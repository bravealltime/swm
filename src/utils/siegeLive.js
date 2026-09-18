// Turns the raw guild / siege packets relayed by the AegisLink plugin into the war-room state.
// Com2uS payload shapes vary between game versions, so everything here is found by field
// name (guild_id, base_number, win_lose, unit_master_id…) rather than by exact path.

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const asList = (v) => (Array.isArray(v) ? v : isObj(v) ? Object.values(v) : []);

/** Every array (or object-of-objects) inside `root` whose items satisfy `pred`. */
function findLists(root, pred, out = [], depth = 0, seen = new Set()) {
  if (!root || typeof root !== 'object' || depth > 6 || seen.has(root)) return out;
  seen.add(root);
  for (const value of Object.values(root)) {
    const list = asList(value);
    if (list.length && list.every(isObj) && pred(list[0])) out.push(list);
    else if (value && typeof value === 'object') findLists(value, pred, out, depth + 1, seen);
  }
  return out;
}

/** All unit_master_id values inside a value, in document order (a deck is 3). */
function masterIds(value, out = [], depth = 0) {
  if (!value || typeof value !== 'object' || depth > 5) return out;
  if (value.unit_master_id) out.push(Number(value.unit_master_id));
  for (const v of Object.values(value)) if (v && typeof v === 'object') masterIds(v, out, depth + 1);
  return out;
}

const numberField = (obj, re) => {
  for (const [k, v] of Object.entries(obj || {})) if (re.test(k) && typeof v === 'number') return v;
  return null;
};
const stringField = (obj, re) => {
  for (const [k, v] of Object.entries(obj || {})) if (re.test(k) && typeof v === 'string' && v) return v;
  return '';
};
const toMs = (t) => (typeof t === 'number' ? (t < 1e12 ? t * 1000 : t) : 0);

export function parseGuildInfo(packet) {
  const g = packet?.resp?.guild;
  if (!g) return null;
  const info = g.guild_info || {};
  const members = asList(g.guild_members).filter((m) => m && (m.wizard_name || m.wizard_id)).map((m) => ({
    id: String(m.wizard_id || m.wizard_name),
    name: m.wizard_name || `#${m.wizard_id}`,
    role: Number(m.grade) === 1 ? 'Leader' : Number(m.grade) === 2 ? 'Vice' : 'Member',
    lastLogin: toMs(m.last_login_timestamp),
  }));
  return { id: info.guild_id, name: info.name || '', level: info.level, members };
}

export function parseSiegeMatchup(packet, myGuildId) {
  const resp = packet?.resp;
  if (!resp) return null;
  const guilds = (findLists(resp, (x) => x.guild_id != null && (x.guild_name || x.name))[0] || []).map((g) => ({
    id: g.guild_id,
    name: g.guild_name || g.name,
    points: numberField(g, /point|score/i) ?? 0,
  }));
  const mine = myGuildId ?? resp.guild_id ?? resp.match_info?.guild_id ?? guilds[0]?.id;
  const colours = {};
  const others = ['red', 'yellow'];
  for (const g of guilds) colours[g.id] = String(g.id) === String(mine) ? 'blue' : others.shift() || 'yellow';
  const bases = (findLists(resp, (x) => x.base_number != null)[0] || []).map((b) => {
    const owner = b.guild_id ?? b.occupy_guild_id ?? b.hold_guild_id ?? b.owner_guild_id ?? null;
    const protectUntil = toMs(numberField(b, /protect|shield|invincible/i));
    return {
      number: Number(b.base_number),
      guildId: owner,
      colour: owner != null ? colours[owner] || 'yellow' : null,
      status: b.base_status ?? b.status ?? null,
      protectedUntil: protectUntil,
      remaining: numberField(b, /remain|alive|deck_count|defense_count/i),
    };
  });
  const match = resp.match_info || {};
  return {
    guilds: guilds.map((g) => ({ ...g, colour: colours[g.id] })),
    bases,
    matchId: match.match_id ?? null,
    matchStatus: match.match_status ?? null,
    startAt: toMs(match.siege_start_time ?? match.start_timestamp ?? 0),
    endAt: toMs(match.siege_end_time ?? match.end_timestamp ?? 0),
  };
}

/** Our own defense decks per base from GetGuildSiegeBaseDefenseUnitList(Preset). */
export function parseDefenseDecks(packet, nameOf) {
  const resp = packet?.resp;
  if (!resp) return {};
  const byBase = {};
  const decks = findLists(resp, (x) => x.base_number != null || x.pos_id != null || x.deck_id != null || x.unit_master_id != null);
  for (const list of decks) {
    for (const d of list) {
      const ids = masterIds(d).slice(0, 3);
      if (!ids.length) continue;
      const base = Number(d.base_number ?? packet.req?.base_number ?? 0);
      (byBase[base] ||= []).push({ ids, names: ids.map(nameOf), owner: stringField(d, /wizard_name/i) || '', pos: d.pos_id ?? d.deck_id ?? null });
    }
  }
  return byBase;
}

/** Battle log rows (from GetGuildSiegeBattleLog* or our own BattleGuildSiegeResult). */
export function parseBattleLogs(packet, nameOf) {
  const resp = packet?.resp;
  if (!resp) return [];
  const rows = findLists(resp, (x) => x.win_lose != null).flat();
  if (!rows.length && resp.win_lose != null) rows.push({ ...resp, base_number: packet.req?.base_number, _own: true });
  return rows.map((r, i) => {
    const attacker = stringField(r, /attack.*wizard.*name|attacker.*name|wizard_name/i) || (r._own ? 'คุณ' : '');
    const defender = stringField(r, /defen.*wizard.*name|defender.*name/i);
    const base = r.base_number ?? r.base_no ?? null;
    const at = toMs(numberField(r, /time|timestamp/i)) || packet.at || Date.now();
    const win = Number(r.win_lose) === 1;
    const attackIds = masterIds(r.attack_unit_list || r.attack_unit_info_list || r.unit_list || []).slice(0, 3);
    const defIds = masterIds(r.defense_unit_list || r.defense_unit_info_list || r.opp_unit_list || []).slice(0, 3);
    return {
      id: `live-${at}-${base}-${attacker}-${i}`,
      at,
      time: new Date(at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      type: win ? 'win' : 'loss',
      text: `${win ? '⚔️' : '💀'} ${attacker || 'สมาชิก'} ${win ? 'ชนะ' : 'แพ้'}${base != null ? ` ป้อม ${base}` : ''}${defender ? ` (ตั้งรับ: ${defender})` : ''}${attackIds.length ? ` ทีม ${attackIds.map(nameOf).join('/')}` : ''}${defIds.length ? ` vs ${defIds.map(nameOf).join('/')}` : ''}`,
    };
  });
}

/**
 * Merge live packets into the war-room state, keeping the user's manual notes / reservations.
 * `nameOf(masterId)` resolves monster names.
 */
export function applyLiveToWar(prev, guildLive, nameOf, myName) {
  const packets = guildLive?.packets || {};
  const commands = Object.entries(packets).sort((a, b) => b[1].at - a[1].at).map(([c, p]) => ({ command: c, at: p.at }));
  if (!commands.length) return prev;
  // first live merge: drop the demo seed (its decks, members, logs and scores are made up)
  const base = prev.live ? prev : {
    ...prev,
    bases: (prev.bases || []).map((b) => ({ ...b, defenses: [], remaining: null, max: null, status: 'active', protectedUntil: 0 })),
    members: [], logs: [], currentScore: { blue: 0, red: 0, yellow: 0 }, guildNames: {},
  };
  const war = { ...base, live: { at: commands[0].at, commands } };

  const info = parseGuildInfo(packets.GetGuildInfo);
  if (info) {
    if (info.name) war.guildName = info.name;
    if (info.members.length) {
      const before = new Map((base.members || []).map((m) => [m.name, m]));
      war.members = info.members.map((m) => ({ swordsLeft: 30, win: 0, loss: 0, ...(before.get(m.name) || {}), ...m }));
    }
  }
  if (myName) war.myPlayerName = myName;

  const matchup = parseSiegeMatchup(packets.GetGuildSiegeMatchupInfo, info?.id);
  if (matchup) {
    if (matchup.guilds.length) {
      const score = { ...base.currentScore };
      const names = {};
      for (const g of matchup.guilds) { score[g.colour] = g.points; names[g.colour] = g.name; }
      war.currentScore = score;
      war.guildNames = names;
    }
    if (matchup.bases.length) {
      const byNumber = new Map(matchup.bases.map((b) => [b.number, b]));
      war.bases = (base.bases || []).map((b) => {
        const lb = byNumber.get(b.id);
        if (!lb) return b;
        return {
          ...b,
          guild: lb.colour || b.guild,
          protectedUntil: lb.protectedUntil || 0,
          status: lb.protectedUntil > Date.now() ? 'protected' : b.status === 'protected' ? 'active' : b.status,
          remaining: lb.remaining ?? b.remaining,
          liveStatus: lb.status,
        };
      });
    }
    if (matchup.startAt || matchup.matchStatus != null) {
      war.round = `Siege #${matchup.matchId ?? '-'} • สถานะ ${matchup.matchStatus ?? '-'}${matchup.startAt ? ` • เริ่ม ${new Date(matchup.startAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}` : ''}`;
    }
  }

  const decks = { ...parseDefenseDecks(packets.GetGuildSiegeBaseDefenseUnitListPreset, nameOf), ...parseDefenseDecks(packets.GetGuildSiegeBaseDefenseUnitList, nameOf) };
  if (Object.keys(decks).length) {
    war.bases = (war.bases || []).map((b) => {
      const list = decks[b.id];
      if (!list?.length) return b;
      const before = new Map((b.defenses || []).map((d) => [d.monsters.join('|'), d]));
      return {
        ...b,
        defenses: list.map((d, i) => ({ id: `${b.id}-${i + 1}`, status: 'alive', attacker: null, attackedAt: null, ...(before.get(d.names.join('|')) || {}), monsters: d.names, owner: d.owner })),
        remaining: list.length,
        max: list.length,
      };
    });
  }

  const liveLogs = [];
  for (const key of Object.keys(packets)) if (/BattleLog/.test(key)) liveLogs.push(...parseBattleLogs(packets[key], nameOf));
  for (const b of guildLive?.battles || []) if (/BattleGuildSiegeResult|BattleServerGuildWar/.test(b.command)) liveLogs.push(...parseBattleLogs(b, nameOf));
  if (liveLogs.length) {
    const seen = new Set((base.logs || []).map((l) => l.id));
    const fresh = liveLogs.filter((l) => !seen.has(l.id)).sort((a, b) => b.at - a.at);
    war.logs = [...fresh, ...(base.logs || [])].slice(0, 80);
  }
  return war;
}
