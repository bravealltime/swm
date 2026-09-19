async function countMonsters() {
  const res = await fetch('https://swarfarm.com/api/v2/monsters/?page_size=1000');
  const data = await res.json();
  console.log('Total monsters count in swarfarm:', data.count);
}
countMonsters();
