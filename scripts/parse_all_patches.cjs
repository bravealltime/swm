const fs = require('fs');
const path = require('path');

const patchIds = [92, 91, 90, 89, 88];
const swgtRawDir = path.join(__dirname, '../swgt_raw');

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&#12539;/g, '・')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function translateChangeType(ct) {
  if (!ct) return 'ปรับสมดุลทั่วไป';
  const clean = decodeHtmlEntities(ct);
  const lower = clean.toLowerCase();
  if (lower.includes('percentage')) return 'ปรับเปอร์เซ็นต์/ตัวคูณ';
  if (lower.includes('damage')) return 'ปรับดาเมจ';
  if (lower.includes('cooldown')) return 'ปรับคูลดาวน์สกิล';
  if (lower.includes('effect added') || lower.includes('add')) return 'เพิ่มเอฟเฟกต์ใหม่';
  if (lower.includes('effect removed') || lower.includes('remove')) return 'นำเอฟเฟกต์ออก';
  if (lower.includes('skill change') || lower.includes('rework')) return 'ยกเครื่องกลไกสกิล';
  if (lower.includes('value')) return 'ปรับเปลี่ยนค่าสถานะ';
  return clean;
}

function classifyImpact(card) {
  const text = (card.preview + ' ' + card.officialText + ' ' + card.changeType).toLowerCase();
  
  // Check value changes if present
  if (card.valueChanges && card.valueChanges.length > 0) {
    const vc = card.valueChanges[0];
    const oldNum = parseFloat(vc.oldValue);
    const newNum = parseFloat(vc.newValue);
    if (!isNaN(oldNum) && !isNaN(newNum)) {
      if (text.includes('cooldown') || text.includes('turn')) {
        return newNum < oldNum ? 'buff' : 'nerf';
      }
      if (text.includes('decrease') || text.includes('reduce')) {
        // e.g. damage decreased by X%
        if (text.includes('decreased by') && newNum > oldNum) return 'nerf';
      }
      if (newNum > oldNum) return 'buff';
      if (newNum < oldNum) return 'nerf';
    }
  }

  // Clear nerf indicators
  if (text.includes('decreased by') || text.includes('reduced by') || text.includes('decreased') || 
      text.includes('cooldown increased') || text.includes('turn increased') || text.includes('weakened')) {
    return 'nerf';
  }
  // Clear buff indicators
  if (text.includes('increased by') || text.includes('damage increased') || text.includes('cooldown decreased') || 
      text.includes('turn decreased') || text.includes('effect added') || text.includes('strengthened') || 
      text.includes('additionally') || text.includes('new effect')) {
    return 'buff';
  }
  return 'adjustment';
}

function parsePatchHtml(html, patchId) {
  const cards = [];
  const cardRegex = /<div class="balance-patch-card"([\s\S]*?)(?=<div class="balance-patch-card"|<div class="container-fluid footer"|<\/body>|$)/g;
  
  let match;
  let index = 0;
  while ((match = cardRegex.exec(html)) !== null) {
    const cardContent = match[0];
    
    // Monster info
    const monsterImgMatch = cardContent.match(/<img[^>]*src="([^"]+)"[^>]*class="[^"]*balance-patch-monster-img/) ||
                            cardContent.match(/<img[^>]*class="[^"]*balance-patch-monster-img[^"]*"[^>]*src="([^"]+)"/);
    const monsterNameMatch = cardContent.match(/class="balance-patch-monster-name">([^<]+)<\/div>/);
    const elementMatch = cardContent.match(/class="balance-patch-element"[\s\S]*?<span>([^<]+)<\/span>/);
    
    // Skill info
    const skillBadgeMatch = cardContent.match(/class="balance-patch-skill-badge[^"]*">([^<]+)<\/div>/);
    const skillImgMatch = cardContent.match(/<img[^>]*src="([^"]+)"[^>]*class="[^"]*balance-patch-skill-img/) ||
                          cardContent.match(/<img[^>]*class="[^"]*balance-patch-skill-img[^"]*"[^>]*src="([^"]+)"/);
    const skillNameMatch = cardContent.match(/class="balance-patch-skill-name">([^<]+)<\/div>/);
    
    // Change badge & type
    const badgeMatch = cardContent.match(/class="balance-patch-badge[^"]*">([^<]+)<\/span>/);
    
    // Preview & details
    let preview = '';
    const previewMatch = cardContent.match(/class="balance-patch-change-preview">([\s\S]*?)<\/div>/);
    if (previewMatch) {
      preview = previewMatch[1]
        .replace(/<i class="fas fa-long-arrow-right"><\/i>/g, ' ➔ ')
        .replace(/<i class="fas fa-long-arrow-alt-right"><\/i>/g, ' ➔ ')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .trim();
    }

    // Official text
    let officialText = '';
    const officialMatch = cardContent.match(/class="[^"]*balance-patch-official-text[^"]*">([\s\S]*?)<\/div>/);
    if (officialMatch) {
      officialText = officialMatch[1]
        .replace(/<i class="fas fa-long-arrow-right"><\/i>/g, ' ➔ ')
        .replace(/<i class="fas fa-long-arrow-alt-right"><\/i>/g, ' ➔ ')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .trim();
    }

    // Value changes (before -> after)
    const valueChanges = [];
    const valRegex = /<span class="balance-patch-old-value">([\s\S]*?)<\/span>[\s\S]*?<span class="balance-patch-new-value">([\s\S]*?)<\/span>/g;
    let valMatch;
    while ((valMatch = valRegex.exec(cardContent)) !== null) {
      valueChanges.push({
        oldValue: valMatch[1].replace(/<[^>]+>/g, '').trim(),
        newValue: valMatch[2].replace(/<[^>]+>/g, '').trim()
      });
    }

    const monsterName = decodeHtmlEntities(monsterNameMatch ? monsterNameMatch[1].trim() : 'Unknown');
    const element = decodeHtmlEntities(elementMatch ? elementMatch[1].trim() : 'Unknown');
    const skillName = decodeHtmlEntities(skillNameMatch ? skillNameMatch[1].trim() : '');
    const skillBadge = decodeHtmlEntities(skillBadgeMatch ? skillBadgeMatch[1].trim() : '');
    const changeType = decodeHtmlEntities(badgeMatch ? badgeMatch[1].trim() : '');

    const card = {
      id: `${patchId}-${++index}`,
      patchId,
      monsterName,
      element,
      monsterImg: monsterImgMatch ? monsterImgMatch[1] : '',
      skillName,
      skillBadge,
      skillImg: skillImgMatch ? skillImgMatch[1] : '',
      changeType,
      changeTypeTh: translateChangeType(changeType),
      preview: decodeHtmlEntities(preview || officialText),
      officialText: decodeHtmlEntities(officialText || preview),
      valueChanges: valueChanges.map(v => ({
        oldValue: decodeHtmlEntities(v.oldValue),
        newValue: decodeHtmlEntities(v.newValue)
      }))
    };

    card.impact = classifyImpact(card);
    cards.push(card);
  }

  return cards;
}

const allDetails = {};
let totalLoadedCards = 0;

for (const id of patchIds) {
  const filePath = path.join(swgtRawDir, `patch_${id}.html`);
  if (fs.existsSync(filePath)) {
    const html = fs.readFileSync(filePath, 'utf8');
    const cards = parsePatchHtml(html, id);
    allDetails[id] = cards;
    totalLoadedCards += cards.length;
    console.log(`Patch ${id}: Parsed ${cards.length} adjustments`);
  }
}

const outPath = path.join(__dirname, '../src/data/balancePatchDetails.json');
fs.writeFileSync(outPath, JSON.stringify(allDetails, null, 2));
console.log(`Saved detailed balance patch data (${totalLoadedCards} total changes) to ${outPath}`);
