import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { resolveSkillId, peekRecord, expandRecord, loadMonsterSkills, subscribeShards } from '../data/monsterSkills';

const serverSnapshot = () => null;

/**
 * Skill record for a monster (same shape getMonsterSkills used to return synchronously).
 * null until the monster's shard has been fetched; the component re-renders when it lands.
 */
export function useMonsterSkills(monsterOrId) {
  const id = resolveSkillId(monsterOrId);
  const raw = useSyncExternalStore(subscribeShards, () => (id ? peekRecord(id) : null), serverSnapshot);
  useEffect(() => {
    if (id && !raw) loadMonsterSkills(id).catch(() => {});
  }, [id, raw]);
  return useMemo(() => (id && raw ? expandRecord(id, raw) : null), [id, raw]);
}
