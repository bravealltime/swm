import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Swords, 
  Search, 
  Sparkles, 
  ArrowRight, 
  Plus, 
  X, 
  Filter, 
  Trophy, 
  TrendingUp, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import MonsterAvatar from './MonsterAvatar';
import guardianMeta from '../data/swrtGuardianMeta.json';
import allMonstersData from '../data/allMonsters.json';
import { buildMonsterIndex } from '../data/swrtPlayerAdapter';
import { loadBox } from '../utils/boxStorage';

const MONSTER_INDEX = buildMonsterIndex(allMonstersData);
const monsterOf = (id) => MONSTER_INDEX.get(Number(id)) || {
  id: `m-${id}`,
  com2usId: String(id),
  name: `#${id}`,
  thaiName: `#${id}`,
  element: 'wind',
  stars: 5,
  avatarUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png'
};

export default function RtaCoreFinder({ onNavigate }) {
  // Selected monsters for core (Slot 1 and Slot 2)
  const [slot1, setSlot1] = useState(null); // monsterId
  const [slot2, setSlot2] = useState(null); // monsterId
  const [searchPickerSlot, setSearchPickerSlot] = useState(null); // 1 or 2 when picker modal/tray is open
  const [pickerSearch, setPickerSearch] = useState('');
  const [minMatches, setMinMatches] = useState(10);
  const [sortBy, setSortBy] = useState('winRate'); // 'winRate' | 'matches' | 'synergyDelta'
  const [onlyOwned, setOnlyOwned] = useState(false);

  // Load user box to check ownership
  const ownedIds = useMemo(() => {
    try {
      const box = loadBox();
      if (!box || !box.units) return new Set();
      const s = new Set();
      for (const u of box.units) {
        if (u.com2usId) s.add(Number(u.com2usId));
        if (u.masterId) s.add(Number(u.masterId));
        if (u.unit_master_id) s.add(Number(u.unit_master_id));
      }
      return s;
    } catch {
      return new Set();
    }
  }, []);

  // Quick lookup maps for solo stats
  const soloMap = useMemo(() => {
    const map = new Map();
    for (const m of guardianMeta.monsters || []) {
      const winRate = m.picks ? (m.wins / m.picks) * 100 : 50;
      const fpWinRate = m.fpPicks ? (m.fpWins / m.fpPicks) * 100 : null;
      const spPicks = m.picks - (m.fpPicks || 0);
      const spWins = m.wins - (m.fpWins || 0);
      const spWinRate = spPicks > 0 ? (spWins / spPicks) * 100 : null;
      map.set(m.id, {
        ...m,
        winRate,
        fpWinRate,
        spWinRate,
        firstPickRate: m.picks ? ((m.fpPicks || 0) / m.picks) * 100 : 0
      });
    }
    return map;
  }, []);

  // Popular core candidates for picker
  const metaCandidates = useMemo(() => {
    return (guardianMeta.monsters || [])
      .filter(m => m.picks >= 10)
      .map(m => {
        const mon = monsterOf(m.id);
        const solo = soloMap.get(m.id);
        return {
          ...mon,
          metaId: m.id,
          picks: m.picks,
          winRate: solo?.winRate || 50
        };
      })
      .sort((a, b) => b.picks - a.picks);
  }, [soloMap]);

  // Filtered picker list
  const filteredPickerList = useMemo(() => {
    if (!pickerSearch.trim()) return metaCandidates;
    const q = pickerSearch.toLowerCase().trim();
    return metaCandidates.filter(m => 
      (m.name || '').toLowerCase().includes(q) || 
      (m.thaiName || '').toLowerCase().includes(q) ||
      (m.element || '').toLowerCase().includes(q)
    );
  }, [metaCandidates, pickerSearch]);

  // Duo stats if both slot1 and slot2 are selected
  const directDuoStats = useMemo(() => {
    if (!slot1 || !slot2) return null;
    const pair = guardianMeta.duos?.find(d => 
      d.ids.includes(slot1) && d.ids.includes(slot2)
    );
    if (!pair) return null;
    const winRate = pair.n ? (pair.w / pair.n) * 100 : 0;
    const s1Solo = soloMap.get(slot1)?.winRate || 50;
    const s2Solo = soloMap.get(slot2)?.winRate || 50;
    const avgSolo = (s1Solo + s2Solo) / 2;
    const synergyDelta = winRate - avgSolo;
    return {
      matches: pair.n,
      wins: pair.w,
      winRate,
      synergyDelta
    };
  }, [slot1, slot2, soloMap]);

  // Recommended next picks
  const recommendations = useMemo(() => {
    if (!slot1 && !slot2) return [];

    // Case 1: Both Slot 1 & Slot 2 selected -> Find best 3rd picks from Trios
    if (slot1 && slot2) {
      const matchingTrios = (guardianMeta.trios || []).filter(t => 
        t.ids.includes(slot1) && t.ids.includes(slot2)
      );

      const list = matchingTrios.map(t => {
        const thirdId = t.ids.find(id => id !== slot1 && id !== slot2);
        const thirdMon = monsterOf(thirdId);
        const winRate = t.n ? (t.w / t.n) * 100 : 0;
        const thirdSolo = soloMap.get(thirdId)?.winRate || 50;
        const avgSolo = ((soloMap.get(slot1)?.winRate || 50) + (soloMap.get(slot2)?.winRate || 50) + thirdSolo) / 3;
        const synergyDelta = winRate - avgSolo;

        return {
          id: thirdId,
          monster: thirdMon,
          matches: t.n,
          wins: t.w,
          winRate,
          synergyDelta,
          trioIds: t.ids,
          isOwned: ownedIds.has(thirdId)
        };
      });

      let res = list.filter(r => r.matches >= minMatches);
      if (onlyOwned) res = res.filter(r => r.isOwned);

      if (sortBy === 'winRate') res.sort((a, b) => b.winRate - a.winRate);
      else if (sortBy === 'matches') res.sort((a, b) => b.matches - a.matches);
      else if (sortBy === 'synergyDelta') res.sort((a, b) => b.synergyDelta - a.synergyDelta);

      return res;
    }

    // Case 2: Only 1 slot selected -> Find best partners from Duos
    const targetId = slot1 || slot2;
    const targetSolo = soloMap.get(targetId)?.winRate || 50;

    const matchingDuos = (guardianMeta.duos || []).filter(d => d.ids.includes(targetId));

    const list = matchingDuos.map(d => {
      const partnerId = d.ids.find(id => id !== targetId);
      const partnerMon = monsterOf(partnerId);
      const winRate = d.n ? (d.w / d.n) * 100 : 0;
      const partnerSolo = soloMap.get(partnerId)?.winRate || 50;
      const avgSolo = (targetSolo + partnerSolo) / 2;
      const synergyDelta = winRate - avgSolo;

      return {
        id: partnerId,
        monster: partnerMon,
        matches: d.n,
        wins: d.w,
        winRate,
        synergyDelta,
        trioIds: null,
        isOwned: ownedIds.has(partnerId)
      };
    });

    let res = list.filter(r => r.matches >= minMatches);
    if (onlyOwned) res = res.filter(r => r.isOwned);

    if (sortBy === 'winRate') res.sort((a, b) => b.winRate - a.winRate);
    else if (sortBy === 'matches') res.sort((a, b) => b.matches - a.matches);
    else if (sortBy === 'synergyDelta') res.sort((a, b) => b.synergyDelta - a.synergyDelta);

    return res;
  }, [slot1, slot2, soloMap, minMatches, onlyOwned, sortBy, ownedIds]);

  // Popular Presets
  const popularCores = [
    { name: 'Oliver + Cheongpung', id1: 16811, id2: 25313, desc: 'Control & ATB Pushback' },
    { name: 'Chandra + Sagar', id1: 15713, id2: 15715, desc: 'Defensive Hug & Disrupt' },
    { name: 'Moore + Robo', id1: 18611, id2: 33312, desc: 'Speed Contest & Strip' },
    { name: 'Vanessa + Sonia', id1: 13812, id2: 35913, desc: 'Speed Lead & Assassinate' }
  ];

  const handleSendToDraft = () => {
    if (!onNavigate) return;
    onNavigate('draft-explorer');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-r from-[#170e2b] via-[#0d1424] to-[#070b12] p-5 sm:p-7 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-mono mb-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>LUCKSAK-INSPIRED DRAFT ENGINE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>🎯 RTA Core Finder Pro</span>
              <span className="text-xs font-mono font-normal text-slate-400 border border-white/10 px-2 py-0.5 rounded-lg bg-black/40">
                Guardian Meta
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              เลือกมอนสเตอร์ Core 1-2 ตัวแรกที่คุณหยิบในห้องดราฟต์ ระบบจะวิเคราะห์สถิติจากรีเพลย์การ์เดียนกว่า <strong>{guardianMeta.meta?.replaysScanned?.toLocaleString() || '3,000'}</strong> แมตช์ เพื่อแนะนำตัวถัดไปที่มี <strong>อัตราการชนะ (Win Rate)</strong> และ <strong>ความเข้าขา (Synergy Delta)</strong> สูงที่สุด
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => { setSlot1(null); setSlot2(null); }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#141b2d] border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-all cursor-pointer"
            >
              ล้างตัวเลือก
            </button>
            <button
              onClick={handleSendToDraft}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>ส่งไปจำลองดราฟต์ 5v5</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Preset Cores */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 font-bold flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5 text-amber-400" /> คอมโบยอดนิยม:
        </span>
        {popularCores.map((c, i) => (
          <button
            key={i}
            onClick={() => { setSlot1(c.id1); setSlot2(c.id2); }}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
              slot1 === c.id1 && slot2 === c.id2
                ? 'bg-purple-600/30 border-purple-400 text-white font-bold shadow-md shadow-purple-500/20'
                : 'bg-[#0f172a] border-white/10 text-slate-300 hover:text-white hover:border-white/25'
            }`}
          >
            <span>{c.name}</span>
            <span className="text-[10px] text-slate-400 font-mono">({c.desc})</span>
          </button>
        ))}
      </div>

      {/* Main Core Selector Slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Slot 1 */}
        <div className="bg-[#0b101d] border border-white/10 rounded-2xl p-4 sm:p-5 relative shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-[11px] font-mono font-black text-cyan-300">1</span>
              <span>มอนสเตอร์ Core ตัวที่ 1</span>
            </span>
            {slot1 && (
              <button
                onClick={() => setSlot1(null)}
                className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> ลบ
              </button>
            )}
          </div>

          {slot1 ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#101726] border border-cyan-500/30">
              <div className="flex items-center gap-3">
                <MonsterAvatar monster={monsterOf(slot1)} size="md" />
                <div>
                  <div className="font-extrabold text-white text-sm sm:text-base">
                    {monsterOf(slot1).thaiName || monsterOf(slot1).name}
                  </div>
                  <div className="text-xs text-slate-400">
                    {monsterOf(slot1).name} • {monsterOf(slot1).element}
                  </div>
                  <div className="text-[11px] font-mono text-cyan-300 mt-0.5">
                    Solo WR: <strong>{soloMap.get(slot1)?.winRate.toFixed(1)}%</strong>
                    {' • '}
                    {soloMap.get(slot1)?.picks} เกม
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSearchPickerSlot(1)}
                className="px-2.5 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 cursor-pointer"
              >
                เปลี่ยน
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchPickerSlot(1)}
              className="w-full h-24 rounded-xl border border-dashed border-cyan-500/40 bg-cyan-950/10 hover:bg-cyan-950/20 flex flex-col items-center justify-center gap-1.5 text-cyan-300 transition-all cursor-pointer group"
            >
              <Plus className="w-6 h-6 group-hover:scale-125 transition-transform" />
              <span className="text-xs font-bold">+ คลิกเลือกมอนสเตอร์ Core ตัวแรก</span>
            </button>
          )}
        </div>

        {/* Slot 2 */}
        <div className="bg-[#0b101d] border border-white/10 rounded-2xl p-4 sm:p-5 relative shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-[11px] font-mono font-black text-purple-300">2</span>
              <span>มอนสเตอร์ Core ตัวที่ 2 (ตัวเลือกเสริม)</span>
            </span>
            {slot2 && (
              <button
                onClick={() => setSlot2(null)}
                className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> ลบ
              </button>
            )}
          </div>

          {slot2 ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#101726] border border-purple-500/30">
              <div className="flex items-center gap-3">
                <MonsterAvatar monster={monsterOf(slot2)} size="md" />
                <div>
                  <div className="font-extrabold text-white text-sm sm:text-base">
                    {monsterOf(slot2).thaiName || monsterOf(slot2).name}
                  </div>
                  <div className="text-xs text-slate-400">
                    {monsterOf(slot2).name} • {monsterOf(slot2).element}
                  </div>
                  <div className="text-[11px] font-mono text-purple-300 mt-0.5">
                    Solo WR: <strong>{soloMap.get(slot2)?.winRate.toFixed(1)}%</strong>
                    {' • '}
                    {soloMap.get(slot2)?.picks} เกม
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSearchPickerSlot(2)}
                className="px-2.5 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 cursor-pointer"
              >
                เปลี่ยน
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchPickerSlot(2)}
              className="w-full h-24 rounded-xl border border-dashed border-purple-500/40 bg-purple-950/10 hover:bg-purple-950/20 flex flex-col items-center justify-center gap-1.5 text-purple-300 transition-all cursor-pointer group"
            >
              <Plus className="w-6 h-6 group-hover:scale-125 transition-transform" />
              <span className="text-xs font-bold">+ คลิกเลือกมอนสเตอร์ Core ตัวที่สอง (ไม่บังคับ)</span>
            </button>
          )}
        </div>
      </div>

      {/* Direct Duo Synergy Card (If both are chosen) */}
      {slot1 && slot2 && (
        <div className="rounded-2xl border border-purple-500/40 bg-gradient-to-r from-[#170e2b] via-[#101628] to-[#0c121f] p-4 sm:p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center -space-x-2">
                <MonsterAvatar monster={monsterOf(slot1)} size="sm" />
                <MonsterAvatar monster={monsterOf(slot2)} size="sm" />
              </div>
              <div>
                <div className="text-xs text-purple-300 font-mono font-bold uppercase tracking-wider">
                  🔥 Duo Synergy Score
                </div>
                <div className="text-sm sm:text-base font-extrabold text-white">
                  {monsterOf(slot1).name} + {monsterOf(slot2).name}
                </div>
              </div>
            </div>

            {directDuoStats ? (
              <div className="flex items-center gap-3 sm:gap-6 font-mono">
                <div className="text-center">
                  <div className="text-[10px] text-slate-400">แมตช์ที่จับคู่</div>
                  <div className="text-sm font-bold text-white">{directDuoStats.matches} แมตช์</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-400">อัตราชนะคู่หู</div>
                  <div className={`text-base font-black ${directDuoStats.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {directDuoStats.winRate.toFixed(1)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-400">Synergy Delta</div>
                  <div className={`text-sm font-black ${directDuoStats.synergyDelta >= 0 ? 'text-cyan-400' : 'text-slate-400'}`}>
                    {directDuoStats.synergyDelta >= 0 ? `+${directDuoStats.synergyDelta.toFixed(1)}%` : `${directDuoStats.synergyDelta.toFixed(1)}%`}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">
                ยังไม่มีการบันทึกคู่นี้เจอกันเกินเกณฑ์ใน Guardian Replay ชุดปัจจุบัน
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter / Sort Bar for Recommendations */}
      {(slot1 || slot2) && (
        <div className="bg-[#101724] p-4 rounded-2xl border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>
                {slot1 && slot2 ? 'ตัวเลือกที่ 3 แนะนำ (Top 3rd Picks จาก Trios)' : 'คู่หูแนะนำที่ดีที่สุด (Top Recommended Partners)'}
              </span>
            </h3>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
              พบ {recommendations.length} ตัวเลือก
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Ownership Filter */}
            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyOwned}
                onChange={(e) => setOnlyOwned(e.target.checked)}
                className="rounded border-slate-700 text-blue-600 focus:ring-0 bg-[#0a0f19]"
              />
              <span className="font-semibold">เฉพาะตัวที่มีในกล่อง ({ownedIds.size > 0 ? 'ตรวจพบกล่อง' : 'ไม่มีกล่อง'})</span>
            </label>

            {/* Min Matches Filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400">ขั้นต่ำ:</span>
              {[5, 10, 20].map((m) => (
                <button
                  key={m}
                  onClick={() => setMinMatches(m)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                    minMatches === m ? 'bg-blue-600 text-white font-bold' : 'bg-[#0c121c] text-slate-400 hover:text-white'
                  }`}
                >
                  {m}+ เกม
                </button>
              ))}
            </div>

            {/* Sort Buttons */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400">เรียงตาม:</span>
              {[
                { id: 'winRate', label: 'Win Rate %' },
                { id: 'matches', label: 'จำนวนเกม' },
                { id: 'synergyDelta', label: 'Synergy Delta' }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setSortBy(s.id)}
                  className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-all ${
                    sortBy === s.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-[#0c121c] text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Cards Grid */}
      {(slot1 || slot2) ? (
        recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendations.map((rec, idx) => {
              const isTopPick = idx === 0;
              return (
                <div 
                  key={rec.id}
                  className={`p-4 rounded-2xl border transition-all hover:scale-[1.01] flex flex-col justify-between ${
                    isTopPick
                      ? 'bg-gradient-to-b from-[#131d33] to-[#0a101d] border-amber-500/50 shadow-lg shadow-amber-500/10'
                      : 'bg-[#0b101d] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <MonsterAvatar monster={rec.monster} size="md" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-sm">
                              {rec.monster.thaiName || rec.monster.name}
                            </span>
                            {isTopPick && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                👑 แนะนำอันดับ 1
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">
                            {rec.monster.name} ({rec.monster.element})
                          </div>
                        </div>
                      </div>

                      {/* Ownership Badge */}
                      {ownedIds.size > 0 && (
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          rec.isOwned 
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30' 
                            : 'bg-slate-900 text-slate-500 border-white/5'
                        }`}>
                          {rec.isOwned ? 'มีในกล่อง ✅' : 'ยังไม่มี ❌'}
                        </span>
                      )}
                    </div>

                    {/* Stats Strip */}
                    <div className="grid grid-cols-3 gap-1.5 py-2 px-2.5 rounded-xl bg-[#080d16] border border-white/5 font-mono text-center">
                      <div>
                        <div className="text-[10px] text-slate-400">WIN RATE</div>
                        <div className={`text-sm font-black ${rec.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {rec.winRate.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">DELTA</div>
                        <div className={`text-sm font-black ${rec.synergyDelta >= 0 ? 'text-cyan-400' : 'text-slate-400'}`}>
                          {rec.synergyDelta >= 0 ? `+${rec.synergyDelta.toFixed(1)}%` : `${rec.synergyDelta.toFixed(1)}%`}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">GAMES</div>
                        <div className="text-sm font-bold text-slate-200">
                          {rec.matches}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {slot1 && slot2 ? 'เติมเป็นตัวที่ 3' : 'เลือกเป็น Core ตัวที่ 2'}
                    </span>
                    {!slot2 && (
                      <button
                        onClick={() => setSlot2(rec.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/30 transition-all cursor-pointer"
                      >
                        + ใส่ Slot 2
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl bg-[#0b101d] border border-white/10 text-slate-400 space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <div className="font-bold text-white text-sm">ไม่พบมอนสเตอร์ที่ตรงกับเกณฑ์ตัวกรอง</div>
            <p className="text-xs text-slate-400">
              ลองลดเกณฑ์ขั้นต่ำจำนวนเกม (Min Matches) หรือปิดตัวกรอง "เฉพาะตัวที่มีในกล่อง"
            </p>
          </div>
        )
      ) : (
        <div className="p-12 text-center rounded-3xl bg-[#0a0f19] border border-white/10 text-slate-400 space-y-3">
          <Sparkles className="w-10 h-10 text-purple-400 mx-auto animate-pulse" />
          <div className="font-extrabold text-white text-base">เริ่มต้นใช้งาน RTA Core Finder</div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            คลิกเลือกมอนสเตอร์ Core 1 ตัวขึ้นไปที่ด้านบน หรือกดเลือกคอมโบยอดนิยม เพื่อดูสถิติและมอนสเตอร์คู่หูที่แนะนำทันที
          </p>
        </div>
      )}

      {/* Monster Picker Modal / Tray */}
      {searchPickerSlot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#0c121f] border border-purple-500/30 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>เลือกมอนสเตอร์สำหรับ Slot {searchPickerSlot}</span>
              </h3>
              <button
                onClick={() => { setSearchPickerSlot(null); setPickerSearch(''); }}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="พิมพ์ชื่อมอนสเตอร์ (เช่น Oliver, Cheongpung, Moore, ชิโหว)..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                className="w-full bg-[#080d16] border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 space-y-1.5 pr-1 no-scrollbar">
              {filteredPickerList.map((m) => {
                const isSelected = slot1 === m.metaId || slot2 === m.metaId;
                return (
                  <div
                    key={m.metaId}
                    onClick={() => {
                      if (searchPickerSlot === 1) setSlot1(m.metaId);
                      else setSlot2(m.metaId);
                      setSearchPickerSlot(null);
                      setPickerSearch('');
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-950/40 border border-purple-500/40 opacity-50'
                        : 'bg-[#101726] border border-white/5 hover:border-purple-500/40 hover:bg-[#151f33]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <MonsterAvatar monster={m} size="sm" />
                      <div>
                        <div className="font-bold text-white text-xs sm:text-sm">
                          {m.thaiName || m.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {m.name} ({m.element})
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono text-xs">
                      <div className="text-white font-bold">{m.picks} เกม</div>
                      <div className={m.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}>
                        {m.winRate.toFixed(1)}% WR
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
