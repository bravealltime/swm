// Lenient JSON extraction from model answers (api/_lib/ai.js) — the batch scripts depend on it
// surviving fences, chatter and truncated output.
import { describe, it, expect } from 'vitest';
import { parseJson, hashOf } from '../api/_lib/ai.js';

describe('parseJson', () => {
  it('parses a plain object', () => {
    expect(parseJson('{"a":1}')).toEqual({ a: 1 });
  });
  it('strips ``` fences and surrounding prose', () => {
    expect(parseJson('Here you go:\n```json\n{"a": [1, 2]}\n```\nHope this helps')).toEqual({ a: [1, 2] });
  });
  it('takes the outermost object when the answer contains nested braces', () => {
    expect(parseJson('x {"outer": {"inner": "}"}} y')).toEqual({ outer: { inner: '}' } });
  });
  it('recovers a truncated object by cutting at the last complete pair', () => {
    expect(parseJson('{"summary": "done", "note": "cut off he')).toEqual({ summary: 'done' });
  });
  it('throws when there is no object at all', () => {
    expect(() => parseJson('no json here')).toThrow(/no JSON object/);
  });
});

describe('hashOf', () => {
  it('is stable, short and sensitive to content', () => {
    expect(hashOf({ a: 1 })).toBe(hashOf({ a: 1 }));
    expect(hashOf({ a: 1 })).toMatch(/^[0-9a-f]{8}$/);
    expect(hashOf({ a: 1 })).not.toBe(hashOf({ a: 2 }));
    expect(hashOf('text')).toBe(hashOf('text'));
  });
});
