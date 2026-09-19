const fs = require('fs');

async function checkVendors() {
  const res = await fetch('https://m.swranking.com/static/js/chunk-vendors.9bb96a39.js');
  const js = await res.text();
  console.log('Vendors length:', js.length);
  fs.writeFileSync('swgt_raw/swrt_vendors.js', js);
  
  // Find chunk references
  const matches = js.match(/static\/js\/[a-zA-Z0-9_\-\.]+\.js/g);
  console.log('Chunk references in vendors:', [...new Set(matches || [])]);

  // Find jsonp / chunk map
  const mapMatches = js.match(/\{[0-9a-f]{4}:"[0-9a-f]{8}"[^\}]*\}/g);
  if (mapMatches) {
    console.log('Chunk map samples:', mapMatches.slice(0, 3));
  }
}
checkVendors().catch(console.error);
