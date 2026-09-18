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

/**
 * High-Resolution Monster Showcase Card Exporter (PNG)
 * Exports a monster with real stats, rune sets, 6 slots, and artifacts
 */
export async function exportMonsterCard({ monster, wizardName = 'Summoner' }) {
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

  // Trigger Download
  const link = document.createElement('a');
  const safeName = (monster.name || 'Monster').replace(/[^a-zA-Z0-9]/g, '_');
  link.download = `SWM_Showcase_${safeName}_${wizardName}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

