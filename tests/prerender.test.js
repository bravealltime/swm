// Static monster pages, sitemap and robots (scripts/prerender_monsters.mjs) on a fixture dist/.
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prerenderMonsters, monsterPage, SITE_URL } from '../scripts/prerender_monsters.mjs';

const TEMPLATE = `<!doctype html>
<html lang="th"><head>
    <meta charset="UTF-8" />
    <title>SWM site</title>
    <meta name="description" content="site-wide description">
    <meta property="og:title" content="site og">
    <script type="module" src="/assets/index-abc.js"></script>
  </head><body><div id="root"></div></body></html>`;

const monster = (id, name, extra = {}) => ({ id, com2usId: id.slice(2), name, thaiName: name, element: 'wind', stars: 4, family: 'Joker', avatarUrl: 'https://cdn/x.png', ...extra });
const rec = (name) => ({ cid: '1', name, bs: { hp: 9000, atk: 800, spd: 103 }, ls: { textTh: 'เพิ่ม ATK 33%' }, sk: [
  { slotLabel: 'S1', name: 'Flying Cards', descriptionTh: 'ขว้าง<การ์ด>', description: 'EN', multiplier: '3.6*{ATK}', scalesWith: 'ATK', cooldownText: 'ไม่มีคูลดาวน์', effects: [{ name: 'Heal Block', nameTh: 'ห้ามฟื้นฟูเลือด' }], skillups: ['+5%'] },
  { slotLabel: 'S3', name: 'Amputation Magic', descriptionTh: 'โจมตี 3 ครั้ง', isAoe: true, hits: 3, cooldown: 5 },
] });

describe('monsterPage', () => {
  const html = monsterPage({ monster: monster('m-13413', 'Lushen', { thaiName: 'ลูเชน (โจ๊กเกอร์ลม)', role: 'Main DPS' }), rec: rec('Lushen'), template: TEMPLATE });

  it('replaces the site-wide title, description and og tags with the monster ones (no duplicates)', () => {
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html).toContain('<title>Lushen (ลูเชน · โจ๊กเกอร์ลม) — สกิล สเตตัส และวิธีใช้ | SWM</title>');
    expect(html.match(/<meta name="description"/g)).toHaveLength(1);
    expect(html).not.toContain('site-wide description');
    expect(html).not.toContain('site og');
    expect(html).toContain(`<link rel="canonical" href="${SITE_URL}/monster/lushen">`);
    expect(html).toContain('<meta property="og:image" content="https://cdn/x.png">');
  });

  it('keeps the app bundle so the SPA boots on the same page', () => {
    expect(html).toContain('/assets/index-abc.js');
    expect(html).toContain('<div id="root">');
  });

  it('renders the Thai skill text, facts, leader skill and stats as visible HTML, escaped', () => {
    expect(html).toContain('ขว้าง&lt;การ์ด&gt;');
    expect(html).toContain('ตัวคูณดาเมจ 3.6*{ATK} (สเกลตาม ATK) · ไม่มีคูลดาวน์ · เอฟเฟกต์: ห้ามฟื้นฟูเลือด · อัปเกรด: +5%');
    expect(html).toContain('S3 · Amputation Magic');
    expect(html).toContain('(AoE)');
    expect(html).toContain('คูลดาวน์ 5 เทิร์น · โจมตี 3 ครั้ง');
    expect(html).toContain('เพิ่ม ATK 33%');
    expect(html).toContain('<td class="text-white font-mono">9000</td>');
    expect(html).toContain('href="/3mdc?q=Lushen"');
  });

  it('renders rich living data sections (summary, rune builds, 3MDC comps) expanding text to 5k+ chars', () => {
    expect(html).toContain('บทวิเคราะห์และภาพรวมเมต้า');
    expect(html).toContain('แนวทางการใส่รูนและสเตตัสเป้าหมายระดับ Guardian');
    expect(html).toContain('G1-G3 Benchmark');
    expect(html).toContain('สถิติในศึกกิลด์วอร์และ Siege Battle');
    expect(html.length).toBeGreaterThan(4500);
  });
});

describe('prerenderMonsters', () => {
  let tmp, result;
  beforeAll(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'swm-prerender-'));
    fs.mkdirSync(path.join(tmp, 'src/data'), { recursive: true });
    fs.mkdirSync(path.join(tmp, 'dist'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'dist/index.html'), TEMPLATE);
    fs.writeFileSync(path.join(tmp, 'src/data/allMonsters.json'), JSON.stringify([
      monster('m-13413', 'Lushen'),
      monster('m-13403', 'Lushen'),            // same name (unawakened form) → same slug, skipped
      monster('m-99999', 'Nobody'),            // no skill record → skipped
      monster('m-24014', 'Alice / Hollyberry Cookie'),
    ]));
    fs.writeFileSync(path.join(tmp, 'src/data/monsterSkillsData.json'), JSON.stringify({
      'm-13413': rec('Lushen'),
      'm-77777': rec('Alice / Hollyberry Cookie'), // matched by name when the id differs
    }));
    result = prerenderMonsters({ root: tmp });
  });

  it('writes one page per monster with skills, skipping duplicates and monsters without data', () => {
    expect(result).toMatchObject({ pages: 2, skippedNoSkills: 1, skippedDuplicate: 1 });
    expect(fs.existsSync(path.join(tmp, 'dist/monster/lushen.html'))).toBe(true);
    expect(fs.existsSync(path.join(tmp, 'dist/monster/alice-hollyberry-cookie.html'))).toBe(true);
    expect(fs.readdirSync(path.join(tmp, 'dist/monster'))).toHaveLength(2);
  });

  it('writes a sitemap with the views and the monster pages, and robots.txt pointing at it', () => {
    const sitemap = fs.readFileSync(path.join(tmp, 'dist/sitemap.xml'), 'utf8');
    expect(sitemap).toContain(`<loc>${SITE_URL}/</loc>`);
    expect(sitemap).toContain(`<loc>${SITE_URL}/catalog</loc>`);
    expect(sitemap).toContain(`<loc>${SITE_URL}/monster/lushen</loc>`);
    expect(sitemap).not.toContain('/admin<');
    expect((sitemap.match(/<url>/g) || []).length).toBe(result.views + result.pages);
    const robots = fs.readFileSync(path.join(tmp, 'dist/robots.txt'), 'utf8');
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
    expect(robots).toContain('Disallow: /admin');
  });

  it('refuses to run without a built dist/', () => {
    expect(() => prerenderMonsters({ root: path.join(tmp, 'nowhere') })).toThrow(/vite build/);
  });
});
