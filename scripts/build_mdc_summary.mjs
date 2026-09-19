// Generates src/data/monsterMdcSummary.json from allMdcData.json
// Provides instant O(1) lookup of 3MDC defense and counter counts per monster
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

export function buildMdcSummary() {
  const mdcPath = path.join(root, 'src/data/allMdcData.json');
  if (!fs.existsSync(mdcPath)) return null;

  const mdc = JSON.parse(fs.readFileSync(mdcPath, 'utf8'));
  const byName = {};
  const byId = {};

  function addEntry(store, key, entry) {
    if (!key) return;
    const k = String(key).toLowerCase().trim();
    if (!store[k]) {
      store[k] = { defCount: 0, cntCount: 0, defTitles: [], counterTeams: [] };
    }
    return store[k];
  }

  for (const d of mdc) {
    for (const m of (d.defenseMonsters || [])) {
      const eName = addEntry(byName, m.name);
      if (eName) {
        eName.defCount++;
        if (eName.defTitles.length < 3 && !eName.defTitles.includes(d.title)) {
          eName.defTitles.push(d.title);
        }
      }
      if (m.com2usId) {
        const eId = addEntry(byId, m.com2usId);
        if (eId) {
          eId.defCount++;
          if (eId.defTitles.length < 3 && !eId.defTitles.includes(d.title)) {
            eId.defTitles.push(d.title);
          }
        }
      }
    }

    for (const c of (d.counters || [])) {
      const teamStr = (c.monsters || []).map((x) => x.name).join(' + ');
      for (const m of (c.monsters || [])) {
        const item = {
          against: d.title,
          team: teamStr,
          winRate: c.winRate || '90%+',
          rating: c.rating || 5,
        };

        const eName = addEntry(byName, m.name);
        if (eName) {
          eName.cntCount++;
          if (eName.counterTeams.length < 3) {
            eName.counterTeams.push(item);
          }
        }
        if (m.com2usId) {
          const eId = addEntry(byId, m.com2usId);
          if (eId) {
            eId.cntCount++;
            if (eId.counterTeams.length < 3) {
              eId.counterTeams.push(item);
            }
          }
        }
      }
    }
  }

  const result = { byName, byId };
  const outPath = path.join(root, 'src/data/monsterMdcSummary.json');
  fs.writeFileSync(outPath, JSON.stringify(result));
  console.log(`[swm] Generated monsterMdcSummary.json: ${Object.keys(byName).length} names, ${Object.keys(byId).length} IDs`);
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildMdcSummary();
}
