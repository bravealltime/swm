import { useState, useEffect, useCallback } from 'react';
import * as aegisLive from '../services/aegisLive';

/**
 * Real guild leaderboards: the shared snapshots from /api/guild-rankings plus whatever this
 * machine's AegisLink saw in-game (fresher, shown immediately). board(server, kind) → entry or null.
 */
export function useGuildRankings() {
  const [shared, setShared] = useState({ boards: [], error: '', loading: true });
  const [live, setLive] = useState(() => aegisLive.getState().rankings);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/guild-rankings', { cache: 'no-store' });
      const json = res.ok ? await res.json() : { boards: [], error: `HTTP ${res.status}` };
      setShared({ boards: json.boards || [], error: json.error || '', loading: false });
    } catch (err) {
      setShared({ boards: [], error: err.message, loading: false });
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const unsub = aegisLive.subscribe((type) => { if (type === 'rankings') setLive({ ...aegisLive.getState().rankings }); });
    // rankings may have arrived between the first render and this subscription
    setLive({ ...aegisLive.getState().rankings });
    return unsub;
  }, []);

  const board = useCallback((server, kind) => {
    const local = live[kind];
    const remote = shared.boards.find((b) => b.server === server && b.kind === kind);
    const remoteAt = remote ? new Date(remote.updatedAt).getTime() : 0;
    if (local && local.server === server && local.at >= remoteAt) return { rows: local.rows, at: local.at, source: 'live', shared: local.shared, error: local.error };
    if (remote) return { rows: remote.rows, at: remoteAt, source: 'shared', note: remote.note };
    return null;
  }, [live, shared.boards]);

  return { board, boards: shared.boards, live, loading: shared.loading, error: shared.error, refresh };
}
