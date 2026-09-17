import React, { useState, useMemo } from 'react';
import { Trophy, Users, BarChart3, Flame, Ban, Crown, Zap, Search, ChevronRight, Info } from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import allMonstersData from '../data/allMonsters.json';
import playersIndex from '../data/swrtPlayersIndex.json';
import guardianMeta from '../data/swrtGuardianMeta.json';
import { buildSwrtProfiles, buildMonsterIndex, flagFromCountry, SMALL_SAMPLE } from '../data/swrtPlayerAdapter';

const MONSTER_INDEX = buildMonsterIndex(allMonstersData);
const PROFILES = buildSwrtProfiles(playersIndex, allMonstersData).filter((p) => p.matchesRecorded > 0);
const META = playersIndex.meta || {};
const REPLAY_META = guardianMeta.meta || {};

const COUNTRY_NAMES = {
  TH: 'ไทย', KR: 'เกาหลี', JP: 'ญี่ปุ่น', CN: 'จีน', TW: 'ไต้หวัน', HK: 'ฮ่องกง', US: 'สหรัฐฯ', CA: 'แคนาดา',
  DE: 'เยอรมนี', FR: 'ฝรั่งเศส', GB: 'อังกฤษ', VN: 'เวียดนาม', ID: 'อินโดนีเซีย', MY: 'มาเลเซีย', SG: 'สิงคโปร์',
  PH: 'ฟิลิปปินส์', BR: 'บราซิล', RU: 'รัสเซีย', AU: 'ออสเตรเลีย', ES: 'สเปน', IT: 'อิตาลี', PL: 'โปแลนด์', NL: 'เนเธอร์แลนด์',
};

const pct = (n, d) => (d ? +((n / d) * 100).toFixed(1) : 0);
const monsterOf = (id) => MONSTER_INDEX.get(Number(id)) || { name: `#${id}`, thaiName: `#${id}`, element: 'fire', stars: 5 };

export default function GuardianView({ onNavigate, subItem }) {
  const [tab, setTab] = useState(subItem === 'guardian-meta' ? 'meta' : 'ladder');

  return (
    <div className="space-y-6 max-w-[1780px] 2xl:max-w-[1880px] mx-auto pb-16 animate-in fade-in duration-300">
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#1a0f2e] via-[#090e18] to-[#070b12] p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Guardian <span className="bg-gradient-to-r from-rose-400 to-amber-300 bg-clip-text text-transparent">จากรีเพลย์จริง</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
              อันดับผู้เล่นและเมต้าที่คำนวณจากรีเพลย์ Guardian สาธารณะของ SWRT {(META.replaysScanned || 0).toLocaleString()} แมตช์
              {REPLAY_META.firstReplay ? ` (${REPLAY_META.firstReplay.slice(0, 10)} ถึง ${REPLAY_META.lastReplay?.slice(0, 10)})` : ''}
              {META.fetchedAt ? ` • อัปเดต ${META.fetchedAt.slice(0, 10)}` : ''}
            </p>
          </div>
        </div>
      </div>

      <div role="tablist" className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-[#0a0f19]/80 border border-white/[0.08] shadow-lg">
        {[
          { id: 'ladder', label: 'อันดับผู้เล่น Guardian', icon: Users, color: 'bg-rose-600 shadow-rose-600/25' },
          { id: 'meta', label: 'เมต้ามอนสเตอร์ & คอมโบ', icon: BarChart3, color: 'bg-purple-600 shadow-purple-600/25' },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                active ? `${t.color} text-white shadow-lg` : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'ladder' ? <Ladder onNavigate={onNavigate} /> : <Meta />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 1: player ladder with country filter (Thailand first)

function Ladder({ onNavigate }) {
  const [country, setCountry] = useState('TH');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(50);

  const countries = useMemo(() => {
    const counts = new Map();
    for (const p of PROFILES) counts.set(p.country, (counts.get(p.country) || 0) + 1);
    const list = [...counts.entries()].filter(([c]) => c && c !== 'GL' && c !== 'NF').sort((a, b) => b[1] - a[1]);
    const th = list.find(([c]) => c === 'TH');
    return [['ALL', PROFILES.length], ...(th ? [th] : [['TH', 0]]), ...list.filter(([c]) => c !== 'TH').slice(0, 14)];
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROFILES
      .filter((p) => (country === 'ALL' || p.country === country) && (!q || p.name.toLowerCase().includes(q)))
      .sort((a, b) => b.score - a.score);
  }, [country, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 bg-[#0a0f19]/80 border border-white/[0.08] rounded-2xl p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {countries.map(([code, count]) => (
            <button
              key={code}
              onClick={() => { setCountry(code); setLimit(50); }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                country === code ? 'bg-rose-600 text-white' : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white'
              }`}
              title={COUNTRY_NAMES[code] || code}
            >
              <span>{code === 'ALL' ? '🌐' : flagFromCountry(code)}</span>
              <span>{code === 'ALL' ? 'ทุกประเทศ' : COUNTRY_NAMES[code] || code}</span>
              <span className="font-mono text-[11px] opacity-70">{count}</span>
            </button>
          ))}
        </div>
        <div className="relative lg:ml-auto lg:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อในอันดับ..."
            className="w-full bg-[#0d1422] border border-white/10 focus:border-rose-400 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-white/[0.06] bg-[#0a0f19]/80 text-slate-400 text-sm">
          ยังไม่พบผู้เล่นจาก{COUNTRY_NAMES[country] || country}ในรีเพลย์ Guardian ที่สแกน — ลองประเทศอื่นหรือรอรอบอัปเดตถัดไป
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-[#0a0f19]/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0c121c] text-slate-400 border-b border-white/[0.06]">
                <tr>
                  <th className="py-2.5 px-3 w-12">#</th>
                  <th className="py-2.5 px-3">ผู้เล่น</th>
                  <th className="py-2.5 px-3">แรงค์</th>
                  <th className="py-2.5 px-3 text-right">คะแนน</th>
                  <th className="py-2.5 px-3 text-right hidden sm:table-cell">อันดับโลก</th>
                  <th className="py-2.5 px-3 text-right">แมตช์ (W-L)</th>
                  <th className="py-2.5 px-3 hidden md:table-cell">มอนสเตอร์ที่ใช้บ่อย</th>
                  <th className="py-2.5 px-3 hidden lg:table-cell">พบล่าสุด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {rows.slice(0, limit).map((p, i) => (
                  <tr key={p.id} className="hover:bg-white/[0.03]">
                    <td className="py-2 px-3 font-mono text-slate-400">{i + 1}</td>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => onNavigate('player-tracker', { initialPlayer: p.name })}
                        className="font-bold text-white hover:text-rose-300 flex items-center gap-2 cursor-pointer text-left"
                      >
                        <span>{p.flag}</span>
                        <span className="truncate max-w-[180px]">{p.name}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded font-black text-[11px] bg-rose-500/15 text-rose-300 border border-rose-500/30">{p.rankBadge}</span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-amber-300">{p.score.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-300 hidden sm:table-cell">#{p.worldRank.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-mono">
                      <span className="text-emerald-400">{p.wins}W</span>
                      <span className="text-slate-500">-</span>
                      <span className="text-rose-400">{p.losses}L</span>
                      {p.matchesRecorded < SMALL_SAMPLE && <span className="ml-1 text-[10px] text-slate-500" title="ตัวอย่างน้อย">·น้อย</span>}
                    </td>
                    <td className="py-2 px-3 hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        {p.signatureMonsters.slice(0, 4).map((m) => (
                          <MonsterAvatar key={m.monsterId} monster={m} size="xs" showStars={false} />
                        ))}
                      </div>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-400 hidden lg:table-cell">{p.archetypeDescription.match(/พบล่าสุด ([^)]+)/)?.[1] || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > limit && (
            <button
              onClick={() => setLimit((l) => l + 50)}
              className="w-full py-3 text-xs font-bold text-rose-300 hover:text-white hover:bg-white/[0.03] border-t border-white/[0.06] cursor-pointer"
            >
              แสดงเพิ่ม (+50) • เหลืออีก {rows.length - limit} คน
            </button>
          )}
        </div>
      )}

      <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        คะแนน/อันดับโลกคือค่า ณ แมตช์ล่าสุดที่ผู้เล่นปรากฏในฟีด ไม่ใช่เรียลไทม์ • W-L นับเฉพาะแมตช์ที่อยู่ในรีเพลย์ที่สแกน
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: monster meta + duo/trio combos from the same replays

function Meta() {
  const [sort, setSort] = useState('picks'); // picks | winRate | bans | leaders | fp
  const [comboKind, setComboKind] = useState('duos');
  const [minPicks, setMinPicks] = useState(20);

  const sides = REPLAY_META.replaySides || 0;
  const replays = sides / 2;
  const fpWinRate = pct(REPLAY_META.firstPickWins || 0, REPLAY_META.firstPickSides || 0);

  const monsters = useMemo(() => {
    const rows = (guardianMeta.monsters || [])
      .filter((m) => m.picks >= minPicks)
      .map((m) => ({
        ...m,
        info: monsterOf(m.id),
        pickRate: pct(m.picks, sides),
        winRate: pct(m.wins, m.picks),
        banRate: pct(m.bans, replays),
        leaderRate: pct(m.leaders, m.picks),
        fpRate: pct(m.fpPicks, m.picks),
      }));
    const key = { picks: 'picks', winRate: 'winRate', bans: 'bans', leaders: 'leaderRate', fp: 'fpRate' }[sort];
    return rows.sort((a, b) => b[key] - a[key]).slice(0, 60);
  }, [sort, minPicks, sides, replays]);

  const combos = useMemo(() => {
    const list = comboKind === 'duos' ? guardianMeta.duos : guardianMeta.trios;
    return (list || []).map((c) => ({ ...c, winRate: pct(c.w, c.n), members: c.ids.map(monsterOf) }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 30);
  }, [comboKind]);

  if (!sides) {
    return (
      <div className="p-12 text-center rounded-2xl border border-white/[0.06] bg-[#0a0f19]/80 text-slate-400 text-sm">
        ยังไม่มีข้อมูลเมต้า — รัน <code className="font-mono text-slate-300">npm run players:fetch</code> เพื่อสร้าง
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'รีเพลย์ที่วิเคราะห์', value: replays.toLocaleString(), sub: 'Guardian เท่านั้น', icon: Flame, color: 'text-rose-400' },
          { label: 'First Pick ชนะ', value: `${fpWinRate}%`, sub: `จาก ${(REPLAY_META.firstPickSides || 0).toLocaleString()} ฝั่งที่เลือกก่อน`, icon: Zap, color: 'text-amber-400' },
          { label: 'มอนสเตอร์ที่ถูกใช้', value: (guardianMeta.monsters || []).length, sub: 'ตัวที่ปรากฏอย่างน้อย 1 ครั้ง', icon: Users, color: 'text-cyan-400' },
          { label: 'ช่วงเวลา', value: REPLAY_META.firstReplay?.slice(5, 10) + ' → ' + REPLAY_META.lastReplay?.slice(5, 10), sub: REPLAY_META.lastReplay?.slice(0, 4), icon: BarChart3, color: 'text-purple-400' },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="p-4 rounded-2xl bg-[#0a0f19]/80 border border-white/[0.08]">
              <div className="flex items-center gap-2 text-xs text-slate-400"><Icon className={`w-4 h-4 ${k.color}`} /> {k.label}</div>
              <div className="text-2xl font-black text-white font-mono mt-1">{k.value}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{k.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Monster table */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0a0f19]/80 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-white/[0.06]">
          <h2 className="text-sm font-bold text-white flex items-center gap-2"><Crown className="w-4 h-4 text-amber-400" /> สถิติรายมอนสเตอร์</h2>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 mr-1">เรียงตาม:</span>
            {[['picks', 'ถูกเลือก'], ['winRate', 'Win Rate'], ['bans', 'ถูกแบน'], ['leaders', 'เป็นลีดเดอร์'], ['fp', 'First Pick']].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setSort(id)}
                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${sort === id ? 'bg-purple-600 text-white' : 'bg-white/[0.04] text-slate-300 hover:text-white'}`}
              >
                {label}
              </button>
            ))}
            <label className="flex items-center gap-1.5 ml-2 text-slate-400">
              ขั้นต่ำ
              <select value={minPicks} onChange={(e) => setMinPicks(Number(e.target.value))} className="bg-[#0d1422] border border-white/10 rounded-lg px-2 py-1 text-slate-200">
                {[5, 20, 50, 100].map((n) => <option key={n} value={n}>{n} แมตช์</option>)}
              </select>
            </label>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0c121c] text-slate-400 border-b border-white/[0.06]">
              <tr>
                <th className="py-2.5 px-3 w-10">#</th>
                <th className="py-2.5 px-3">มอนสเตอร์</th>
                <th className="py-2.5 px-3 text-right">ถูกเลือก</th>
                <th className="py-2.5 px-3 text-right">Pick %</th>
                <th className="py-2.5 px-3 text-right">Win %</th>
                <th className="py-2.5 px-3 text-right hidden sm:table-cell">Ban %</th>
                <th className="py-2.5 px-3 text-right hidden md:table-cell">Leader %</th>
                <th className="py-2.5 px-3 text-right hidden md:table-cell">First Pick %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {monsters.map((m, i) => (
                <tr key={m.id} className="hover:bg-white/[0.03]">
                  <td className="py-1.5 px-3 font-mono text-slate-400">{i + 1}</td>
                  <td className="py-1.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <MonsterAvatar monster={m.info} size="xs" showStars={false} />
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">{m.info.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{m.info.thaiName !== m.info.name ? m.info.thaiName : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-300">{m.picks.toLocaleString()}</td>
                  <td className="py-1.5 px-3 text-right font-mono text-cyan-300">{m.pickRate}%</td>
                  <td className={`py-1.5 px-3 text-right font-mono font-bold ${m.winRate >= 52 ? 'text-emerald-400' : m.winRate < 48 ? 'text-rose-400' : 'text-slate-200'}`}>{m.winRate}%</td>
                  <td className="py-1.5 px-3 text-right font-mono text-rose-300 hidden sm:table-cell">{m.banRate}%</td>
                  <td className="py-1.5 px-3 text-right font-mono text-amber-300 hidden md:table-cell">{m.leaderRate}%</td>
                  <td className="py-1.5 px-3 text-right font-mono text-purple-300 hidden md:table-cell">{m.fpRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Combos */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0a0f19]/80 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-white/[0.06]">
          <h2 className="text-sm font-bold text-white flex items-center gap-2"><Ban className="w-4 h-4 text-purple-400 rotate-45" /> คอมโบที่ถูกดราฟต์ด้วยกันบ่อยที่สุด</h2>
          <div className="flex items-center gap-1.5 text-xs">
            {[['duos', 'คู่ (Duo)'], ['trios', 'สาม (Trio)']].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setComboKind(id)}
                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${comboKind === id ? 'bg-purple-600 text-white' : 'bg-white/[0.04] text-slate-300 hover:text-white'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 divide-y md:divide-y-0 divide-white/[0.04]">
          {combos.map((c, i) => (
            <div key={c.ids.join('-')} className="flex items-center gap-3 p-3 border-b border-white/[0.04]">
              <span className="font-mono text-slate-500 w-6 text-right">{i + 1}</span>
              <div className="flex items-center gap-1">
                {c.members.map((m) => <MonsterAvatar key={m.com2usId || m.name} monster={m} size="sm" showStars={false} />)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">{c.members.map((m) => m.name).join(' + ')}</div>
                <div className="text-[11px] text-slate-400 font-mono">{c.n} ครั้ง</div>
              </div>
              <div className={`text-sm font-black font-mono ${c.winRate >= 52 ? 'text-emerald-400' : c.winRate < 48 ? 'text-rose-400' : 'text-slate-200'}`}>{c.winRate}%</div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        Pick % = สัดส่วนฝั่งที่มีมอนสเตอร์ตัวนี้ในดราฟต์ 5 ตัว • Ban % = สัดส่วนแมตช์ที่ตัวนี้ถูกแบน • คอมโบแสดงเฉพาะที่ถูกดราฟต์ร่วมกัน ≥ 8 ครั้ง
      </p>
    </div>
  );
}
