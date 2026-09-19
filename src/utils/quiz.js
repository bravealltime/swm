// "ทายมอนจากสกิล": read a Thai skill description, pick the monster. The daily round is seeded by the
// Bangkok date so everyone gets the same 10 questions and scores are comparable, like Wordle.

export const QUESTIONS_PER_ROUND = 10;
const CHOICES = 4;

/** YYYY-MM-DD in Asia/Bangkok (UTC+7), the day boundary for the daily round. */
export function bangkokDate(now = new Date()) {
  return new Date(now.getTime() + 7 * 3600e3).toISOString().slice(0, 10);
}

export function seedFrom(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h;
}

/** Small deterministic PRNG (mulberry32); returns () => [0, 1). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list, random) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/**
 * Which monsters to ask about today. `pool` items are { id, element, stars }; the same pool and
 * seed always give the same questions, and no monster appears twice in a round.
 */
export function pickRound(pool, seed, count = QUESTIONS_PER_ROUND) {
  const random = rng(seed);
  const order = shuffle(pool, random);
  const picked = order.slice(0, Math.min(count, order.length));
  return picked.map((answer, i) => {
    // distractors: same element first, then anything else, never the answer itself
    const others = order.filter((m) => m.id !== answer.id);
    const same = others.filter((m) => m.element === answer.element);
    const rest = others.filter((m) => m.element !== answer.element);
    const distractors = shuffle(same, random).slice(0, CHOICES - 1);
    if (distractors.length < CHOICES - 1) distractors.push(...shuffle(rest, random).slice(0, CHOICES - 1 - distractors.length));
    return { n: i + 1, answerId: answer.id, choiceIds: shuffle([answer.id, ...distractors.map((m) => m.id)], random) };
  });
}

const MIN_TEXT = 30;
const DISTINCT_TEXT = 60; // "immunity to all allies for 2 turns" fits many monsters; longer texts are specific

/**
 * Which skill to quote for a monster: a Thai description long enough to be recognisable, preferring
 * detailed ones over one-liners and any skill over the basic attack. Deterministic for the same seed.
 */
export function pickSkill(skills, seed) {
  const ok = (skills || []).map((s, i) => ({ s, i, len: (s.descriptionTh || '').trim().length })).filter(({ len }) => len >= MIN_TEXT);
  if (!ok.length) return null;
  const notBasic = ok.filter(({ i, s }) => i > 0 && !/^S1$/i.test(s.slotLabel || ''));
  const tiers = [notBasic.filter(({ len }) => len >= DISTINCT_TEXT), notBasic, ok.filter(({ len }) => len >= DISTINCT_TEXT), ok];
  const list = tiers.find((t) => t.length) || ok;
  const { s, i } = list[Math.floor(rng(seed)() * list.length)];
  return { s, i };
}

/** Blanks out anything that would give the answer away: the monster's names and family. */
export function maskText(text, names) {
  let out = String(text || '');
  for (const n of (names || []).filter((x) => x && String(x).trim().length >= 3).sort((a, b) => b.length - a.length)) {
    out = out.replace(new RegExp(String(n).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '▇▇▇');
  }
  return out;
}

/** Wordle-style share text: "ทายมอนจากสกิล 2026-09-19 8/10 🟩🟩🟥…". */
export function shareText({ date, results, url }) {
  const score = results.filter(Boolean).length;
  const grid = results.map((r) => (r ? '🟩' : '🟥')).join('');
  return `ทายมอนจากสกิล SWM ${date} — ${score}/${results.length}\n${grid}\n${url}`;
}

export function scoreLabel(score, total) {
  const r = score / (total || 1);
  if (r === 1) return 'สมบูรณ์แบบ — รู้ทุกสกิลเหมือนอ่านคู่มือ';
  if (r >= 0.8) return 'ระดับ Guardian — แม่นมาก';
  if (r >= 0.5) return 'ใช้ได้ — อีกนิดเดียว';
  return 'ลองเปิดสารานุกรมแล้วมาใหม่พรุ่งนี้';
}
