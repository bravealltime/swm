import { describe, it, expect } from 'vitest';
import { analyzeRtaDraft } from '../src/utils/draftAdvisorEngine';
import { evaluateArtifactRolls, scanGodTierArtifacts } from '../src/utils/artifactEvaluator';
import { exportAccountMilestoneCard } from '../src/utils/cardExporter';

describe('Realtime RTA Draft Advisor Engine (draftAdvisorEngine.js)', () => {
  it('correctly recommends hard counters against enemy picks', () => {
    const blueTeam = [null, null, null, null, null];
    const redTeam = [
      { name: 'Oliver', thaiName: 'โอลิเวอร์', element: 'wind' },
      { name: 'Sonia', thaiName: 'โซเนีย', element: 'wind' },
      null,
      null,
      null,
    ];

    const res = analyzeRtaDraft(blueTeam, redTeam);

    expect(res.topBanTarget).toBeDefined();
    expect(res.topBanTarget.name).toBe('Oliver');
    expect(res.topBanTarget.score).toBeGreaterThanOrEqual(95);

    expect(res.counterRecommendations.length).toBeGreaterThan(0);
    const counterNames = res.counterRecommendations.map((c) => c.monster.name);
    // Against Oliver -> Juno, Haegang, Douglas
    expect(counterNames).toContain('Juno');
    expect(counterNames).toContain('Haegang');
    // Against Sonia -> Chandra, Byungchul, Camilla, Leo
    expect(counterNames).toContain('Chandra');
  });

  it('correctly suggests synergy partners when blue team picks core monsters', () => {
    const blueTeam = [
      { name: 'Oliver', thaiName: 'โอลิเวอร์', element: 'wind' },
      null,
      null,
      null,
      null,
    ];
    const redTeam = [null, null, null, null, null];

    const res = analyzeRtaDraft(blueTeam, redTeam);
    expect(res.synergyRecommendations.length).toBeGreaterThan(0);

    const synergyNames = res.synergyRecommendations.map((s) => s.monster.name);
    expect(synergyNames).toContain('Cheongpung');
  });
});

describe('Artifact Roll Quality Evaluator (artifactEvaluator.js)', () => {
  it('evaluates God-Tier for 18%+ Added Damage by SPD', () => {
    const mockArtifact = {
      id: 1,
      slot: 1,
      element: 'fire',
      subs: [
        [207, 19], // Added Damage by SPD +19% -> GOD Tier!
        [204, 8],  // Added Damage by HP +8%
      ],
    };

    const ownedUnits = [
      { id: 101, name: 'Juno', element: 'fire', info: { name: 'Juno', thaiName: 'จูโน่' } },
      { id: 102, name: 'Moore', element: 'water', info: { name: 'Moore', thaiName: 'มัวร์' } },
    ];

    const evaluated = evaluateArtifactRolls(mockArtifact, ownedUnits);
    expect(evaluated.rollTier).toBe('GOD');
    expect(evaluated.score).toBeGreaterThanOrEqual(75);
    expect(evaluated.highRolls.length).toBe(1);
    expect(evaluated.highRolls[0].tier).toBe('GOD');

    // Matches Juno (fire element matches artifact element)
    expect(evaluated.matchedOwnedWearers.some((m) => m.name === 'Juno')).toBe(true);
  });

  it('scanGodTierArtifacts filters only GOD and LEGEND artifacts', () => {
    const artifacts = [
      { id: 1, subs: [[207, 19]] }, // GOD
      { id: 2, subs: [[208, 12], [204, 12]] }, // LEGEND
      { id: 3, subs: [[207, 4]] }, // STANDARD
    ];

    const res = scanGodTierArtifacts(artifacts);
    expect(res.length).toBe(2);
    expect(res.map((a) => a.id)).toEqual([1, 2]);
  });
});

describe('Card Exporter Functions', () => {
  it('has exportAccountMilestoneCard defined as an async function', () => {
    expect(typeof exportAccountMilestoneCard).toBe('function');
  });
});
