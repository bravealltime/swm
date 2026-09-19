import React, { useState, useMemo } from 'react';
import { 
  Swords, 
  Shield, 
  Sparkles, 
  Zap, 
  Clock, 
  Crown, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Search, 
  Filter,
  ArrowRight,
  Info
} from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import { matchArenaTeams } from '../utils/arenaMatcher';
import { loadBox } from '../utils/swexImport';

export default function ArenaMetaView({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('ao'); // 'ao' | 'ad' | 'mybox'
  const [selectedArchetype, setSelectedArchetype] = useState('all');
  const [copiedTeamId, setCopiedTeamId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const userBox = useMemo(() => loadBox(), []);
  const arenaData = useMemo(() => matchArenaTeams(userBox), [userBox]);

  const { offense, defense, summary } = arenaData;

  // Active list based on tab
  const rawList = useMemo(() => {
    if (activeTab === 'ao') return offense;
    if (activeTab === 'ad') return defense;
    if (activeTab === 'mybox') {
      return [...offense.filter(t => t.isComplete), ...defense.filter(t => t.isComplete)];
    }
    return offense;
  }, [activeTab, offense, defense]);

  // Filter by archetype and search query
  const filteredList = useMemo(() => {
    return rawList.filter((team) => {
      if (selectedArchetype !== 'all' && team.archetype !== selectedArchetype) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = team.name?.toLowerCase().includes(q) || team.nameTh?.toLowerCase().includes(q);
        const matchMonster = team.slots.some(m => m.name.toLowerCase().includes(q) || (m.thaiName && m.thaiName.toLowerCase().includes(q)));
        return matchName || matchMonster;
      }
      return true;
    });
  }, [rawList, selectedArchetype, searchQuery]);

  // Copy team details
  const handleCopyTeam = (team) => {
    const text = `⚔️ [SWM Arena] ${team.nameTh} (${team.name})\nสมาชิก: ${team.slots.map(s => s.name).join(' + ')}\nลีดเดอร์: ${team.leader}\nรูน: ${team.runeGuidance || team.runeBuilds}`;
    navigator.clipboard.writeText(text);
    setCopiedTeamId(team.id);
    setTimeout(() => setCopiedTeamId(null), 2500);
  };

  return (
    <div className="space-y-6 max-w-[1780px] 2xl:max-w-[1880px] mx-auto pb-16 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#0c1424] via-[#0d172e] to-[#070b12] p-6 sm:p-8 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-bold uppercase">
            <Swords className="w-3.5 h-3.5" />
            <span>Summoners War Arena • 4v4 Tactical Comps</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            สูตรทีมบุก & ตั้งรับอารีน่า (Arena Offense & Defense)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            รวมสูตรทีมบุกปิดแมตช์เร็วช่วง Rush Hour (15-25 วินาที) และทีมตั้งรับดักทางสปีด 33% / ถ่วงเวลาป้องกันแต้มลด พร้อมวิเคราะห์ว่าในไอดีของคุณจัดทีมไหนได้ทันที
          </p>
        </div>

        {/* Status KPI */}
        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3.5 flex items-center gap-4 text-xs font-mono shadow-xl">
            <div>
              <div className="text-slate-400 text-[11px]">ทีมบุกพร้อมรบ (AO)</div>
              <div className="text-emerald-400 font-bold text-base">{summary.readyAo} / {summary.totalAo} ทีม</div>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div>
              <div className="text-slate-400 text-[11px]">ทีมรับพร้อมรบ (AD)</div>
              <div className="text-cyan-400 font-bold text-base">{summary.readyAd} / {summary.totalAd} ทีม</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2 overflow-x-auto text-xs sm:text-sm font-bold">
          <button
            onClick={() => { setActiveTab('ao'); setSelectedArchetype('all'); }}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'ao'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/25'
                : 'text-slate-400 hover:text-white bg-white/[0.03]'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>⚔️ ทีมบุกอารีน่า (Arena Offense - AO)</span>
          </button>

          <button
            onClick={() => { setActiveTab('ad'); setSelectedArchetype('all'); }}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'ad'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'text-slate-400 hover:text-white bg-white/[0.03]'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>🛡️ ทีมตั้งรับ & ถ่วงเวลา (Arena Defense - AD)</span>
          </button>

          <button
            onClick={() => { setActiveTab('mybox'); setSelectedArchetype('all'); }}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'mybox'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                : 'text-slate-400 hover:text-white bg-white/[0.03]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>⚡ ทีมที่ฉันมีครบ 4 ตัว ({summary.readyAo + summary.readyAd} ทีม)</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อทีม หรือ มอนสเตอร์..."
            className="w-full bg-[#070b14] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* 3. Team Cards Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {filteredList.map((team) => (
          <div
            key={team.id}
            className="rounded-3xl border border-white/[0.08] bg-[#0c1220] p-5 sm:p-6 space-y-4 shadow-xl hover:border-blue-500/30 transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[11px] font-bold font-mono">
                      {team.archetype}
                    </span>
                    {team.avgClearTime && (
                      <span className="px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-300 text-[11px] font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-400" /> {team.avgClearTime}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold font-mono ${
                      team.isComplete 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-white/[0.04] text-slate-400'
                    }`}>
                      {team.statusLabel}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white mt-1.5">
                    {team.nameTh}
                  </h3>
                  <div className="text-xs text-slate-400 font-mono">{team.name}</div>
                </div>

                <button
                  onClick={() => handleCopyTeam(team)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedTeamId === team.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copiedTeamId === team.id ? 'คัดลอกแล้ว' : 'คัดลอกสูตร'}</span>
                </button>
              </div>

              {/* 4 Monster Slots */}
              <div className="grid grid-cols-4 gap-2.5 p-3 rounded-2xl bg-[#070b14] border border-white/[0.06]">
                {team.slots.map((mon, sIdx) => (
                  <div key={sIdx} className="flex flex-col items-center text-center group/m relative">
                    <div className="relative">
                      <MonsterAvatar monster={mon} size="md" showStars={false} />
                      {sIdx === 0 && (
                        <div className="absolute -top-2 -left-1 bg-amber-500 text-slate-950 p-1 rounded-full shadow-md" title="สกิลหัวหน้าทีม (Leader)">
                          <Crown className="w-3 h-3 font-black" />
                        </div>
                      )}
                      {mon.isOwned && (
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5" title="มีในไอดีแล้ว">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-white truncate max-w-[85px] mt-1.5">
                      {mon.name}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[85px]">
                      {mon.thaiName !== mon.name ? mon.thaiName : `ช่องที่ ${sIdx + 1}`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Leader Skill */}
              <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                <span><strong>ลีดเดอร์:</strong> {team.leader}</span>
              </div>

              {/* Turn Order (AO) OR Win Condition (AD) */}
              {team.turnOrder && (
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="font-bold text-cyan-300 uppercase font-mono text-[11px]">
                    ลำดับเทิร์นการออกสกิล (Turn Order):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {team.turnOrder.map((step, i) => (
                      <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold flex items-center justify-center text-[10px]">
                          {i + 1}
                        </span>
                        <span className="truncate">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {team.winCondition && (
                <div className="text-xs text-slate-300 bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-xl">
                  <strong className="text-blue-300">เงื่อนไขชัยชนะ:</strong> {team.winCondition}
                </div>
              )}

              {/* Rune Guidance */}
              <div className="text-xs text-slate-300 bg-slate-900/80 border border-white/[0.06] p-3 rounded-xl leading-relaxed">
                <div className="font-bold text-amber-300 font-mono text-[11px] mb-1">แนวทางการใส่รูน & สปีด:</div>
                <p>{team.runeGuidance || team.runeBuilds}</p>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400 leading-relaxed italic">
                💡 {team.description}
              </p>
            </div>

            {/* Matchup Advice Footer */}
            <div className="pt-3 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {team.bestAgainst && (
                <div className="text-emerald-300">
                  <strong className="text-emerald-400">เหมาะกับ:</strong> {team.bestAgainst}
                </div>
              )}
              {team.avoidAgainst && (
                <div className="text-rose-300">
                  <strong className="text-rose-400">ควรเลี่ยง:</strong> {team.avoidAgainst}
                </div>
              )}
              {team.counterTips && (
                <div className="text-amber-300 sm:col-span-2">
                  <strong className="text-amber-400">วิธีแก้ทาง:</strong> {team.counterTips}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredList.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-[#0c1220] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">ไม่พบทีมตามเงื่อนไขที่เลือก</h3>
          <p className="text-xs text-slate-400">ลองล้างคำค้นหา หรือสลับไปยังแท็บอื่นเพื่อดูทีมเพิ่มเติม</p>
        </div>
      )}
    </div>
  );
}
