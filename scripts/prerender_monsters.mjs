// Writes a crawlable HTML page per monster into dist/ after `vite build`:
//
//   dist/monster/<slug>.html   title, description, Open Graph, canonical, and the monster's Thai
//                              skills / stats / Guardian RTA stats / duos / synergies / counters /
//                              rune builds / 3MDC comps / balance patches as plain HTML inside #root
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
import { getMonsterLivingData } from '../src/utils/monsterLivingData.js';

export const SITE_URL = (process.env.SITE_URL || 'https://swm-blue.vercel.app').replace(/\/+$/, '');

const ELEMENT_TH = { water: 'น้ำ', fire: 'ไฟ', wind: 'ลม', light: 'แสง', dark: 'มืด' };
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attr = (s) => esc(s).replace(/'/g, '&#39;');
const clip = (s, n) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t; };

/** Skill record for a catalog monster: by id first, then by name (same rule as src/data/monsterSkills.js). */
function skillsFor(monster, skills, byName) {
  return skills[monster.id] || byName.get(String(monster.name || '').toLowerCase()) || null;
}

export function monsterPage({ monster, rec, template, livingData: customLivingData = null }) {
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

  // Extract living data (RTA, Duos, Highdata, Patches, 3MDC, Rune builds, Dungeon Abyss)
  const living = customLivingData || getMonsterLivingData(monster) || {};
  const { guardianStats, duos = [], synergies = [], counters = [], balancePatches = [], mdcStats, builds, dungeonStats = [], summaryTextTh } = living;

  const title = `${name}${thai ? ` (${thai})` : ''} — สกิล สเตตัส และวิธีใช้ | SWM`;
  const firstSkill = skills.find((s) => s.descriptionTh);
  const metaSnippet = guardianStats ? `อันดับ #${guardianStats.rank} RTA Guardian (เลือก ${guardianStats.picks.toLocaleString()} ครั้ง ชนะ ${guardianStats.winRate}%) · ` : '';
  const description = clip(`${name}${thai ? ` (${thai})` : ''} มอนสเตอร์ธาตุ${elementTh} ${stars}★ ${metaSnippet}${monster.family ? `ตระกูล ${monster.family}` : ''} — ${skills.length ? `สกิลแปลไทย ${skills.length} สกิล` : 'ข้อมูลสกิล'}${firstSkill ? `: ${firstSkill.name} ${firstSkill.descriptionTh}` : ''}`, 158);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'หน้าแรก', 'item': `${SITE_URL}/` },
          { '@type': 'ListItem', 'position': 2, 'name': 'สารานุกรมมอนสเตอร์', 'item': `${SITE_URL}/catalog` },
          { '@type': 'ListItem', 'position': 3, 'name': name, 'item': url },
        ],
      },
      {
        '@type': 'ItemPage',
        '@id': url,
        'url': url,
        'name': title,
        'description': description,
        'inLanguage': 'th-TH',
        'mainEntity': {
          '@type': 'GameCharacter',
          'name': name,
          ...(thai ? { 'alternateName': thai } : {}),
          ...(image ? { 'image': image } : {}),
          'description': summaryTextTh || description,
        },
      },
    ],
  };

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
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
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

  // 1. Living Summary HTML
  const summaryHtml = summaryTextTh ? `
    <section class="mt-6 p-4 rounded-xl bg-slate-900 border border-blue-900/40 text-slate-200">
      <h2 class="text-lg font-bold text-blue-300 mb-1.5">บทวิเคราะห์และภาพรวมเมต้า</h2>
      <p class="text-sm leading-relaxed">${esc(summaryTextTh)}</p>
    </section>` : '';

  // 2. RTA Guardian Stats HTML
  const guardianHtml = guardianStats ? `
    <section class="mt-6">
      <h2 class="text-lg font-bold text-white">สถิติ RTA Guardian ซีซั่น ${guardianStats.season} (รีเพลย์ระดับสูง)</h2>
      <div class="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <div class="text-xs text-slate-400">อันดับเมต้า</div>
          <div class="text-xl font-bold text-amber-400 font-mono">#${guardianStats.rank}</div>
          <div class="text-[11px] text-slate-500">จาก ${guardianStats.totalMonsters} มอนสเตอร์</div>
        </div>
        <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <div class="text-xs text-slate-400">ถูกเลือก (Picks)</div>
          <div class="text-xl font-bold text-white font-mono">${guardianStats.picks.toLocaleString()}</div>
          <div class="text-[11px] text-emerald-400 font-semibold">อัตราชนะ ${guardianStats.winRate}%</div>
        </div>
        <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <div class="text-xs text-slate-400">อัตราโดนแบน</div>
          <div class="text-xl font-bold text-rose-400 font-mono">${guardianStats.banRate}%</div>
          <div class="text-[11px] text-slate-400">${guardianStats.bans.toLocaleString()} แมตช์</div>
        </div>
        <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <div class="text-xs text-slate-400">First Pick Rate</div>
          <div class="text-xl font-bold text-purple-300 font-mono">${guardianStats.fpRate}%</div>
          <div class="text-[11px] text-slate-400">ชนะเมื่อ FP ${guardianStats.fpWinRate}%</div>
        </div>
      </div>
    </section>` : '';

  // 3. Duos HTML
  const duosHtml = duos.length > 0 ? `
    <section class="mt-6">
      <h2 class="text-lg font-bold text-white">คู่หูที่ดราฟต์ร่วมกันบ่อยที่สุดใน RTA Guardian</h2>
      <ul class="mt-2 space-y-2 text-sm">
        ${duos.map((d) => `
          <li class="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
            <div>
              <a href="/monster/${monsterSlug(d.partnerName)}" class="text-blue-400 hover:underline font-bold">${esc(d.partnerThaiName)} (${esc(d.partnerName)})</a>
              <span class="text-xs text-slate-400 ml-2">ดราฟต์ร่วมกัน ${d.matches.toLocaleString()} แมตช์</span>
            </div>
            <span class="text-emerald-400 font-mono font-bold">อัตราชนะ ${d.winRate}%</span>
          </li>
        `).join('')}
      </ul>
    </section>` : '';

  // 4. Synergies & Counters HTML
  const highDataHtml = (synergies.length > 0 || counters.length > 0) ? `
    <section class="mt-6">
      <h2 class="text-lg font-bold text-white">คอมโบส่งเสริม & ตัวแก้ทาง (Synergies & Counters)</h2>
      <div class="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        ${synergies.length > 0 ? `
          <div class="p-3 rounded-xl bg-slate-900 border border-emerald-500/20">
            <h3 class="font-bold text-emerald-400 mb-2 text-xs uppercase tracking-wider">คอมโบส่งเสริม (Synergies สูงสุด)</h3>
            <ul class="space-y-1.5 text-xs">
              ${synergies.map((s) => `
                <li class="flex justify-between items-center py-1 border-b border-white/[0.04]">
                  <a href="/monster/${monsterSlug(s.name)}" class="text-slate-200 hover:text-white">${esc(s.thaiName || s.name)}</a>
                  <span class="text-emerald-400 font-mono font-bold">${s.winRate}%</span>
                </li>
              `).join('')}
            </ul>
          </div>` : ''}
        ${counters.length > 0 ? `
          <div class="p-3 rounded-xl bg-slate-900 border border-rose-500/20">
            <h3 class="font-bold text-rose-400 mb-2 text-xs uppercase tracking-wider">ตัวแก้ทางที่ต้องระวัง (Counters)</h3>
            <ul class="space-y-1.5 text-xs">
              ${counters.map((c) => `
                <li class="flex justify-between items-center py-1 border-b border-white/[0.04]">
                  <a href="/monster/${monsterSlug(c.name)}" class="text-slate-200 hover:text-white">${esc(c.thaiName || c.name)}</a>
                  <span class="text-rose-400 font-mono font-bold">ชนะ ${c.winRate}%</span>
                </li>
              `).join('')}
            </ul>
          </div>` : ''}
      </div>
    </section>` : '';

  // 5. Rune Builds & Benchmarks HTML
  const buildsHtml = builds ? `
    <section class="mt-6">
      <h2 class="text-lg font-bold text-white">แนวทางการใส่รูนและสเตตัสเป้าหมายระดับ Guardian</h2>
      <div class="mt-2 p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-sm">
        ${builds.sets?.length ? `
          <div>
            <span class="text-slate-400">เซ็ตแนะนำ:</span>
            <span class="text-white font-bold ml-2 font-mono">${esc(builds.sets.join(' หรือ '))}</span>
          </div>` : ''}
        ${builds.slots246?.length ? `
          <div>
            <span class="text-slate-400">ออฟหลักช่อง 2 / 4 / 6:</span>
            <span class="text-purple-300 font-bold ml-2 font-mono">${esc(builds.slots246.join(' / '))}</span>
          </div>` : ''}
        ${builds.artifacts?.length ? `
          <div>
            <span class="text-slate-400">อาร์ติแฟกต์แนะนำ:</span>
            <span class="text-amber-300 ml-2">${esc(builds.artifacts.join(' · '))}</span>
          </div>` : ''}
        ${builds.benchmarks ? `
          <div class="pt-2 border-t border-slate-800">
            <h3 class="text-xs font-bold text-slate-300 mb-2">ค่าสเตตัสเป้าหมายระดับการ์เดียน (G1-G3 Benchmark)</h3>
            <table class="w-full text-xs font-mono">
              <tr class="border-b border-slate-800"><td class="py-1 text-slate-400">HP</td><td class="text-right text-emerald-400 font-bold">${builds.benchmarks.hp?.toLocaleString()}</td><td class="py-1 pl-4 text-slate-400">SPD</td><td class="text-right text-purple-400 font-bold">+${builds.benchmarks.spd}</td></tr>
              <tr class="border-b border-slate-800"><td class="py-1 text-slate-400">ATK</td><td class="text-right text-amber-400 font-bold">${builds.benchmarks.atk?.toLocaleString()}</td><td class="py-1 pl-4 text-slate-400">CRI Rate</td><td class="text-right text-slate-200">${builds.benchmarks.cr}%</td></tr>
              <tr class="border-b border-slate-800"><td class="py-1 text-slate-400">DEF</td><td class="text-right text-sky-400 font-bold">${builds.benchmarks.def?.toLocaleString()}</td><td class="py-1 pl-4 text-slate-400">CRI Dmg</td><td class="text-right text-slate-200">${builds.benchmarks.cd}%</td></tr>
              <tr><td class="py-1 text-slate-400">RES</td><td class="text-right text-slate-200">${builds.benchmarks.res}%</td><td class="py-1 pl-4 text-slate-400">ACC</td><td class="text-right text-slate-200">${builds.benchmarks.acc}%</td></tr>
            </table>
          </div>` : ''}
        ${builds.tips ? `<p class="text-xs text-slate-300 italic pt-2 border-t border-slate-800">💡 <strong>เทคนิคการเล่น:</strong> ${esc(builds.tips)}</p>` : ''}
      </div>
    </section>` : '';

  // 6. PVE Dungeon Abyss Hard HTML
  const dungeonHtml = dungeonStats.length > 0 ? `
    <section class="mt-6">
      <h2 class="text-lg font-bold text-white">สถิติและทีมสปีดฟาร์มดันเจี้ยน Abyss Hard (PVE)</h2>
      <div class="mt-2 space-y-3 text-sm">
        ${dungeonStats.map((d) => `
          <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div class="flex justify-between items-center flex-wrap gap-2">
              <div class="font-bold text-sky-300 text-base">${esc(d.dungeonNameEn)} (${esc(d.dungeonName)})</div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold">ชนะ ${esc(d.successRate)}</span>
                <span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs font-mono">เวลาเฉลี่ย ${esc(d.avgTime)} นาที</span>
                ${d.recordTime ? `<span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-mono font-bold">สถิติ ${esc(d.recordTime)}</span>` : ''}
              </div>
            </div>
            <div class="text-xs text-slate-300">
              <span class="text-slate-400">บทบาทในทีม:</span> <strong class="text-amber-300">${esc(d.role)}</strong> · <span class="text-slate-400">รูนแนะนำ:</span> <span class="text-slate-200 font-mono">${esc(d.recommendedRune)}</span>
            </div>
            ${d.teammates?.length ? `
              <div class="text-xs text-slate-400">
                <span>เพื่อนร่วมทีม:</span> <span class="text-slate-200 font-semibold">${esc(d.teammates.join(', '))}</span>
              </div>
            ` : ''}
            ${d.turnOrderTh ? `
              <div class="text-xs text-slate-400">
                <span>ลำดับเทิร์น:</span> <span class="text-sky-300 font-mono">${esc(d.turnOrderTh)}</span>
              </div>
            ` : ''}
            ${d.bossMechanicTh ? `
              <div class="text-xs text-slate-400 italic bg-slate-950/60 p-2 rounded border border-slate-800/80">
                💡 ${esc(d.bossMechanicTh)}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </section>` : '';

  // 7. 3MDC Comps HTML
  const mdcHtml = mdcStats && (mdcStats.defCount > 0 || mdcStats.cntCount > 0) ? `
    <section class="mt-6">
      <h2 class="text-lg font-bold text-white">สถิติในศึกกิลด์วอร์และ Siege Battle (ฐานข้อมูล 3MDC)</h2>
      <div class="mt-2 p-4 rounded-xl bg-slate-900 border border-slate-800 text-sm space-y-2">
        <p class="text-slate-300">ปรากฏในสูตรบุกแก้ทาง <strong>${mdcStats.cntCount}</strong> สูตร ${mdcStats.defCount > 0 ? `และเป็นเสาหลักในทีมตั้งรับ <strong>${mdcStats.defCount}</strong> ทีม` : ''}</p>
        ${mdcStats.counterTeams?.length ? `
          <div class="pt-2 border-t border-slate-800">
            <h3 class="text-xs font-bold text-slate-400 mb-1.5">ตัวอย่างสูตรบุกแก้ทางยอดนิยม:</h3>
            <ul class="space-y-1.5 text-xs text-slate-300">
              ${mdcStats.counterTeams.map((c) => `
                <li class="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <div>
                    <span class="text-emerald-400 font-bold">${esc(c.team)}</span>
                    <span class="text-slate-400 ml-2">แก้ทาง: ${esc(c.against)}</span>
                  </div>
                  <span class="text-emerald-400 font-mono font-bold">${esc(c.winRate)}</span>
                </li>
              `).join('')}
            </ul>
          </div>` : ''}
      </div>
    </section>` : '';

  // 7. Balance Patches HTML
  const balanceHtml = balancePatches.length > 0 ? `
    <section class="mt-6">
      <h2 class="text-lg font-bold text-white">ประวัติการปรับสมดุล (Balance Patch History)</h2>
      <div class="mt-2 space-y-2 text-sm">
        ${balancePatches.map((p) => `
          <div class="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-white">แพตช์ #${esc(p.patchId)} · ${esc(p.changeTypeTh)}</span>
              <span class="text-slate-400">${esc(p.date)}</span>
            </div>
            <div class="text-xs font-semibold text-amber-300 mt-1">${esc(p.skillName)}</div>
            <p class="text-xs text-slate-300 mt-1 leading-relaxed">${esc(p.translatedText || p.preview || p.officialText)}</p>
          </div>
        `).join('')}
      </div>
    </section>` : '';

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
      ${summaryHtml}
      ${guardianHtml}
      ${duosHtml}
      ${highDataHtml}
      ${buildsHtml}
      ${dungeonHtml}
      ${mdcHtml}
      ${balanceHtml}
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
    // the site-wide description / Open Graph / twitter / canonical tags give way to the monster's own
    // (leaving the template's <link rel="canonical"> in place would emit two conflicting canonicals)
    .replace(/\s*<meta (?:name|property)="(?:description|og:[^"]+|twitter:[^"]+)"[^>]*>/g, '')
    .replace(/\s*<link rel="canonical"[^>]*\/?>/g, '')
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
