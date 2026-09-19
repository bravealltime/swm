async function testMonsters() {
  try {
    const res = await fetch('https://swarfarm.com/api/v2/monsters/?page_size=1000', { method: 'HEAD' });
    console.log('monsters page_size=1000 ->', res.status);
  } catch(e) {
    console.log('Error:', e.message);
  }
}
testMonsters();
