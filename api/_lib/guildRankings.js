// Shared guild leaderboards. Every contributor keeps their own snapshot per server+kind
// (row id "<server>:<kind>:<contributor uuid>"), so nobody can overwrite what someone else saw
// in-game; the board shown to everyone is chosen here from those snapshots.
import { supabaseRest, getSettings, saveSettings } from './admin.js';

export const SERVERS = new Set(['asia', 'global', 'europe', 'korea', 'japan']);
export const KINDS = new Set(['siege', 'wgb', 'guild']);

const MAX_AGE_MS = 30 * 24 * 3600 * 1000; // rankings older than a season are not shown
const AGREE_TOP = 10;
const AGREE_RATIO = 0.6;

export const snapshotId = (server, kind, contributor) => `${server}:${kind}:${contributor}`;

/**
 * Trusted / blocked contributor ids from site_settings (managed in the back-office).
 * getSettings() caches for 30s per function instance; pass fresh for the back-office so an
 * admin sees their own trust/block change right away whichever instance answers.
 */
export async function contributorLists({ fresh = false } = {}) {
  const s = await getSettings({ fresh });
  const g = s.guildRankings || {};
  return { trusted: new Set(g.trusted || []), blocked: new Set(g.blocked || []) };
}

export async function setContributorFlag(list, contributor, on, by) {
  const s = await getSettings({ fresh: true });
  const g = { trusted: [], blocked: [], ...(s.guildRankings || {}) };
  const set = new Set(g[list]);
  if (on) set.add(contributor); else set.delete(contributor);
  return saveSettings({ guildRankings: { ...g, [list]: [...set] } }, by);
}

const topNames = (rows) => [...rows].sort((a, b) => a.rank - b.rank).slice(0, AGREE_TOP).map((r) => String(r.name).toLowerCase());

/** Share of snapshot a's top guilds that also appear in snapshot b's top guilds. */
export function agreement(a, b) {
  const ta = topNames(a);
  if (!ta.length) return 0;
  const tb = new Set(topNames(b));
  return ta.filter((n) => tb.has(n)).length / ta.length;
}

/**
 * One board per server+kind from the contributors' snapshots:
 *   1. the newest snapshot from a trusted contributor, else
 *   2. the newest snapshot that at least one other contributor agrees with, else
 *   3. the newest snapshot, flagged unverified.
 * Blocked contributors and snapshots older than MAX_AGE_MS are ignored.
 */
export function pickBoards(snapshots, { trusted, blocked }, now = Date.now()) {
  const groups = new Map();
  for (const s of snapshots) {
    if (!s.contributor || blocked.has(s.contributor)) continue;
    if (now - new Date(s.updated_at).getTime() > MAX_AGE_MS) continue;
    if (!Array.isArray(s.rows) || s.rows.length < 3) continue;
    const key = `${s.server}:${s.kind}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }

  const boards = [];
  for (const subs of groups.values()) {
    subs.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    const agreeing = (s) => subs.filter((o) => o.contributor !== s.contributor && agreement(s.rows, o.rows) >= AGREE_RATIO).length;

    let pick = subs.find((s) => trusted.has(s.contributor));
    let verified = Boolean(pick);
    if (!pick) {
      pick = subs.find((s) => agreeing(s) > 0);
      verified = Boolean(pick);
    }
    if (!pick) pick = subs[0];

    boards.push({
      server: pick.server,
      kind: pick.kind,
      rows: pick.rows,
      updatedAt: pick.updated_at,
      note: pick.note,
      verified,
      sources: 1 + agreeing(pick),
      contributors: subs.length,
    });
  }
  return boards.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

const SNAPSHOT_FIELDS = 'id,server,kind,rows,updated_at,contributor,note';

export async function loadSnapshots(server) {
  const q = `?select=${SNAPSHOT_FIELDS}&order=updated_at.desc${server ? `&server=eq.${server}` : ''}&limit=500`;
  return supabaseRest('guild_rankings', { query: q });
}

export function saveSnapshot({ server, kind, rows, contributor, note }) {
  const row = { id: snapshotId(server, kind, contributor), server, kind, rows, updated_at: new Date().toISOString(), contributor, note };
  return supabaseRest('guild_rankings', { method: 'POST', body: row, query: '?on_conflict=id' });
}

export function deleteSnapshot(id) {
  return supabaseRest('guild_rankings', { method: 'DELETE', query: `?id=eq.${encodeURIComponent(id)}` });
}

/** Back-office listing: every snapshot, rows reduced to a count and the top 3 names. */
export async function adminSnapshots() {
  const [r, lists] = await Promise.all([loadSnapshots(), contributorLists({ fresh: true })]);
  if (!r.ok) return { ok: false, error: r.error };
  const snapshots = (r.data || []).map((s) => ({
    id: s.id,
    server: s.server,
    kind: s.kind,
    updatedAt: s.updated_at,
    contributor: s.contributor,
    note: s.note,
    rowCount: Array.isArray(s.rows) ? s.rows.length : 0,
    top: Array.isArray(s.rows) ? topNames(s.rows).slice(0, 3) : [],
    trusted: lists.trusted.has(s.contributor),
    blocked: lists.blocked.has(s.contributor),
  }));
  return { ok: true, snapshots, trusted: [...lists.trusted], blocked: [...lists.blocked], boards: pickBoards(r.data || [], lists).map(({ rows: _rows, ...b }) => b) };
}
