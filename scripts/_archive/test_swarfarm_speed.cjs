async function test() {
  const t0 = Date.now();
  const res = await fetch('https://swarfarm.com/api/v2/skills/?page=1');
  const data = await res.json();
  console.log(`Fetched 100 skills in ${Date.now() - t0}ms`);
  console.log('Sample skill:', {
    name: data.results[0].name,
    description: data.results[0].description,
    multiplier: data.results[0].multiplier_formula,
    icon: data.results[0].icon_filename,
    scales: data.results[0].scales_with
  });
}
test().catch(console.error);
