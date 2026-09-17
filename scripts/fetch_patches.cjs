const fs = require('fs');
const path = require('path');
const https = require('https');

const patchesToFetch = [92, 91, 90, 89, 88];
const outDir = path.join(__dirname, '../swgt_raw');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function fetchPatch(id) {
  const filePath = path.join(outDir, `patch_${id}.html`);
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 10000) {
    console.log(`Patch ${id} already exists (${fs.statSync(filePath).size} bytes), skipping download.`);
    return;
  }

  const url = `https://swgt.io/controllers/balancePatch/specific?balancePatchID=${id}`;
  console.log(`Fetching Patch ${id} from ${url}...`);

  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Handle redirect if needed
        console.log(`Redirecting to ${res.headers.location}`);
        return;
      }
      let chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        fs.writeFileSync(filePath, buffer);
        console.log(`Saved patch_${id}.html (${buffer.length} bytes)`);
        resolve();
      });
    });

    req.on('error', (err) => {
      console.error(`Error fetching patch ${id}:`, err.message);
      resolve(); // don't crash loop
    });
  });
}

async function run() {
  for (const id of patchesToFetch) {
    await fetchPatch(id);
    await new Promise(r => setTimeout(r, 600)); // slight pause
  }
  console.log('Finished fetching selected patches.');
}

run();
