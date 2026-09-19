const fs = require('fs');
const path = require('path');

function parsePatchHtml(html, patchId) {
  // Find all cards
  const cards = [];
  const cardRegex = /<div class="balance-patch-card"([\s\S]*?)(?=<div class="balance-patch-card"|<div class="container-fluid footer"|<\/body>|$)/g;
  
  let match;
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

    // Clean monster name
    const monsterName = monsterNameMatch ? monsterNameMatch[1].trim() : 'Unknown';
    const element = elementMatch ? elementMatch[1].trim() : 'Unknown';
    const skillName = skillNameMatch ? skillNameMatch[1].trim() : '';
    const skillBadge = skillBadgeMatch ? skillBadgeMatch[1].trim() : '';
    const changeType = badgeMatch ? badgeMatch[1].trim() : '';

    cards.push({
      patchId,
      monsterName,
      element,
      monsterImg: monsterImgMatch ? monsterImgMatch[1] : '',
      skillName,
      skillBadge,
      skillImg: skillImgMatch ? skillImgMatch[1] : '',
      changeType,
      preview: preview || officialText,
      officialText: officialText || preview,
      valueChanges
    });
  }

  return cards;
}

const html92 = fs.readFileSync(path.join(__dirname, '../swgt_raw/patch_92.html'), 'utf8');
const cards92 = parsePatchHtml(html92, 92);
console.log('Parsed patch 92 cards count:', cards92.length);
console.log('Sample card 1:', cards92[0]);
console.log('Sample card 2:', cards92[1]);
