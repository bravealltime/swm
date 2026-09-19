async function testUrls() {
  const urls = [
    'https://swarfarm.com/static/bestiary/skills.json',
    'https://swarfarm.com/data/bestiary/skills.json',
    'https://swarfarm.com/api/v2/skills/?page_size=1000',
    'https://swarfarm.com/api/v2/skills/?page_size=500'
  ];
  for (const u of urls) {
    try {
      const res = await fetch(u, { method: 'HEAD' });
      console.log(u, '->', res.status);
    } catch(e) {
      console.log(u, '-> ERROR', e.message);
    }
  }
}
testUrls();
