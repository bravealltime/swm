/**
 * Writes a two-sentence Thai play-style summary for the strongest Guardian players, grounded in
 * their real replay stats (swrtPlayersIndex.json + match shards). Results are cached by a hash of
 * the stats, so a nightly run only pays for players whose numbers changed.
 *
 *   node scripts/ai_player_summaries.mjs               # top 150 players with >= 5 matches
 *   node scripts/ai_player_summaries.mjs --limit=20    # smaller batch
 *   node scripts/ai_player_summaries.mjs --force       # ignore the cache
 *
 * Needs AI_BASE_URL / AI_MODEL / AI_API_KEY (from .env locally, secrets in CI).
 */
import fs from 'node:fs';
import path from 'node:path';
import { chat, parseJson, hashOf, aiConfig } from '../api/_lib/ai.js';

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const LIMIT = Number(args.limit || 150);
const FORCE = !!args.force;
const CONCURRENCY = 1; // the provider allows one queued request per key
const MIN_MATCHES = 5;

const OUT = path.resolve('src/data/swrtPlayerSummaries.json');
const index = JSON.parse(fs.readFileSync(path.resolve('src/data/swrtPlayersIndex.json'), 'utf8'));
const monsters = JSON.parse(fs.readFileSync(path.resolve('src/data/allMonsters.json'), 'utf8'));
const nameOf = new Map(monsters.map((m) => [Number(m.com2usId), m.name]));
const TIER = (lv) => (lv >= 4003 ? 'G3' : lv >= 4002 ? 'G2' : lv >= 4001 ? 'G1' : lv >= 3501 ? 'C' : 'F');

const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { meta: {}, players: {} };
const shardCache = new Map();
function matchesOf(id) {
  const shard = id % (index.meta?.shards || 32);
  if (!shardCache.has(shard)) {
    const f = path.resolve(`public/data/swrt-matches/${shard}.json`);
    shardCache.set(shard, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {});
  }
  return shardCache.get(shard)[id] || [];
}

function factSheet(p) {
  const recent = matchesOf(p.id);
  const top = (p.top || []).slice(0, 6).map(([m, n, w]) => `${nameOf.get(m) || m} ${n} ครั้ง ชนะ ${w}`).join(', ');
  const leaders = {};
  const banned = {};
  const oppPicks = {};
  for (const r of recent) {
    if (r.my?.l) leaders[nameOf.get(r.my.l) || r.my.l] = (leaders[nameOf.get(r.my.l) || r.my.l] || 0) + 1;
    if (r.my?.b) banned[nameOf.get(r.my.b) || r.my.b] = (banned[nameOf.get(r.my.b) || r.my.b] || 0) + 1;
    for (const id of r.vs?.ids || []) oppPicks[nameOf.get(id) || id] = (oppPicks[nameOf.get(id) || id] || 0) + 1;
  }
  const topOf = (o, n = 3) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k} (${v})`).join(', ') || '-';
  const fpRate = p.m ? Math.round(((p.fp || 0) / p.m) * 100) : 0;
  return {
    text: `ผู้เล่น ${p.n} ประเทศ ${p.c || '-'} ระดับ ${TIER(p.lv)} คะแนน ${p.s} อันดับโลก ${p.r}
แมตช์ที่บันทึก ${p.m} ชนะ ${p.w} แพ้ ${p.m - p.w} (ชนะ ${p.m ? Math.round((p.w / p.m) * 100) : 0}%) เลือกก่อน ${fpRate}% ของแมตช์
มอนสเตอร์ที่ใช้บ่อย: ${top || '-'}
ลีดเดอร์ที่ใช้บ่อย: ${topOf(leaders)}
มอนสเตอร์ของเขาที่โดนแบนบ่อย: ${topOf(banned)}
มอนสเตอร์ที่คู่แข่งเลือกมาเจอเขาบ่อย: ${topOf(oppPicks, 4)}`,
    hash: hashOf([p.m, p.w, p.fp, p.s, p.top, recent.map((r) => r.k)]),
  };
}

const SYSTEM = `คุณเขียนสรุปสไตล์การเล่น RTA ของ Summoners War เป็นภาษาไทยให้เว็บสถิติ ใช้เฉพาะตัวเลขที่ให้มา ห้ามเดาสกิลหรือนิสัยที่ไม่มีข้อมูล
ตอบเป็น JSON เท่านั้น: {"summary": "2 ประโยค ไม่เกิน 60 คำ เล่าสไตล์จากมอนสเตอร์/ลีด/first pick/แบน", "tags": ["แท็กสั้น 3 อัน เช่น สปีดคอนโทรล, Oliver core, แบน Haegang"]}`;

async function summarize(p) {
  const { text, hash } = factSheet(p);
  const cached = existing.players?.[p.id];
  if (!FORCE && cached && cached.hash === hash) return { id: p.id, ...cached, cached: true };
  const { text: out } = await chat({ system: SYSTEM, user: text, maxTokens: 400, temperature: 0.4 });
  const json = parseJson(out);
  return { id: p.id, hash, summary: String(json.summary || '').trim(), tags: (json.tags || []).slice(0, 3).map(String), at: new Date().toISOString() };
}

(async () => {
  if (!aiConfig().configured) { console.error('AI provider not configured — skipping'); process.exit(0); }
  const players = (index.players || []).filter((p) => p.m >= MIN_MATCHES).sort((a, b) => b.s - a.s).slice(0, LIMIT);
  console.log(`summarizing ${players.length} players (concurrency ${CONCURRENCY})`);
  const results = { ...(existing.players || {}) };
  let done = 0, fresh = 0, failed = 0;
  const queue = [...players];
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const p = queue.shift();
      try {
        const r = await summarize(p);
        results[p.id] = { hash: r.hash, summary: r.summary, tags: r.tags, at: r.at };
        if (!r.cached) fresh += 1;
      } catch (err) {
        failed += 1;
        console.warn(`  ${p.n}: ${err.message}`);
      }
      done += 1;
      if (done % 10 === 0 || done === players.length) {
        fs.writeFileSync(OUT, JSON.stringify({ meta: { updatedAt: new Date().toISOString(), model: aiConfig().model, count: Object.keys(results).length }, players: results }));
        console.log(`  ${done}/${players.length} (new ${fresh}, failed ${failed})`);
      }
    }
  }));
  fs.writeFileSync(OUT, JSON.stringify({ meta: { updatedAt: new Date().toISOString(), model: aiConfig().model, count: Object.keys(results).length }, players: results }));
  console.log(`done: ${Object.keys(results).length} summaries -> ${path.relative(process.cwd(), OUT)}`);
})();
