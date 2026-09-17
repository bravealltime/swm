// Zero-dependency HTML5 Canvas image exporter for Social Sharing Cards
// Generates high-resolution PNGs for Summoner Passport and LD5 Showcase

export async function exportProfileCard({ wizard, stats, topLd5 = [] }) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');

  // 1. Dark Gradient Background
  const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630);
  bgGrad.addColorStop(0, '#0a0f18');
  bgGrad.addColorStop(0.5, '#0d1527');
  bgGrad.addColorStop(1, '#05080e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 630);

  // 2. Decorative Cyber Grids / Borders
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for (let x = 40; x < 1200; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 630);
    ctx.stroke();
  }

  // Outer Glowing Border
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, 1160, 590);

  // Corner Accents
  ctx.fillStyle = '#60a5fa';
  ctx.fillRect(16, 16, 24, 6);
  ctx.fillRect(16, 16, 6, 24);
  ctx.fillRect(1160, 16, 24, 6);
  ctx.fillRect(1178, 16, 6, 24);
  ctx.fillRect(16, 604, 24, 6);
  ctx.fillRect(16, 586, 6, 24);
  ctx.fillRect(1160, 604, 24, 6);
  ctx.fillRect(1178, 586, 6, 24);

  // 3. Header
  ctx.fillStyle = '#93c5fd';
  ctx.font = 'bold 16px "SF Pro Display", sans-serif';
  ctx.fillText('SUMMONERS WAR COMPANION • PASSPORT CARD', 60, 70);

  // 4. Summoner Profile Info
  const summonerName = wizard?.name || 'Summoner';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px "SF Pro Display", sans-serif';
  ctx.fillText(summonerName, 60, 130);

  const guildText = wizard?.guild ? `กิลด์: ${wizard.guild}` : 'ไม่มีสังกัดกิลด์';
  const countryText = wizard?.country ? ` [${wizard.country}]` : '';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '20px "SF Pro Display", sans-serif';
  ctx.fillText(`เลเวล ${wizard?.level || 100} • ${guildText}${countryText}`, 60, 170);

  // 5. Stat Tiles (4 Grid Boxes)
  const tiles = [
    { label: 'มอนสเตอร์ 6 ดาว', val: stats?.total6Star ? `${stats.total6Star} ตัว` : 'N/A', color: '#60a5fa' },
    { label: 'มอนสเตอร์แสง-มืด (LD 5★)', val: stats?.ld5Count ? `${stats.ld5Count} ตัว` : '0 ตัว', color: '#c084fc' },
    { label: 'ประสิทธิภาพรูนเฉลี่ย', val: stats?.avgEff ? `${stats.avgEff}%` : 'N/A', color: '#34d399' },
    { label: 'รูน Quad SPD (≥+20)', val: stats?.quadSpdCount ? `${stats.quadSpdCount} ชิ้น` : '0 ชิ้น', color: '#38bdf8' }
  ];

  tiles.forEach((t, i) => {
    const x = 60 + (i % 2) * 260;
    const y = 220 + Math.floor(i / 2) * 110;

    // Tile Box
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(x, y, 240, 90);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, 240, 90);

    // Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 13px "SF Pro Display", sans-serif';
    ctx.fillText(t.label, x + 16, y + 30);

    // Value
    ctx.fillStyle = t.color;
    ctx.font = 'bold 28px "SF Pro Display", sans-serif';
    ctx.fillText(t.val, x + 16, y + 68);
  });

  // 6. Right Panel: Trophy Showcase / LD Collection Preview
  const rightX = 620;
  const rightY = 100;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fillRect(rightX, rightY, 520, 440);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(rightX, rightY, 520, 440);

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 20px "SF Pro Display", sans-serif';
  ctx.fillText('✨ ทำเนียบมอนสเตอร์แสงมืด (LD 5★)', rightX + 24, rightY + 45);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px "SF Pro Display", sans-serif';
  ctx.fillText('ครอบครองทั้งหมด: ' + (topLd5.length) + ' ตัว', rightX + 24, rightY + 75);

  // List up to 8 LD5 names with stars
  topLd5.slice(0, 8).forEach((ld, idx) => {
    const lx = rightX + 24 + (idx % 2) * 240;
    const ly = rightY + 120 + Math.floor(idx / 2) * 70;

    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.fillRect(lx, ly, 225, 55);
    ctx.strokeStyle = ld.element === 'light' ? '#fde047' : '#c084fc';
    ctx.lineWidth = 1;
    ctx.strokeRect(lx, ly, 225, 55);

    // Element dot
    ctx.fillStyle = ld.element === 'light' ? '#fef08a' : '#e879f9';
    ctx.beginPath();
    ctx.arc(lx + 20, ly + 27, 8, 0, Math.PI * 2);
    ctx.fill();

    // Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px "SF Pro Display", sans-serif';
    ctx.fillText(ld.name, lx + 36, ly + 28);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 11px "SF Pro Display", sans-serif';
    ctx.fillText('★★★★★ ' + (ld.element === 'light' ? 'แสง' : 'มืด'), lx + 36, ly + 45);
  });

  if (topLd5.length === 0) {
    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 16px "SF Pro Display", sans-serif';
    ctx.fillText('ยังไม่มีมอนสเตอร์แสง-มืด 5 ดาวแท้ในไอดีนี้', rightX + 110, rightY + 240);
  }

  // 7. Footer Brand
  ctx.fillStyle = '#64748b';
  ctx.font = '13px "SF Pro Display", sans-serif';
  ctx.fillText('SWM Meta Platform • https://bravealltime.github.io/swm', 60, 585);
  ctx.fillText(new Date().toLocaleDateString('th-TH'), 1020, 585);

  // 8. Trigger Download
  const link = document.createElement('a');
  link.download = `SWM_Passport_${summonerName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export async function exportLdShowcaseCard({ wizardName, ld5List = [] }) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 700;
  const ctx = canvas.getContext('2d');

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, 1200, 700);
  bgGrad.addColorStop(0, '#100c1e');
  bgGrad.addColorStop(0.5, '#15102a');
  bgGrad.addColorStop(1, '#080511');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 700);

  // Outer Border
  ctx.strokeStyle = '#c084fc';
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, 1160, 660);

  // Header
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 36px "SF Pro Display", sans-serif';
  ctx.fillText('✨ ตู้สะสมมอนสเตอร์แสง-มืด 5 ดาวแท้ (LD 5★ Trophy Card)', 50, 75);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '18px "SF Pro Display", sans-serif';
  ctx.fillText(`ผู้ครอบครอง: ${wizardName || 'Summoner'} • รวมทั้งสิ้น ${ld5List.length} ตัวละคร`, 50, 110);

  // Monster Grid (up to 15 monsters in 5 columns x 3 rows)
  const cols = 5;
  const itemW = 210;
  const itemH = 140;
  const startX = 50;
  const startY = 140;

  ld5List.slice(0, 15).forEach((m, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * 225;
    const y = startY + row * 155;

    const isLight = m.element === 'light';

    // Card background
    ctx.fillStyle = isLight ? 'rgba(254, 240, 138, 0.08)' : 'rgba(192, 132, 252, 0.08)';
    ctx.fillRect(x, y, itemW, itemH);
    ctx.strokeStyle = isLight ? 'rgba(250, 204, 21, 0.4)' : 'rgba(192, 132, 252, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, itemW, itemH);

    // Glowing badge
    ctx.fillStyle = isLight ? '#facc15' : '#c084fc';
    ctx.font = 'bold 12px "SF Pro Display", sans-serif';
    ctx.fillText(isLight ? 'LIGHT (แสง)' : 'DARK (มืด)', x + 15, y + 30);

    // Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "SF Pro Display", sans-serif';
    ctx.fillText(m.name, x + 15, y + 65);

    // Stars
    ctx.fillStyle = '#fbbf24';
    ctx.font = '16px "SF Pro Display", sans-serif';
    ctx.fillText('★★★★★', x + 15, y + 95);

    // Rune Info if equipped
    if (m.spd || m.sets) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px "SF Pro Display", sans-serif';
      const spdText = m.spd ? `⚡${m.spd}` : '';
      const setText = m.sets?.length ? ` • ${m.sets[0]}` : '';
      ctx.fillText(spdText + setText, x + 15, y + 120);
    }
  });

  if (ld5List.length === 0) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px "SF Pro Display", sans-serif';
    ctx.fillText('ไม่พบมอนสเตอร์แสง-มืด 5 ดาวแท้ที่เปิดได้จากคัมภีร์ในไอดีนี้', 400, 360);
  }

  // Footer
  ctx.fillStyle = '#64748b';
  ctx.font = '13px "SF Pro Display", sans-serif';
  ctx.fillText('Generated by SWM • Summoners War Meta Engine', 50, 655);
  ctx.fillText(new Date().toLocaleDateString('th-TH'), 1050, 655);

  // Trigger Download
  const link = document.createElement('a');
  link.download = `SWM_LD5_Showcase_${(wizardName || 'Player').replace(/[^a-zA-Z0-9]/g, '_')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
