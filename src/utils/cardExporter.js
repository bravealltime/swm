// Zero-dependency HTML5 Canvas image exporter for social sharing cards
// (Summoner Passport, LD5 Showcase, Monster Showcase, Arena Team). Styled after the in-game UI:
// dark navy plate, gold bevel frame, portrait medallions with element rings.

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

/**
 * Summoner passport (1200×675): hero portrait + identity, four stat tiles, the LD5 hall with
 * portraits on the right and the fastest monsters along the bottom.
 */
export async function exportProfileCard({ wizard, stats = {}, topLd5 = [], heroes = [], preview = true }) {
  await ensureFonts();
  const W = 1200, H = 675;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  drawBackdrop(ctx, W, H);
  drawGoldFrame(ctx, W, H);

  const name = wizard?.name || 'Summoner';
  const ld = topLd5.slice(0, 8);
  const hero = ld[0] || heroes[0] || null;

  // header
  text(ctx, 'SUMMONERS WAR • SUMMONER PASSPORT', 60, 66, { font: `700 13px ${SANS}`, color: '#e9c46a', spacing: 3 });
  text(ctx, `SWM • swm-blue.vercel.app   ${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`, W - 60, 66, { font: `500 12px ${THAI}`, color: 'rgba(226, 232, 240, 0.6)', align: 'right' });
  ctx.strokeStyle = 'rgba(233, 196, 106, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(60, 80); ctx.lineTo(W - 60, 80); ctx.stroke();

  // identity
  await drawPortrait(ctx, { url: hero?.avatarUrl, cx: 132, cy: 178, r: 68, element: hero?.element, label: name });
  text(ctx, name, 230, 168, { font: `800 46px ${SANS}`, color: '#ffffff', maxWidth: 330, shadow: 'rgba(245, 197, 66, 0.45)' });
  const sub = [`Lv.${wizard?.level || '-'}`, wizard?.guild ? `กิลด์ ${wizard.guild}` : 'ไม่มีกิลด์', wizard?.country ? wizard.country : ''].filter(Boolean).join('  •  ');
  text(ctx, sub, 230, 200, { font: `500 17px ${THAI}`, color: '#cbd5e1', maxWidth: 330 });
  let px = 230;
  for (const [label, colour] of [[`มอนสเตอร์ ${num(stats.totalUnits)}`, '#93c5fd'], [`nat5 ${num(stats.nat5Count)}`, '#fbbf24'], [`อาร์ติแฟกต์ ${num(stats.totalArtifacts)}`, '#5eead4']]) {
    if (!/\s0$/.test(label)) px += pill(ctx, px, 218, label, { color: colour, bg: 'rgba(255,255,255,0.05)' }) + 8;
  }

  // stat tiles
  const tiles = [
    { label: 'มอนสเตอร์ 6 ดาว', val: `${num(stats.total6Star)} ตัว`, color: '#60a5fa' },
    { label: 'แสง-มืด 5★ แท้', val: `${num(stats.ld5Count)} ตัว`, color: '#c084fc' },
    { label: 'ประสิทธิภาพรูนเฉลี่ย', val: stats.avgEff ? `${stats.avgEff}%` : '-', color: '#34d399' },
    { label: 'รูน SPD ≥ +20', val: `${num(stats.quadSpdCount)} ใบ`, color: '#38bdf8' },
  ];
  tiles.forEach((t, i) => {
    const x = 60 + (i % 2) * 252, y = 268 + Math.floor(i / 2) * 100;
    drawPanel(ctx, x, y, 240, 88, { radius: 12 });
    ctx.fillStyle = t.color;
    roundRect(ctx, x, y + 14, 4, 60, 2); ctx.fill();
    text(ctx, t.label, x + 20, y + 32, { font: `600 13px ${THAI}`, color: '#94a3b8' });
    text(ctx, t.val, x + 20, y + 68, { font: `800 30px ${SANS}`, color: t.color, shadow: `${t.color}55` });
  });

  // LD5 hall
  const hx = 600, hy = 100, hw = 540, hh = 372;
  drawPanel(ctx, hx, hy, hw, hh, { titleBar: 52 });
  const hallTitle = ld.length ? 'ทำเนียบมอนสเตอร์แสง-มืด 5★' : 'มอนสเตอร์เด่นในกล่อง';
  text(ctx, `✦ ${hallTitle}`, hx + 22, hy + 33, { font: `700 19px ${THAI}`, color: '#f5d78a' });
  const hallCount = ld.length ? topLd5.length : heroes.length;
  pill(ctx, hx + hw - 22 - 84, hy + 14, `${hallCount} ตัว`, { color: '#f5d78a', padX: 14 });
  const cells = ld.length ? ld : heroes.slice(0, 8);
  const cw = 128, ch = 148, gx = (hw - cw * 4) / 5;
  for (let i = 0; i < Math.min(cells.length, 8); i++) {
    const m = cells[i];
    const cx = hx + gx + (i % 4) * (cw + gx), cy = hy + 66 + Math.floor(i / 4) * (ch + 10);
    drawPanel(ctx, cx, cy, cw, ch, { fill: 'rgba(255,255,255,0.03)', stroke: `${ELEMENT_COLOR[m.element] || '#e9c46a'}40`, radius: 12 });
    await drawPortrait(ctx, { url: m.avatarUrl, cx: cx + cw / 2, cy: cy + 50, r: 38, element: m.element, label: m.name });
    text(ctx, m.name, cx + cw / 2, cy + 108, { font: `700 13px ${SANS}`, color: '#ffffff', align: 'center', maxWidth: cw - 14 });
    drawStars(ctx, cx + 12, cy + 128, 5, 4.5, '#fbbf24', 2);
    if (m.spd) text(ctx, `SPD ${m.spd}`, cx + cw - 10, cy + 132, { font: `700 10px ${SANS}`, color: '#7dd3fc', align: 'right' });
  }
  if (topLd5.length > 8) text(ctx, `+ อีก ${topLd5.length - 8} ตัว`, hx + hw - 22, hy + hh - 14, { font: `600 12px ${THAI}`, color: '#94a3b8', align: 'right' });
  if (!cells.length) text(ctx, 'ยังไม่มีมอนสเตอร์แสง-มืด 5 ดาวแท้ในไอดีนี้ — สู้ต่อไป!', hx + hw / 2, hy + hh / 2 + 10, { font: `500 16px ${THAI}`, color: '#94a3b8', align: 'center' });

  // fastest monsters per speed set: Swift / Violent / Despair, top 3 each
  const sx = 60, sy = 490, sw = W - 120, sh = 150;
  drawPanel(ctx, sx, sy, sw, sh);
  text(ctx, '⚡ ตัวเร็วสุดของแต่ละเซ็ต (SPD รวมรูน)', sx + 22, sy + 28, { font: `700 15px ${THAI}`, color: '#7dd3fc' });
  const groups = [
    { set: 'Swift', thai: 'สวิฟต์', colour: '#7dd3fc' },
    { set: 'Violent', thai: 'ไวโอเลนต์', colour: '#f472b6' },
    { set: 'Despair', thai: 'สตัน', colour: '#c084fc' },
  ];
  const gw = (sw - 44) / 3;
  const rankColour = ['#fbbf24', '#cbd5e1', '#d97706'];
  for (let g = 0; g < groups.length; g++) {
    const grp = groups[g];
    const gx0 = sx + 22 + g * gw;
    const members = heroes.filter((m) => (m.sets || []).includes(grp.set)).sort((a, b) => b.spd - a.spd).slice(0, 3);
    const icon = await loadImage(`${CDN}rune_icons/${grp.set.toLowerCase()}.png`);
    if (icon) ctx.drawImage(icon, gx0, sy + 40, 22, 22);
    text(ctx, `${grp.set} • ${grp.thai}`, gx0 + (icon ? 28 : 0), sy + 56, { font: `700 13px ${THAI}`, color: grp.colour });
    if (g > 0) { ctx.strokeStyle = 'rgba(233, 196, 106, 0.18)'; ctx.beginPath(); ctx.moveTo(gx0 - 10, sy + 42); ctx.lineTo(gx0 - 10, sy + sh - 12); ctx.stroke(); }
    if (!members.length) { text(ctx, 'ยังไม่มีตัวที่ใส่เซ็ตนี้', gx0, sy + 100, { font: `500 12px ${THAI}`, color: '#64748b' }); continue; }
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      const ry = sy + 80 + i * 24;
      ctx.fillStyle = rankColour[i];
      ctx.beginPath(); ctx.arc(gx0 + 9, ry, 8, 0, Math.PI * 2); ctx.fill();
      text(ctx, String(i + 1), gx0 + 9, ry + 1, { font: `800 10px ${SANS}`, color: '#0b0f1f', align: 'center', baseline: 'middle' });
      await drawPortrait(ctx, { url: m.avatarUrl, cx: gx0 + 36, cy: ry, r: 11, element: m.element, label: m.name, badge: false });
      const extra = (m.sets || []).filter((x) => x !== grp.set)[0];
      text(ctx, m.name, gx0 + 54, ry + 4, { font: `700 12px ${SANS}`, color: '#ffffff', maxWidth: gw - 150 });
      if (extra) {
        ctx.save(); ctx.font = `700 12px ${SANS}`; const nw = Math.min(ctx.measureText(m.name).width, gw - 150); ctx.restore();
        text(ctx, `+${extra}`, gx0 + 54 + nw + 6, ry + 4, { font: `500 10px ${SANS}`, color: '#94a3b8', maxWidth: 60 });
      }
      text(ctx, `SPD ${m.spd}`, gx0 + gw - 22, ry + 4, { font: `800 12px ${SANS}`, color: grp.colour, align: 'right' });
    }
  }

  text(ctx, 'สร้างจากกล่องจริงของผู้เล่นด้วย SWM (Summoners War Master)', W / 2, H - 30, { font: `500 11px ${THAI}`, color: 'rgba(148, 163, 184, 0.7)', align: 'center' });
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
 * High-Resolution Monster Showcase Card Exporter (PNG)
 * Exports a monster with real stats, rune sets, 6 slots, and artifacts
 */
export async function exportMonsterCard({ monster, wizardName = 'Summoner', preview = true }) {
  if (!monster) return;

  const canvas = document.createElement('canvas');
  canvas.width = 1100;
  canvas.height = 650;
  const ctx = canvas.getContext('2d');

  // 1. Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 1100, 650);
  bgGrad.addColorStop(0, '#0a0e17');
  bgGrad.addColorStop(0.5, '#111928');
  bgGrad.addColorStop(1, '#080c14');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1100, 650);

  // Border with glow
  const elem = (monster.element || 'fire').toLowerCase();
  const elemColorMap = {
    fire: '#f43f5e',
    water: '#0ea5e9',
    wind: '#eab308',
    light: '#fef08a',
    dark: '#a855f7'
  };
  const themeColor = elemColorMap[elem] || '#3b82f6';

  ctx.strokeStyle = themeColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, 1060, 610);

  // Corner decorations
  ctx.fillStyle = themeColor;
  ctx.fillRect(16, 16, 24, 6);
  ctx.fillRect(16, 16, 6, 24);
  ctx.fillRect(1060, 16, 24, 6);
  ctx.fillRect(1078, 16, 6, 24);
  ctx.fillRect(16, 624, 24, 6);
  ctx.fillRect(16, 606, 6, 24);
  ctx.fillRect(1060, 624, 24, 6);
  ctx.fillRect(1078, 606, 6, 24);

  // Header Title
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 14px "SF Pro Display", sans-serif';
  ctx.fillText('SUMMONERS WAR MASTER • MONSTER PROFILE SHOWCASE', 50, 60);

  ctx.fillStyle = themeColor;
  ctx.font = 'bold 13px "SF Pro Display", sans-serif';
  ctx.fillText(`MASTER ID: #${monster.com2usId || monster.unit_master_id || '9999'} • SUMMONER: ${wizardName.toUpperCase()}`, 700, 60);

  // Left Column - Monster Info
  const startX = 50;
  const startY = 100;

  // Portrait Box
  ctx.fillStyle = '#162032';
  ctx.fillRect(startX, startY, 260, 260);
  ctx.strokeStyle = themeColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(startX, startY, 260, 260);

  // Monster Image if loaded
  const imgUrl = monster.avatarUrl || monster.imageUrl;
  if (imgUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((res) => {
        img.onload = res;
        img.onerror = res;
        img.src = imgUrl;
      });
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, startX + 10, startY + 10, 240, 240);
      }
    } catch {
      // fallback
    }
  }

  // Element & Stars Badge
  ctx.fillStyle = themeColor;
  ctx.font = 'bold 15px "SF Pro Display", sans-serif';
  ctx.fillText(`${elem.toUpperCase()} • ${monster.archetype || 'Monster'}`, startX, 395);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px "SF Pro Display", sans-serif';
  ctx.fillText(monster.name || 'Monster', startX, 435);

  ctx.fillStyle = '#fbbf24';
  ctx.font = '22px "SF Pro Display", sans-serif';
  ctx.fillText('★★★★★★', startX, 470);

  if (monster.thaiName && monster.thaiName !== monster.name) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px "SF Pro Display", sans-serif';
    ctx.fillText(`(ชื่อไทย: ${monster.thaiName})`, startX, 500);
  }

  // Rune Sets Banner
  const sets = monster.runeSets || monster.sets || ['Violent', 'Will'];
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(startX, 530, 260, 48);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(startX, 530, 260, 48);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 14px "SF Pro Display", sans-serif';
  ctx.fillText('RUNE SETS:', startX + 15, 560);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(sets.join(' / '), startX + 105, 560);

  // Right Column - Stats Grid (340 to 1040)
  const statX = 350;
  const statY = 100;
  const statW = 690;
  const statH = 480;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(statX, statY, statW, statH);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(statX, statY, statW, statH);

  // Stats Header
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 18px "SF Pro Display", sans-serif';
  ctx.fillText('⚡ BATTLE STATS (ค่าสเตตัสการต่อสู้จริง)', statX + 25, statY + 38);

  // 8 Primary Stats Layout
  const s = monster.stats || {};
  const statItems = [
    { label: 'HP (พลังชีวิต)', base: s.baseHp || 10500, plus: s.plusHp || 15400, unit: '' },
    { label: 'ATK (พลังโจมตี)', base: s.baseAtk || 780, plus: s.plusAtk || 1350, unit: '' },
    { label: 'DEF (พลังป้องกัน)', base: s.baseDef || 620, plus: s.plusDef || 480, unit: '' },
    { label: 'SPD (ความเร็ว)', base: s.baseSpd || 100, plus: s.plusSpd || 142, unit: '' },
    { label: 'CRI Rate (อัตราคริ)', base: `${s.critRate || 85}%`, plus: '', isTotal: true },
    { label: 'CRI Dmg (ดาเมจคริ)', base: `${s.critDmg || 160}%`, plus: '', isTotal: true },
    { label: 'Resistance (ความต้านทาน)', base: `${s.res || 25}%`, plus: '', isTotal: true },
    { label: 'Accuracy (ความแม่นยำ)', base: `${s.acc || 45}%`, plus: '', isTotal: true },
  ];

  statItems.forEach((item, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const itemLeft = statX + 25 + col * 330;
    const itemTop = statY + 65 + row * 62;

    // Mini Box
    ctx.fillStyle = '#162236';
    ctx.fillRect(itemLeft, itemTop, 310, 52);
    ctx.strokeStyle = '#22324b';
    ctx.strokeRect(itemLeft, itemTop, 310, 52);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px "SF Pro Display", sans-serif';
    ctx.fillText(item.label, itemLeft + 12, itemTop + 22);

    if (item.isTotal) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 20px "SF Pro Display", sans-serif';
      ctx.fillText(String(item.base), itemLeft + 12, itemTop + 44);
    } else {
      const total = Number(item.base) + Number(item.plus);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px "SF Pro Display", sans-serif';
      ctx.fillText(`${total.toLocaleString()}`, itemLeft + 12, itemTop + 44);

      ctx.fillStyle = '#4ade80';
      ctx.font = '13px "SF Pro Display", sans-serif';
      ctx.fillText(`(+${Number(item.plus).toLocaleString()})`, itemLeft + 110, itemTop + 44);
    }
  });

  // Runes Slot 1-6 Mini-Display
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 15px "SF Pro Display", sans-serif';
  ctx.fillText('🔮 RUNES 1-6 SLOTS OVERVIEW', statX + 25, statY + 340);

  const runes = monster.runes || [
    { slot: 1, set: 'Violent', main: 'ATK+160', grade: 6 },
    { slot: 2, set: 'Violent', main: 'SPD+42', grade: 6 },
    { slot: 3, set: 'Violent', main: 'DEF+160', grade: 6 },
    { slot: 4, set: 'Will', main: 'CD+80%', grade: 6 },
    { slot: 5, set: 'Violent', main: 'HP+2448', grade: 6 },
    { slot: 6, set: 'Will', main: 'ATK+63%', grade: 6 },
  ];

  runes.slice(0, 6).forEach((r, i) => {
    const slotX = statX + 25 + i * 105;
    const slotY = statY + 360;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(slotX, slotY, 95, 75);
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(slotX, slotY, 95, 75);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 11px "SF Pro Display", sans-serif';
    ctx.fillText(`SLOT ${r.slot || i + 1} • +15`, slotX + 8, slotY + 20);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "SF Pro Display", sans-serif';
    ctx.fillText(r.main || 'Stat', slotX + 8, slotY + 42);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px "SF Pro Display", sans-serif';
    ctx.fillText(r.set || 'Rune', slotX + 8, slotY + 62);
  });

  // Footer branding
  ctx.fillStyle = '#64748b';
  ctx.font = '12px "SF Pro Display", sans-serif';
  ctx.fillText('SWM Tactical Platform • Summoners War Master AI Engine', 50, 615);
  ctx.fillText(new Date().toLocaleDateString('th-TH'), 950, 615);

  // Trigger Download / Preview
  const safeName = (monster.name || 'Monster').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `SWM_Showcase_${safeName}_${wizardName}.png`;
  const title = `การ์ดมอนสเตอร์: ${monster.thaiName || monster.name || 'Monster'} (${wizardName})`;
  return handleCardExport({ canvas, filename, title, preview });
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
  const title = `สูตรทีมอารีน่า: ${team.thaiName || team.name || ''}`;
  return handleCardExport({ canvas, filename, title, preview });
}
