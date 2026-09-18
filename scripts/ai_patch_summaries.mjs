/**
 * Thai summaries for balance patches: one overview per patch plus a one-line Thai note per changed
 * monster, grounded strictly in the official change text stored in balancePatchDetails.json.
 * Cached by content hash, so re-runs only pay for new or changed patches.
 *
 *   node scripts/ai_patch_summaries.mjs             # every patch that has details
 *   node scripts/ai_patch_summaries.mjs --patch=92  # one patch
 *   node scripts/ai_patch_summaries.mjs --force
 */
import fs from 'node:fs';
import path from 'node:path';
import { chat, parseJson, hashOf, aiConfig } from '../api/_lib/ai.js';

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const ONLY = args.patch ? String(args.patch) : null;
const FORCE = !!args.force;

const OUT = path.resolve('src/data/balancePatchAi.json');
const patches = JSON.parse(fs.readFileSync(path.resolve('src/data/balancePatches.json'), 'utf8'));
const details = JSON.parse(fs.readFileSync(path.resolve('src/data/balancePatchDetails.json'), 'utf8'));
const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { meta: {}, patches: {} };

const SYSTEM = `คุณคือนักวิเคราะห์แพตช์ Summoners War ของเว็บ SWM สรุปเป็นภาษาไทยจาก "ข้อความทางการ" ที่ให้มาเท่านั้น
ห้ามเพิ่มการเปลี่ยนแปลงที่ไม่ได้ระบุ ห้ามเดาตัวเลข ถ้าเป็นการปรับสเตตัสเล็กน้อยให้บอกว่าเล็กน้อย ตอบเป็น JSON เท่านั้นและปิด JSON ให้ครบ`;

const OVERVIEW_FORMAT = `{"overview": "3-4 ประโยค ภาพรวมแพตช์ ใครถูกบัฟ/เนิร์ฟชัดสุด กระทบ RTA/Siege/PvE อย่างไร",
 "winners": ["ชื่อมอนสเตอร์ที่ได้ประโยชน์ชัด สูงสุด 5"],
 "losers": ["ชื่อมอนสเตอร์ที่ถูกเนิร์ฟชัด สูงสุด 5"]}`;
const NOTES_FORMAT = `{"<ชื่อมอนสเตอร์ตามที่ให้มา>": "1 ประโยคภาษาไทย บอกว่าเปลี่ยนอะไรและผลคืออะไร"}`;
const CHUNK = 8; // monsters per notes call — the provider times out on long generations

function groupByMonster(rows) {
  const byMonster = new Map();
  for (const r of rows) {
    const key = `${r.monsterName} (${r.element})`;
    if (!byMonster.has(key)) byMonster.set(key, []);
    byMonster.get(key).push(`${r.skillName || r.changeType}: ${(r.officialText || r.preview || '').replace(/\s+/g, ' ').trim()}`);
  }
  return byMonster;
}

const NL = '\n';
const linesOf = (entries) => entries.map(([m, changes]) => `- ${m}${NL}  ${changes.join(`${NL}  `)}`).join(NL);

async function summarizePatch(patchId) {
  const meta = patches.find((p) => String(p.id) === String(patchId) || String(p.link || '').endsWith(`=${patchId}`));
  const rows = details[patchId] || [];
  const entries = [...groupByMonster(rows).entries()];
  const header = `แพตช์ #${patchId}${meta?.date ? ` วันที่ ${meta.date}` : ''} มอนสเตอร์ที่ถูกแก้ ${entries.length} ตัว`;

  // 1. overview (short answer; the full change list fits in the prompt)
  const ov = parseJson((await chat({
    system: SYSTEM,
    user: [header, '', 'ข้อความทางการ:', linesOf(entries).slice(0, 24000), '', 'รูปแบบคำตอบ:', OVERVIEW_FORMAT].join(NL),
    maxTokens: 700, temperature: 0.3, timeoutMs: 90000,
  })).text);

  // 2. one-line notes in chunks
  const perMonster = {};
  for (let i = 0; i < entries.length; i += CHUNK) {
    const chunk = entries.slice(i, i + CHUNK);
    const prompt = [`${header} (ส่วนที่ ${i / CHUNK + 1})`, '', 'ข้อความทางการ:', linesOf(chunk), '', 'เขียนโน้ต 1 ประโยคต่อมอนสเตอร์ ใช้ชื่อเป็น key ให้ตรงกับที่ให้มา รูปแบบ:', NOTES_FORMAT].join(NL);
    let notes = null;
    for (let attempt = 0; attempt < 2 && !notes; attempt++) {
      try {
        const { text } = await chat({
          system: SYSTEM,
          user: attempt ? `${prompt}${NL}${NL}ตอบเป็น JSON object เท่านั้น ขึ้นต้นด้วย { และห้ามมีข้อความอื่น` : prompt,
          maxTokens: 1400, temperature: attempt ? 0.1 : 0.3, timeoutMs: 90000,
        });
        notes = parseJson(text);
      } catch (err) {
        if (attempt) console.warn(`    notes chunk ${i / CHUNK + 1}: ${err.message}`);
      }
    }
    for (const [k, v] of Object.entries(notes || {})) perMonster[String(k).replace(/\s*\(.*\)$/, '')] = String(v);
  }

  return {
    hash: hashOf(rows),
    overview: String(ov.overview || '').trim(),
    winners: (ov.winners || []).slice(0, 5).map(String),
    losers: (ov.losers || []).slice(0, 5).map(String),
    perMonster,
    monsters: entries.length,
    at: new Date().toISOString(),
  };
}

(async () => {
  if (!aiConfig().configured) { console.error('AI provider not configured — skipping'); process.exit(0); }
  const ids = Object.keys(details).filter((id) => (details[id] || []).length && (!ONLY || id === ONLY)).sort((a, b) => Number(b) - Number(a));
  const results = { ...(existing.patches || {}) };
  console.log(`patches with details: ${ids.join(', ')}`);
  for (const id of ids) {
    const hash = hashOf(details[id] || []);
    if (!FORCE && results[id]?.hash === hash) { console.log(`  #${id}: cached`); continue; }
    try {
      results[id] = await summarizePatch(id);
      console.log(`  #${id}: ${results[id].monsters} monsters, ${Object.keys(results[id].perMonster).length} notes -> ok`);
    } catch (err) {
      console.warn(`  #${id}: ${err.message}`);
    }
    fs.writeFileSync(OUT, JSON.stringify({ meta: { updatedAt: new Date().toISOString(), model: aiConfig().model }, patches: results }, null, 1));
  }
  console.log(`done -> ${path.relative(process.cwd(), OUT)}`);
})();
