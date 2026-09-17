/**
 * Adds monsters that exist in the game but are missing from src/data/allMonsters.json,
 * using swarfarm.com's public bestiary (open data, no login). Only awakened forms
 * (1A / 2A) of obtainable, non-material monsters are added, in the same schema the site
 * already uses, so SWEX imports and replay data can always resolve a name + portrait.
 *
 *   node scripts/fill_missing_monsters.cjs            # add what is missing
 *   node scripts/fill_missing_monsters.cjs --dry-run  # just report
 */
const fs = require('fs');
const path = require('path');

const FILE = path.resolve('src/data/allMonsters.json');
const CDN = 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/';
const DRY = process.argv.includes('--dry-run');

const ROLE_TH = {
  Attack: 'ตัวทำดาเมจ (Attack)',
  Defense: 'สายป้องกัน (Defense)',
  HP: 'สายเลือด (HP)',
  Support: 'ซัพพอร์ต (Support)',
};

async function fetchAll() {
  const out = [];
  let url = 'https://swarfarm.com/api/v2/monsters/?obtainable=true&page_size=200';
  while (url) {
    const res = await fetch(url, { headers: { 'User-Agent': 'swm-dataset-builder (github.com/bravealltime/swm)' } });
    if (!res.ok) throw new Error(`swarfarm HTTP ${res.status}`);
    const json = await res.json();
    out.push(...json.results);
    url = json.next;
    await new Promise((r) => setTimeout(r, 400));
  }
  return out;
}

(async () => {
  const local = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const have = new Set(local.map((m) => Number(m.com2usId)));
  console.log(`local catalog: ${local.length} monsters`);

  const remote = await fetchAll();
  const byId = new Map(remote.map((m) => [m.com2us_id, m]));
  const candidates = remote.filter((m) =>
    m.awaken_level >= 1 && m.archetype !== 'Material' && m.natural_stars >= 2 && !have.has(m.com2us_id)
  );

  const added = candidates.map((m) => {
    const base = m.awakens_from ? byId.get(m.awakens_from) : null;
    return {
      id: `m-${m.com2us_id}`,
      com2usId: String(m.com2us_id),
      name: m.name,
      thaiName: m.name,
      unawakenedName: base?.name || m.name,
      family: base?.name || m.name,
      thaiFamily: base?.name || m.name,
      element: (m.element || 'fire').toLowerCase(),
      stars: m.natural_stars,
      archetype: m.archetype || '',
      leaderSkill: '',
      role: ROLE_TH[m.archetype] || '',
      suggestedRunes: '',
      avatarUrl: CDN + m.image_filename,
      imageUrl: CDN + m.image_filename,
      secondAwakened: m.awaken_level === 2 || undefined,
      source: 'swarfarm',
    };
  }).sort((a, b) => Number(a.com2usId) - Number(b.com2usId));

  console.log(`swarfarm: ${remote.length} entries, ${added.length} awakened monsters missing locally`);
  console.log(added.slice(0, 15).map((m) => `${m.com2usId} ${m.name} (${m.element}, ${m.stars}★${m.secondAwakened ? ', 2A' : ''})`).join('\n'));
  if (added.length > 15) console.log(`... +${added.length - 15} more`);

  if (DRY || !added.length) return;
  fs.writeFileSync(FILE, JSON.stringify([...local, ...added], null, 2));
  console.log(`saved ${local.length + added.length} monsters -> ${path.relative(process.cwd(), FILE)}`);
})();
