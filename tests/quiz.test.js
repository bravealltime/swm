// Daily skill quiz logic (src/utils/quiz.js).
import { describe, it, expect } from 'vitest';
import { bangkokDate, seedFrom, rng, pickRound, pickSkill, maskText, shareText, scoreLabel } from '../src/utils/quiz.js';

const pool = [];
for (let i = 0; i < 40; i++) pool.push({ id: `m-${100 + i}`, element: ['water', 'fire', 'wind', 'light', 'dark'][i % 5], stars: 5 });

describe('bangkokDate', () => {
  it('rolls the day over at midnight Bangkok time, not UTC', () => {
    expect(bangkokDate(new Date('2026-09-19T16:59:00Z'))).toBe('2026-09-19');
    expect(bangkokDate(new Date('2026-09-19T17:00:00Z'))).toBe('2026-09-20');
  });
});

describe('rng / seed', () => {
  it('is deterministic and different per seed', () => {
    const a = rng(seedFrom('2026-09-19')), b = rng(seedFrom('2026-09-19')), c = rng(seedFrom('2026-09-20'));
    const va = [a(), a(), a()], vb = [b(), b(), b()], vc = [c(), c(), c()];
    expect(va).toEqual(vb);
    expect(va).not.toEqual(vc);
    expect(va.every((x) => x >= 0 && x < 1)).toBe(true);
  });
});

describe('pickRound', () => {
  const round = pickRound(pool, seedFrom('2026-09-19'));

  it('gives 10 questions with 4 choices that include the answer, no monster twice', () => {
    expect(round).toHaveLength(10);
    expect(new Set(round.map((q) => q.answerId)).size).toBe(10);
    for (const q of round) {
      expect(q.choiceIds).toHaveLength(4);
      expect(new Set(q.choiceIds).size).toBe(4);
      expect(q.choiceIds).toContain(q.answerId);
    }
  });

  it('prefers distractors of the same element', () => {
    const byId = new Map(pool.map((m) => [m.id, m]));
    for (const q of round) {
      const el = byId.get(q.answerId).element;
      expect(q.choiceIds.every((id) => byId.get(id).element === el)).toBe(true); // 8 per element in the pool → always possible
    }
  });

  it('is identical for the same day and different on another day', () => {
    expect(pickRound(pool, seedFrom('2026-09-19'))).toEqual(round);
    expect(pickRound(pool, seedFrom('2026-09-20')).map((q) => q.answerId)).not.toEqual(round.map((q) => q.answerId));
  });

  it('falls back to other elements when a colour runs short, and to a short round for a tiny pool', () => {
    const tiny = [{ id: 'a', element: 'fire' }, { id: 'b', element: 'water' }, { id: 'c', element: 'wind' }, { id: 'd', element: 'dark' }, { id: 'e', element: 'light' }];
    const r = pickRound(tiny, 1);
    expect(r).toHaveLength(5);
    expect(r[0].choiceIds).toHaveLength(4);
  });
});

describe('pickSkill', () => {
  const skills = [
    { slotLabel: 'S1', name: 'Basic', descriptionTh: 'โจมตีศัตรู 1 ครั้ง และมีโอกาสทำให้ติดสตั๊น 1 เทิร์นโดยมีโอกาส' },
    { slotLabel: 'S2', name: 'Two', descriptionTh: 'สั้น' },
    { slotLabel: 'S3', name: 'Three', descriptionTh: 'โจมตีศัตรูทั้งหมด 3 ครั้ง และลบล้างบัฟที่มีประโยชน์ทั้งหมดของศัตรู' },
  ];
  it('quotes a non-basic skill with a real description when there is one', () => {
    expect(pickSkill(skills, 7).s.name).toBe('Three');
  });
  it('prefers a detailed description over a generic one-liner', () => {
    const generic = { slotLabel: 'S2', name: 'Immune', descriptionTh: 'สร้างภูมิคุ้มกันให้พันธมิตรทั้งหมดนาน 2 เทิร์น' }; // 45 chars
    const detailed = { slotLabel: 'S3', name: 'Long', descriptionTh: 'โจมตีศัตรูทั้งหมด 3 ครั้ง ลบล้างบัฟทั้งหมด และเพิ่มเกจโจมตีของพันธมิตรทั้งหมด 30% เมื่อโจมตีโดน' };
    for (const seed of [1, 2, 3, 4, 5]) expect(pickSkill([skills[0], generic, detailed], seed).s.name).toBe('Long');
  });
  it('falls back to the basic attack, and to null without usable text', () => {
    expect(pickSkill(skills.slice(0, 2), 7).s.name).toBe('Basic');
    expect(pickSkill([{ descriptionTh: 'x' }], 1)).toBeNull();
    expect(pickSkill([], 1)).toBeNull();
  });
});

describe('maskText', () => {
  it('blanks names and family, longest first, case-insensitively', () => {
    expect(maskText('Lushen throws cards; the Joker family', ['Lushen', 'ลูเชน', 'Joker'])).toBe('▇▇▇ throws cards; the ▇▇▇ family');
    expect(maskText('ลูเชนขว้างการ์ด', ['Lushen', 'ลูเชน'])).toBe('▇▇▇ขว้างการ์ด');
  });
  it('ignores very short names so it does not eat ordinary words', () => {
    expect(maskText('มี 3 ครั้ง', ['มี', ''])).toBe('มี 3 ครั้ง');
  });
});

describe('share text and labels', () => {
  it('formats the Wordle-style summary', () => {
    expect(shareText({ date: '2026-09-19', results: [true, false, true], url: 'https://x/quiz' })).toBe('ทายมอนจากสกิล SWM 2026-09-19 — 2/3\n🟩🟥🟩\nhttps://x/quiz');
    expect(scoreLabel(10, 10)).toMatch(/สมบูรณ์แบบ/);
    expect(scoreLabel(3, 10)).toMatch(/สารานุกรม/);
  });
});
