import React, { useState } from 'react';
import { 
  Shield, 
  Gift, 
  Trophy, 
  Search, 
  Copy, 
  Check, 
  ExternalLink, 
  ArrowRight, 
  Flame, 
  Zap, 
  Sliders, 
  CheckCircle2,
  Crosshair,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  TrendingUp,
  History,
  Compass
} from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import { MONSTERS } from '../data/monsters';
import { PROMO_CODES } from '../data/promoCodes';
import { MDC_TEAMS } from '../data/mdcTeams';
import { LEADERBOARDS } from '../data/leaderboards';
import runeArtifactOfDay from '../data/runeArtifactOfTheDay.json';
import trendingDefenses from '../data/trendingDefenses.json';
import latestSiegeBattles from '../data/latestSiegeBattles.json';

export default function DashboardView({ onNavigate }) {
  const [selectedSlots, setSelectedSlots] = useState([
    MONSTERS.find(m => m.id === 'carcano'),
    MONSTERS.find(m => m.id === 'savannah'),
    MONSTERS.find(m => m.id === 'miles')
  ]);
  const [slotPickerActive, setSlotPickerActive] = useState(null);
  const [elementFilter, setElementFilter] = useState('all');
  const [copiedCode, setCopiedCode] = useState(null);
  const [selectedServer, setSelectedServer] = useState('asia');
  const [battleServer, setBattleServer] = useState('Global');
  const [battleIdx, setBattleIdx] = useState(0);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleSlotSelect = (monster) => {
    if (slotPickerActive !== null) {
      const newSlots = [...selectedSlots];
      newSlots[slotPickerActive] = monster;
      setSelectedSlots(newSlots);
      setSlotPickerActive(null);
    }
  };

  const handleClearSlot = (index, e) => {
    e.stopPropagation();
    const newSlots = [...selectedSlots];
    newSlots[index] = null;
    setSelectedSlots(newSlots);
  };

  // Find best matching defense based on current selected slots
  const activeDefense = MDC_TEAMS.find(d => {
    const selectedIds = selectedSlots.filter(Boolean).map(m => m.id);
    return selectedIds.length > 0 && selectedIds.every(id => d.defenseMonsters.includes(id));
  }) || MDC_TEAMS[1];

  const filteredPoolMonsters = MONSTERS.filter(m => {
    if (elementFilter !== 'all' && m.element !== elementFilter) return false;
    return true;
  });

  const topGuilds = LEADERBOARDS[selectedServer]?.slice(0, 5) || [];
  const currentBattles = latestSiegeBattles[battleServer] || [];
  const activeBattle = currentBattles[battleIdx % Math.max(1, currentBattles.length)];

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      
      {/* 1. Tactical Command Bar (Status & Quick Jumps) */}
      <div className="bg-[#101724] border border-[#1d2b3f] rounded-xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold shrink-0">
            <Crosshair className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-400">
              สถานีควบคุมยุทธวิธี SWM (Summoners War Master • Tactical Combat Hub)
            </div>
            <div className="text-sm font-semibold text-slate-200">
              ระบบวิเคราะห์ข้อมูลเกมครบวงจร: 3MDC Counters, 96 Trending Defenses, สารานุกรมสกิล 940 ตัว, และดาเมจเสริมอาร์ติแฟกต์
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto">
          <button
            onClick={() => onNavigate('rta')}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg shadow-amber-500/10"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>🏆 RTA S38 (SWRT)</span>
          </button>

          <button
            onClick={() => onNavigate('trending')}
            className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>สถิติทั่วโลก (96 ทีม)</span>
          </button>

          <button
            onClick={() => onNavigate('dungeons')}
            className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/40 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>ดันเจี้ยน Abyss</span>
          </button>

          <button
            onClick={() => onNavigate('balance')}
            className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5" />
            <span>ประวัติแพตช์ (92)</span>
          </button>

          <button
            onClick={() => onNavigate('recruit')}
            className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/40 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>กิลด์รับสมัคร (120)</span>
          </button>
        </div>
      </div>

      {/* 2. Main Deck: 3MDC Tactical Interceptor (Left 7 cols) & Code Vault (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: 3MDC Live Interceptor Console */}
        <div className="lg:col-span-7 bg-[#101724] border border-[#1d2b3f] rounded-2xl p-5 sm:p-6 space-y-5 flex flex-col justify-between shadow-xl">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1d2b3f]">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  3MDC Defense Interceptor (วิเคราะห์ทีมตั้งรับ)
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                ฐานข้อมูลยุทธวิธี SWM
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-2">
              เลือก 3 มอนสเตอร์ของคู่แข่งในหอคอย Siege Battle เพื่อค้นหาทีมบุกเคาน์เตอร์และอัตราการชนะทันที:
            </p>

            {/* 3 Monster Slots */}
            <div className="grid grid-cols-3 gap-3 my-4">
              {[0, 1, 2].map((slotIdx) => {
                const monster = selectedSlots[slotIdx];
                const isActive = slotPickerActive === slotIdx;
                return (
                  <div
                    key={slotIdx}
                    onClick={() => setSlotPickerActive(isActive ? null : slotIdx)}
                    className={`relative rounded-xl border-2 transition-all p-3 text-center cursor-pointer flex flex-col items-center justify-center min-h-[120px] ${
                      isActive 
                        ? 'border-blue-500 bg-blue-950/40 shadow-lg shadow-blue-500/20' 
                        : monster 
                          ? 'border-[#293d58] bg-[#0c121c] hover:border-slate-500' 
                          : 'border-dashed border-[#1f2d42] bg-[#080d14] hover:border-blue-400/50'
                    }`}
                  >
                    {monster ? (
                      <>
                        <button
                          onClick={(e) => handleClearSlot(slotIdx, e)}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center text-xs font-bold shadow-md z-10"
                          title="ลบมอนสเตอร์"
                        >
                          ✕
                        </button>
                        <MonsterAvatar monster={monster} size="md" showStars={false} />
                        <span className="mt-1.5 text-xs font-bold text-slate-200 truncate max-w-full">
                          {monster.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {slotIdx === 0 ? 'Leader' : `Slot #${slotIdx + 1}`}
                        </span>
                      </>
                    ) : (
                      <div className="text-slate-500 flex flex-col items-center gap-1">
                        <span className="text-2xl font-light text-slate-600">+</span>
                        <span className="text-xs font-bold text-slate-400">
                          {slotIdx === 0 ? 'เลือก Leader' : `เลือกตัวที่ ${slotIdx + 1}`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Monster Selection Drawer */}
            {slotPickerActive !== null && (
              <div className="p-3.5 rounded-xl bg-[#0b1018] border border-blue-500/40 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-400">
                    เลือกมอนสเตอร์ใส่ตำแหน่งที่ #{slotPickerActive + 1}:
                  </span>
                  <div className="flex gap-1">
                    {['all', 'fire', 'water', 'wind', 'light', 'dark'].map((el) => (
                      <button
                        key={el}
                        onClick={() => setElementFilter(el)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase transition-colors ${
                          elementFilter === el
                            ? 'bg-blue-600 text-white'
                            : 'bg-[#151f2e] text-slate-400 hover:text-white'
                        }`}
                      >
                        {el}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto pr-1">
                  {filteredPoolMonsters.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleSlotSelect(m)}
                      className="p-1 rounded-lg bg-[#111927] hover:bg-blue-900/40 border border-[#1e2a3c] hover:border-blue-400 transition-all flex flex-col items-center gap-1 cursor-pointer"
                    >
                      <img 
                        src={m.avatarUrl} 
                        alt={m.name} 
                        className="w-10 h-10 rounded object-cover"
                      />
                      <span className="text-[10px] text-slate-300 truncate w-full text-center">
                        {m.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Live Counter Team Results */}
            <div className="mt-4 pt-4 border-t border-[#1d2b3f] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  สูตรทีมแก้ทางที่แนะนำ (Top Counter Strategy)
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  Winrate: {activeDefense.counters[0]?.winRate || '96.2%'}
                </span>
              </div>

              {activeDefense.counters[0] && (
                <div className="p-3.5 rounded-xl bg-[#0c121c] border border-[#1f2c3f] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {activeDefense.counters[0].monsters.map((id, idx) => {
                        const m = MONSTERS.find(unit => unit.id === id);
                        return m ? (
                          <MonsterAvatar key={idx} monster={m} size="sm" showStars={false} />
                        ) : null;
                      })}
                    </div>
                    <span className="text-xs font-bold text-blue-400">
                      {activeDefense.counters[0].author}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1 border-t border-[#182333]">
                    {activeDefense.counters[0].notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#1d2b3f]">
            <button
              onClick={() => onNavigate('3mdc')}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              <span>เปิดฐานข้อมูลค้นหา 3MDC เต็มรูปแบบ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Code Vault & Live Drops */}
        <div className="lg:col-span-5 bg-[#101724] border border-[#1d2b3f] rounded-2xl p-5 sm:p-6 space-y-4 flex flex-col justify-between shadow-xl">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1d2b3f]">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  คลังโค้ดแจกไอเทม (Active Game Codes)
                </h2>
              </div>
              <button
                onClick={() => onNavigate('codes')}
                className="text-xs text-blue-400 hover:text-blue-300 font-bold"
              >
                ดูทั้งหมด ({PROMO_CODES.length})
              </button>
            </div>

            <p className="text-xs text-slate-300 mt-1">
              โค้ดแท้ที่ยังใช้งานได้อยู่ กดปุ่มเพื่อคัดลอก หรือกดรับเพื่อส่งของเข้าเกมทันที:
            </p>

            {/* Codes Stream */}
            <div className="space-y-3 mt-3">
              {PROMO_CODES.slice(0, 4).map((item) => (
                <div 
                  key={item.id}
                  className="p-3.5 rounded-xl bg-[#0c121c] border border-[#1f2c3f] hover:border-slate-600 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm sm:text-base font-black text-emerald-400 tracking-wider">
                      {item.code}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(item.code)}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          copiedCode === item.code
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#182333] text-slate-200 hover:bg-[#223147]'
                        }`}
                        title="คัดลอกโค้ด"
                      >
                        {copiedCode === item.code ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode === item.code ? 'ก็อปแล้ว' : 'ก็อป'}</span>
                      </button>

                      <a
                        href={item.redeemUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <span>รับ</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Real Com2uS Item Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {item.rewards.map((r, rIdx) => (
                      <div 
                        key={rIdx}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#131b26] border border-[#1e2a3c] text-xs text-slate-200"
                      >
                        {r.imageUrl && (
                          <img 
                            src={r.imageUrl} 
                            alt={r.name} 
                            className="w-4 h-4 object-contain"
                          />
                        )}
                        <span>{r.name.split(' ')[0]}</span>
                        <span className="font-mono font-bold text-emerald-400">x{r.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Guide */}
          <div className="p-3.5 rounded-xl bg-[#0c121c] border border-[#1f2c3f] text-xs text-slate-300 space-y-1">
            <div className="font-bold text-blue-400">💡 เคล็ดลับการรับของ:</div>
            <p className="text-slate-400 leading-relaxed">
              สำหรับ iOS และ Android เมื่อกดปุ่ม <strong>"รับ"</strong> ระบบจะเปิดหน้า WithHive เพื่อส่งรางวัลเข้ากล่องจดหมายในเกมทันที
            </p>
          </div>
        </div>

      </div>

      {/* 3. Daily Feature: Rune & Artifact of the Day (Live from SWGT Homepage) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Rune */}
        <div className="bg-[#111824] border border-[#233148] rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500/20 to-transparent px-4 py-1 text-[11px] font-bold text-amber-300 font-mono rounded-bl-xl border-b border-l border-amber-500/30">
            RUNE OF THE DAY
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              รูนประจำวัน (Daily Featured Rune)
            </h3>
          </div>

          <div className="bg-[#0b1018] p-4 rounded-xl border border-[#1d2a3d] flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-purple-950/60 border-2 border-amber-500/60 flex items-center justify-center p-2 flex-shrink-0 shadow-lg">
              <img
                src="https://do9d4mpqk497d.cloudfront.net/common/images/rune_icons/rune3.png"
                alt="Rune"
                className="max-h-full max-w-full"
                onError={(e) => { e.target.src = 'https://do9d4mpqk497d.cloudfront.net/common/images/summoners_war_query_jp/rune.png'; }}
              />
            </div>

            <div className="flex-1 space-y-1 text-center sm:text-left">
              <div className="text-base font-extrabold text-amber-400">
                {runeArtifactOfDay?.rune?.title || '+15 Violent Rune'}
              </div>
              <div className="text-sm font-mono font-bold text-emerald-400">
                Main: {runeArtifactOfDay?.rune?.mainStat || 'SPD +42'}
              </div>
              <div className="text-xs text-slate-300 space-y-0.5 pt-1">
                {runeArtifactOfDay?.rune?.subStats?.map((st, idx) => (
                  <div key={idx} className="font-mono text-slate-300">• {st}</div>
                ))}
              </div>
            </div>

            <div className="text-center sm:text-right flex-shrink-0 border-t sm:border-t-0 sm:border-l border-[#1d2a3d] pt-2 sm:pt-0 sm:pl-4">
              <div className="text-[11px] text-slate-400">Efficiency</div>
              <div className="text-xl font-mono font-black text-amber-400">{runeArtifactOfDay?.rune?.efficiency || '108.4%'}</div>
            </div>
          </div>
        </div>

        {/* Daily Artifact */}
        <div className="bg-[#111824] border border-[#233148] rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-gradient-to-l from-cyan-500/20 to-transparent px-4 py-1 text-[11px] font-bold text-cyan-300 font-mono rounded-bl-xl border-b border-l border-cyan-500/30">
            ARTIFACT OF THE DAY
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              อาร์ติแฟกต์ประจำวัน (Daily Featured Artifact)
            </h3>
          </div>

          <div className="bg-[#0b1018] p-4 rounded-xl border border-[#1d2a3d] flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-cyan-950/60 border-2 border-cyan-500/60 flex items-center justify-center p-2 flex-shrink-0 shadow-lg">
              <img
                src="https://do9d4mpqk497d.cloudfront.net/common/images/elements/water.png"
                alt="Artifact"
                className="max-h-full max-w-full"
              />
            </div>

            <div className="flex-1 space-y-1 text-center sm:text-left">
              <div className="text-base font-extrabold text-cyan-400">
                {runeArtifactOfDay?.artifact?.title || '+15 Legend Attribute Artifact (Water)'}
              </div>
              <div className="text-sm font-mono font-bold text-emerald-400">
                Main: {runeArtifactOfDay?.artifact?.mainStat || 'HP +1500'}
              </div>
              <div className="text-xs text-slate-300 space-y-0.5 pt-1">
                {runeArtifactOfDay?.artifact?.subStats?.map((st, idx) => (
                  <div key={idx} className="font-mono text-slate-300">• {st}</div>
                ))}
              </div>
            </div>

            <div className="text-center sm:text-right flex-shrink-0 border-t sm:border-t-0 sm:border-l border-[#1d2a3d] pt-2 sm:pt-0 sm:pl-4">
              <div className="text-[11px] text-slate-400">Efficiency</div>
              <div className="text-xl font-mono font-black text-cyan-400">{runeArtifactOfDay?.artifact?.efficiency || '102.1%'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Lower Tactical Deck: Trending 20 Defenses + Live Siege Carousel + SWEX */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Trending Meta Defenses (20 Teams Live Stream) */}
        <div className="bg-[#101724] border border-[#1d2b3f] rounded-2xl p-5 space-y-3 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1d2b3f]">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  ทีมตั้งรับยอดฮิต (Trending 3MDC)
                </h3>
              </div>
              <button 
                onClick={() => onNavigate('trending')}
                className="text-xs text-blue-400 hover:text-blue-300 font-bold"
              >
                ดูทั้งหมด ({trendingDefenses.length})
              </button>
            </div>

            <div className="space-y-2.5 mt-3">
              {trendingDefenses.slice(0, 4).map((def) => (
                <div
                  key={def.id}
                  onClick={() => onNavigate('3mdc', { search: `${def.leader.name} ${def.monster2.name} ${def.monster3.name}` })}
                  className="p-3 rounded-xl bg-[#0c121c] border border-[#1f2c3f] hover:border-blue-500 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {[def.leader, def.monster2, def.monster3].map((u, uIdx) => (
                      <img
                        key={uIdx}
                        src={u.img}
                        alt={u.name}
                        className="w-9 h-9 rounded border border-[#2b3a50] object-cover bg-black"
                        onError={(e) => { e.target.src = 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png'; }}
                      />
                    ))}
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-white truncate max-w-[120px]">
                      {def.leader.name}
                    </div>
                    <span className="text-[10px] text-blue-400 font-semibold">ค้นหาสูตรตี →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 text-center text-xs text-slate-400">
            อัปเดตอัตโนมัติตามเมต้า Siege ล่าสุดของเซิร์ฟเวอร์
          </div>
        </div>

        {/* Card 2: Live Siege Battles per Server (Real Match Matches from SWGT Carousel) */}
        <div className="bg-[#101724] border border-[#1d2b3f] rounded-2xl p-5 space-y-3 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1d2b3f]">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  ผลการแข่งสด (Siege Matchups)
                </h3>
              </div>

              <select
                value={battleServer}
                onChange={(e) => { setBattleServer(e.target.value); setBattleIdx(0); }}
                className="bg-[#0c121c] border border-[#1f2c3f] text-xs text-slate-200 rounded px-2 py-1 font-bold focus:outline-none"
              >
                <option value="Global">Global</option>
                <option value="Europe">Europe</option>
                <option value="Asia">Asia</option>
                <option value="JPKR">JP/KR</option>
              </select>
            </div>

            {activeBattle ? (
              <div className="space-y-2 mt-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>รอบแข่งที่ #{battleIdx + 1} จาก {currentBattles.length}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setBattleIdx(prev => Math.max(0, prev - 1))}
                      className="px-2 py-0.5 bg-[#182333] hover:bg-[#202e42] rounded text-slate-300"
                    >
                      ◀
                    </button>
                    <button
                      onClick={() => setBattleIdx(prev => (prev + 1) % currentBattles.length)}
                      className="px-2 py-0.5 bg-[#182333] hover:bg-[#202e42] rounded text-slate-300"
                    >
                      ▶
                    </button>
                  </div>
                </div>

                <div className="bg-[#0c121c] p-3 rounded-xl border border-[#1f2c3f] divide-y divide-[#162131]">
                  {activeBattle.guilds.map((g, gIdx) => (
                    <div key={gIdx} className="py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-amber-400 font-bold w-7">{g.rank}</span>
                        <span className="font-bold text-white truncate max-w-[130px]">{g.name}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="font-bold text-blue-400">{g.score}</span>
                        {g.speed && <span className="text-[10px] text-slate-400">{g.speed}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                ไม่มีข้อมูลการแข่งขันสดในขณะนี้
              </div>
            )}
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={() => onNavigate('leaderboards')}
              className="text-xs text-blue-400 hover:text-blue-300 font-bold"
            >
              ดูกระดานคะแนนทุกเซิร์ฟเวอร์ →
            </button>
          </div>
        </div>

        {/* Card 3: SWEX + Profile Integration */}
        <div className="bg-[#101724] border border-[#1d2b3f] rounded-2xl p-5 space-y-3 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1d2b3f]">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  SWEX & Profile Integration
                </h3>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0c121c] border border-[#1f2c3f] flex items-center gap-3 mt-3">
              <img 
                src="https://do9d4mpqk497d.cloudfront.net/common/images/about/swex_logo.png" 
                alt="SWEX" 
                className="w-10 h-10 object-contain"
              />
              <div>
                <div className="text-xs font-bold text-white">3MDC SWEX Auto-Logger</div>
                <div className="text-[11px] text-slate-400">บันทึกสถิติการตี Siege อัตโนมัติ</div>
              </div>
            </div>

            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              รองรับการส่งออกข้อมูลไอดีผ่าน Summoners War Exporter เพื่อตรวจสอบคะแนนประสิทธิภาพรูนและอาร์ติแฟกต์
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <a
              href="https://github.com/Cerusa/3mdc-swex-plugin/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              ดาวน์โหลดปลั๊กอิน <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => onNavigate('rune')}
              className="px-3 py-1.5 rounded-lg bg-[#182333] hover:bg-[#202e42] text-xs font-bold text-slate-200 border border-[#2a3c56]"
            >
              คำนวณรูน
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
