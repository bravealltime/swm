const fs = require('fs');
const path = require('path');

function translateLeaderSkill(ls) {
  if (!ls) return null;
  const attrMap = {
    'HP': 'พลังชีวิต (HP)',
    'Attack Power': 'พลังโจมตี (ATK)',
    'Defense': 'พลังป้องกัน (DEF)',
    'Attack Speed': 'ความเร็วโจมตี (SPD)',
    'Critical Rate': 'อัตราคริติคอล (CRI Rate)',
    'Resistance': 'ความต้านทาน (RES)',
    'Accuracy': 'ความแม่นยำ (ACC)',
    'Critical DMG': 'ความเสียหายคริติคอล (CRI DMG)'
  };
  const areaMap = {
    'Guild': 'ในสงครามกิลด์และกิลด์ซีจ (Guild Content)',
    'Arena': 'ในอารีน่า (Arena)',
    'Dungeon': 'ในดันเจี้ยน (Dungeon)',
    'General': 'ทุกคอนเทนต์การต่อสู้'
  };
  const elemMap = {
    'Fire': 'ธาตุไฟ',
    'Water': 'ธาตุน้ำ',
    'Wind': 'ธาตุลม',
    'Light': 'ธาตุแสง',
    'Dark': 'ธาตุมืด'
  };

  const attr = attrMap[ls.attribute] || ls.attribute;
  const scope = ls.element ? `ที่มี${elemMap[ls.element] || ls.element}` : (areaMap[ls.area] || '');
  const textTh = `เพิ่ม ${attr} ของมอนสเตอร์ฝ่ายเรา${scope ? ' ' + scope : ''} ขึ้น ${ls.amount}%`;
  
  let iconName = `leader_skill_${ls.attribute.replace(/\s+/g, '_')}`;
  if (ls.element) iconName += `_${ls.element}`;
  else if (ls.area && ls.area !== 'General') iconName += `_${ls.area}`;
  
  return {
    attribute: ls.attribute,
    amount: ls.amount,
    area: ls.area,
    element: ls.element,
    textTh,
    textEn: `Increases the ${ls.attribute} of ally Monsters ${ls.element ? 'with ' + ls.element + ' attribute' : (ls.area ? 'in ' + ls.area : '')} by ${ls.amount}%.`,
    iconUrl: `https://do9d4mpqk497d.cloudfront.net/common/images/leader_skills36/${iconName}.png`
  };
}

console.log('Sample Leader Skill:');
console.log(translateLeaderSkill({ attribute: 'HP', amount: 21, area: 'Guild', element: null }));
console.log(translateLeaderSkill({ attribute: 'Attack Power', amount: 33, area: 'General', element: null }));
console.log(translateLeaderSkill({ attribute: 'Attack Speed', amount: 24, area: 'Arena', element: null }));
