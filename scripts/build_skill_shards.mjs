// Splits src/data/monsterSkillsData.json (the 7 MB source the AI coach and scripts keep using) into
// small shards the encyclopedia fetches on demand, plus a tiny index for the skill-effect filter,
// so the catalog view no longer ships the whole thing as one 5 MB JS chunk.
//
//   public/data/skills/<0..15>.json   compact records keyed by monster id, shard = shardOf(id)
//   src/data/monsterSkillsIndex.json  { shards, effects: [names], m: { id: [cid, name, passive, aoe, [effectIdx]] } }
//
// vite.config.js runs this while resolving its config, i.e. before the dev server scans public/
// (skipped when the output is newer than the source); `node scripts/build_skill_shards.mjs --force`
// regenerates by hand.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SHARD_COUNT = 16;
// String hash rather than com2usId % n: the FFF-A-E id layout makes a plain modulo land on a few
// residues only. Keep in sync with shardOf() in src/data/monsterSkills.js.
export function shardOf(id) {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % SHARD_COUNT;
}

export function buildSkillShards({ root = process.cwd(), force = false } = {}) {
  const source = path.join(root, 'src/data/monsterSkillsData.json');
  const indexFile = path.join(root, 'src/data/monsterSkillsIndex.json');
  const outDir = path.join(root, 'public/data/skills');

  const sourceMtime = fs.statSync(source).mtimeMs;
  const shardFiles = Array.from({ length: SHARD_COUNT }, (_, i) => path.join(outDir, `${i}.json`));
  const upToDate = [indexFile, ...shardFiles].every((f) => fs.existsSync(f) && fs.statSync(f).mtimeMs >= sourceMtime);
  if (!force && upToDate) return { skipped: true };

  const data = JSON.parse(fs.readFileSync(source, 'utf8'));
  const effects = [];
  const effectIndex = new Map();
  const shards = Array.from({ length: SHARD_COUNT }, () => ({}));
  const m = {};

  for (const [id, val] of Object.entries(data)) {
    const skills = val.sk || [];
    const ids = new Set();
    for (const s of skills) {
      for (const e of s.effects || []) {
        if (!effectIndex.has(e.name)) { effectIndex.set(e.name, effects.length); effects.push(e.name); }
        ids.add(effectIndex.get(e.name));
      }
    }
    m[id] = [
      String(val.cid || ''),
      val.name || '',
      skills.some((s) => s.isPassive) ? 1 : 0,
      skills.some((s) => s.isAoe) ? 1 : 0,
      [...ids].sort((a, b) => a - b),
    ];
    shards[shardOf(id)][id] = val;
  }

  fs.mkdirSync(outDir, { recursive: true });
  // overwrite in place (a delete + recreate makes Vite's public-file watcher drop the entries);
  // only leftovers from a different SHARD_COUNT are removed
  shards.forEach((shard, i) => fs.writeFileSync(shardFiles[i], JSON.stringify(shard)));
  for (const f of fs.readdirSync(outDir)) {
    if (/^\d+\.json$/.test(f) && Number(f.slice(0, -5)) >= SHARD_COUNT) fs.unlinkSync(path.join(outDir, f));
  }
  fs.writeFileSync(indexFile, JSON.stringify({ shards: SHARD_COUNT, effects, m }));

  return { skipped: false, monsters: Object.keys(m).length, effects: effects.length, shards: SHARD_COUNT };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const r = buildSkillShards({ force: process.argv.includes('--force') });
  console.log(r.skipped ? 'skill shards up to date' : `skill shards: ${r.monsters} monsters, ${r.effects} effects → ${r.shards} files`);
}
