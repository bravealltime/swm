// vitest globalSetup: make sure the generated skill index/shards exist before any test imports
// src/data/monsterSkills.js (CI starts from a clean checkout where they are not committed).
import { buildSkillShards } from '../../scripts/build_skill_shards.mjs';

export default function ensureSkillShards() {
  const result = buildSkillShards({ root: process.cwd() });
  if (!result.skipped) console.log(`[tests] built skill shards for ${result.monsters} monsters`);
}
