// Writes a crawlable HTML page per monster into dist/ after `vite build`:
//
//   dist/monster/<slug>.html   title, description, Open Graph, canonical, and the monster's Thai
//                              skills / stats as plain HTML inside #root — Google reads that, the
//                              React app then boots on the same URL and opens the inspector
//   dist/sitemap.xml           every view + every monster page
//   dist/robots.txt
//
// The SPA understands the same address (/monster/<slug>, see src/router.js), and Vercel serves
// the static file before the SPA rewrite kicks in (vercel.json: cleanUrls). vite.config.js runs
// this in closeBundle; `node scripts/prerender_monsters.mjs` runs it by hand on an existing dist/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { monsterSlug, VIEW_TITLES } from '../src/router.js';

export const SITE_URL = (process.env.SITE_URL || 'https://swm-blue.vercel.app').replace(/\/+$/, '');

const ELEMENT_TH = { water: 'น้ำ', fire: 'ไฟ', wind: 'ลม', light: 'แสง', dark: 'มืด' };
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attr = (s) => esc(s).replace(/'/g, '&#39;');
const clip = (s, n) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t; };

/** Skill record for a catalog monster: by id first, then by name (same rule as src/data/monsterSkills.js). */
function skillsFor(monster, skills, byName) {
  return skills[monster.id] || byName.get(String(monster.name || '').toLowerCase()) || null;
}

export function monsterPage({ monster, rec, template }) {
  const name = monster.name;
  // "ลูเชน (โจ๊กเกอร์ลม)" → "ลูเชน · โจ๊กเกอร์ลม" so the title does not nest parentheses
  const thai = monster.thaiName && monster.thaiName !== name ? String(monster.thaiName).replace(/\s*\((.*)\)\s*$/, ' · $1') : '';
  const elementTh = ELEMENT_TH[monster.element] || monster.element || '';
  const stars = Number(monster.stars) || 0;
  const slug = monsterSlug(name);
  const url = `${SITE_URL}/monster/${slug}`;
  const image = monster.avatarUrl || monster.imageUrl || '';
  const skills = rec?.sk || [];
  const leader = rec?.ls;
  const bs = rec?.bs || {};

  const title = `${name}${thai ? ` (${thai})` : ''} — สกิล สเตตัส และวิธีใช้ | SWM`;
  const firstSkill = skills.find((s) => s.descriptionTh);
  const description = clip(`${name}${thai ? ` (${thai})` : ''} มอนสเตอร์ธาตุ${elementTh} ${stars}★ ${monster.family ? `ตระกูล ${monster.family}` : ''} — ${skills.length ? `สกิลแปลไทย ${skills.length} สกิล` : 'ข้อมูลสกิล'}${firstSkill ? `: ${firstSkill.name} ${firstSkill.descriptionTh}` : ''}`, 158);

  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${attr(description)}">`,
    `<link rel="canonical" href="${attr(url)}">`,
    `<meta property="og:type" content="article">`,
    `<meta property="og:site_name" content="SWM (Summoners War Master)">`,
    `<meta property="og:locale" content="th_TH">`,
    `<meta property="og:title" content="${attr(title)}">`,
    `<meta property="og:description" content="${attr(description)}">`,
    `<meta property="og:url" content="${attr(url)}">`,
    image ? `<meta property="og:image" content="${attr(image)}">` : '',
    `<meta name="twitter:card" content="summary">`,
  ].filter(Boolean).join('\n    ');

  const skillHtml = skills.map((s, i) => {
    const effects = (s.effects || []).map((e) => e.nameTh || e.name).filter(Boolean);
    const facts = [
      s.multiplier ? `ตัวคูณดาเมจ ${s.multiplier}${s.scalesWith ? ` (สเกลตาม ${s.scalesWith})` : ''}` : '',
      s.cooldownText || (s.cooldown ? `คูลดาวน์ ${s.cooldown} เทิร์น` : ''),
      s.hits > 1 ? `โจมตี ${s.hits} ครั้ง` : '',
      effects.length ? `เอฟเฟกต์: ${effects.join(', ')}` : '',
      Array.isArray(s.skillups) && s.skillups.length ? `อัปเกรด: ${s.skillups.join(' / ')}` : '',
    ].filter(Boolean);
    return `
      <section class="mt-4">
        <h3 class="text-base font-bold text-white">${esc(s.slotLabel || `S${i + 1}`)} · ${esc(s.name)}${s.isPassive ? ' <span class="text-purple-300">(Passive)</span>' : ''}${s.isAoe ? ' <span class="text-amber-300">(AoE)</span>' : ''}</h3>
        <p class="text-sm text-slate-200 mt-1">${esc(s.descriptionTh || s.description || '')}</p>
        ${facts.length ? `<p class="text-xs text-slate-400 mt-1">${esc(facts.join(' · '))}</p>` : ''}
        ${s.tactics ? `<p class="text-xs text-slate-400 mt-1">${esc(s.tactics)}</p>` : ''}
      </section>`;
  }).join('');

  const statRows = [['HP', bs.hp], ['ATK', bs.atk], ['DEF', bs.def], ['SPD', bs.spd], ['CRI Rate', bs.critRate != null ? `${bs.critRate}%` : null], ['CRI Dmg', bs.critDmg != null ? `${bs.critDmg}%` : null], ['RES', bs.res != null ? `${bs.res}%` : null], ['ACC', bs.acc != null ? `${bs.acc}%` : null]]
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `<tr><th class="text-left pr-4 text-slate-400 font-medium">${k}</th><td class="text-white font-mono">${esc(v)}</td></tr>`).join('');

  const body = `
    <main class="max-w-3xl mx-auto p-4 sm:p-8 text-slate-100">
      <nav class="text-xs text-slate-400"><a href="/" class="hover:text-white">SWM</a> › <a href="/catalog" class="hover:text-white">สารานุกรมมอนสเตอร์</a> › ${esc(name)}</nav>
      <header class="mt-4 flex items-start gap-4">
        ${image ? `<img src="${attr(image)}" alt="${attr(name)}" width="96" height="96" class="rounded-xl">` : ''}
        <div>
          <h1 class="text-2xl font-black text-white">${esc(name)}${thai ? ` <span class="text-slate-300 font-bold">(${esc(thai)})</span>` : ''}</h1>
          <p class="text-sm text-slate-300 mt-1">ธาตุ${esc(elementTh)} · ${stars}★${monster.family ? ` · ตระกูล ${esc(monster.family)}${monster.thaiFamily && monster.thaiFamily !== monster.family ? ` (${esc(monster.thaiFamily)})` : ''}` : ''}${monster.archetype ? ` · ${esc(monster.archetype)}` : ''}${monster.unawakenedName && monster.unawakenedName !== name ? ` · ก่อนตื่น: ${esc(monster.unawakenedName)}` : ''}</p>
          ${monster.role ? `<p class="text-sm text-slate-400 mt-1">${esc(monster.role)}</p>` : ''}
        </div>
      </header>
      ${leader ? `<h2 class="text-lg font-bold text-white mt-6">ลีดเดอร์สกิล</h2><p class="text-sm text-slate-200 mt-1">${esc(leader.textTh || leader.textEn || `${leader.attribute || ''} +${leader.amount || ''}%${leader.area ? ` (${leader.area})` : ''}`)}</p>` : ''}
      ${skills.length ? `<h2 class="text-lg font-bold text-white mt-6">สกิล (${skills.length})</h2>${skillHtml}` : ''}
      ${statRows ? `<h2 class="text-lg font-bold text-white mt-6">ค่าสถานะพื้นฐาน (6★ เลเวล 40)</h2><table class="text-sm mt-2">${statRows}</table>` : ''}
      <h2 class="text-lg font-bold text-white mt-6">ใช้งานต่อ</h2>
      <ul class="text-sm text-blue-300 mt-1 space-y-1">
        <li><a href="/3mdc?q=${encodeURIComponent(name)}" class="hover:underline">สูตรแก้ทาง 3MDC ที่มี ${esc(name)}</a></li>
        <li><a href="/where2use?monster=${encodeURIComponent(name)}" class="hover:underline">${esc(name)} ใช้ที่ไหนได้บ้าง</a></li>
        <li><a href="/catalog" class="hover:underline">สารานุกรมสกิลมอนสเตอร์ทั้งหมด</a></li>
      </ul>
      <p class="text-xs text-slate-500 mt-8">ข้อมูลสกิลจากเกม แปลไทยโดย SWM · หน้าโต้ตอบเต็ม (ค้นหา, ฟิลเตอร์, tooltip) จะโหลดเมื่อเปิด JavaScript</p>
    </main>`;

  return template
    // the site-wide description / Open Graph tags give way to the monster's own
    .replace(/\s*<meta (?:name|property)="(?:description|og:[^"]+|twitter:card)"[^>]*>/g, '')
    .replace(/<title>[\s\S]*?<\/title>/, head)
    .replace('<div id="root"></div>', `<div id="root">${body}\n    </div>`);
}

export function prerenderMonsters({ root = process.cwd(), dist = path.join(root, 'dist'), log = () => {} } = {}) {
  const templateFile = path.join(dist, 'index.html');
  if (!fs.existsSync(templateFile)) throw new Error(`no ${templateFile} — run vite build first`);
  const template = fs.readFileSync(templateFile, 'utf8');
  const monstersJson = JSON.parse(fs.readFileSync(path.join(root, 'src/data/allMonsters.json'), 'utf8'));
  const monsters = Array.isArray(monstersJson) ? monstersJson : Object.values(monstersJson);
  const skills = JSON.parse(fs.readFileSync(path.join(root, 'src/data/monsterSkillsData.json'), 'utf8'));
  const byName = new Map(Object.values(skills).map((r) => [String(r.name || '').toLowerCase(), r]));

  const outDir = path.join(dist, 'monster');
  fs.mkdirSync(outDir, { recursive: true });
  const seen = new Set();
  const pages = [];
  let skippedNoSkills = 0;
  let skippedDuplicate = 0;
  for (const monster of monsters) {
    const rec = skillsFor(monster, skills, byName);
    if (!rec) { skippedNoSkills++; continue; }
    const slug = monsterSlug(monster.name);
    if (!slug || seen.has(slug)) { skippedDuplicate++; continue; } // the SPA resolves a slug to the first name match too
    seen.add(slug);
    fs.writeFileSync(path.join(outDir, `${slug}.html`), monsterPage({ monster, rec, template }));
    pages.push(slug);
  }

  const today = new Date().toISOString().slice(0, 10);
  const views = Object.keys(VIEW_TITLES).filter((v) => v !== 'admin');
  const urls = [
    ...views.map((v) => ({ loc: v === 'dashboard' ? `${SITE_URL}/` : `${SITE_URL}/${v}`, priority: v === 'dashboard' ? '1.0' : '0.7', changefreq: 'daily' })),
    ...pages.map((slug) => ({ loc: `${SITE_URL}/monster/${slug}`, priority: '0.6', changefreq: 'weekly' })),
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${esc(u.loc)}</loc><lastmod>${today}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);
  fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

  const result = { pages: pages.length, skippedNoSkills, skippedDuplicate, views: views.length };
  log(`[swm] prerendered ${result.pages} monster pages (+ sitemap with ${views.length} views); no skills: ${skippedNoSkills}, duplicate slug: ${skippedDuplicate}`);
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  prerenderMonsters({ log: console.log });
}
