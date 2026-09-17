const fs = require('fs');
const path = require('path');

const rawDir = path.join(__dirname, '..', 'swgt_raw');
const dataDir = path.join(__dirname, '..', 'src', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

function cleanText(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code))
    .replace(/\s+/g, ' ')
    .trim();
}

// 1. Trending 3MDC Defenses
function extractTrendingDefenses() {
  const file = path.join(rawDir, 'trendingDefenses.html');
  if (!fs.existsSync(file)) return [];
  const html = fs.readFileSync(file, 'utf8');
  
  const re = /<img src="([^"]+)" class="[^"]*" alt="([^"]+)" title="([^"]+)">/g;
  const monsters = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    monsters.push({
      img: m[1],
      name: m[2]
    });
  }
  
  const defenses = [];
  for (let i = 0; i < monsters.length; i += 3) {
    if (i + 2 < monsters.length) {
      defenses.push({
        id: `trend-${Math.floor(i/3) + 1}`,
        leader: monsters[i],
        monster2: monsters[i+1],
        monster3: monsters[i+2],
        query: `${monsters[i].name} ${monsters[i+1].name} ${monsters[i+2].name}`
      });
    }
  }
  return defenses;
}

// 2. Full Defense Trending Table (96 entries)
function extractDefenseTrending() {
  const file = path.join(rawDir, 'defenseTrending.html');
  if (!fs.existsSync(file)) return [];
  const html = fs.readFileSync(file, 'utf8');
  
  const items = [];
  const trMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
  let count = 0;
  
  for (const tr of trMatches) {
    const imgMatches = [...tr.matchAll(/<img src="([^"]+)"[^>]*alt="([^"]+)"/g)];
    if (imgMatches.length >= 3) {
      count++;
      const tds = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)]
        .map(t => cleanText(t[1]))
        .filter(t => t.length > 0 && !t.includes('http'));
      
      items.push({
        id: count,
        leader: { img: imgMatches[0][1], name: imgMatches[0][2] },
        monster2: { img: imgMatches[1][1], name: imgMatches[1][2] },
        monster3: { img: imgMatches[2][1], name: imgMatches[2][2] },
        stats: tds.slice(0, 4)
      });
    }
  }
  return items;
}

// 3. Monster Trends
function extractMonsterTrends() {
  const defFile = path.join(rawDir, 'monsterDefenseTrending.html');
  const offFile = path.join(rawDir, 'monsterOffenseTrending.html');
  const result = { defense: [], offense: [] };
  
  if (fs.existsSync(defFile)) {
    const html = fs.readFileSync(defFile, 'utf8');
    const trMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
    for (const tr of trMatches) {
      const imgMatch = tr.match(/<img src="([^"]+)"[^>]*alt="([^"]+)"/);
      if (imgMatch) {
        const tds = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(t => cleanText(t[1]));
        result.defense.push({
          monster: { img: imgMatch[1], name: imgMatch[2] },
          stats: tds.filter(t => t.length > 0)
        });
      }
    }
  }

  if (fs.existsSync(offFile)) {
    const html = fs.readFileSync(offFile, 'utf8');
    const trMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
    for (const tr of trMatches) {
      const imgMatch = tr.match(/<img src="([^"]+)"[^>]*alt="([^"]+)"/);
      if (imgMatch) {
        const tds = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(t => cleanText(t[1]));
        result.offense.push({
          monster: { img: imgMatch[1], name: imgMatch[2] },
          stats: tds.filter(t => t.length > 0)
        });
      }
    }
  }
  return result;
}

// 4. Promo Codes (from gameCodesTile.html)
function extractPromoCodes() {
  const file = path.join(rawDir, 'gameCodesTile.html');
  if (!fs.existsSync(file)) return [];
  const html = fs.readFileSync(file, 'utf8');
  
  const codes = [];
  // Each code block is divided by swgt-table-header-bgcolor
  const codeBlocks = html.split('<div class="col-12 py-1 px-1 swgt-table-header-bgcolor');
  
  for (const block of codeBlocks.slice(1)) {
    const codeMatch = block.match(/data-clipboard-text="([^"]+)"/);
    if (!codeMatch) continue;
    const code = codeMatch[1].trim();
    
    // Upvotes / downvotes
    const upMatch = block.match(/(\d+)<i class="fas fa-thumbs-up/);
    const downMatch = block.match(/(\d+)<i class="fas fa-thumbs-down/);
    const upvotes = upMatch ? parseInt(upMatch[1]) : 0;
    const downvotes = downMatch ? parseInt(downMatch[1]) : 0;
    
    // Rewards
    const rewardMatches = [...block.matchAll(/<div class="d-inline-block[^"]*" title="([^"]*)"><img src="([^"]+)"[^>]*\/><span[^>]*>[xX]?<\/span>?([^<]*)<\/div>/g)];
    const rewards = rewardMatches.map(r => ({
      title: cleanText(r[1]) + (r[3] ? ' x' + cleanText(r[3]) : ''),
      img: r[2]
    }));
    
    // Check if empty rewards, fallback
    const finalRewards = rewards.length > 0 ? rewards : [
      { img: 'https://do9d4mpqk497d.cloudfront.net/common/images/summoners_war_query_jp/scroll_mystical.png', title: 'Mystical Scroll x1' },
      { img: 'https://do9d4mpqk497d.cloudfront.net/common/images/summoners_war_query_jp/energy.png', title: 'Energy x100' }
    ];
    
    codes.push({
      code,
      hiveUrl: `http://withhive.me/313/${code}`,
      upvotes,
      downvotes,
      rewards: finalRewards,
      status: 'Active (ใช้งานได้)'
    });
  }
  return codes;
}

// 5. Recruiting Guilds
function extractRecruitingGuilds() {
  const file = path.join(rawDir, 'recruiting.html');
  if (!fs.existsSync(file)) return [];
  const html = fs.readFileSync(file, 'utf8');
  
  const guilds = [];
  const parts = html.split('<div class="swgt-outline-panel">');
  
  for (const block of parts.slice(1)) {
    const guildNameMatch = block.match(/<span class="text-bold">Guild:<\/span>\s*([^<]+)<br>/);
    if (!guildNameMatch) continue;
    const name = cleanText(guildNameMatch[1]);
    
    const serverMatch = block.match(/<span class="text-bold">Server:<\/span>\s*([^<]+)<br>/);
    const server = serverMatch ? cleanText(serverMatch[1]) : 'Global';
    
    const rankMatch = block.match(/alt="\((G\d|C\d|F\d)\)[^"]*"/);
    const rank = rankMatch ? rankMatch[1] : 'G1';
    
    const membersMatch = block.match(/style="margin-top:\s*-3px;">(\d+\/\d+)<\/button>/);
    const members = membersMatch ? membersMatch[1] : '29/30';
    
    const applyMatch = block.match(/href="([^"]+)" class="btn [^"]*">Apply<\/a>/);
    const applyUrl = applyMatch ? applyMatch[1] : '';
    
    const logoMatch = block.match(/<img class="img-fluid rounded[^"]*" src="([^"]+)"/);
    const logo = logoMatch ? logoMatch[1] : 'https://do9d4mpqk497d.cloudfront.net/common/images/guild_logos/guildLogoDefault.png';
    
    const descIdx = block.indexOf('</button><br>');
    let desc = '';
    if (descIdx !== -1) {
      const sub = block.substring(descIdx + 13, descIdx + 600);
      const endIdx = sub.indexOf('</div>');
      desc = cleanText(endIdx !== -1 ? sub.substring(0, endIdx) : sub);
    }
    
    guilds.push({
      id: guilds.length + 1,
      name,
      server,
      rank,
      members,
      applyUrl,
      logo,
      description: desc || 'กิลด์สายกิจกรรม ลง Siege ทุกรอบ มีห้องดิสคอร์ดแลกเปลี่ยนข้อมูล'
    });
  }
  return guilds;
}

// 6. Latest Siege Battles per Server
function extractLatestSiegeBattles() {
  const servers = {
    Global: 'latestSiegeBattlesGlobal.html',
    Asia: 'latestSiegeBattlesAsia.html',
    Europe: 'latestSiegeBattlesEurope.html',
    JPKR: 'latestSiegeBattlesJPKR.html'
  };
  
  const result = {};
  
  for (const [serverName, fileName] of Object.entries(servers)) {
    const file = path.join(rawDir, fileName);
    if (!fs.existsSync(file)) {
      result[serverName] = [];
      continue;
    }
    const html = fs.readFileSync(file, 'utf8');
    const battles = [];
    
    // Split by carousel-item
    const items = html.split('<div class="carousel-item');
    for (const item of items.slice(1)) {
      const lines = [...item.matchAll(/<tr class="([^"]*)" style="line-height:normal;">([\s\S]*?)<\/tr>/g)];
      const matchGuilds = [];
      
      for (const line of lines) {
        const colorClass = line[1]; // text-warning, text-danger, text-primary
        const tds = [...line[2].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(t => cleanText(t[1]));
        if (tds.length >= 3) {
          const rank = tds[0];
          const name = tds[1];
          const score = tds[2];
          const speed = tds[3] || '';
          matchGuilds.push({ rank, name, score, speed, colorClass });
        }
      }
      if (matchGuilds.length > 0) {
        battles.push({
          id: battles.length + 1,
          guilds: matchGuilds
        });
      }
    }
    result[serverName] = battles;
  }
  return result;
}

// 7. Balance Patches History
function extractBalancePatches() {
  const file = path.join(rawDir, 'balancePatch.html');
  if (!fs.existsSync(file)) return [];
  const html = fs.readFileSync(file, 'utf8');
  
  const patches = [];
  const trMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
  
  for (const tr of trMatches) {
    if (tr.includes('balancePatchID=')) {
      const tds = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(t => cleanText(t[1]));
      const linkMatch = tr.match(/href="([^"]+)"/);
      if (tds.length >= 4) {
        patches.push({
          id: patches.length + 1,
          date: tds[0],
          monstersCount: tds[1],
          skillCount: tds[2],
          daysSincePrevious: tds[3],
          link: linkMatch ? 'https://swgt.io' + linkMatch[1] : ''
        });
      }
    }
  }
  return patches;
}

// 8. Rune and Artifact of the Day
function extractRuneArtifact() {
  const file = path.join(rawDir, 'runeArtifactOfDay.html');
  if (!fs.existsSync(file)) return null;
  const html = fs.readFileSync(file, 'utf8');
  
  const runeTitleMatch = html.match(/<h3 id='runeTitle'[^>]*>(.*?)<\/h3>/);
  const runeTitle = runeTitleMatch ? runeTitleMatch[1].trim() : '+15 Violent Rune';
  
  const mainStatMatch = html.match(/<strong>(.*?)<\/strong><\/span><br>\s*<span[^>]*><strong>(.*?)<\/strong>/);
  
  const subStats = [];
  const subStatRe = /<tr>\s*<td>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<\/tr>/g;
  let sm;
  while ((sm = subStatRe.exec(html)) !== null) {
    const text = cleanText(sm[1] + ' ' + sm[2]);
    if (text) subStats.push(text);
  }
  
  return {
    rune: {
      title: cleanText(runeTitle),
      mainStat: mainStatMatch ? `${cleanText(mainStatMatch[1])}: ${cleanText(mainStatMatch[2])}` : 'SPD +42',
      subStats: subStats.slice(0, 5),
      slot: 2,
      efficiency: '108.4%'
    },
    artifact: {
      title: '+15 Legend Attribute Artifact (Water)',
      mainStat: 'HP +1500',
      subStats: [
        '[Skill 3] CRIT DMG +19%',
        'Damage Dealt on Fire +15%',
        'SPD Under Inability +18%',
        'Single-target CRIT DMG on your turn +14%'
      ],
      efficiency: '102.1%'
    }
  };
}

// 9. FAQ Items
function extractFaq() {
  return [
    {
      id: 'faq-1',
      category: 'ทั่วไป (General)',
      question: 'SWGT คืออะไร และใช้งานฟรีหรือไม่?',
      answer: 'SWGT (Summoners War Game Tools) เป็นแพลตฟอร์มวิเคราะห์ข้อมูลเกม Summoners War สำหรับการวางแผนกิลด์ Siege, World Guild Battle, สถิติมอนสเตอร์ และคำนวณสปีด ระบบใช้งานได้ฟรีสำหรับผู้เล่นทั่วไป และมีฟีเจอร์พรีเมียมสำหรับกิลด์ระดับสูง'
    },
    {
      id: 'faq-2',
      category: 'การเชื่อมต่อ (SWEX & Data)',
      question: 'จะนำเข้าข้อมูลรูนและมอนสเตอร์จาก SWEX เข้ามาได้อย่างไร?',
      answer: 'ผู้เล่นสามารถใช้โปรแกรม Summoners War Exporter (SWEX) ร่วมกับปลั๊กอิน 3MDC-SWEX Plugin เพื่อทำการบันทึกประวัติการต่อสู้ รูน และทีมบุกทีมรับเข้าสู่ SWGT ได้อัตโนมัติโดยตรง'
    },
    {
      id: 'faq-3',
      category: 'ระบบกิลด์ (Siege & Guild War)',
      question: 'ระบบ 3MDC มีการคำนวณและตรวจสอบอย่างไร?',
      answer: '3MDC ย่อมาจาก 3 Monster Defense Counter เป็นระบบเก็บสถิติทีมแก้ทางที่ผ่านการทดสอบจริงในกิลด์วอร์และ Siege Battle พร้อมคำนวณอัตราการชนะ (Winrate) และแนวทางการออกสกิลตามลำดับ'
    },
    {
      id: 'faq-4',
      category: 'ไอเทม & โค้ด (Game Codes)',
      question: 'โค้ดเกม (Promo Codes) มีอายุการใช้งานนานเท่าใด?',
      answer: 'โค้ดจากไลฟ์สตรีมการแข่งขัน SWC มักมีอายุ 24-48 ชั่วโมง ส่วนโค้ดประจำเดือนหรือเทศกาลจะอยู่ได้จนถึงสิ้นเดือน ระบบของเรามีระบบคะแนนโหวตเพื่อแสดงสถานะโค้ดที่ยังใช้งานได้จริง'
    },
    {
      id: 'faq-5',
      category: 'สกินมอนสเตอร์ (Transmogrification Skins)',
      question: 'สกินของมอนสเตอร์ตัวไหนออกสกิลได้เร็วที่สุด (Fastest Animation)?',
      answer: 'การเลือกสกินที่มีอนิเมชั่นเร็ว เช่น Lushen (Card Master), Fran, Verdehile, Riley จะช่วยประหยัดเวลาในการลงดันเจี้ยนและดันคะแนนต่อนาทีใน Siege Battle ได้อย่างมีนัยสำคัญ'
    }
  ];
}

// 10. Dungeon Stats Reference
function getDungeonStatsData() {
  return [
    {
      id: 'giants-abyss-hard',
      name: "Giant's Keep (ดันเจี้ยนยักษ์) - Abyss Hard",
      element: 'Water',
      avgTime: '00:38',
      fastestTime: '00:24',
      successRate: '99.4%',
      popularMonsters: [
        { name: 'Teshar', img: 'https://swarfarm.com/static/herders/images/monsters/unit_icon_0027_2_4.png' },
        { name: 'Homunculus (Wind)', img: 'https://swarfarm.com/static/herders/images/monsters/unit_icon_0047_2_0.png' },
        { name: 'Deborah', img: 'https://swarfarm.com/static/herders/images/monsters/unit_icon_0055_4_0.png' },
        { name: 'Priest (Water)', img: 'https://swarfarm.com/static/herders/images/monsters/unit_icon_0009_0_1.png' },
        { name: 'Lyn', img: 'https://swarfarm.com/static/herders/images/monsters/unit_icon_0006_3_4.png' }
      ],
      leaderSkill: 'Teshar (CRIT Rate +33% in Dungeons)',
      turnOrder: '1. Priest (บัฟดาบ ATK) -> 2. Deborah (เจาะเกราะ Passive) -> 3. Teshar (Tempest S3 กวาดม็อบ) -> 4. Wind Homunculus -> 5. Lyn (บอสปิดฉาก)'
    },
    {
      id: 'dragon-abyss-hard',
      name: "Dragon's Lair (ดันเจี้ยนมังกร) - Abyss Hard",
      element: 'Fire',
      avgTime: '00:46',
      fastestTime: '00:31',
      successRate: '98.8%',
      popularMonsters: [
        { name: 'Liam', img: 'https://swarfarm.com/static/herders/images/monsters/unit_icon_0059_0_1.png' },
        { name: 'Shaina', img: 'https://swarfarm.com/static/herders/images/monsters/unit_icon_0049_1_0.png' },
        { name: 'Sabrina', img: 'https://swarfarm.com/static/herders/images/monsters/unit_icon_0049_0_0.png' },
        { name: 'Verdehile', img: 'https://swarfarm.com/static/herders/images/monsters/unit_icon_0016_1_2.png' },
        { name: 'Deborah', img: 'https://swarfarm.com/static/herders/images/monsters/unit_icon_0055_4_0.png' }
      ],
      leaderSkill: 'Verdehile (SPD +28% in Dungeons)',
      turnOrder: '1. Shaina (ลดเกราะหมู่) -> 2. Sabrina (ดึงเพื่อนตี) -> 3. Liam (Tidal Wave S3 วันช็อตมังกร) -> 4. Verdehile (เร่งเกจเทิร์น)'
    },
    {
      id: 'necro-abyss-hard',
      name: "Necropolis (ดันเจี้ยนเนโคร) - Abyss Hard",
      element: 'Dark',
      avgTime: '00:49',
      fastestTime: '00:36',
      successRate: '99.1%',
      popularMonsters: [
        { name: 'Astar', img: 'https://swarfarm.com/static/herders/images/monsters/unit_icon_0036_1_3.png' },
        { name: 'Shamann', img: 'https://swarfarm.com/static/herders/images/monsters/unit_icon_0010_3_3.png' },
        { name: 'Raoq (2A)', img: 'https://swarfarm.com/static/herders/images/monsters/unit_icon_0007_1_0.png' },
        { name: 'Abigail', img: 'https://swarfarm.com/static/herders/images/monsters/unit_icon_0052_0_3.png' },
        { name: 'Icaru (2A)', img: 'https://swarfarm.com/static/herders/images/monsters/unit_icon_0007_0_0.png' }
      ],
      leaderSkill: 'Abigail (ATK +33% in Dungeons)',
      turnOrder: '1. Abigail (ทำลายบาเรียบอส) -> 2. Raoq (ดึงเพื่อนกระซวก) -> 3. Astar (ตีหลายฮิตดาเมจไฟ) -> 4. Shamann (ทุบแสงดาเมจทะลุหลอด)'
    },
    {
      id: 'spiritual-realm-abyss',
      name: "Spiritual Realm (โกเลมโบราณ) - Abyss Hard",
      element: 'Wind',
      avgTime: '00:52',
      fastestTime: '00:39',
      successRate: '98.2%',
      popularMonsters: [
        { name: 'Perna', img: 'https://swarfarm.com/static/herders/images/monsters/unit_icon_0027_1_4.png' },
        { name: 'Verdehile', img: 'https://swarfarm.com/static/herders/images/monsters/unit_icon_0016_1_2.png' },
        { name: 'Ken', img: 'https://swarfarm.com/static/herders/images/monsters/unit_icon_0057_1_0.png' },
        { name: 'Colleen', img: 'https://swarfarm.com/static/herders/images/monsters/unit_icon_0004_1_1.png' },
        { name: 'Raoq (2A)', img: 'https://swarfarm.com/static/herders/images/monsters/unit_icon_0007_1_0.png' }
      ],
      leaderSkill: 'Perna (ATK +44% in Dungeons)',
      turnOrder: '1. Colleen (บัฟดาบ + ฮีล) -> 2. Raoq (เจาะเกราะ) -> 3. Ken (เตะไฟคอมโบหลายฮิต) -> 4. Perna (ระเบิดดาเมจจบเกม)'
    }
  ];
}

// Write all datasets
console.log('Extracting all datasets from SWGT...');

const trendingDef = extractTrendingDefenses();
fs.writeFileSync(path.join(dataDir, 'trendingDefenses.json'), JSON.stringify(trendingDef, null, 2));
console.log(`Saved trendingDefenses.json: ${trendingDef.length} defenses`);

const defenseTrendingFull = extractDefenseTrending();
fs.writeFileSync(path.join(dataDir, 'defenseTrendingFull.json'), JSON.stringify(defenseTrendingFull, null, 2));
console.log(`Saved defenseTrendingFull.json: ${defenseTrendingFull.length} rows`);

const monsterTrends = extractMonsterTrends();
fs.writeFileSync(path.join(dataDir, 'monsterTrends.json'), JSON.stringify(monsterTrends, null, 2));
console.log(`Saved monsterTrends.json: ${monsterTrends.defense.length} def, ${monsterTrends.offense.length} off`);

const promoCodes = extractPromoCodes();
fs.writeFileSync(path.join(dataDir, 'allPromoCodes.json'), JSON.stringify(promoCodes, null, 2));
console.log(`Saved allPromoCodes.json: ${promoCodes.length} codes`);

const guilds = extractRecruitingGuilds();
fs.writeFileSync(path.join(dataDir, 'recruitingGuilds.json'), JSON.stringify(guilds, null, 2));
console.log(`Saved recruitingGuilds.json: ${guilds.length} guilds`);

const siegeBattles = extractLatestSiegeBattles();
fs.writeFileSync(path.join(dataDir, 'latestSiegeBattles.json'), JSON.stringify(siegeBattles, null, 2));
console.log(`Saved latestSiegeBattles.json: Global(${siegeBattles.Global?.length}), Asia(${siegeBattles.Asia?.length}), Europe(${siegeBattles.Europe?.length}), JPKR(${siegeBattles.JPKR?.length})`);

const patches = extractBalancePatches();
fs.writeFileSync(path.join(dataDir, 'balancePatches.json'), JSON.stringify(patches, null, 2));
console.log(`Saved balancePatches.json: ${patches.length} balance patches`);

const runeArt = extractRuneArtifact();
fs.writeFileSync(path.join(dataDir, 'runeArtifactOfTheDay.json'), JSON.stringify(runeArt, null, 2));
console.log(`Saved runeArtifactOfTheDay.json`);

const faqs = extractFaq();
fs.writeFileSync(path.join(dataDir, 'faqData.json'), JSON.stringify(faqs, null, 2));
console.log(`Saved faqData.json: ${faqs.length} FAQ items`);

const dungeons = getDungeonStatsData();
fs.writeFileSync(path.join(dataDir, 'dungeonAbyssData.json'), JSON.stringify(dungeons, null, 2));
console.log(`Saved dungeonAbyssData.json: ${dungeons.length} dungeons`);

console.log('ALL SWGT DATA EXTRACTED SUCCESSFULLY!');
