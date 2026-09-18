// Compact, privacy-safe text summary of the imported box for the AI coach: names, stars, sets,
// SPD and rune quality only — no account ids, no raw rune inventory.
/** Names the coach should get skill facts for: the strongest nat5 by SPD (they drive most answers). */
export function keyMonstersForAi(box, monsterOf, limit = 12) {
  return (box?.units || [])
    .map((u) => ({ u, info: monsterOf(u.masterId) }))
    .filter((x) => x.info && (x.info.stars || 0) >= 5)
    .sort((a, b) => b.u.spd - a.u.spd)
    .map((x) => x.info.name)
    .filter((n, i, arr) => arr.indexOf(n) === i)
    .slice(0, limit);
}

export function summarizeBoxForAi(box, monsterOf, { maxUnits = 45 } = {}) {
  if (!box?.units?.length) return '';
  const rows = box.units
    .map((u) => ({ ...u, info: monsterOf(u.masterId) }))
    .filter((u) => u.info)
    .sort((a, b) => (b.info.stars || 0) - (a.info.stars || 0) || b.spd - a.spd);

  const nat5 = rows.filter((u) => (u.info.stars || 0) >= 5);
  const others = rows.filter((u) => (u.info.stars || 0) < 5 && u.stars === 6);
  const line = (u) => `${u.info.name}${u.stars === 6 ? '' : ` ${u.stars}★`} SPD${u.spd}${u.sets?.length ? ` ${u.sets.join('/')}` : ''}${u.runeEff ? ` คุณภาพรูน${u.runeEff}%` : ''}`;

  const setCount = {};
  for (const u of box.units) for (const s of u.sets || []) setCount[s] = (setCount[s] || 0) + 1;
  const sets = Object.entries(setCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k}×${v}`).join(', ');

  return [
    `ผู้เล่น ${box.wizard?.name || '-'} Lv.${box.wizard?.level || '-'} มอนสเตอร์ ${box.units.length} ตัว (nat5 ${nat5.length}, 6★ ${box.units.filter((u) => u.stars === 6).length}) รูน ${box.runes?.length || 0} ใบ`,
    `เซ็ตที่ใช้บ่อย: ${sets || '-'}`,
    `nat5 (เรียงตาม SPD รวมรูน): ${nat5.slice(0, maxUnits).map(line).join('; ')}${nat5.length > maxUnits ? `; …อีก ${nat5.length - maxUnits} ตัว` : ''}`,
    others.length ? `ตัว 6★ อื่น ๆ: ${others.slice(0, 25).map(line).join('; ')}${others.length > 25 ? '; …' : ''}` : '',
  ].filter(Boolean).join('\n');
}
