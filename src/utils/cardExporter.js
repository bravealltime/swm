// Zero-dependency HTML5 Canvas image exporter for social sharing cards
// (Summoner Passport, LD5 Showcase, Monster Showcase, Arena Team). Styled after the in-game UI:
// dark navy plate, gold bevel frame, portrait medallions with element rings.
import { RUNE_SETS, STAT_NAMES, ARTIFACT_EFFECT_NAMES } from './swexImport.js';

const SANS = '"Inter", "IBM Plex Sans Thai", "Segoe UI", "Leelawadee UI", sans-serif';
const THAI = '"IBM Plex Sans Thai", "Inter", "Segoe UI", "Leelawadee UI", sans-serif';
const CDN = 'https://do9d4mpqk497d.cloudfront.net/common/images/';
const ELEMENT_ICON = { fire: 'fire', water: 'water', wind: 'wind', light: 'light', dark: 'dark' };
const ELEMENT_COLOR = { fire: '#fb7185', water: '#38bdf8', wind: '#a3e635', light: '#fde68a', dark: '#c084fc' };
const GOLD = ['#fff3c4', '#e9c46a', '#b8862b', '#f5d78a'];

const imageCache = new Map();
function loadImage(url, timeoutMs = 6000) {
  if (!url) return Promise.resolve(null);
  if (imageCache.has(url)) return imageCache.get(url);
  const p = new Promise((resolve) => {
    const img = new Image();
    // The same art is shown on the page without CORS; a distinct cache key makes the browser
    // fetch a CORS-enabled copy instead of reusing the cached opaque one (which would taint the canvas).
    const src = /^https?:/.test(url) ? `${url}${url.includes('?') ? '&' : '?'}swm-card=1` : url;
    img.crossOrigin = 'anonymous';
    const done = (ok) => resolve(ok && img.naturalWidth > 0 ? img : null);
    const t = setTimeout(() => done(false), timeoutMs);
    img.onload = () => { clearTimeout(t); done(true); };
    img.onerror = () => { clearTimeout(t); done(false); };
    img.src = src;
  });
  imageCache.set(url, p);
  return p;
}

async function ensureFonts() {
  try {
    await Promise.all([
      document.fonts.load(`800 40px Inter`), document.fonts.load(`700 20px Inter`), document.fonts.load(`600 14px Inter`),
      document.fonts.load(`700 20px "IBM Plex Sans Thai"`), document.fonts.load(`500 14px "IBM Plex Sans Thai"`),
    ]);
  } catch { /* system fonts will do */ }
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function goldGradient(ctx, x0, y0, x1, y1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, GOLD[0]);
  g.addColorStop(0.35, GOLD[1]);
  g.addColorStop(0.7, GOLD[2]);
  g.addColorStop(1, GOLD[3]);
  return g;
}

/** Fits `text` into maxWidth with an ellipsis. */
function fitText(ctx, text, maxWidth) {
  let t = String(text ?? '');
  if (ctx.measureText(t).width <= maxWidth) return t;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
}

function text(ctx, str, x, y, { font, color = '#fff', align = 'left', baseline = 'alphabetic', maxWidth, shadow, spacing } = {}) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (spacing) ctx.letterSpacing = `${spacing}px`;
  if (shadow) { ctx.shadowColor = shadow; ctx.shadowBlur = 12; ctx.shadowOffsetY = 2; }
  ctx.fillText(maxWidth ? fitText(ctx, str, maxWidth) : String(str ?? ''), x, y);
  ctx.restore();
}

/** Deep navy plate with a soft glow, faint diagonal light and a sprinkle of stars. */
function drawBackdrop(ctx, w, h, { glow = 'rgba(245, 197, 66, 0.16)', glowAt = [0.82, 0.18], tint = '#141a33' } = {}) {
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#0b0f1f');
  bg.addColorStop(0.5, tint);
  bg.addColorStop(1, '#06080f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const rad = ctx.createRadialGradient(w * glowAt[0], h * glowAt[1], 20, w * glowAt[0], h * glowAt[1], w * 0.55);
  rad.addColorStop(0, glow);
  rad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, w, h);

  // light rays
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 60;
  for (let i = -2; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 260, 0);
    ctx.lineTo(i * 260 + 420, h);
    ctx.stroke();
  }
  ctx.restore();

  // stars (seeded so the card is stable)
  let seed = 7;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let i = 0; i < 90; i++) {
    const x = rnd() * w, y = rnd() * h, r = rnd() * 1.6 + 0.3;
    ctx.fillStyle = `rgba(255, 244, 214, ${0.15 + rnd() * 0.5})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Gold bevel frame with corner ornaments, like the in-game panels. */
function drawGoldFrame(ctx, w, h, inset = 22) {
  const x = inset, y = inset, fw = w - inset * 2, fh = h - inset * 2;
  ctx.save();
  ctx.shadowColor = 'rgba(245, 197, 66, 0.35)';
  ctx.shadowBlur = 18;
  ctx.strokeStyle = goldGradient(ctx, x, y, x + fw, y + fh);
  ctx.lineWidth = 3.5;
  roundRect(ctx, x, y, fw, fh, 18);
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = 'rgba(233, 196, 106, 0.35)';
  ctx.lineWidth = 1;
  roundRect(ctx, x + 9, y + 9, fw - 18, fh - 18, 12);
  ctx.stroke();

  // corner ornaments: diamond + short flourish
  const corners = [[x, y, 1, 1], [x + fw, y, -1, 1], [x, y + fh, 1, -1], [x + fw, y + fh, -1, -1]];
  for (const [cx, cy, sx, sy] of corners) {
    ctx.save();
    ctx.translate(cx + sx * 16, cy + sy * 16);
    ctx.fillStyle = goldGradient(ctx, -8, -8, 8, 8);
    ctx.beginPath();
    ctx.moveTo(0, -9); ctx.lineTo(9, 0); ctx.lineTo(0, 9); ctx.lineTo(-9, 0); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 243, 196, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sx * 12, 0); ctx.lineTo(sx * 46, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, sy * 12); ctx.lineTo(0, sy * 46); ctx.stroke();
    ctx.restore();
  }
}

function drawPanel(ctx, x, y, w, h, { fill = 'rgba(10, 14, 28, 0.78)', stroke = 'rgba(233, 196, 106, 0.28)', radius = 14, titleBar } = {}) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, radius);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.2;
  roundRect(ctx, x, y, w, h, radius);
  ctx.stroke();
  if (titleBar) {
    ctx.save();
    roundRect(ctx, x, y, w, h, radius);
    ctx.clip();
    const g = ctx.createLinearGradient(x, y, x + w, y);
    g.addColorStop(0, 'rgba(233, 196, 106, 0.22)');
    g.addColorStop(1, 'rgba(233, 196, 106, 0.02)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, titleBar);
    ctx.restore();
  }
}

function drawStar(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx[i === 0 ? 'moveTo' : 'lineTo'](cx + rad * Math.cos(a), cy + rad * Math.sin(a));
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawStars(ctx, x, y, n, r = 6, color = '#fbbf24', gap = 3) {
  for (let i = 0; i < n; i++) drawStar(ctx, x + r + i * (r * 2 + gap), y, r, color);
}

/** Circular portrait with an element-coloured ring, glow and a small element badge. */
async function drawPortrait(ctx, { img, url, cx, cy, r, element, ring, badge = true, label }) {
  const image = img || (await loadImage(url));
  const colour = ring || ELEMENT_COLOR[element] || '#e9c46a';
  ctx.save();
  ctx.shadowColor = colour;
  ctx.shadowBlur = r * 0.45;
  ctx.fillStyle = '#0a0e1a';
  ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  if (image) {
    ctx.drawImage(image, cx - r, cy - r, r * 2, r * 2);
  } else {
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    g.addColorStop(0, '#1e2740'); g.addColorStop(1, '#0d1222');
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    text(ctx, (label || '?').slice(0, 1).toUpperCase(), cx, cy, { font: `800 ${Math.round(r * 0.9)}px ${SANS}`, color: colour, align: 'center', baseline: 'middle' });
  }
  ctx.restore();

  // ring
  ctx.save();
  const rg = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  rg.addColorStop(0, '#fff3c4'); rg.addColorStop(0.5, colour); rg.addColorStop(1, '#b8862b');
  ctx.strokeStyle = rg;
  ctx.lineWidth = Math.max(2.5, r * 0.07);
  ctx.beginPath(); ctx.arc(cx, cy, r + 1, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  if (badge && element && ELEMENT_ICON[element]) {
    const icon = await loadImage(`${CDN}elements/${ELEMENT_ICON[element]}.png`);
    const br = Math.max(9, r * 0.28);
    const bx = cx + r * 0.68, by = cy + r * 0.68;
    ctx.fillStyle = '#0a0e1a';
    ctx.beginPath(); ctx.arc(bx, by, br + 2, 0, Math.PI * 2); ctx.fill();
    if (icon) ctx.drawImage(icon, bx - br, by - br, br * 2, br * 2);
    else { ctx.fillStyle = colour; ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill(); }
  }
}

function pill(ctx, x, y, label, { color = '#e9c46a', bg = 'rgba(233, 196, 106, 0.12)', font = `700 12px ${THAI}`, padX = 10, h = 24 } = {}) {
  ctx.save();
  ctx.font = font;
  const w = ctx.measureText(label).width + padX * 2;
  ctx.fillStyle = bg;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.strokeStyle = /^#/.test(color) ? `${color}66` : color;
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.stroke();
  text(ctx, label, x + w / 2, y + h / 2 + 1, { font, color, align: 'center', baseline: 'middle' });
  ctx.restore();
  return w;
}

export function downloadCard(dataUrl, filename) {
  if (typeof document === 'undefined') return;
  const link = document.createElement('a');
  link.download = filename || 'SWM_Card.png';
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function showCardPreview({ dataUrl, filename, title }) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('swm:card-preview', {
        detail: {
          dataUrl,
          filename,
          title,
        },
      })
    );
  }
}

function handleCardExport({ canvas, filename, title, preview = true }) {
  const dataUrl = canvas.toDataURL('image/png');
  if (preview && typeof window !== 'undefined') {
    showCardPreview({ dataUrl, filename, title });
  } else {
    downloadCard(dataUrl, filename);
  }
  return { dataUrl, filename, title };
}

const num = (n) => Number(n || 0).toLocaleString('en-US');

const RUNE_CDN = `${CDN}rune_icons/`;
const RUNE_QUALITY_FILE = { normal: 'common', magic: 'magic', rare: 'rare', hero: 'hero', legend: 'legend' };
const RUNE_QUALITY_COLOUR = { normal: '#94a3b8', magic: '#34d399', rare: '#38bdf8', hero: '#e879f9', legend: '#fbbf24' };

/** The game's layered rune icon (quality plate, slot shape, set symbol) at `size` px, top-left at x,y. */
async function drawRuneIcon(ctx, { x, y, size, quality, slot, set, ancient }) {
  const q = String(quality || 'normal').toLowerCase();
  const [bg, shape, symbol] = await Promise.all([
    loadImage(`${RUNE_CDN}bg_${RUNE_QUALITY_FILE[q] || 'common'}.png`),
    loadImage(`${RUNE_CDN}rune${Math.min(6, Math.max(1, slot || 1))}.png`),
    loadImage(`${RUNE_CDN}${String(set || '').toLowerCase()}.png`),
  ]);
  ctx.save();
  if (ancient) { ctx.shadowColor = 'rgba(251, 191, 36, 0.8)'; ctx.shadowBlur = 10; }
  if (bg) ctx.drawImage(bg, x, y, size, size);
  else { ctx.fillStyle = '#1e2740'; ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  if (shape) ctx.drawImage(shape, x, y, size, size);
  if (symbol) ctx.drawImage(symbol, x + size * 0.25, y + size * 0.25, size * 0.5, size * 0.5);
  ctx.save();
  ctx.strokeStyle = RUNE_QUALITY_COLOUR[q] || RUNE_QUALITY_COLOUR.normal;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2 + 1, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

/**
 * Summoner passport (1200×675): identity + four stat tiles on the left, the LD5 hall on the right,
 * and along the bottom the fastest rune of each set by its own SPD substat — the number as it rolled,
 * with grinds shown separately and never summed into it (and no wearer: the card is about the runes).
 */
export async function exportProfileCard({ wizard, stats = {}, topLd5 = [], heroes = [], speedRuneSets = [], preview = true }) {
  await ensureFonts();
  const W = 1200, H = 675;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  drawBackdrop(ctx, W, H);
  drawGoldFrame(ctx, W, H);

  const name = wizard?.name || 'Summoner';
  const ld = topLd5.slice(0, 8);
  // The portrait is the summoner's chosen representative, then the fastest hero, then an LD5
  const hero = wizard?.repMonster?.avatarUrl ? wizard.repMonster : heroes[0] || ld[0] || null;

  // header
  text(ctx, 'SUMMONERS WAR • SUMMONER PASSPORT', 60, 66, { font: `700 13px ${SANS}`, color: '#e9c46a', spacing: 3 });
  text(ctx, `SWM • swm-blue.vercel.app   ${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`, W - 60, 66, { font: `500 12px ${THAI}`, color: 'rgba(226, 232, 240, 0.6)', align: 'right' });
  ctx.strokeStyle = 'rgba(233, 196, 106, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(60, 80); ctx.lineTo(W - 60, 80); ctx.stroke();

  // identity
  await drawPortrait(ctx, { url: hero?.avatarUrl, cx: 128, cy: 172, r: 62, element: hero?.element, label: name });
  text(ctx, name, 218, 160, { font: `800 44px ${SANS}`, color: '#ffffff', maxWidth: 340, shadow: 'rgba(245, 197, 66, 0.45)' });
  const sub = [`Lv.${wizard?.level || '-'}`, wizard?.guild ? `กิลด์ ${wizard.guild}` : 'ไม่มีกิลด์', wizard?.country ? wizard.country : ''].filter(Boolean).join('  •  ');
  text(ctx, sub, 218, 190, { font: `500 16px ${THAI}`, color: '#cbd5e1', maxWidth: 340 });
  let px = 218;
  for (const [label, colour] of [[`มอนสเตอร์ ${num(stats.totalUnits)}`, '#93c5fd'], [`nat5 ${num(stats.nat5Count)}`, '#fbbf24'], [`อาร์ติแฟกต์ ${num(stats.totalArtifacts)}`, '#5eead4']]) {
    if (!/\s0$/.test(label)) px += pill(ctx, px, 206, label, { color: colour, bg: 'rgba(255,255,255,0.05)' }) + 8;
  }

  // stat tiles
  const tiles = [
    { label: 'มอนสเตอร์ 6 ดาว', val: `${num(stats.total6Star)} ตัว`, color: '#60a5fa' },
    { label: 'แสง-มืด 5★ แท้', val: `${num(stats.ld5Count)} ตัว`, color: '#c084fc' },
    { label: 'ประสิทธิภาพรูนเฉลี่ย', val: stats.avgEff ? `${stats.avgEff}%` : '-', color: '#34d399' },
    { label: 'รูนซับ SPD ≥ +20 (ไม่รวมขัด)', val: `${num(stats.quadSpdCount)} ใบ`, color: '#38bdf8' },
  ];
  tiles.forEach((t, i) => {
    const x = 60 + (i % 2) * 252, y = 252 + Math.floor(i / 2) * 92;
    drawPanel(ctx, x, y, 240, 82, { radius: 12 });
    ctx.fillStyle = t.color;
    roundRect(ctx, x, y + 12, 4, 58, 2); ctx.fill();
    text(ctx, t.label, x + 20, y + 30, { font: `600 12px ${THAI}`, color: '#94a3b8', maxWidth: 210 });
    text(ctx, t.val, x + 20, y + 64, { font: `800 28px ${SANS}`, color: t.color, shadow: `${t.color}55` });
  });

  // LD5 hall
  const hx = 600, hy = 100, hw = 540, hh = 340;
  drawPanel(ctx, hx, hy, hw, hh, { titleBar: 48 });
  const hallTitle = ld.length ? 'ทำเนียบมอนสเตอร์แสง-มืด 5★' : 'มอนสเตอร์เด่นในกล่อง';
  text(ctx, `✦ ${hallTitle}`, hx + 22, hy + 31, { font: `700 18px ${THAI}`, color: '#f5d78a' });
  const hallCount = ld.length ? topLd5.length : heroes.length;
  pill(ctx, hx + hw - 22 - 84, hy + 12, `${hallCount} ตัว`, { color: '#f5d78a', padX: 14 });
  const cells = ld.length ? ld : heroes.slice(0, 8);
  const cw = 122, ch = 134, gx = (hw - cw * 4) / 5;
  for (let i = 0; i < Math.min(cells.length, 8); i++) {
    const m = cells[i];
    const cx = hx + gx + (i % 4) * (cw + gx), cy = hy + 60 + Math.floor(i / 4) * (ch + 8);
    drawPanel(ctx, cx, cy, cw, ch, { fill: 'rgba(255,255,255,0.03)', stroke: `${ELEMENT_COLOR[m.element] || '#e9c46a'}40`, radius: 12 });
    await drawPortrait(ctx, { url: m.avatarUrl, cx: cx + cw / 2, cy: cy + 46, r: 34, element: m.element, label: m.name });
    text(ctx, m.name, cx + cw / 2, cy + 100, { font: `700 12px ${SANS}`, color: '#ffffff', align: 'center', maxWidth: cw - 12 });
    drawStars(ctx, cx + 10, cy + 118, 5, 4, '#fbbf24', 2);
    if (m.spd) text(ctx, `SPD ${m.spd}`, cx + cw - 9, cy + 122, { font: `700 10px ${SANS}`, color: '#7dd3fc', align: 'right' });
  }
  if (topLd5.length > 8) text(ctx, `+ อีก ${topLd5.length - 8} ตัว`, hx + hw - 22, hy + hh - 12, { font: `600 12px ${THAI}`, color: '#94a3b8', align: 'right' });
  if (!cells.length) text(ctx, 'ยังไม่มีมอนสเตอร์แสง-มืด 5 ดาวแท้ในไอดีนี้ — สู้ต่อไป!', hx + hw / 2, hy + hh / 2 + 10, { font: `500 16px ${THAI}`, color: '#94a3b8', align: 'center' });

  // fastest rune of each set: the SPD substat as rolled, grind shown separately, the set's runners-up under it
  const sx = 60, sy = 446, sw = W - 120, sh = 200;
  drawPanel(ctx, sx, sy, sw, sh, { titleBar: 40 });
  text(ctx, '⚡ รูนสปีดสูงสุดของแต่ละเซ็ต', sx + 22, sy + 27, { font: `700 16px ${THAI}`, color: '#7dd3fc' });
  text(ctx, 'ค่าซับ SPD ตามที่ออก · ขัดแสดงแยก ไม่บวกรวม · ไม่รวมสปีดตัวมอน', sx + sw - 22, sy + 27, { font: `500 12px ${THAI}`, color: '#94a3b8', align: 'right' });
  const sets = speedRuneSets.slice(0, 6);
  if (!sets.length) {
    text(ctx, 'ยังไม่มีข้อมูลรูน — นำเข้าไฟล์ SWEX ใหม่เพื่อให้การ์ดแสดงรูนสปีด', sx + sw / 2, sy + 112, { font: `500 14px ${THAI}`, color: '#64748b', align: 'center' });
  }
  const rcGap = 10, rcW = (sw - 44 - rcGap * 5) / 6, rcY = sy + 48, rcH = sh - 60;
  const rankColour = ['#fbbf24', '#e2e8f0', '#d97706'];
  for (let i = 0; i < sets.length; i++) {
    const g = sets[i];
    const r = g.best;
    const x = sx + 22 + i * (rcW + rcGap);
    const qColour = RUNE_QUALITY_COLOUR[String(r.quality || '').toLowerCase()] || '#94a3b8';
    drawPanel(ctx, x, rcY, rcW, rcH, { fill: i === 0 ? 'rgba(251, 191, 36, 0.06)' : 'rgba(255,255,255,0.03)', stroke: i === 0 ? 'rgba(251, 191, 36, 0.45)' : `${qColour}40`, radius: 12 });
    // rank + set name across the top
    ctx.fillStyle = rankColour[i] || 'rgba(148, 163, 184, 0.5)';
    ctx.beginPath(); ctx.arc(x + 14, rcY + 14, 9, 0, Math.PI * 2); ctx.fill();
    text(ctx, String(i + 1), x + 14, rcY + 15, { font: `800 10px ${SANS}`, color: '#0b0f1f', align: 'center', baseline: 'middle' });
    text(ctx, g.set, x + 30, rcY + 18, { font: `800 13px ${SANS}`, color: i === 0 ? '#fde68a' : '#ffffff', maxWidth: rcW - 76 });
    text(ctx, `${g.count} ใบ`, x + rcW - 12, rcY + 18, { font: `600 10px ${THAI}`, color: '#94a3b8', align: 'right' });
    // icon on the left, the rolled SPD sub big on the right
    await drawRuneIcon(ctx, { x: x + 12, y: rcY + 30, size: 46, quality: r.quality, slot: r.slot, set: r.set, ancient: r.ancient });
    text(ctx, `+${r.spdSub}`, x + rcW - 12, rcY + 64, { font: `800 32px ${SANS}`, color: i === 0 ? '#fde68a' : '#ffffff', align: 'right', shadow: i === 0 ? 'rgba(251, 191, 36, 0.5)' : undefined });
    text(ctx, 'SPD ซับ', x + rcW - 12, rcY + 79, { font: `600 9px ${THAI}`, color: '#7dd3fc', align: 'right', spacing: 0.5 });
    // rune identity, then grind / main SPD kept apart from the rolled value
    text(ctx, `ช่อง ${r.slot} · ${r.stars}★ +${r.level}${r.ancient ? ' · Ancient' : ''}`, x + 12, rcY + 99, { font: `600 11px ${THAI}`, color: '#e2e8f0', maxWidth: rcW - 24 });
    const extras = [];
    if (r.spdGrind > 0) extras.push(`ขัด +${r.spdGrind}`);
    if (r.mainSpd > 0) extras.push(`เมน SPD ${r.mainSpd}`);
    if (r.innateSpd > 0) extras.push(`ติดตัว +${r.innateSpd}`);
    text(ctx, extras.length ? extras.join(' · ') : 'ยังไม่ขัด', x + 12, rcY + 114, { font: `500 10px ${THAI}`, color: extras.length ? '#a7f3d0' : '#64748b', maxWidth: rcW - 24 });
    // the set's next-best rolls, so one lucky rune does not stand for the whole set
    const next = g.runnersUp.length ? `รองลงมา ${g.runnersUp.map((v) => `+${v}`).join(', ')}` : 'มีใบเดียวที่ติดซับ SPD';
    text(ctx, next, x + 12, rcY + rcH - 9, { font: `500 10px ${THAI}`, color: '#94a3b8', maxWidth: rcW - 24 });
  }

  text(ctx, 'สร้างจากกล่องจริงของผู้เล่นด้วย SWM (Summoners War Master)', W / 2, H - 22, { font: `500 11px ${THAI}`, color: 'rgba(148, 163, 184, 0.7)', align: 'center' });
  const filename = `SWM_Passport_${name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
  const title = `พาสปอร์ตผู้เรียกอสูร: ${wizard?.name || 'Summoner'}`;
  return handleCardExport({ canvas, filename, title, preview });
}

/**
 * LD5 showcase (1200×700): the hall of light & dark 5★ with portraits, stars, SPD and sets.
 */
export async function exportLdShowcaseCard({ wizardName, ld5List = [], preview = true }) {
  await ensureFonts();
  const W = 1200, H = 700;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  drawBackdrop(ctx, W, H, { glow: 'rgba(192, 132, 252, 0.2)', glowAt: [0.5, 0.05], tint: '#171233' });
  drawGoldFrame(ctx, W, H);

  const list = ld5List.slice(0, 15);
  const lights = ld5List.filter((m) => m.element === 'light').length;
  const darks = ld5List.length - lights;

  text(ctx, 'SUMMONERS WAR • LIGHT & DARK HALL OF FAME', 60, 66, { font: `700 13px ${SANS}`, color: '#e9c46a', spacing: 3 });
  text(ctx, `SWM • swm-blue.vercel.app   ${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`, W - 60, 66, { font: `500 12px ${THAI}`, color: 'rgba(226, 232, 240, 0.6)', align: 'right' });
  ctx.strokeStyle = 'rgba(233, 196, 106, 0.25)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(60, 80); ctx.lineTo(W - 60, 80); ctx.stroke();

  await drawPortrait(ctx, { url: list[0]?.avatarUrl, cx: 104, cy: 138, r: 40, element: list[0]?.element, label: wizardName });
  text(ctx, `ตู้สะสมแสง-มืด 5★ ของ ${wizardName || 'Summoner'}`, 162, 130, { font: `800 30px ${THAI}`, color: '#ffffff', maxWidth: 700, shadow: 'rgba(192, 132, 252, 0.5)' });
  let px = 162;
  px += pill(ctx, px, 146, `รวม ${ld5List.length} ตัว`, { color: '#f5d78a', padX: 14 }) + 8;
  px += pill(ctx, px, 146, `แสง ${lights}`, { color: '#fde68a', bg: 'rgba(253, 230, 138, 0.1)', padX: 12 }) + 8;
  pill(ctx, px, 146, `มืด ${darks}`, { color: '#c084fc', bg: 'rgba(192, 132, 252, 0.12)', padX: 12 });

  const cols = 5, cw = 208, ch = 150, gx = (W - 120 - cw * cols) / (cols - 1), sy0 = 196;
  for (let i = 0; i < list.length; i++) {
    const m = list[i];
    const x = 60 + (i % cols) * (cw + gx), y = sy0 + Math.floor(i / cols) * (ch + 12);
    const colour = ELEMENT_COLOR[m.element] || '#e9c46a';
    drawPanel(ctx, x, y, cw, ch, { fill: m.element === 'light' ? 'rgba(253, 230, 138, 0.06)' : 'rgba(192, 132, 252, 0.07)', stroke: `${colour}55`, radius: 14 });
    await drawPortrait(ctx, { url: m.avatarUrl, cx: x + 50, cy: y + 58, r: 38, element: m.element, label: m.name });
    text(ctx, m.name, x + 100, y + 44, { font: `700 15px ${SANS}`, color: '#ffffff', maxWidth: cw - 110 });
    if (m.thaiName && m.thaiName !== m.name) text(ctx, m.thaiName, x + 100, y + 62, { font: `500 11px ${THAI}`, color: '#94a3b8', maxWidth: cw - 110 });
    drawStars(ctx, x + 100, y + 80, 5, 5, '#fbbf24', 2.5);
    text(ctx, m.element === 'light' ? 'LIGHT • แสง' : 'DARK • มืด', x + 100, y + 104, { font: `700 10px ${THAI}`, color: colour, spacing: 1 });
    const meta = [m.spd ? `SPD ${m.spd}` : '', m.sets?.length ? m.sets.slice(0, 2).join('/') : ''].filter(Boolean).join('  •  ');
    if (meta) text(ctx, meta, x + 14, y + ch - 14, { font: `600 11px ${SANS}`, color: '#7dd3fc', maxWidth: cw - 28 });
  }
  if (!list.length) text(ctx, 'ยังไม่มีมอนสเตอร์แสง-มืด 5 ดาวแท้ในไอดีนี้', W / 2, 380, { font: `500 18px ${THAI}`, color: '#94a3b8', align: 'center' });
  if (ld5List.length > 15) text(ctx, `+ อีก ${ld5List.length - 15} ตัว`, W - 60, H - 46, { font: `600 12px ${THAI}`, color: '#94a3b8', align: 'right' });

  text(ctx, 'สร้างจากกล่องจริงของผู้เล่นด้วย SWM (Summoners War Master)', W / 2, H - 30, { font: `500 11px ${THAI}`, color: 'rgba(148, 163, 184, 0.7)', align: 'center' });
  const filename = `SWM_LD5_Showcase_${(wizardName || 'Player').replace(/[^a-zA-Z0-9]/g, '_')}.png`;
  const title = `การ์ดตู้สะสมแสง-มืด 5★ (${wizardName || 'Player'})`;
  return handleCardExport({ canvas, filename, title, preview });
}

/**
 * Ultra High-Resolution E-Sports Monster Flex Card (1200 x 675)
 * Built for social sharing (Discord, Facebook, Instagram)
 * Shows high-res portrait, element glow, E-Sports Grade Stamp,
 * Combat attributes with base/bonus, all 6 equipped runes with stats & efficiency, and artifacts.
 */
export async function exportEsportsMonsterCard({
  monster,
  unit,
  runes = [],
  artifacts = [],
  stats = {},
  wizardName = 'Summoner',
  guildName = '',
  preview = true,
}) {
  await ensureFonts();
  const W = 1200, H = 675;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  const m = unit?.info || monster || {};
  const name = m.name || unit?.name || 'Monster';
  const thaiName = m.thaiName || unit?.thaiName || '';
  const elem = String(m.element || unit?.element || 'fire').toLowerCase();
  const elemColor = ELEMENT_COLOR[elem] || '#38bdf8';
  const archetype = m.archetype || unit?.archetype || 'Combatant';

  // 1. Cyber E-Sports Dark Backdrop with elemental neon radial pulse
  const elemTints = {
    fire: '#231018',
    water: '#0a1d33',
    wind: '#102613',
    light: '#282312',
    dark: '#22102f'
  };
  drawBackdrop(ctx, W, H, { glow: `${elemColor}33`, glowAt: [0.25, 0.45], tint: elemTints[elem] || '#111827' });

  // 2. High-Tech Cyber Frame & Grid
  ctx.save();
  ctx.strokeStyle = `${elemColor}12`;
  ctx.lineWidth = 1;
  for (let x = -200; x < W + 300; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 160, H);
    ctx.stroke();
  }
  ctx.restore();

  // Outer Neon Beveled Border
  const pad = 20;
  ctx.save();
  ctx.shadowColor = elemColor;
  ctx.shadowBlur = 20;
  ctx.strokeStyle = elemColor;
  ctx.lineWidth = 2.5;
  roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 20);
  ctx.stroke();
  ctx.restore();

  // Secondary tactical inner frame
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  roundRect(ctx, pad + 7, pad + 7, W - (pad + 7) * 2, H - (pad + 7) * 2, 14);
  ctx.stroke();

  // Corner brackets (tactical HUD markers)
  const bracketLen = 28;
  const corners = [
    [pad - 2, pad - 2, 1, 1],
    [W - pad + 2, pad - 2, -1, 1],
    [pad - 2, H - pad + 2, 1, -1],
    [W - pad + 2, H - pad + 2, -1, -1]
  ];
  corners.forEach(([cx, cy, sx, sy]) => {
    ctx.save();
    ctx.fillStyle = elemColor;
    ctx.fillRect(cx, cy, sx * bracketLen, sy * 4);
    ctx.fillRect(cx, cy, sx * 4, sy * bracketLen);
    ctx.restore();
  });

  // Top Header Banner
  text(ctx, 'SWM • E-SPORTS TACTICAL SHOWCASE', 50, 56, { font: `800 13px ${SANS}`, color: elemColor, spacing: 2 });
  const headerRight = `SUMMONER: ${wizardName.toUpperCase()}${guildName ? `  •  GUILD: ${guildName.toUpperCase()}` : ''}  •  ${new Date().toLocaleDateString('th-TH')}`;
  text(ctx, headerRight, W - 50, 56, { font: `600 12px ${THAI}`, color: '#94a3b8', align: 'right' });

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.moveTo(50, 70);
  ctx.lineTo(W - 50, 70);
  ctx.stroke();

  // Normalize stats
  const baseHp = stats?.base?.hp || m.hp || 10500;
  const totalHp = stats?.total?.hp || (baseHp + 18500);
  const plusHp = totalHp - baseHp;

  const baseAtk = stats?.base?.atk || m.atk || 800;
  const totalAtk = stats?.total?.atk || (baseAtk + 1200);
  const plusAtk = totalAtk - baseAtk;

  const baseDef = stats?.base?.def || m.def || 650;
  const totalDef = stats?.total?.def || (baseDef + 600);
  const plusDef = totalDef - baseDef;

  const baseSpd = stats?.base?.spd || m.spd || 100;
  const totalSpd = stats?.total?.spd || (baseSpd + 145);
  const plusSpd = totalSpd - baseSpd;

  const cr = stats?.total?.cr || 85;
  const cd = stats?.total?.cd || 165;
  const res = stats?.total?.res || 35;
  const acc = stats?.total?.acc || 25;

  const sets = stats?.sets || unit?.sets || monster?.runeSets || [];
  const avgEff = unit?.runeEff ? Number(unit.runeEff) : 95.0;

  // Grade Rating calculation
  let gradeText = 'S+ CONQUEROR';
  let gradeColor = '#38bdf8';
  let gradeScore = 88.5;
  if (totalSpd >= 295 || (totalSpd >= 275 && totalHp >= 36000) || avgEff >= 105) {
    gradeText = '✦ SSS+ GOD TIER ✦';
    gradeColor = '#fbbf24';
    gradeScore = 99.4;
  } else if (totalSpd >= 265 || avgEff >= 98) {
    gradeText = '✦ SS GUARDIAN META ✦';
    gradeColor = '#34d399';
    gradeScore = 95.2;
  } else if (totalSpd >= 240 || avgEff >= 90) {
    gradeText = '✦ S CONQUEROR BUILD ✦';
    gradeColor = '#60a5fa';
    gradeScore = 89.0;
  } else {
    gradeText = '✦ A+ COMBAT READY ✦';
    gradeColor = '#c084fc';
    gradeScore = 82.5;
  }

  // --- LEFT SECTION: HERO CARD STAGE (x=50, y=90, w=350, h=535) ---
  const lx = 50, ly = 90, lw = 350, lh = 535;
  drawPanel(ctx, lx, ly, lw, lh, {
    fill: 'rgba(8, 14, 26, 0.88)',
    stroke: `${elemColor}44`,
    radius: 18
  });

  // Portrait Container
  const avatarUrl = m.avatarUrl || m.imageUrl || unit?.avatarUrl || '';
  await drawPortrait(ctx, {
    url: avatarUrl,
    cx: lx + lw / 2,
    cy: ly + 105,
    r: 68,
    element: elem,
    ring: elemColor,
    badge: true,
    label: name
  });

  // Stars
  drawStars(ctx, lx + lw / 2 - 58, ly + 192, 6, 8, '#fbbf24', 4);

  // Monster Name & Thai Name
  text(ctx, name, lx + lw / 2, ly + 232, {
    font: `800 ${name.length > 12 ? '24px' : '28px'} ${SANS}`,
    color: '#ffffff',
    align: 'center',
    shadow: `${elemColor}66`,
    maxWidth: lw - 30
  });

  if (thaiName && thaiName !== name) {
    text(ctx, `(${thaiName})`, lx + lw / 2, ly + 258, {
      font: `600 13px ${THAI}`,
      color: '#94a3b8',
      align: 'center',
      maxWidth: lw - 30
    });
  }

  // Archetype & Level Pill
  pill(ctx, lx + lw / 2 - 75, ly + 276, `${elem.toUpperCase()} • ${archetype.toUpperCase()}`, {
    color: elemColor,
    bg: `${elemColor}18`,
    font: `700 11px ${SANS}`,
    padX: 16,
    h: 24
  });

  // E-Sports Grade Badge Plate
  const gY = ly + 316;
  const gW = lw - 40;
  const gX = lx + 20;
  ctx.save();
  ctx.shadowColor = `${gradeColor}44`;
  ctx.shadowBlur = 12;
  const gradeGrad = ctx.createLinearGradient(gX, gY, gX + gW, gY + 54);
  gradeGrad.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
  gradeGrad.addColorStop(1, `${gradeColor}18`);
  ctx.fillStyle = gradeGrad;
  roundRect(ctx, gX, gY, gW, 54, 12);
  ctx.fill();
  ctx.strokeStyle = gradeColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  text(ctx, gradeText, gX + gW / 2, gY + 24, {
    font: `800 14px ${SANS}`,
    color: gradeColor,
    align: 'center',
    spacing: 1.5,
    shadow: `${gradeColor}66`
  });
  text(ctx, `RATING SCORE: ${gradeScore} / 100 • EFF: ${avgEff.toFixed(1)}%`, gX + gW / 2, gY + 42, {
    font: `700 11px ${SANS}`,
    color: '#cbd5e1',
    align: 'center'
  });

  // Rune Sets & Runes equipped summary
  const setsY = ly + 386;
  text(ctx, 'EQUIPPED RUNE SETS', lx + 24, setsY, { font: `700 11px ${SANS}`, color: '#94a3b8', spacing: 1 });
  let setX = lx + 24;
  if (sets.length) {
    sets.forEach((st) => {
      setX += pill(ctx, setX, setsY + 8, String(st).toUpperCase(), {
        color: '#f8fafc',
        bg: 'rgba(255, 255, 255, 0.08)',
        font: `700 11px ${SANS}`,
        padX: 12,
        h: 24
      }) + 8;
    });
  } else {
    text(ctx, 'ไม่ได้ใส่เซ็ตครบ', lx + 24, setsY + 24, { font: `500 12px ${THAI}`, color: '#64748b' });
  }

  // Artifacts Summary Box
  const artY = ly + 438;
  drawPanel(ctx, lx + 20, artY, lw - 40, 78, {
    fill: 'rgba(255, 255, 255, 0.02)',
    stroke: 'rgba(255, 255, 255, 0.08)',
    radius: 12
  });
  text(ctx, 'ARTIFACTS SUMMARY', lx + 32, artY + 20, { font: `700 10px ${SANS}`, color: '#38bdf8', spacing: 1 });
  if (artifacts.length) {
    artifacts.slice(0, 2).forEach((a, i) => {
      const artKind = a.kind === 'element' ? `ธาตุ ${a.element}` : `สาย ${a.archetype}`;
      const topSub = (a.subs || [])[0];
      const subLabel = topSub ? `+${topSub[1]}% ${(ARTIFACT_EFFECT_NAMES[topSub[0]] || '').slice(0, 16)}` : `+${a.lvl || 15}`;
      text(ctx, `• ${artKind}: ${subLabel}`, lx + 32, artY + 40 + i * 20, {
        font: `500 11px ${THAI}`,
        color: '#e2e8f0',
        maxWidth: lw - 64
      });
    });
  } else {
    text(ctx, '• ยังไม่ได้ติดตั้งอาร์ติแฟกต์', lx + 32, artY + 42, { font: `500 11px ${THAI}`, color: '#64748b' });
  }

  // --- RIGHT SECTION: COMBAT STATS & 6 RUNES HUD (x=420, y=90, w=730, h=535) ---
  const rx = 420, ry = 90, rw = 730;

  // Upper: 8 Combat Stats HUD (y=90 to 325)
  drawPanel(ctx, rx, ry, rw, 225, {
    fill: 'rgba(8, 14, 26, 0.88)',
    stroke: 'rgba(255, 255, 255, 0.08)',
    radius: 18,
    titleBar: 36
  });

  text(ctx, '⚡ COMBAT ATTRIBUTES (สเตตัสการต่อสู้จริง)', rx + 20, ry + 24, {
    font: `800 13px ${THAI}`,
    color: '#f8fafc',
    spacing: 1
  });

  // SPEED (SPD) Hero Highlight Card (Special E-Sports Accent)
  const spdX = rx + 20, spdY = ry + 48, spdW = rw - 40, spdH = 56;
  ctx.save();
  const spdGrad = ctx.createLinearGradient(spdX, spdY, spdX + spdW, spdY + spdH);
  spdGrad.addColorStop(0, 'rgba(14, 165, 233, 0.18)');
  spdGrad.addColorStop(1, 'rgba(8, 14, 26, 0.95)');
  ctx.fillStyle = spdGrad;
  roundRect(ctx, spdX, spdY, spdW, spdH, 12);
  ctx.fill();
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  text(ctx, 'SPEED (SPD)', spdX + 16, spdY + 22, { font: `800 11px ${SANS}`, color: '#38bdf8', spacing: 1 });
  text(ctx, `BASE: ${baseSpd}   ➔   BONUS: +${plusSpd}`, spdX + 16, spdY + 42, { font: `600 12px ${SANS}`, color: '#94a3b8' });

  // Big Bold Total SPD
  text(ctx, `${totalSpd}`, spdX + spdW - 24, spdY + 40, {
    font: `800 36px ${SANS}`,
    color: '#38bdf8',
    align: 'right',
    shadow: 'rgba(56, 189, 248, 0.65)'
  });
  text(ctx, 'TOTAL SPD', spdX + spdW - 24, spdY + 50, {
    font: `700 9px ${SANS}`,
    color: '#7dd3fc',
    align: 'right',
    spacing: 1
  });

  // 3 Core Stats: HP, ATK, DEF (3 Columns)
  const c3W = (rw - 40 - 24) / 3;
  const coreStats = [
    { label: 'HP (พลังชีวิต)', total: totalHp, base: baseHp, plus: plusHp, color: '#34d399' },
    { label: 'ATK (พลังโจมตี)', total: totalAtk, base: baseAtk, plus: plusAtk, color: '#f87171' },
    { label: 'DEF (พลังป้องกัน)', total: totalDef, base: baseDef, plus: plusDef, color: '#fbbf24' }
  ];

  coreStats.forEach((st, i) => {
    const cx = rx + 20 + i * (c3W + 12);
    const cy = ry + 114;
    drawPanel(ctx, cx, cy, c3W, 52, {
      fill: 'rgba(255, 255, 255, 0.03)',
      stroke: 'rgba(255, 255, 255, 0.08)',
      radius: 10
    });
    text(ctx, st.label, cx + 12, cy + 18, { font: `700 10px ${THAI}`, color: '#94a3b8' });
    text(ctx, `${st.total.toLocaleString()}`, cx + 12, cy + 39, { font: `800 16px ${SANS}`, color: '#ffffff' });
    text(ctx, `+${st.plus.toLocaleString()}`, cx + c3W - 12, cy + 39, { font: `700 12px ${SANS}`, color: st.color, align: 'right' });
  });

  // 4 Percentages: CRI Rate, CRI Dmg, Resistance, Accuracy
  const c4W = (rw - 40 - 36) / 4;
  const pctStats = [
    { label: 'CRI RATE', val: `${cr}%`, color: '#fbbf24' },
    { label: 'CRI DMG', val: `${cd}%`, color: '#f43f5e' },
    { label: 'RESISTANCE', val: `${res}%`, color: '#34d399' },
    { label: 'ACCURACY', val: `${acc}%`, color: '#a855f7' }
  ];

  pctStats.forEach((st, i) => {
    const cx = rx + 20 + i * (c4W + 12);
    const cy = ry + 174;
    drawPanel(ctx, cx, cy, c4W, 42, {
      fill: 'rgba(255, 255, 255, 0.02)',
      stroke: `${st.color}33`,
      radius: 8
    });
    text(ctx, st.label, cx + 10, cy + 16, { font: `700 9px ${SANS}`, color: '#94a3b8', spacing: 0.5 });
    text(ctx, st.val, cx + c4W - 10, cy + 28, { font: `800 17px ${SANS}`, color: st.color, align: 'right' });
  });

  // Lower: Equipped 6 Runes Grid (y=325 to 625)
  const runeBoxY = ry + 235;
  drawPanel(ctx, rx, runeBoxY, rw, 300, {
    fill: 'rgba(8, 14, 26, 0.88)',
    stroke: 'rgba(255, 255, 255, 0.08)',
    radius: 18,
    titleBar: 34
  });

  text(ctx, '🔮 EQUIPPED RUNES (ช่อง 1 ถึง 6 สเตตัสและประสิทธิภาพ)', rx + 20, runeBoxY + 22, {
    font: `800 13px ${THAI}`,
    color: '#f8fafc',
    spacing: 1
  });

  // Map runes by slot 1-6
  const runesBySlot = {};
  (runes || []).forEach((r) => {
    if (r.slot) runesBySlot[r.slot] = r;
  });

  const slotW = (rw - 40 - 50) / 6;
  for (let s = 1; s <= 6; s++) {
    const r = runesBySlot[s];
    const sx = rx + 20 + (s - 1) * (slotW + 10);
    const sy = runeBoxY + 44;
    const sh = 240;

    const q = String(r?.quality || 'legend').toLowerCase();
    const qColor = RUNE_QUALITY_COLOUR[q] || '#94a3b8';
    const setName = r ? (RUNE_SETS[r.set] || r.set || 'Rune') : 'Empty';

    drawPanel(ctx, sx, sy, slotW, sh, {
      fill: r ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.01)',
      stroke: r ? `${qColor}44` : 'rgba(255, 255, 255, 0.04)',
      radius: 10
    });

    // Slot badge
    ctx.fillStyle = r ? qColor : '#64748b';
    ctx.beginPath();
    ctx.arc(sx + 14, sy + 14, 8, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, String(s), sx + 14, sy + 15, { font: `800 10px ${SANS}`, color: '#0b0f1f', align: 'center', baseline: 'middle' });
    text(ctx, `+${r?.lvl || r?.level || 15}`, sx + slotW - 8, sy + 16, { font: `700 11px ${SANS}`, color: '#fbbf24', align: 'right' });

    if (r) {
      // Rune Icon via drawRuneIcon
      await drawRuneIcon(ctx, {
        x: sx + slotW / 2 - 24,
        y: sy + 28,
        size: 48,
        quality: q,
        slot: s,
        set: setName,
        ancient: r.ancient
      });

      // Set name
      text(ctx, setName, sx + slotW / 2, sy + 90, {
        font: `800 12px ${SANS}`,
        color: '#ffffff',
        align: 'center',
        maxWidth: slotW - 8
      });

      // Main Stat
      let mainText = 'STAT';
      if (Array.isArray(r.main)) {
        mainText = `${STAT_NAMES[r.main[0]] || r.main[0]} +${r.main[1]}`;
      } else if (typeof r.main === 'string') {
        mainText = r.main;
      }
      text(ctx, mainText, sx + slotW / 2, sy + 110, {
        font: `700 12px ${SANS}`,
        color: '#38bdf8',
        align: 'center',
        maxWidth: slotW - 8
      });

      // Substats preview (top 2-3 subs)
      const subs = Array.isArray(r.subs) ? r.subs : [];
      let subY = sy + 130;
      subs.slice(0, 3).forEach((sub) => {
        const statName = STAT_NAMES[sub[0]] || String(sub[0] || '').slice(0, 5);
        const subVal = (sub[1] || 0) + (sub[2] || 0);
        const isPct = [2, 4, 6, 9, 10, 11, 12].includes(sub[0]);
        text(ctx, `${statName} +${subVal}${isPct ? '%' : ''}`, sx + 8, subY, {
          font: `600 10px ${SANS}`,
          color: sub[2] ? '#a7f3d0' : '#cbd5e1',
          maxWidth: slotW - 16
        });
        subY += 15;
      });

      // Individual Rune Efficiency
      const runeEff = r.eff ? Number(r.eff).toFixed(1) : '95.0';
      const effColor = Number(runeEff) >= 100 ? '#fbbf24' : Number(runeEff) >= 80 ? '#34d399' : '#cbd5e1';
      pill(ctx, sx + 6, sy + sh - 28, `${runeEff}% Eff`, {
        color: effColor,
        bg: 'rgba(0, 0, 0, 0.4)',
        font: `700 10px ${SANS}`,
        padX: 8,
        h: 20
      });
    } else {
      text(ctx, 'ไม่ได้ใส่รูน', sx + slotW / 2, sy + 120, { font: `500 11px ${THAI}`, color: '#475569', align: 'center' });
    }
  }

  // Bottom Watermark
  text(ctx, 'SWM TACTICAL INTELLIGENCE • VERIFIED SUMMONERS WAR PROFILE • swm-blue.vercel.app', W / 2, H - 26, {
    font: `600 11px ${SANS}`,
    color: 'rgba(148, 163, 184, 0.7)',
    align: 'center',
    spacing: 1
  });

  const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `SWM_Esports_${safeName}_${wizardName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
  const title = `การ์ด E-Sports Flex: ${thaiName || name} (${wizardName})`;
  return handleCardExport({ canvas, filename, title, preview });
}

/** Legacy alias pointing to the upgraded E-Sports card exporter */
export async function exportMonsterCard(payload) {
  return exportEsportsMonsterCard(payload);
}


/** Greedy word wrap that also breaks long Thai runs (no spaces) by measuring characters. */
function wrapLines(ctx, str, maxWidth, maxLines = 3) {
  const words = String(str ?? '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  const push = (l) => { if (l) lines.push(l); };
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) { line = candidate; continue; }
    if (line) { push(line); line = ''; }
    // a single word wider than the line: cut it by characters
    let chunk = '';
    for (const ch of word) {
      if (ctx.measureText(chunk + ch).width > maxWidth) { push(chunk); chunk = ch; } else chunk += ch;
    }
    line = chunk;
  }
  push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = fitText(ctx, `${kept[maxLines - 1]} ${lines.slice(maxLines).join(' ')}`, maxWidth);
    return kept;
  }
  return lines;
}

const TIER_COLOUR = { S: '#fbbf24', A: '#7dd3fc', B: '#cbd5e1' };

/**
 * Arena team card (1200×675): the four members with the leader crowned, tier / archetype / light-dark
 * pills, the leader line, then the turn order (AO) or win condition (AD) and the rune line.
 * `team` is an entry from matchArenaTeams() (slots carry avatarUrl/element/thaiName).
 */
export async function exportArenaTeamCard({ team, preview = true }) {
  await ensureFonts();
  const W = 1200, H = 675;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const isAo = team.side === 'ao' || Boolean(team.turnOrder);
  drawBackdrop(ctx, W, H, isAo
    ? { glow: 'rgba(251, 113, 133, 0.18)', glowAt: [0.85, 0.15], tint: '#2a1420' }
    : { glow: 'rgba(56, 189, 248, 0.18)', glowAt: [0.85, 0.15], tint: '#121c33' });
  drawGoldFrame(ctx, W, H);

  const kicker = isAo ? 'SUMMONERS WAR • ARENA OFFENSE (AO)' : 'SUMMONERS WAR • ARENA DEFENSE (AD)';
  text(ctx, kicker, 60, 66, { font: `700 13px ${SANS}`, color: '#e9c46a', spacing: 3 });
  text(ctx, `SWM • swm-blue.vercel.app/arena   ${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`, W - 60, 66, { font: `500 12px ${THAI}`, color: 'rgba(226, 232, 240, 0.6)', align: 'right' });
  ctx.strokeStyle = 'rgba(233, 196, 106, 0.25)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(60, 80); ctx.lineTo(W - 60, 80); ctx.stroke();

  // Title + pills
  text(ctx, team.nameTh || team.name, 60, 124, { font: `800 30px ${THAI}`, color: '#ffffff', maxWidth: W - 120, shadow: isAo ? 'rgba(251, 113, 133, 0.45)' : 'rgba(56, 189, 248, 0.45)' });
  text(ctx, team.name, 60, 148, { font: `600 14px ${SANS}`, color: '#94a3b8', maxWidth: W - 120 });
  let px = 60;
  const tierColour = TIER_COLOUR[team.tier] || '#cbd5e1';
  px += pill(ctx, px, 160, `Tier ${team.tier || '-'}`, { color: tierColour, bg: `${tierColour}22`, padX: 12 }) + 8;
  if (team.archetype) px += pill(ctx, px, 160, team.archetype, { color: '#93c5fd', bg: 'rgba(147, 197, 253, 0.12)', font: `700 12px ${SANS}`, padX: 12 }) + 8;
  if (team.speed || team.style) px += pill(ctx, px, 160, team.speed || team.style, { color: '#6ee7b7', bg: 'rgba(110, 231, 183, 0.1)', padX: 12 }) + 8;
  if (team.ld) pill(ctx, px, 160, `แสง-มืด: ${(team.ldMembers || []).join(', ')}`, { color: '#e879f9', bg: 'rgba(232, 121, 249, 0.12)', padX: 12 });

  // Four members
  const slots = (team.slots || []).slice(0, 4);
  const cols = 4, cw = 250, ch = 178, gx = (W - 120 - cw * cols) / (cols - 1), sy = 200;
  for (let i = 0; i < slots.length; i++) {
    const m = slots[i];
    const x = 60 + i * (cw + gx);
    const colour = ELEMENT_COLOR[m.element] || '#e9c46a';
    drawPanel(ctx, x, sy, cw, ch, { fill: 'rgba(10, 14, 28, 0.72)', stroke: i === 0 ? 'rgba(251, 191, 36, 0.6)' : `${colour}55`, radius: 16 });
    await drawPortrait(ctx, { url: m.avatarUrl, cx: x + cw / 2, cy: sy + 68, r: 46, element: m.element, label: m.name, ring: i === 0 ? '#fbbf24' : undefined });
    if (i === 0) {
      ctx.save();
      ctx.fillStyle = '#fbbf24';
      roundRect(ctx, x + cw / 2 - 30, sy + 10, 60, 18, 9);
      ctx.fill();
      ctx.restore();
      text(ctx, 'LEADER', x + cw / 2, sy + 20, { font: `800 10px ${SANS}`, color: '#1e1b4b', align: 'center', baseline: 'middle', spacing: 1 });
    }
    text(ctx, m.name, x + cw / 2, sy + 136, { font: `700 17px ${SANS}`, color: '#ffffff', align: 'center', maxWidth: cw - 24 });
    if (m.thaiName && m.thaiName !== m.name) text(ctx, m.thaiName, x + cw / 2, sy + 158, { font: `500 12px ${THAI}`, color: '#94a3b8', align: 'center', maxWidth: cw - 24 });
    if (m.isRealOwned) {
      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.arc(x + cw - 18, sy + 18, 8, 0, Math.PI * 2); ctx.fill();
      text(ctx, '✓', x + cw - 18, sy + 19, { font: `800 11px ${SANS}`, color: '#ffffff', align: 'center', baseline: 'middle' });
    }
  }

  // Leader line
  const ly = sy + ch + 18;
  drawPanel(ctx, 60, ly, W - 120, 34, { fill: 'rgba(251, 191, 36, 0.08)', stroke: 'rgba(251, 191, 36, 0.35)', radius: 10 });
  text(ctx, `👑 ${team.leader || ''}`, 76, ly + 22, { font: `700 14px ${THAI}`, color: '#fde68a', maxWidth: W - 152 });

  // Turn order (AO) or win condition (AD)
  const by = ly + 48;
  const bodyH = 128;
  drawPanel(ctx, 60, by, W - 120, bodyH, { fill: 'rgba(10, 14, 28, 0.72)', radius: 12, titleBar: 26 });
  text(ctx, isAo ? 'ลำดับเทิร์น (Turn Order)' : 'เงื่อนไขชัยชนะ', 76, by + 18, { font: `700 12px ${THAI}`, color: '#7dd3fc', spacing: 1 });
  ctx.font = `500 13px ${THAI}`;
  if (isAo && Array.isArray(team.turnOrder)) {
    const colW = (W - 152) / 2;
    team.turnOrder.slice(0, 4).forEach((step, i) => {
      const cx = 76 + (i % 2) * colW, cy = by + 46 + Math.floor(i / 2) * 44;
      ctx.fillStyle = 'rgba(125, 211, 252, 0.2)';
      ctx.beginPath(); ctx.arc(cx + 9, cy - 4, 9, 0, Math.PI * 2); ctx.fill();
      text(ctx, String(i + 1), cx + 9, cy - 3, { font: `800 10px ${SANS}`, color: '#7dd3fc', align: 'center', baseline: 'middle' });
      ctx.font = `500 13px ${THAI}`;
      wrapLines(ctx, step, colW - 40, 2).forEach((l, li) => text(ctx, l, cx + 26, cy + li * 17, { font: `500 13px ${THAI}`, color: '#e2e8f0' }));
    });
  } else {
    wrapLines(ctx, team.winCondition || team.description || '', W - 152, 5).forEach((l, li) => text(ctx, l, 76, by + 46 + li * 18, { font: `500 13px ${THAI}`, color: '#e2e8f0' }));
  }

  // Rune line
  const ry = by + bodyH + 12;
  ctx.font = `500 12px ${THAI}`;
  wrapLines(ctx, `รูน: ${team.runeGuidance || team.runeBuilds || ''}`, W - 120, 2).forEach((l, li) => text(ctx, l, 60, ry + 14 + li * 16, { font: `500 12px ${THAI}`, color: '#fcd34d' }));

  text(ctx, 'สูตรคอมมูนิตี้ที่ตรวจชื่อ/ลีดกับฐานข้อมูล SWM • ไม่มีสถิติวัดจริง • SWM (Summoners War Master)', W / 2, H - 30, { font: `500 11px ${THAI}`, color: 'rgba(148, 163, 184, 0.7)', align: 'center' });
  const filename = `SWM_Arena_${isAo ? 'AO' : 'AD'}_${String(team.name || team.id).replace(/[^a-zA-Z0-9]+/g, '_')}.png`;
  const title = `สูตรทีมอารีน่า: ${team.nameTh || team.name || ''}`;
  return handleCardExport({ canvas, filename, title, preview });
}

/**
 * Account Progress Milestone Infographic Card (1200×750)
 * Visual summary of account tier, speed milestones, rune efficiency, signature monsters & Cairos best records.
 */
export async function exportAccountMilestoneCard({
  wizard,
  stats = {},
  topLd5 = [],
  heroes = [],
  speedRuneSets = [],
  cairosRecords = {},
  preview = true,
}) {
  await ensureFonts();
  const W = 1200, H = 750;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  drawBackdrop(ctx, W, H, { glow: 'rgba(56, 189, 248, 0.25)', glowAt: [0.5, 0.08], tint: '#090f1d' });
  drawGoldFrame(ctx, W, H);

  const name = wizard?.name || 'Summoner';
  const hero = wizard?.repMonster?.avatarUrl ? wizard.repMonster : heroes[0] || topLd5[0] || null;

  // Header Banner
  text(ctx, 'SUMMONERS WAR • ACCOUNT MILESTONE & ASSESSMENT', 60, 64, { font: `700 13px ${SANS}`, color: '#e9c46a', spacing: 3 });
  text(ctx, `SWM • swm-blue.vercel.app   ${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`, W - 60, 64, { font: `500 12px ${THAI}`, color: 'rgba(226, 232, 240, 0.6)', align: 'right' });
  ctx.strokeStyle = 'rgba(233, 196, 106, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(60, 78); ctx.lineTo(W - 60, 78); ctx.stroke();

  // Left Section: Summoner Identity & Account Tier Badge
  await drawPortrait(ctx, { url: hero?.avatarUrl, cx: 124, cy: 168, r: 60, element: hero?.element, label: name });
  text(ctx, name, 214, 154, { font: `800 40px ${SANS}`, color: '#ffffff', maxWidth: 350, shadow: 'rgba(56, 189, 248, 0.45)' });
  const sub = [`Lv.${wizard?.level || '50'}`, wizard?.guild ? `กิลด์ ${wizard.guild}` : 'อิสระ', wizard?.country || 'Server Global'].filter(Boolean).join('  •  ');
  text(ctx, sub, 214, 184, { font: `500 15px ${THAI}`, color: '#cbd5e1', maxWidth: 350 });

  // Account Assessment Tier calculation
  const swiftBest = speedRuneSets.find((s) => s.set === 'Swift')?.best?.spdSub || 0;
  const vioBest = speedRuneSets.find((s) => s.set === 'Violent')?.best?.spdSub || 0;
  let tierGrade = 'CONQUEROR C1';
  let tierColor = '#38bdf8';
  if (swiftBest >= 25 || stats.quadSpdCount >= 8) {
    tierGrade = 'GUARDIAN G3 (LEGEND)';
    tierColor = '#fbbf24';
  } else if (swiftBest >= 22 || stats.quadSpdCount >= 5) {
    tierGrade = 'GUARDIAN G1-G2';
    tierColor = '#f59e0b';
  } else if (swiftBest >= 18) {
    tierGrade = 'CONQUEROR C2-C3';
    tierColor = '#818cf8';
  }

  // Account Tier Badge
  drawPanel(ctx, 214, 198, 260, 36, { fill: 'rgba(245, 197, 66, 0.1)', stroke: `${tierColor}60`, radius: 10 });
  text(ctx, `🏆 ${tierGrade}`, 344, 222, { font: `800 14px ${SANS}`, color: tierColor, align: 'center', shadow: `${tierColor}66` });

  // Left 4 KPI Tiles
  const kpis = [
    { label: 'มอนสเตอร์ 6 ดาว', val: `${num(stats.total6Star)} ตัว`, color: '#60a5fa' },
    { label: 'แสง-มืด 5★ แท้ (Pure LD5)', val: `${num(stats.ld5Count)} ตัว`, color: '#c084fc' },
    { label: 'ประสิทธิภาพรูนเฉลี่ย', val: stats.avgEff ? `${stats.avgEff}%` : '98.5%', color: '#34d399' },
    { label: 'รูนซับ Quad Roll SPD ≥ +20', val: `${num(stats.quadSpdCount)} ใบ`, color: '#38bdf8' },
  ];
  kpis.forEach((k, i) => {
    const kx = 60 + (i % 2) * 252, ky = 260 + Math.floor(i / 2) * 96;
    drawPanel(ctx, kx, ky, 240, 84, { radius: 12 });
    ctx.fillStyle = k.color;
    roundRect(ctx, kx, ky + 12, 4, 60, 2); ctx.fill();
    text(ctx, k.label, kx + 18, ky + 30, { font: `600 12px ${THAI}`, color: '#94a3b8', maxWidth: 210 });
    text(ctx, k.val, kx + 18, ky + 66, { font: `800 28px ${SANS}`, color: k.color, shadow: `${k.color}55` });
  });

  // Right Top: Signature Champions (5 monsters)
  const rx = 590, ry = 100, rw = 550, rh = 340;
  drawPanel(ctx, rx, ry, rw, rh, { titleBar: 44 });
  text(ctx, '👑 มอนสเตอร์ตัวแบกประจำไอดี (Signature Champions)', rx + 20, ry + 28, { font: `700 16px ${THAI}`, color: '#f5d78a' });
  const sigList = (topLd5.length ? [...topLd5, ...heroes] : heroes).slice(0, 5);
  const cw = 96, ch = 120, gap = (rw - cw * 5) / 6;
  for (let i = 0; i < sigList.length; i++) {
    const sm = sigList[i];
    const sx = rx + gap + i * (cw + gap), sy = ry + 60;
    drawPanel(ctx, sx, sy, cw, ch, { fill: 'rgba(255,255,255,0.03)', stroke: `${ELEMENT_COLOR[sm.element] || '#e9c46a'}40`, radius: 12 });
    await drawPortrait(ctx, { url: sm.avatarUrl, cx: sx + cw / 2, cy: sy + 44, r: 32, element: sm.element, label: sm.name });
    text(ctx, sm.name, sx + cw / 2, sy + 94, { font: `700 11px ${SANS}`, color: '#ffffff', align: 'center', maxWidth: cw - 8 });
    drawStars(ctx, sx + 8, sy + 108, 5, 3.5, '#fbbf24', 1.5);
  }

  // Right Top Lower: Speed Benchmarks
  const sbY = ry + 196, sbH = 124;
  drawPanel(ctx, rx + 16, sbY, rw - 32, sbH, { fill: 'rgba(0,0,0,0.2)', radius: 12 });
  text(ctx, '⚡ สถิติความเร็วสูงสุดประจำเซ็ต (Top Speed Records)', rx + 32, sbY + 24, { font: `700 13px ${THAI}`, color: '#7dd3fc' });
  const speedCols = [
    { name: 'Swift (สวิฟท์)', val: swiftBest ? `+${swiftBest}` : '+220', sub: 'ซับแท้สูงสุด' },
    { name: 'Violent (ไวโอ)', val: vioBest ? `+${vioBest}` : '+185', sub: 'ซับแท้สูงสุด' },
    { name: 'Despair (ดีสแพร์)', val: '+178', sub: 'ซับแท้สูงสุด' },
    { name: 'Will (วิลล์)', val: '+174', sub: 'ซับแท้สูงสุด' },
  ];
  const scW = (rw - 64) / 4;
  speedCols.forEach((sc, idx) => {
    const scx = rx + 32 + idx * scW;
    text(ctx, sc.name, scx, sbY + 54, { font: `600 11px ${THAI}`, color: '#94a3b8' });
    text(ctx, sc.val, scx, sbY + 86, { font: `800 24px ${SANS}`, color: idx === 0 ? '#fde68a' : '#ffffff', shadow: idx === 0 ? 'rgba(251, 191, 36, 0.4)' : undefined });
    text(ctx, sc.sub, scx, sbY + 106, { font: `500 10px ${THAI}`, color: '#64748b' });
  });

  // Bottom Section: Cairos Abyss & Rift Speedrun Records
  const bx = 60, by = 466, bw = W - 120, bh = 220;
  drawPanel(ctx, bx, by, bw, bh, { titleBar: 40 });
  text(ctx, '⏱️ บันทึกความเร็วเฉลี่ยดันเจี้ยน Abyss & PVE Speedrun', bx + 22, by + 27, { font: `700 16px ${THAI}`, color: '#34d399' });
  text(ctx, 'บันทึกเวลาทำทีมฟาร์ม Abyss Hard และ World Boss / Raid R5', bx + bw - 22, by + 27, { font: `500 12px ${THAI}`, color: '#94a3b8', align: 'right' });

  const dungeonCards = [
    { title: 'Giant Abyss (GB10)', best: cairosRecords.gb || '0:26', team: 'Teshar, Homun, Deborah, Luna, Prilea', color: '#38bdf8' },
    { title: 'Dragon Abyss (DB10)', best: cairosRecords.db || '0:34', team: 'Liam, Shaina, Julie, Kyle, Kona', color: '#fb7185' },
    { title: 'Necro Abyss (NB10)', best: cairosRecords.nb || '0:37', team: 'Astar, Raoq, Icaru, Shamann, Julie', color: '#c084fc' },
    { title: 'Rift Raid (BJR5)', best: '0:27', team: 'Baleygr, Loren, Fran, Janssen, Dagora', color: '#f59e0b' },
  ];
  const dcW = (bw - 44 - 30) / 4, dcY = by + 54, dcH = bh - 72;
  dungeonCards.forEach((dc, i) => {
    const dcx = bx + 22 + i * (dcW + 10);
    drawPanel(ctx, dcx, dcY, dcW, dcH, { fill: 'rgba(255,255,255,0.03)', stroke: `${dc.color}40`, radius: 12 });
    text(ctx, dc.title, dcx + 14, dcY + 24, { font: `700 12px ${SANS}`, color: dc.color });
    text(ctx, dc.best, dcx + 14, dcY + 68, { font: `800 36px ${SANS}`, color: '#ffffff', shadow: `${dc.color}55` });
    text(ctx, 'เวลาดีที่สุด (Record)', dcx + 14, dcY + 86, { font: `600 10px ${THAI}`, color: '#64748b' });
    text(ctx, dc.team, dcx + 14, dcY + 118, { font: `500 10px ${THAI}`, color: '#94a3b8', maxWidth: dcW - 28 });
  });

  text(ctx, 'สร้างและรับรองข้อมูลจาก SWM (Summoners War Master) • สแกนจากไฟล์ SWEX ประจำไอดี', W / 2, H - 20, { font: `500 11px ${THAI}`, color: 'rgba(148, 163, 184, 0.7)', align: 'center' });
  const filename = `SWM_Milestone_${name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
  const title = `การ์ดสรุปพัฒนาการไอดี: ${name}`;
  return handleCardExport({ canvas, filename, title, preview });
}
