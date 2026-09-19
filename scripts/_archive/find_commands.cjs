const fs = require('fs');
const src = fs.readFileSync('swgt_raw/swgt_logger_src.js', 'utf8');

// Find all command strings
const commands = new Set();
const matches = src.match(/['"][A-Z][a-zA-Z0-9_]+['"]/g) || [];
for (const m of matches) {
  const c = m.replace(/['"]/g, '');
  if (c.startsWith('Battle') || c.startsWith('Get') || c.startsWith('Hub') || c.startsWith('Guest') || c.startsWith('Update') || c.startsWith('Confirm') || c.startsWith('Do') || c.startsWith('Receive') || c.startsWith('Defense') || c.startsWith('Set')) {
    commands.add(c);
  }
}

console.log('Intercepted Game Commands in SWGTLogger:');
console.log(Array.from(commands).sort());
