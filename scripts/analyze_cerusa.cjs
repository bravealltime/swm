const https = require('https');
const fs = require('fs');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  const swgtLoggerUrl = 'https://raw.githubusercontent.com/Cerusa/swgt-swex-plugin/main/SWGTLogger/index.js';
  const data = await fetch(swgtLoggerUrl);
  fs.writeFileSync('swgt_raw/swgt_logger_src.js', data);
  console.log('Downloaded SWGTLogger/index.js, size:', data.length);

  // Extract commands
  const lines = data.split('\n');
  const commands = [];
  for (const line of lines) {
    if (line.includes("proxy.on(") || line.includes("command == '") || line.includes('command === "') || line.includes("command == \"") || line.includes("listenToCommands")) {
      commands.push(line.trim());
    }
  }
  console.log('Key lines:');
  console.log(commands.slice(0, 30));
}

run();
