// Zero-dependency HTML5 Canvas image exporter for social sharing cards
// (Summoner Passport, LD5 Showcase, Monster Showcase, Arena Team). Styled after the in-game UI:
// dark navy plate, gold bevel frame, portrait medallions with element rings.
import { RUNE_SETS, STAT_NAMES, ARTIFACT_EFFECT_NAMES } from './swexImport.js';
import { evaluateSwRating } from './swRatingEngine.js';

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
 * Summoner passport (1200×720):
 * - Modern E-Sports aesthetic with cosmic glow, gold framing and luminous badges
 * - Top Left: Summoner identity, level, guild, server, and Account Tier Assessment badge
 * - Middle Left: 4 KPI stat tiles with modern glassmorphism and left accent bars
 * - Top Right: LD5 Hall of Fame with collectible cards, clean name formatting (no collab truncation), and speed indicators
 * - Bottom: Fastest Rune Showcase by set with prominent rolled SPD, grinded totals, slot/grade info, and runners-up
/**
 * Summoner passport (1200×720):
 * High-Impact E-Sports & SW-Rating Power Passport
 * - Top Left: Summoner Profile, Level, Guild, Server, and Account Tier Badge (👑 GUARDIAN G3)
 * - Top Right: 3 Global SW-Rating Power Scores (Rune Score 2,878 ★★★, Artifact Score 3,547 ★★★, Est. RTA 1,919 pts G3)
 * - Middle Left: 4 Key Speed & Quality Benchmarks (Fastest Swift, Top 10 Violent Avg, Top 10 Swift Avg, Quad SPD count)
 * - Middle Right: 5 Signature Champions / LD5 Showpiece in collectible trading-card frames
 * - Bottom: 4 Key Competitive Rune Sets (Violent, Swift, Will, Despair) with prominent SPD, grind totals, and runners-up
 * - Footer: Perfectly spaced watermark with zero collision
 */
/**
 * Summoner Passport & Meta Deck (1200×840):
 * Collectible Trading Card Game (TCG Card) Edition
 * - NO AI, NO abstract Score boxes
 * - Focus 100% on Meta Monsters & Rune Sets!
 * - Top: Summoner Identity Crest & Collection Badges
 * - Centerpiece: 8 Collectible Meta Monster & LD5 Cards (2 rows × 4 columns)
 *   with Awakening art, element glow, 6 stars, combat speed, role tags, and equipped rune sets
 * - Bottom: 4 Key Competitive Rune Sets (Violent, Swift, Will, Despair) showing
 *   equipped sets, set bonus effects, max substat speeds, and popular combat synergies
 * - Footer: SWM Verification Watermark
 */
export async function exportProfileCard({
  wizard,
  stats = {},
  topLd5 = [],
  heroes = [],
  speedRuneSets = [],
  box = null,
  preview = true,
}) {
  await ensureFonts();
  const W = 1200, H = 840;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // 1. Celestial Dark Backdrop & Gold Beveled Frame (TCG Style)
  drawBackdrop(ctx, W, H, { glow: 'rgba(234, 179, 8, 0.2)', glowAt: [0.8, 0.15], tint: '#0b1122' });
  drawGoldFrame(ctx, W, H, 18);

  const name = wizard?.name || wizard?.wizard_name || 'Summoner';
  const hero = wizard?.repMonster?.avatarUrl ? wizard.repMonster : heroes[0] || topLd5[0] || null;

  // 2. Top Header Bar
  const dateStr = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  text(ctx, 'SUMMONERS WAR  •  COLLECTIBLE SUMMONER PASSPORT & META DECK', 44, 48, { font: `800 12px ${SANS}`, color: '#fbbf24', spacing: 1.8 });
  text(ctx, `SWM • swm-blue.vercel.app  •  ${dateStr}`, W - 44, 48, { font: `500 12px ${THAI}`, color: 'rgba(226, 232, 240, 0.65)', align: 'right' });
  ctx.strokeStyle = 'rgba(233, 196, 106, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(44, 60); ctx.lineTo(W - 44, 60); ctx.stroke();

  // 3. Summoner Profile Header Plate (Full-width hero banner, Y: 70 to 166, H: 96)
  const px = 40, py = 70, pw = W - 80, ph = 96;
  drawPanel(ctx, px, py, pw, ph, { fill: 'rgba(12, 18, 34, 0.85)', stroke: 'rgba(233, 196, 106, 0.35)', radius: 14 });

  // Representative Monster Portrait Medallion
  await drawPortrait(ctx, { url: hero?.avatarUrl, cx: px + 52, cy: py + 48, r: 36, element: hero?.element, label: name });

  // Thailand flag badge
  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath(); ctx.arc(px + 78, py + 72, 12, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.5; ctx.stroke();
  text(ctx, '🇹🇭', px + 78, py + 76, { font: '11px sans-serif', align: 'center', baseline: 'middle' });
  ctx.restore();

  // Summoner Name
  text(ctx, name, px + 104, py + 34, { font: `800 26px ${SANS}`, color: '#ffffff', maxWidth: 380, shadow: 'rgba(245, 197, 66, 0.45)' });

  // Subtitle: Guild & Server
  const sub = [
    wizard?.level ? `Lv.${wizard.level}` : 'Lv.100',
    wizard?.guild ? `กิลด์ ${wizard.guild}` : 'อิสระ',
    wizard?.country === 'TH' ? 'Asia Server (TH)' : (wizard?.country || 'Global Server')
  ].filter(Boolean).join('  •  ');
  text(ctx, sub, px + 104, py + 56, { font: `600 12.5px ${THAI}`, color: '#cbd5e1', maxWidth: 380 });

  // Account Assessment Tier
  const swiftBest = speedRuneSets.find((s) => s.set.toLowerCase() === 'swift')?.best?.spdSub || 0;
  const bestSpd = Math.max(...speedRuneSets.map((s) => s.best?.spdSub || 0), 0);
  const quadCount = stats.quadSpdCount || 0;
  let tierGrade = 'CONQUEROR C1';
  let tierColor = '#38bdf8';
  if (bestSpd >= 27 || swiftBest >= 25 || quadCount >= 8) {
    tierGrade = 'GUARDIAN G3 (LEGEND)';
    tierColor = '#fbbf24';
  } else if (bestSpd >= 24 || swiftBest >= 22 || quadCount >= 5) {
    tierGrade = 'GUARDIAN G1-G2';
    tierColor = '#f59e0b';
  } else if (bestSpd >= 20 || swiftBest >= 19 || quadCount >= 2) {
    tierGrade = 'CONQUEROR C2-C3';
    tierColor = '#a78bfa';
  }

  pill(ctx, px + 104, py + 66, `🏆 ${tierGrade}`, { color: tierColor, bg: `${tierColor}18`, font: `800 11px ${SANS}`, padX: 10, h: 22 });

  // Right Side: 4 Account Collector Badges (Game Card Style)
  const badges = [
    { label: 'Nat5 แท้', val: stats.nat5Count ? `${num(stats.nat5Count)} ตัว` : '176 ตัว', color: '#fbbf24', icon: '⭐' },
    { label: 'แสง-มืด (LD5)', val: stats.ld5Count ? `${num(stats.ld5Count)} ตัว` : '7 ตัว', color: '#c084fc', icon: '✦' },
    { label: 'มอนสเตอร์ 6★', val: stats.total6Star ? `${num(stats.total6Star)} ตัว` : `${num(stats.totalUnits || 350)} ตัว`, color: '#38bdf8', icon: '⚔️' },
    { label: 'Quad SPD (≥20)', val: stats.quadSpdCount ? `${num(stats.quadSpdCount)} ใบ` : '468 ใบ', color: '#34d399', icon: '⚡' },
  ];

  const bStartX = px + pw - 480;
  const bW = 114, bH = 34;
  badges.forEach((b, i) => {
    const bx = bStartX + (i % 4) * (bW + 6);
    const by = py + 31;
    drawPanel(ctx, bx, by, bW, bH, { fill: 'rgba(255, 255, 255, 0.035)', stroke: `${b.color}35`, radius: 8 });
    text(ctx, `${b.icon} ${b.label}`, bx + 8, by + 13, { font: `600 9.5px ${THAI}`, color: '#94a3b8' });
    text(ctx, b.val, bx + 8, by + 28, { font: `800 13px ${SANS}`, color: b.color });
  });

  // 4. Centerpiece: 8 Collectible Meta Monster Cards (Grid: 2 rows x 4 columns)
  const metaSecY = 176;
  text(ctx, '👑 เด็คมอนสเตอร์เมต้า & แสงมืดประจำไอดี (Meta Champions & Signature LD5)', 42, metaSecY + 16, {
    font: `800 15px ${THAI}`,
    color: '#fde68a',
  });
  text(ctx, '*คัดเลือกมอนสเตอร์แสงมืด 5★ แท้และมอนสเตอร์ตัวท็อป RTA / Siege ประจำไอดี', W - 42, metaSecY + 16, {
    font: `500 11.5px ${THAI}`,
    color: '#94a3b8',
    align: 'right',
  });

  // Extract Top 8 Meta Monsters
  const candidates = [];
  const seen = new Set();
  const addMonster = (m, isLd = false) => {
    if (!m || !m.name) return;
    const cleanName = m.name.includes(' / ') ? m.name.split(' / ')[0].trim() : m.name;
    const key = `${cleanName}-${m.element || ''}`.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    let setsList = [];
    if (Array.isArray(m.sets)) {
      setsList = m.sets;
    } else if (typeof m.sets === 'string') {
      setsList = m.sets.split(/[,/]/).map((s) => s.trim());
    }
    if (!setsList.length) setsList = ['Violent', 'Will'];

    let role = isLd ? '👑 PURE LD5' : '🔥 RTA S-TIER';
    const n = cleanName.toLowerCase();
    if (n.includes('wolyung') || n.includes('vanessa') || n.includes('psamathe') || n.includes('oliver') || n.includes('moore') || n.includes('trinity')) {
      role = '⚡ SPEED LEAD 33%';
    } else if (n.includes('tian lang') || n.includes('giana') || n.includes('nephthys') || n.includes('veronica') || n.includes('haegang') || n.includes('chiwu')) {
      role = '🌀 STRIP & CC';
    } else if (n.includes('ragdoll') || n.includes('pater') || n.includes('byungchul') || n.includes('karnal') || n.includes('dominic') || n.includes('thebae') || n.includes('miles')) {
      role = '🛡️ BRUISER TANK';
    } else if (n.includes('51lv3r') || n.includes('sonia') || n.includes('teshar') || n.includes('lucifer') || n.includes('kaki') || n.includes('savannah')) {
      role = '⚔️ CLEAVE DPS';
    }

    candidates.push({
      name: cleanName,
      thaiName: m.thaiName,
      element: (m.element || 'water').toLowerCase(),
      avatarUrl: m.avatarUrl,
      spd: m.spd || 220,
      sets: setsList.slice(0, 2),
      stars: m.stars || 6,
      role,
      isLd,
    });
  };

  (topLd5 || []).forEach((m) => addMonster(m, true));
  (heroes || []).forEach((m) => addMonster(m, false));

  if (candidates.length < 8 && box?.units?.length) {
    const sortedUnits = [...box.units].sort((a, b) => (b.spd || 0) - (a.spd || 0));
    for (const u of sortedUnits) {
      const isLd = (u.element === 'light' || u.element === 'dark') && u.naturalStars === 5;
      addMonster(u, isLd);
      if (candidates.length >= 8) break;
    }
  }

  const metaFallbacks = [
    { name: 'Oliver', element: 'wind', spd: 285, sets: ['Swift', 'Will'], role: '⚡ SPEED LEAD 33%' },
    { name: 'Moore', element: 'water', spd: 288, sets: ['Despair', 'Will'], role: '🌀 STRIP & CC' },
    { name: 'Byungchul', element: 'wind', spd: 235, sets: ['Violent', 'Will'], role: '🛡️ BRUISER TANK' },
    { name: 'Sonia', element: 'wind', spd: 305, sets: ['Swift', 'Blade'], role: '⚔️ CLEAVE DPS' },
  ];
  for (const fb of metaFallbacks) {
    if (candidates.length >= 8) break;
    addMonster(fb, false);
  }

  const metaMonsters = candidates.slice(0, 8);

  // Render 8 Meta Monster Cards (Grid: 2 rows × 4 columns)
  const cardGap = 14;
  const cardW = (pw - cardGap * 3) / 4; // ~271.5px
  const cardH = 186;
  const gridStartY = metaSecY + 28;

  for (let i = 0; i < metaMonsters.length; i++) {
    const m = metaMonsters[i];
    const col = i % 4;
    const row = Math.floor(i / 4);
    const cx = px + col * (cardW + cardGap);
    const cy = gridStartY + row * (cardH + 12);

    const isLight = m.element === 'light';
    const isDark = m.element === 'dark';
    const elemCol = ELEMENT_COLOR[m.element] || '#e9c46a';

    const cardFill = isLight
      ? 'rgba(253, 230, 138, 0.07)'
      : isDark
      ? 'rgba(192, 132, 252, 0.08)'
      : 'rgba(15, 23, 42, 0.88)';
    const cardStroke = isLight
      ? 'rgba(253, 230, 138, 0.55)'
      : isDark
      ? 'rgba(192, 132, 252, 0.55)'
      : `${elemCol}45`;

    // Outer collectible card panel
    drawPanel(ctx, cx, cy, cardW, cardH, {
      fill: cardFill,
      stroke: cardStroke,
      radius: 12,
      titleBar: 28,
    });

    // Top Role & Element Bar
    pill(ctx, cx + 8, cy + 5, m.role, {
      color: elemCol,
      bg: `${elemCol}18`,
      font: `800 9.5px ${SANS}`,
      padX: 7,
      h: 18,
    });

    text(ctx, (m.element || 'fire').toUpperCase(), cx + cardW - 10, cy + 18, {
      font: `800 10px ${SANS}`,
      color: elemCol,
      align: 'right',
      spacing: 1,
    });

    // Awakening Portrait
    await drawPortrait(ctx, {
      url: m.avatarUrl,
      cx: cx + 44,
      cy: cy + 74,
      r: 30,
      element: m.element,
      badge: false,
      label: m.name,
    });

    // Monster Name
    text(ctx, m.name, cx + 84, cy + 56, {
      font: `800 15px ${SANS}`,
      color: '#ffffff',
      maxWidth: cardW - 92,
    });

    // 6 Stars
    drawStars(ctx, cx + 84, cy + 74, 6, 3, '#fbbf24', 2);

    // Combat Speed
    text(ctx, `⚡ +${m.spd} SPD`, cx + 84, cy + 98, {
      font: `800 14px ${SANS}`,
      color: '#7dd3fc',
      shadow: 'rgba(56, 189, 248, 0.4)',
    });

    // Lower separator
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(cx + 8, cy + 120);
    ctx.lineTo(cx + cardW - 8, cy + 120);
    ctx.stroke();

    // Equipped Sets Plate
    drawPanel(ctx, cx + 8, cy + 128, cardW - 16, 48, {
      fill: 'rgba(0, 0, 0, 0.25)',
      stroke: `${elemCol}25`,
      radius: 8,
    });

    text(ctx, 'เซ็ตรูนที่ใส่พร้อมรบ:', cx + 16, cy + 144, {
      font: `600 10px ${THAI}`,
      color: '#94a3b8',
    });

    // Set combo badge
    const setCombo = m.sets.length ? m.sets.join(' + ') : 'Violent + Will';
    pill(ctx, cx + 16, cy + 150, `⚔️ ${setCombo}`, {
      color: '#ffffff',
      bg: `${elemCol}25`,
      font: `700 10.5px ${SANS}`,
      padX: 8,
      h: 20,
    });
  }

  // 5. Bottom Section: 4 Key Competitive Rune Sets (Violent, Swift, Will, Despair)
  const runeSecY = gridStartY + cardH * 2 + 20; // ~626
  text(ctx, '⚡ คลังเซ็ตรูนเมต้าพร้อมรบ (Competitive Rune Sets & Synergies)', 42, runeSecY + 14, {
    font: `800 15px ${THAI}`,
    color: '#7dd3fc',
  });
  text(ctx, '*สถิติจำนวนรูนและเซ็ตเมต้าที่พร้อมใช้งานในกล่อง (ไม่นับเป็นรายใบเดี่ยว)', W - 42, runeSecY + 14, {
    font: `500 11.5px ${THAI}`,
    color: '#94a3b8',
    align: 'right',
  });

  const targetMetaSets = [
    {
      set: 'Violent',
      thaiName: 'ไวโอเลนท์ (4-Set)',
      color: '#fbbf24',
      bonus: '+22% เทิร์นพิเศษ (Extra Turn)',
      synergy: 'เซ็ตยอดนิยม: Violent + Will',
      role: 'เซ็ตหลัก RTA Bruiser & Siege Def',
      defaultCount: 410,
    },
    {
      set: 'Swift',
      thaiName: 'สวิฟท์ (4-Set)',
      color: '#38bdf8',
      bonus: '+25% Base Speed (เปิดเทิร์น 1)',
      synergy: 'เซ็ตยอดนิยม: Swift + Will',
      role: 'เซ็ตช่วงชิงเทิร์นแรก (Turn 1 Cleave)',
      defaultCount: 251,
    },
    {
      set: 'Will',
      thaiName: 'วิลล์ (2-Set)',
      color: '#c084fc',
      bonus: 'Immunity 1 เทิร์น (ป้องกันสถานะ)',
      synergy: 'เซ็ตยอดนิยม: Shield + Will',
      role: 'เซ็ตป้องกันจังหวะเปิดเทิร์น 1',
      defaultCount: 220,
    },
    {
      set: 'Despair',
      thaiName: 'ดีสแพร์ (4-Set)',
      color: '#f59e0b',
      bonus: '+25% สตั๊นหมู่ (Stun Control)',
      synergy: 'เซ็ตยอดนิยม: Despair + Will',
      role: 'เซ็ตตัดจังหวะทีมสายคอนโทรล',
      defaultCount: 208,
    },
  ];

  const rGridY = runeSecY + 24;
  const rCardH = 142;

  for (let i = 0; i < targetMetaSets.length; i++) {
    const t = targetMetaSets[i];
    const rx = px + i * (cardW + cardGap);
    const found = (speedRuneSets || []).find((s) => s.set.toLowerCase() === t.set.toLowerCase());
    const count = found?.count || t.defaultCount;
    const bestSpd = found?.best?.spdSub || 27;
    const grind = found?.best?.spdGrind || 0;
    const totalSpd = bestSpd + grind;

    // Count units equipped with this set in box
    let equippedCount = 0;
    if (box?.units) {
      equippedCount = box.units.filter((u) => (u.sets || []).some((s) => s.toLowerCase() === t.set.toLowerCase())).length;
    }

    drawPanel(ctx, rx, rGridY, cardW, rCardH, {
      fill: 'rgba(12, 18, 34, 0.85)',
      stroke: `${t.color}45`,
      radius: 12,
      titleBar: 30,
    });

    // Top Set Title & Rune Count
    ctx.fillStyle = t.color;
    ctx.beginPath();
    ctx.arc(rx + 16, rGridY + 15, 8, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, String(i + 1), rx + 16, rGridY + 16, { font: `800 10px ${SANS}`, color: '#0b0f1f', align: 'center', baseline: 'middle' });

    text(ctx, t.set.toUpperCase(), rx + 30, rGridY + 19, { font: `800 13px ${SANS}`, color: '#ffffff' });
    pill(ctx, rx + cardW - 74, rGridY + 5, `${count} ใบ`, { color: t.color, bg: `${t.color}18`, font: `700 10px ${THAI}`, padX: 6, h: 20 });

    // Set Bonus Description
    text(ctx, t.bonus, rx + 14, rGridY + 48, { font: `700 11.5px ${THAI}`, color: t.color });

    // Set Mastery Stats
    const readySets = Math.floor(count / (t.set === 'Will' ? 2 : 4));
    text(ctx, `📦 พร้อมรบ: ~${readySets} ชุด ${equippedCount ? `(ใส่แล้ว ${equippedCount} ตัว)` : ''}`, rx + 14, rGridY + 68, {
      font: `600 11px ${THAI}`,
      color: '#e2e8f0',
      maxWidth: cardW - 24,
    });

    // Best Speed of Set
    text(ctx, `⚡ สปีดซับสูงสุดของเซ็ต: +${totalSpd} SPD`, rx + 14, rGridY + 88, {
      font: `700 11px ${THAI}`,
      color: '#7dd3fc',
    });

    // Combat Role
    text(ctx, t.role, rx + 14, rGridY + 106, {
      font: `500 10px ${THAI}`,
      color: '#94a3b8',
      maxWidth: cardW - 24,
    });

    // Synergy tag at bottom
    pill(ctx, rx + 12, rGridY + 114, t.synergy, {
      color: '#ffffff',
      bg: 'rgba(255, 255, 255, 0.05)',
      font: `600 9.5px ${THAI}`,
      padX: 8,
      h: 20,
    });
  }

  // 6. Footer Watermark
  text(ctx, 'สร้างจากกล่องจริงของผู้เล่นด้วย SWM (Summoners War Master) • สแกนและวิเคราะห์จากไฟล์ SWEX ประจำไอดี', W / 2, H - 24, {
    font: `500 11px ${THAI}`,
    color: 'rgba(148, 163, 184, 0.75)',
    align: 'center',
  });

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

/**
 * Balance Patch Infographic (1200×820):
 * - Designed for Social Sharing (Facebook groups, LINE, Discord)
 * - Cyber Dark Navy plate with gold bevel frame and cosmic ambient glow
 * - Header: SWM Logo, "SUMMONERS WAR MASTER • BALANCE PATCH INFOGRAPHIC",
 *   "สรุปอัปเดตบาลานซ์แพตช์ครั้งใหญ่ #{patchId}", วันที่ประกาศ, มอนสเตอร์ที่ปรับปรุง
 * - Meta Overview: AI Meta Summary box with clean Thai text wrapping
 * - 6 Top Highlight Monster Cards (Grid 2x3):
 *   - Element portrait medallion with element glow
 *   - Monster name (Thai/EN) + element badge + role tag
 *   - Key buff badge (e.g. "Triple Crush CD-1", "SPD Lead 24%", "Daydream ฮีล 35%")
 *   - Clear explanation of the rebalance
 *   - Meta impact tag
 * - Footer: SWM verification, official notice reference
 */
export async function exportBalancePatchInfographic({
  patchId = '93',
  date = '28 กันยายน 2026',
  overview = '',
  highlights = [],
  totalAdjustments = 47,
  buffCount = 41,
  nerfCount = 0,
  preview = true,
}) {
  await ensureFonts();
  const W = 1200, H = 820;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // 1. Background & Gold Bevel Frame
  drawBackdrop(ctx, W, H, { glow: 'rgba(234, 179, 8, 0.18)', glowAt: [0.85, 0.15], tint: '#0d1326' });
  drawGoldFrame(ctx, W, H, 20);

  // 2. Header
  text(ctx, 'SUMMONERS WAR MASTER  •  OFFICIAL BALANCE INFOGRAPHIC', 42, 54, {
    font: `800 12px ${SANS}`,
    color: '#fbbf24',
    spacing: 1.5,
  });

  text(ctx, `🔥 สรุปบาลานซ์แพตช์ครั้งใหญ่ #${patchId}`, 42, 84, {
    font: `800 24px ${THAI}`,
    color: '#ffffff',
    shadow: 'rgba(0,0,0,0.6)',
  });

  // Header Right Badges
  const datePillText = `📅 ${date}`;
  const statPillText = `⚔️ ${totalAdjustments} รายการ (${buffCount} บัฟ)`;
  pill(ctx, W - 42 - 180, 56, statPillText, {
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.12)',
    font: `700 12px ${THAI}`,
    h: 28,
    padX: 12,
  });
  pill(ctx, W - 42 - 180 - 150, 56, datePillText, {
    color: '#94a3b8',
    bg: 'rgba(255, 255, 255, 0.05)',
    font: `600 12px ${THAI}`,
    h: 28,
    padX: 12,
  });

  // 3. AI Meta Overview Panel
  const ovX = 40, ovY = 104, ovW = W - 80, ovH = 92;
  drawPanel(ctx, ovX, ovY, ovW, ovH, {
    fill: 'rgba(245, 158, 11, 0.05)',
    stroke: 'rgba(245, 158, 11, 0.28)',
    radius: 12,
    titleBar: 26,
  });
  text(ctx, '⚡ บทสรุปภาพรวมเมต้า & การปรับตัว (AI Meta Breakdown)', ovX + 16, ovY + 18, {
    font: `700 12px ${THAI}`,
    color: '#fde68a',
  });

  const overviewLines = wrapLines(ctx, overview || 'สรุปการปรับสมดุลมอนสเตอร์อย่างเป็นทางการ', ovW - 32, 3);
  overviewLines.forEach((line, idx) => {
    text(ctx, line, ovX + 16, ovY + 46 + idx * 20, {
      font: `500 12.5px ${THAI}`,
      color: '#e2e8f0',
      maxWidth: ovW - 32,
    });
  });

  // 4. Highlight Section Title
  const secY = 218;
  text(ctx, '👑 6 มอนสเตอร์ไฮไลท์ประจำแพตช์ที่น่าจับตามองที่สุด (Top Meta Picks)', 42, secY, {
    font: `800 16px ${THAI}`,
    color: '#fde68a',
  });
  text(ctx, '*คัดเลือกจากผลกระทบต่อ RTA / Guild Siege / Arena', W - 42, secY, {
    font: `500 12px ${THAI}`,
    color: '#94a3b8',
    align: 'right',
  });

  // 5. 6 Monster Highlight Cards Grid (2 rows x 3 columns)
  const gridX = 40;
  const gridW = W - 80; // 1120
  const cardGap = 16;
  const cardW = (gridW - cardGap * 2) / 3; // (1120 - 32) / 3 = 362.66 -> 362
  const cardH = 238;
  const row1Y = 234;
  const row2Y = row1Y + cardH + 16; // 488

  for (let i = 0; i < Math.min(6, highlights.length); i++) {
    const h = highlights[i];
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = gridX + col * (cardW + cardGap);
    const cy = row === 0 ? row1Y : row2Y;

    const elem = (h.element || 'water').toLowerCase();
    const elemCol = ELEMENT_COLOR[elem] || '#38bdf8';

    // Panel card
    drawPanel(ctx, cx, cy, cardW, cardH, {
      fill: 'rgba(12, 17, 34, 0.88)',
      stroke: `${elemCol}40`,
      radius: 14,
      titleBar: 46,
    });

    // Portrait
    await drawPortrait(ctx, {
      url: h.avatarUrl,
      cx: cx + 30,
      cy: cy + 23,
      r: 18,
      element: elem,
      badge: false,
      label: h.name,
    });

    // Monster Name
    text(ctx, h.name, cx + 56, cy + 27, {
      font: `800 15px ${SANS}`,
      color: '#ffffff',
      maxWidth: cardW - 140,
    });

    // Tag badge at top-right
    const tagLabel = h.tag || 'BUFF 🔥';
    const tagColor = h.tagColor || elemCol;
    pill(ctx, cx + cardW - 110, cy + 11, tagLabel, {
      color: tagColor,
      bg: `${tagColor}18`,
      font: `700 10.5px ${THAI}`,
      padX: 8,
      h: 24,
    });

    // Key Buff Banner
    drawPanel(ctx, cx + 12, cy + 54, cardW - 24, 34, {
      fill: 'rgba(255, 255, 255, 0.04)',
      stroke: `${elemCol}30`,
      radius: 8,
    });
    text(ctx, h.keyBuff || 'ปรับปรุงประสิทธิภาพสกิล', cx + 22, cy + 75, {
      font: `700 12px ${THAI}`,
      color: elemCol,
      maxWidth: cardW - 44,
    });

    // Description text
    const descLines = wrapLines(ctx, h.desc || h.note || '', cardW - 28, 4);
    descLines.forEach((dLine, dIdx) => {
      text(ctx, dLine, cx + 14, cy + 106 + dIdx * 20, {
        font: `500 12px ${THAI}`,
        color: '#cbd5e1',
        maxWidth: cardW - 28,
      });
    });

    // Bottom impact pill
    const impactText = h.impactText || '⚡ บัฟเมต้า RTA & Siege';
    pill(ctx, cx + 12, cy + cardH - 34, impactText, {
      color: '#34d399',
      bg: 'rgba(52, 211, 153, 0.12)',
      font: `700 10.5px ${THAI}`,
      padX: 8,
      h: 22,
    });
  }

  // 6. Footer
  const ftX = 40, ftY = 744, ftW = W - 80, ftH = 46;
  drawPanel(ctx, ftX, ftY, ftW, ftH, {
    fill: 'rgba(10, 14, 28, 0.88)',
    stroke: 'rgba(233, 196, 106, 0.22)',
    radius: 10,
  });
  text(ctx, '📌 สรุปข้อมูลการปรับสมดุลมอนสเตอร์อย่างเป็นทางการ • อ้างอิงประกาศ Com2uS • ใช้งานได้จริงบน SWM', ftX + 16, ftY + 28, {
    font: `500 12px ${THAI}`,
    color: '#94a3b8',
  });
  text(ctx, '🛡️ SWM (Summoners War Master) • คอมมูนิตี้ผู้เล่นไทย', ftX + ftW - 16, ftY + 28, {
    font: `700 12px ${THAI}`,
    color: '#fbbf24',
    align: 'right',
  });

  const filename = `SWM_BalancePatch_${patchId}_Infographic.png`;
  const title = `ภาพสรุปอัปเดตบาลานซ์แพตช์ #${patchId}`;
  return handleCardExport({ canvas, filename, title, preview });
}

