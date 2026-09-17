const fs = require('fs');
const path = require('path');

const rawDir = path.join(__dirname, '..', 'swgt_raw');

function inspectFile(filename, searchTerms) {
  const content = fs.readFileSync(path.join(rawDir, filename), 'utf8');
  console.log(`\n*** ${filename} ***`);
  for (const term of searchTerms) {
    const idx = content.indexOf(term);
    if (idx !== -1) {
      console.log(`Found "${term}" at index ${idx}:`);
      console.log(content.substring(idx, idx + 400).replace(/\s+/g, ' '));
    } else {
      console.log(`Term "${term}" not found`);
    }
  }
}

inspectFile('defenseTrending.html', ['<tbody', 'Morris', 'DataTable', 'data-']);
inspectFile('monsterDefenseTrending.html', ['<tbody', 'DataTable', '<tr']);
inspectFile('recruiting.html', ['<table', 'card', 'guild', 'Server']);
inspectFile('latestSiegeBattlesGlobal.html', ['<div', 'vs', 'carousel', 'table']);
inspectFile('balancePatch.html', ['balancePatchList', '<tr', '<td']);
inspectFile('dungeonStats.html', ['Giants', 'Dragon', 'Necro', 'table', 'data:']);
inspectFile('faq.html', ['accordion', 'card-header', 'faq', 'collapse']);
inspectFile('changeLog.html', ['card', 'version', '7.', '202']);
