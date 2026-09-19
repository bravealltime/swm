// Separate from vite.config.js on purpose: the app config starts the dev middleware and the
// skill-shard generator, neither of which a unit test run needs — except that src/data/monsterSkills.js
// imports the generated monsterSkillsIndex.json (gitignored), so a fresh checkout (CI) builds the
// shards once before the tests import it.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{js,mjs}'],
    globalSetup: ['./tests/setup/ensureSkillShards.mjs'],
  },
});
