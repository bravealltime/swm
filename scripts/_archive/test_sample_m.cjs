async function sampleMonster() {
  const res = await fetch('https://swarfarm.com/api/v2/monsters/?com2us_id=20831');
  const data = await res.json();
  const m = data.results[0];
  console.log({
    id: m.id,
    name: m.name,
    com2us_id: m.com2us_id,
    family_id: m.family_id,
    skills: m.skills,
    leader_skill: m.leader_skill
  });
}
sampleMonster();
