const fs = require('fs');
const path = require('path');

const rawDir = path.join(__dirname, '..', 'swgt_raw');

// 1. Trending Defenses
function parseTrendingDefenses() {
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
        searchQuery: `${monsters[i].name} ${monsters[i+1].name} ${monsters[i+2].name}`
      });
    }
  }
  return defenses;
}

// 2. Defense Trending (Full list from allServerAnalytics)
function parseDefenseTrending() {
  const file = path.join(rawDir, 'defenseTrending.html');
  if (!fs.existsSync(file)) return [];
  const html = fs.readFileSync(file, 'utf8');
  
  // Look for table rows or datatable data
  const rows = [];
  // SWGT often embeds tables with <tr> containing monster images and win/loss or count
  const trMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
  for (const tr of trMatches) {
    const imgMatches = [...tr.matchAll(/<img src="([^"]+)"[^>]*alt="([^"]+)"/g)];
    if (imgMatches.length >= 3) {
      // Find winrate or count numbers
      const tdTexts = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(t => t[1].replace(/<[^>]+>/g, '').trim());
      rows.push({
        monsters: imgMatches.slice(0, 3).map(im => ({ img: im[1], name: im[2] })),
        stats: tdTexts.filter(t => t.length > 0 && !t.includes('img'))
      });
    }
  }
  return rows;
}

// 3. Game Codes
function parseGameCodes() {
  const file = path.join(rawDir, 'gamecodesPage.html');
  if (!fs.existsSync(file)) return [];
  const html = fs.readFileSync(file, 'utf8');
  
  const codes = [];
  // Links with http://withhive.me/313/CODE
  const codeRegex = /href="http:\/\/withhive\.me\/313\/([^"]+)"/g;
  const matches = [...html.matchAll(codeRegex)];
  const seen = new Set();
  
  for (const m of matches) {
    const code = m[1].trim();
    if (!seen.has(code) && code.length > 3) {
      seen.add(code);
      codes.push(code);
    }
  }
  return codes;
}

// 4. Actively Recruiting Guilds
function parseRecruiting() {
  const file = path.join(rawDir, 'recruiting.html');
  if (!fs.existsSync(file)) return [];
  const html = fs.readFileSync(file, 'utf8');
  
  const guilds = [];
  // Find guild cards or rows
  const cardRegex = /<div class="card[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g;
  // Or table rows
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let trm;
  while ((trm = trRegex.exec(html)) !== null) {
    const content = trm[1];
    if (content.includes('<td') && !content.includes('<th')) {
      const tds = [...content.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(t => t[1].replace(/<[^>]+>/g, '').trim());
      if (tds.length >= 3) {
        guilds.push({
          name: tds[0],
          server: tds[1] || 'Global',
          rank: tds[2] || '',
          requirements: tds[3] || '',
          contact: tds[4] || ''
        });
      }
    }
  }
  return guilds;
}

// 5. Change Log
function parseChangeLog() {
  const file = path.join(rawDir, 'changeLog.html');
  if (!fs.existsSync(file)) return [];
  const html = fs.readFileSync(file, 'utf8');
  
  const logs = [];
  const itemRegex = /<h[45][^>]*>(.*?)<\/h[45]>[\s\S]*?<ul>([\s\S]*?)<\/ul>/g;
  let lm;
  while ((lm = itemRegex.exec(html)) !== null) {
    const version = lm[1].replace(/<[^>]+>/g, '').trim();
    const items = [...lm[2].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map(li => li[1].replace(/<[^>]+>/g, '').trim());
    logs.push({ version, items });
  }
  return logs;
}

// 6. FAQ
function parseFaq() {
  const file = path.join(rawDir, 'faq.html');
  if (!fs.existsSync(file)) return [];
  const html = fs.readFileSync(file, 'utf8');
  
  const faqs = [];
  const qRegex = /<a[^>]*class="[^"]*faq[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
  // Let's also check for general Q&A
  return faqs;
}

console.log('Trending Defenses:', parseTrendingDefenses().length);
console.log('Defense Trending rows:', parseDefenseTrending().length);
console.log('Game Codes found:', parseGameCodes());
console.log('Recruiting rows:', parseRecruiting().length);
console.log('Change Log items:', parseChangeLog().length);
