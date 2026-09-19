const fs = require('fs');
const path = require('path');

async function inspect3mdc() {
  const res = await fetch('https://swgt.io/3mdc/', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  console.log('3mdc page len:', html.length);
  
  // Find script tags
  const scriptRegex = /<script[^>]*src="([^"]+)"/g;
  let sm;
  while ((sm = scriptRegex.exec(html)) !== null) {
    console.log('Script src:', sm[1]);
  }

  // Find ajax URLs
  const ajaxRegex = /url\s*:\s*['"]([^'"]+)['"]/g;
  let am;
  while ((am = ajaxRegex.exec(html)) !== null) {
    console.log('Ajax URL:', am[1]);
  }

  // Find search query forms or parameters
  const inputRegex = /<input[^>]*name="([^"]+)"/g;
  const inputs = new Set();
  let im;
  while ((im = inputRegex.exec(html)) !== null) {
    inputs.add(im[1]);
  }
  console.log('Form input names:', [...inputs]);
}
inspect3mdc();
