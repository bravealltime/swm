// The encyclopedia's skill shards: the generator (scripts/build_skill_shards.mjs) and the
// browser-side expansion (src/data/monsterSkills.js) must stay exact inverses of each other.
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildSkillShards, SHARD_COUNT } from '../scripts/build_skill_shards.mjs';

const ROOT = path.resolve(__dirname, '..');

describe('buildSkillShards on a small fixture', () => {
  let tmp, index, shards;
  const ICON = 'https://cdn.example/skills/';
  const skill = (name, icon, effects, extra = {}) => ({ id: 1, slot: 1, name, description: `${name} EN`, descriptionTh: `${name} TH`, iconUrl: ICON + icon, effects, ...extra });

  beforeAll(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'swm-shards-'));
    fs.mkdirSync(path.join(tmp, 'src/data'), { recursive: true });
    const data = {
      'm-10111': { cid: '10111', name: 'Zed', bs: { hp: 1 }, ls: { attribute: 'HP', amount: 20, iconUrl: 'https://cdn.example/leader/hp.png' }, sk: [
        skill('Slash', 'a.png', [{ name: 'Stun', nameTh: 'สตั๊น', type: 'Debuff', chance: 50, badgeClass: 'x', iconUrl: 'https://i/stun.png' }]),
        skill('Roar', 'b.png', [{ name: 'Stun', nameTh: 'สตั๊น', type: 'Debuff', badgeClass: 'x', iconUrl: 'https://i/stun.png' }, { name: 'Brand', nameTh: 'ตรา', type: 'Debuff', chance: 100, badgeClass: 'y', iconUrl: 'https://i/brand.png' }], { isPassive: true, isAoe: true }),
      ] },
      'm-10112': { cid: '10112', name: 'Abe', bs: {}, ls: { attribute: 'SPD', amount: 10, iconUrl: 'https://cdn.example/leader/spd.png' }, sk: [skill('Poke', 'c.png', [], { description: 'only EN', descriptionTh: '' })] },
      'm-99999': { cid: '99999', name: 'Nobody', bs: {}, ls: { iconUrl: 'https://elsewhere/x.png' }, sk: [{ id: 2, name: 'Odd', iconUrl: 'https://elsewhere/skill.png' }] },
    };
    fs.writeFileSync(path.join(tmp, 'src/data/monsterSkillsData.json'), JSON.stringify(data));
    // catalog order: Abe first, Zed second, Nobody absent
    fs.writeFileSync(path.join(tmp, 'src/data/allMonsters.json'), JSON.stringify([{ id: 'm-10112', name: 'Abe' }, { id: 'm-10111', name: 'Zed' }]));
    const r = buildSkillShards({ root: tmp, force: true });
    expect(r).toMatchObject({ skipped: false, monsters: 3, effects: 2, shards: SHARD_COUNT });
    index = JSON.parse(fs.readFileSync(path.join(tmp, 'src/data/monsterSkillsIndex.json'), 'utf8'));
    shards = Array.from({ length: SHARD_COUNT }, (_, i) => JSON.parse(fs.readFileSync(path.join(tmp, `public/data/skills/${i}.json`), 'utf8')));
  });

  it('assigns shards in catalog order, unknown ids last', () => {
    const shardOf = (id) => index.m[id][5];
    expect(shardOf('m-10112')).toBeLessThanOrEqual(shardOf('m-10111'));
    expect(shardOf('m-10111')).toBeLessThanOrEqual(shardOf('m-99999'));
    expect(shards[shardOf('m-10112')]['m-10112']).toBeDefined();
  });

  it('builds filter tags and a deduplicated effect table', () => {
    expect(index.effects.map((e) => e.name)).toEqual(['Stun', 'Brand']);
    expect(index.effects[0]).toMatchObject({ nameTh: 'สตั๊น', type: 'Debuff', badgeClass: 'x', iconUrl: 'https://i/stun.png' });
    const [cid, name, passive, aoe, fx] = index.m['m-10111'];
    expect([cid, name, passive, aoe, fx]).toEqual(['10111', 'Zed', 1, 1, [0, 1]]);
    expect(index.m['m-10112'].slice(2, 5)).toEqual([0, 0, []]);
  });

  it('strips the shared icon prefix and the English description, keeping odd ones verbatim', () => {
    expect(index.skillIcon).toBe(ICON);
    const zed = shards[index.m['m-10111'][5]]['m-10111'];
    expect(zed.sk[0]).toMatchObject({ icon: 'a.png', descriptionTh: 'Slash TH' });
    expect(zed.sk[0]).not.toHaveProperty('iconUrl');
    expect(zed.sk[0]).not.toHaveProperty('description');
    expect(zed.sk[0].ef).toEqual([[0, 50]]);
    expect(zed.sk[1].ef).toEqual([[0], [1, 100]]); // effect without a chance keeps none
    expect(index.leaderIcon).toBe('https://cdn.example/leader/'); // shared by Zed and Abe
    expect(zed.ls).toEqual({ attribute: 'HP', amount: 20, icon: 'hp.png' });
    const abe = shards[index.m['m-10112'][5]]['m-10112'];
    expect(abe.sk[0].description).toBe('only EN'); // no Thai text → English kept
    const nobody = shards[index.m['m-99999'][5]]['m-99999'];
    expect(nobody.sk[0].iconUrl).toBe('https://elsewhere/skill.png');
    expect(nobody.ls.iconUrl).toBe('https://elsewhere/x.png');
  });

  it('skips regeneration when the output is newer than both sources', () => {
    expect(buildSkillShards({ root: tmp })).toEqual({ skipped: true });
  });
});

describe('expandRecord restores the original shape for every real monster', () => {
  it('round-trips all 940 records (description falls back to Thai by design)', async () => {
    buildSkillShards({ root: ROOT }); // make sure the generated files exist
    const { expandRecord } = await import('../src/data/monsterSkills.js');
    const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/monsterSkillsIndex.json'), 'utf8'));
    const full = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/monsterSkillsData.json'), 'utf8'));
    const shardCache = new Map();
    const shard = (n) => shardCache.get(n) || shardCache.set(n, JSON.parse(fs.readFileSync(path.join(ROOT, `public/data/skills/${n}.json`), 'utf8'))).get(n);
    const canon = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((k2) => [k2, x[k2]])) : x));

    let checked = 0;
    for (const [id, val] of Object.entries(full)) {
      const got = expandRecord(id, shard(index.m[id][5])[id]);
      const want = { id, com2usId: val.cid, name: val.name, baseStats: val.bs, leaderSkill: val.ls, skills: (val.sk || []).map((s) => (s.descriptionTh ? { ...s, description: s.descriptionTh } : s)) };
      if (canon(got) !== canon(want)) throw new Error(`mismatch for ${id}`);
      checked++;
    }
    expect(checked).toBe(Object.keys(full).length);
    expect(checked).toBeGreaterThan(900);
  });
});
