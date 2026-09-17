const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'swgt_raw', 'monsterCatalogGrid.html');
const html = fs.readFileSync(file, 'utf8');

// Thai translations dictionary for common names & families
const THAI_FAMILIES = {
  'Beast Rider': 'บีสต์ไรเดอร์',
  'Sniper Mk.I': 'สไนเปอร์ Mk.I',
  'Sky Surfer': 'สกายเซิร์ฟเฟอร์',
  'Pierret': 'ปิแอร์เร็ตต์',
  'Onimusha': 'โอนิมูฉะ',
  'Weapon Master': 'เวพอนมาสเตอร์',
  'Mage': 'เมจ (จอมเวท)',
  'Monk': 'มังค์ (Beast Monk)',
  'Phoenix': 'ฟีนิกซ์',
  'Ifrit': 'อิฟริท',
  'Werewolf': 'มนุษย์หมาป่า',
  'Anubis': 'อนูบิส',
  'Pirate Captain': 'กัปตันโจรสลัด',
  'Polar Queen': 'โพลาร์ควีน',
  'Blade Dancer': 'เบลดแดนเซอร์',
  'Boomerang Warrior': 'บูมเมอแรงวอริเออร์',
  'Chakram Dancer': 'จักกะรัมแดนเซอร์',
  'Dragon': 'มังกร',
  'Dragon Knight': 'อัศวินมังกร',
  'Archangel': 'อัครทูตสวรรค์ (อาร์คแองเจิล)',
  'Valkyrja': 'วาลคิรี (วัลคิเรีย)',
  'Sea Emperor': 'ราชาสมุทร (ซีเอ็มเพอเรอร์)',
  'Panda Warrior': 'แพนด้าวอริเออร์',
  'Oracle': 'ออราเคิล',
  'Occult Girl': 'ออคคัลท์เกิร์ล (เด็กผี)',
  'Chimera': 'คิเมร่า',
  'Desert Queen': 'ราชินีทะเลทราย',
  'Hell Lady': 'เฮลล์เลดี้',
  'Monkey King': 'วานรเทพ (มังกี้คิง)',
  'Fairy King': 'ราชาภูติ (แฟรี่คิง)',
  'Unicorn': 'ยูนิคอร์น',
  'Lightning Emperor': 'จักรพรรดิสายฟ้า (ไลท์นิ่งเอ็มเพอเรอร์)',
  'Slayer': 'สเลเยอร์',
  'Striker': 'สไตรเกอร์',
  'Battle Angel': 'แบทเทิลแองเจิล',
  'Shadowcaster': 'ชาโดว์คาสเตอร์',
  'Puppeteer': 'นักเชิดหุ่น (พัพเพ็ตเทียร์)',
  'Indra': 'พระอินทร์ (อินทรา)',
  'Asura': 'อสูร (อาสุรา)',
  'Yaksha': 'ยักษา (ยักษะ)',
  'Hacker': 'แฮ็กเกอร์',
  'Cyborg': 'ไซบอร์ก',
  'Frankenstein': 'แฟรงเกนสไตน์',
  'Living Armor': 'ชุดเกราะมีชีวิต (ลิฟวิ่งอาร์เมอร์)',
  'Grim Reaper': 'กริมรีปเปอร์',
  'Mystic Witch': 'แม่มดลึกลับ (มิสติกวิทช์)',
  'Vagabond': 'วากาบอนด์',
  'Inugami': 'อินุกามิ (หมา)'
};

// Common Thai name transliterations
const THAI_NAMES = {
  'Savannah': 'ซาวันนาห์',
  'Carcano': 'คาร์คาโน',
  'Miles': 'ไมล์ส',
  'Clara': 'คลาร่า',
  'Kaki': 'คากิ',
  'Dominic': 'โดมินิค',
  'Nana': 'นานา',
  'Chandra': 'จันทรา',
  'Perna': 'เพอร์น่า',
  'Elsharion': 'เอลชาริออน',
  'Eshir': 'เอเชียร์ 2A',
  'Jultan': 'จูลแทน 2A',
  'Aegir': 'เอจีร์',
  'Khmun': 'คมุน',
  'Vigor': 'วิกอร์ 2A',
  'Galleon': 'กัลเลียน',
  'Tiana': 'ทีอาน่า',
  'Leah': 'ลีอาห์',
  'Martina': 'มาร์ติน่า',
  'Shaina': 'เชน่า',
  'Tractor': 'แทรกเตอร์',
  'Nickel': 'นิกเกิล',
  'Teshar': 'เทชาร์',
  'Verdehile': 'แวร์เดฮิล (แวมไฟ)',
  'Lushen': 'ลูเชน (โจ๊กเกอร์ลม)',
  'Riley': 'ไรลีย์ (โทเท็มลม)',
  'Seara': 'เซอาร่า',
  'Praha': 'ปราฮา',
  'Giana': 'เกียนา',
  'Woosa': 'วูซ่า (ผู้เฒ่าน้ำ)',
  'Feng Yan': 'เฟิงเหยียน (แพนด้าลม)',
  'Mo Long': 'โม่หลง (แพนด้าน้ำ)',
  'Oliver': 'โอลิเวอร์',
  'Cheonpung': 'ชอนพุง',
  'Raoq': 'ราออค 2A',
  'Belladeon': 'เบลลาเดียน 2A',
  'Kro': 'โคร 2A',
  'Lyn': 'ลิน (อเมซอนแสง)',
  'Shamann': 'ชามานน์ 2A',
  'Zinc': 'ซิงค์ 2A'
};

// Recommended rune builds by archetype/family
function getSuggestedRunes(archetype, stars, name) {
  if (name.includes('Sniper') || name === 'Carcano') return 'Swift/Will หรือ Violent/Destroy (SPD/CRIT DMG/ATK%)';
  if (archetype === 'Defense') return 'Violent/Will หรือ Guard/Guard/Will (DEF%/DEF%/DEF% หรือ DEF%/CD/DEF%)';
  if (archetype === 'Support') return 'Violent/Will หรือ Swift/Will (SPD/HP%/HP%)';
  if (archetype === 'HP') return 'Violent/Destroy หรือ Despair/Revenge (SPD/HP%/HP%)';
  if (archetype === 'Attack') return 'Violent/Will หรือ Rage/Blade (ATK%/CRIT DMG/ATK%)';
  return 'Violent/Will (SPD/HP%/HP%)';
}

function getSuggestedRole(archetype, family, name) {
  if (name === 'Savannah') return 'ตัวดาเมจ/ลดเกราะ/ลดเกจหมู่ บุกทะลวงแถวสอง';
  if (name === 'Carcano') return 'ยิงเจาะเกราะเป้าเดี่ยว และแปะเกราะป้องกัน';
  if (name === 'Miles') return 'ดาเมจทะลุตามความเร็ว และสตั๊นเป้าหมาย';
  if (name === 'Tiana') return 'ล้างบัฟและดีบัฟทั้งหมดในสนาม 100% ไม่พลาด';
  if (archetype === 'Defense') return 'ตัวยืนแท็งก์สายป้องกัน สร้างดาเมจตามพลังป้องกัน (DEF)';
  if (archetype === 'Support') return 'ตัวซัพพอร์ตทีม บัฟพลังชีวิต เร่งเกจเทิร์น และล้างดีบัฟ';
  if (archetype === 'HP') return 'ตัวชนดาเมจพลังชีวิตสูง (Bruiser) ทนทานและสะท้อนหรือสวนกลับ';
  return 'ตัวทำดาเมจหลัก (Main DPS) กวาดล้างศัตรู';
}

// Extract monsters
// Let's use regex matching the imageContainer and inner data-viewelement
const containerRegex = /<div class="[^"]*imageContainer[^"]*"[^>]*data-monstername="([^"]*)"[^>]*data-monsterunawakenedname="([^"]*)"[^>]*data-monsterelement="([^"]*)"[^>]*data-monsternaturalstars="([^"]*)"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g;

const monsters = [];
const seenIds = new Set();
let match;

while ((match = containerRegex.exec(html)) !== null) {
  const name = match[1].trim();
  const unawakened = match[2].trim();
  const element = match[3].toLowerCase().trim();
  const stars = parseInt(match[4]) || 5;
  const content = match[5];

  // com2usID
  const idMatch = content.match(/com2usID=(\d+)/);
  const com2usId = idMatch ? idMatch[1] : `${element}-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

  if (seenIds.has(com2usId)) continue;
  seenIds.add(com2usId);

  // image url
  const imgMatch = content.match(/data-src="([^"]+)"/);
  const imageUrl = imgMatch ? imgMatch[1] : 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png';

  // Extract from data-viewelement
  const viewElMatch = content.match(/data-viewelement="([\s\S]*?)"/);
  let archetype = 'Attack';
  let family = unawakened || name;
  let leaderSkill = '';

  if (viewElMatch) {
    const viewEl = viewElMatch[1];
    const archMatch = viewEl.match(/Archetype<\/div>\s*<div[^>]*>([^<]+)<\/div>/);
    if (archMatch) archetype = archMatch[1].trim();

    const famMatch = viewEl.match(/Family<\/div>\s*<div[^>]*>([^<]+)<\/div>/);
    if (famMatch) family = famMatch[1].trim();

    const leadMatch = viewEl.match(/Leader Skill:<\/strong>&nbsp;([^<]+)/);
    if (leadMatch) leaderSkill = leadMatch[1].trim().replace(/&nbsp;/g, ' ');
  }

  const thaiName = THAI_NAMES[name] || name;
  const thaiFamily = THAI_FAMILIES[family] || family;
  const role = getSuggestedRole(archetype, family, name);
  const runes = getSuggestedRunes(archetype, stars, name);

  monsters.push({
    id: `m-${com2usId}`,
    com2usId,
    name,
    thaiName,
    unawakenedName: unawakened,
    family,
    thaiFamily,
    element, // 'fire' | 'water' | 'wind' | 'light' | 'dark'
    stars,   // 5, 4, 3, 2, 1
    archetype,
    leaderSkill,
    role,
    suggestedRunes: runes,
    avatarUrl: imageUrl,
    imageUrl: imageUrl
  });
}

console.log('Total unique monsters successfully extracted:', monsters.length);

// Sort: 5 stars first, then 4, 3, 2, 1, then by name
monsters.sort((a, b) => {
  if (b.stars !== a.stars) return b.stars - a.stars;
  return a.name.localeCompare(b.name);
});

// Write to src/data/allMonsters.json and src/data/monsters.js
const dataDir = path.join(__dirname, '..', 'src', 'data');
fs.writeFileSync(path.join(dataDir, 'allMonsters.json'), JSON.stringify(monsters, null, 2));
console.log('Written to src/data/allMonsters.json');

// Also update src/data/monsters.js so existing imports receive full catalog!
const jsContent = `// All Summoners War Monsters catalog (${monsters.length} monsters across all elements and stars)
// Extracted from official SWGT database & Com2uS in-game portraits
import ALL_MONSTERS_JSON from './allMonsters.json';

export const MONSTERS = ALL_MONSTERS_JSON;
export default MONSTERS;
`;

fs.writeFileSync(path.join(dataDir, 'monsters.js'), jsContent);
console.log('Updated src/data/monsters.js successfully!');
