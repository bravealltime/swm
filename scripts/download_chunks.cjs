const fs = require('fs');

async function downloadChunks() {
  const chunks = {
    'statistic': 'static/js/pages-tabBar-statistic-statistic.55ff825f.js',
    'rank-rank': 'static/js/packageA-pages-monster-rank-rank.2e380324.js',
    'monster-detail': 'static/js/packageA-pages-monster-detail-detail.0b4a5a33.js',
    'rank-list': 'static/js/packageA-pages-rank-rank-list.7a7b393f.js',
    'intelligentBP': 'static/js/packageB-pages-game-freedom-intelligentBP.63ffc49a.js'
  };

  for (const [key, path] of Object.entries(chunks)) {
    const url = 'https://m.swranking.com/' + path;
    try {
      const res = await fetch(url);
      const text = await res.text();
      fs.writeFileSync(`swgt_raw/swrt_${key}.js`, text);
      console.log(`Downloaded ${key}: length = ${text.length}`);
    } catch(e) {
      console.log(`Failed ${key}:`, e.message);
    }
  }
}

downloadChunks();
