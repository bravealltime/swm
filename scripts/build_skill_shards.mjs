// Splits src/data/monsterSkillsData.json (the 7 MB source the AI coach and scripts keep using) into
// small shards the encyclopedia fetches on demand, plus a tiny index for the skill-effect filter,
// so the catalog view no longer ships the whole thing as one 5 MB JS chunk.
//
//   public/data/skills/<0..15>.json   compact records keyed by monster id
//   src/data/monsterSkillsIndex.json  { shards, skillIcon, leaderIcon, effects: [{name,…}],
//                                       m: { id: [cid, name, passive, aoe, [effectIdx], shard] },
//                                       maxSkills: { id: [[skillId, maxLevel], …] } (skill-up tracker) }
//
// Shards follow the catalog's default order (allMonsters.json, A→Z), so the first page and a name
// search touch one shard instead of all of them. Inside a shard the record is trimmed to what the
// browser rebuilds in expandRecord() (src/data/monsterSkills.js): effects become [effectIdx, chance]
// (their name/nameTh/type/badgeClass/iconUrl are identical for every occurrence and live once in the
// index), icon URLs lose their shared prefix, and the English description goes when a Thai one exists.
//
// vite.config.js runs this while resolving its config, i.e. before the dev server scans public/
// (skipped when the output is newer than both sources); `node scripts/build_skill_shards.mjs --force`
// regenerates by hand.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SHARD_COUNT = 16;

const dirOf = (url) => (url || '').replace(/[^/]+$/, '');

/** The prefix shared by (almost) every url in the list, or '' when there is none worth stripping. */
function commonPrefix(urls) {
  const counts = new Map();
  for (const u of urls) if (u) counts.set(dirOf(u), (counts.get(dirOf(u)) || 0) + 1);
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 1 ? best[0] : '';
}

const stripPrefix = (url, prefix) => (prefix && url && url.startsWith(prefix) ? url.slice(prefix.length) : null);

export function buildSkillShards({ root = process.cwd(), force = false } = {}) {
  const source = path.join(root, 'src/data/monsterSkillsData.json');
  const monstersFile = path.join(root, 'src/data/allMonsters.json');
  const indexFile = path.join(root, 'src/data/monsterSkillsIndex.json');
  const outDir = path.join(root, 'public/data/skills');

  // The output format is defined here, so a change to this script must rebuild too (e.g. when maxSkills was added)
  const sourceMtime = Math.max(fs.statSync(source).mtimeMs, fs.statSync(monstersFile).mtimeMs, fs.statSync(fileURLToPath(import.meta.url)).mtimeMs);
  const shardFiles = Array.from({ length: SHARD_COUNT }, (_, i) => path.join(outDir, `${i}.json`));
  const upToDate = [indexFile, ...shardFiles].every((f) => fs.existsSync(f) && fs.statSync(f).mtimeMs >= sourceMtime);
  if (!force && upToDate) return { skipped: true };

  const data = JSON.parse(fs.readFileSync(source, 'utf8'));
  const monstersJson = JSON.parse(fs.readFileSync(monstersFile, 'utf8'));
  const monsters = Array.isArray(monstersJson) ? monstersJson : Object.values(monstersJson);

  // catalog order first, unknown ids after it
  const position = new Map(monsters.map((m, i) => [m.id, i]));
  const ids = Object.keys(data).sort((a, b) => ((position.get(a) ?? Infinity) - (position.get(b) ?? Infinity)) || a.localeCompare(b));
  const perShard = Math.ceil(ids.length / SHARD_COUNT);

  const allSkills = ids.flatMap((id) => data[id].sk || []);
  const skillIcon = commonPrefix(allSkills.map((s) => s.iconUrl));
  const leaderIcon = commonPrefix(ids.map((id) => data[id].ls?.iconUrl));

  const effects = [];
  const effectIndex = new Map();
  const effectIdx = (e) => {
    if (!effectIndex.has(e.name)) {
      effectIndex.set(e.name, effects.length);
      effects.push({ name: e.name, nameTh: e.nameTh, type: e.type, badgeClass: e.badgeClass, iconUrl: e.iconUrl });
    }
    return effectIndex.get(e.name);
  };

  const compactSkill = (s) => {
    const { iconUrl, effects: fx, description, ...rest } = s;
    const out = { ...rest };
    const icon = stripPrefix(iconUrl, skillIcon);
    if (icon !== null) out.icon = icon; else if (iconUrl !== undefined) out.iconUrl = iconUrl;
    if (description !== undefined && !rest.descriptionTh) out.description = description;
    if (fx) out.ef = fx.map((e) => ('chance' in e ? [effectIdx(e), e.chance] : [effectIdx(e)]));
    return out;
  };
  const compactLeader = (ls) => {
    if (!ls) return ls;
    const { iconUrl, ...rest } = ls;
    const icon = stripPrefix(iconUrl, leaderIcon);
    if (icon !== null) return { ...rest, icon };
    return iconUrl !== undefined ? { ...rest, iconUrl } : rest;
  };

  const shards = Array.from({ length: SHARD_COUNT }, () => ({}));
  const m = {};
  const maxSkills = {};
  ids.forEach((id, i) => {
    const val = data[id];
    const skills = val.sk || [];
    const shard = Math.floor(i / perShard);
    const fx = new Set();
    for (const s of skills) for (const e of s.effects || []) fx.add(effectIdx(e));
    m[id] = [
      String(val.cid || ''),
      val.name || '',
      skills.some((s) => s.isPassive) ? 1 : 0,
      skills.some((s) => s.isAoe) ? 1 : 0,
      [...fx].sort((a, b) => a - b),
      shard,
    ];
    maxSkills[id] = skills.map((s) => [Number(s.id) || 0, Number(s.maxLevel) || (s.skillups ? s.skillups.length + 1 : 1)]);
    shards[shard][id] = { ...val, ls: compactLeader(val.ls), sk: skills.map(compactSkill) };
  });

  fs.mkdirSync(outDir, { recursive: true });
  // overwrite in place (a delete + recreate makes Vite's public-file watcher drop the entries);
  // only leftovers from a different SHARD_COUNT are removed
  shards.forEach((shard, i) => fs.writeFileSync(shardFiles[i], JSON.stringify(shard)));
  for (const f of fs.readdirSync(outDir)) {
    if (/^\d+\.json$/.test(f) && Number(f.slice(0, -5)) >= SHARD_COUNT) fs.unlinkSync(path.join(outDir, f));
  }
  fs.writeFileSync(indexFile, JSON.stringify({ shards: SHARD_COUNT, skillIcon, leaderIcon, effects, m, maxSkills }));

  return { skipped: false, monsters: ids.length, effects: effects.length, shards: SHARD_COUNT };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const r = buildSkillShards({ force: process.argv.includes('--force') });
  console.log(r.skipped ? 'skill shards up to date' : `skill shards: ${r.monsters} monsters, ${r.effects} effects → ${r.shards} files`);
}
