const fs = require('fs');
const path = require('path');

const rawDir = path.join(__dirname, '..', 'swgt_raw');

// Let's inspect each file
const files = fs.readdirSync(rawDir);
console.log('Available files in swgt_raw:', files);

function analyzeFile(filename) {
  const content = fs.readFileSync(path.join(rawDir, filename), 'utf8');
  console.log(`\n=== Analysis of ${filename} (${content.length} chars) ===`);
  
  // Find titles/headings
  const hMatches = content.match(/<h[1-4][^>]*>(.*?)<\/h[1-4]>/gi) || [];
  console.log('Headings:', hMatches.slice(0, 5).map(h => h.replace(/<[^>]+>/g, '').trim()));
  
  // Find datatables or tables
  const tableMatches = content.match(/<table[^>]*id="([^"]+)"/gi) || [];
  console.log('Table IDs:', tableMatches);
  
  // Find form actions
  const formMatches = content.match(/<form[^>]*action="([^"]+)"/gi) || [];
  console.log('Form Actions:', formMatches);
}

['recruiting.html', 'dungeonStats.html', 'balancePatch.html', 'faq.html', 'about.html', 'changeLog.html', 'siegeSimulator.html', 'siegeCalculator.html'].forEach(analyzeFile);
