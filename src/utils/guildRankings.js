// Guild ranking packets (siege / world guild battle) relayed by the AegisLink plugin, turned
// into plain rows the site can show and share. Shapes are matched by field name because
// Com2uS payloads differ between game versions.

export const SERVERS = [
  { id: 'asia', label: 'Asia' },
  { id: 'global', label: 'Global' },
  { id: 'europe', label: 'Europe' },
  { id: 'korea', label: 'Korea' },
  { id: 'japan', label: 'Japan' },
];

const EUROPE = new Set(['DE', 'FR', 'GB', 'UK', 'IT', 'ES', 'NL', 'BE', 'SE', 'NO', 'FI', 'DK', 'PL', 'CZ', 'AT', 'CH', 'PT', 'GR', 'HU', 'RO', 'IE', 'UA', 'RU', 'TR', 'BG', 'HR', 'RS', 'SK', 'SI', 'LT', 'LV', 'EE']);
const ASIA = new Set(['TH', 'VN', 'SG', 'MY', 'PH', 'ID', 'TW', 'HK', 'MO', 'IN', 'KH', 'LA', 'MM', 'BD', 'LK', 'NP', 'PK', 'MN', 'BN']);

/** Best guess of the game server from the account's country code. */
export function serverFromCountry(cc) {
  const c = String(cc || '').toUpperCase();
  if (c === 'KR') return 'korea';
  if (c === 'JP') return 'japan';
  if (EUROPE.has(c)) return 'europe';
  if (ASIA.has(c)) return 'asia';
  return 'global';
}

export function kindFromCommand(command) {
  if (/ServerGuildWar|GuildWar|WorldGuild/i.test(command)) return 'wgb';
  if (/Siege/i.test(command)) return 'siege';
  return 'guild';
}

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const asList = (v) => (Array.isArray(v) ? v : isObj(v) ? Object.values(v) : []);
const numField = (o, re) => { for (const [k, v] of Object.entries(o)) if (re.test(k) && typeof v === 'number') return v; return null; };
const strField = (o, re) => { for (const [k, v] of Object.entries(o)) if (re.test(k) && typeof v === 'string' && v) return v; return ''; };

function candidateLists(root, out = [], depth = 0) {
  if (!root || typeof root !== 'object' || depth > 5) return out;
  for (const value of Object.values(root)) {
    const list = asList(value);
    if (list.length >= 3 && list.every(isObj) && list.slice(0, 3).every((x) => strField(x, /guild_name|^name$/i) && (numField(x, /rank|point|score|rating/i) != null))) out.push(list);
    else if (value && typeof value === 'object') candidateLists(value, out, depth + 1);
  }
  return out;
}

/**
 * Rows from a ranking packet: [{ rank, name, guildId, points, rating, members }] sorted by rank.
 * Returns null when the packet holds no guild list.
 */
export function parseRankingPacket(command, resp) {
  if (!/Rank/i.test(command) || !resp) return null;
  const list = candidateLists(resp).sort((a, b) => b.length - a.length)[0];
  if (!list) return null;
  const rows = list.map((g, i) => ({
    rank: numField(g, /^rank$|ranking|guild_rank|^rank_no$/i) ?? i + 1,
    name: strField(g, /guild_name|^name$/i).slice(0, 40),
    guildId: g.guild_id ?? g.id ?? null,
    points: numField(g, /point|score/i) ?? 0,
    rating: numField(g, /rating/i),
    members: numField(g, /member/i),
    level: numField(g, /guild_level|^level$/i),
  })).filter((r) => r.name);
  rows.sort((a, b) => a.rank - b.rank || b.points - a.points);
  return rows.slice(0, 100).map((r, i) => ({ ...r, rank: r.rank || i + 1 }));
}
