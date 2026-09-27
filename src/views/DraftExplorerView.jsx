import React, { useState, useMemo } from 'react';
import { 
  Swords, 
  Shield, 
  Flame, 
  Zap, 
  Search, 
  RotateCcw, 
  ArrowRight, 
  Check, 
  X, 
  AlertTriangle, 
  Crown, 
  Ban, 
  TrendingUp, 
  Sparkles,
  Users,
  Compass,
  Trophy,
  Activity,
  Layers,
  HelpCircle
} from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import AiAdvisorPanel from '../components/AiAdvisorPanel';
import AiChatPanel from '../components/AiChatPanel';
import { MONSTERS } from '../data/monsters';
import RTA_SYNERGIES from '../data/rtaSynergies.json';
import { analyzeRtaDraft } from '../utils/draftAdvisorEngine';

// Guardian Preset Drafts
const PRESET_DRAFTS = [
  {
    name: 'Control Cleave (โอลิเวอร์ คอนโทรล)',
    blue: ['Oliver', 'Cheongpung', 'Moore', 'Robo', 'Ethna'],
    red: ['Chandra', 'Sagar', 'Velajuel', 'Camilla', 'Byungchul'],
    blueBan: 'Sagar',
    redBan: 'Oliver',
    desc: 'เปิดสปีดล้างบัฟ ลดเกจ และรีเซ็ตสกิลฝ่ายตรงข้ามไม่ให้ได้ขยับ'
  },
  {
    name: 'Speed Snipe (สปีดวันช็อต)',
    blue: ['Vanessa', 'Sonia', 'Adriana', 'Sekhmet', 'Miles'],
    red: ['Moore', 'Robo', 'Cheongpung', 'Haeyang', 'Leo'],
    blueBan: 'Leo',
    redBan: 'Sonia',
    desc: 'สปีดลีด 33% บัฟสปีดเกราะ สไนป์ตัดตัวปัญหาตายทีละตัว'
  },
  {
    name: 'Leo Zero-SPD (ลีโอล็อคความเร็ว)',
    blue: ['Leo', 'Lucifer', 'Megan', 'Lushen', 'Kaki'],
    red: ['Oliver', 'Sonia', 'Ethna', 'Sekhmet', 'Vanessa'],
    blueBan: 'Vanessa',
    redBan: 'Leo',
    desc: 'กดสปีดทุกคนเท่ากัน ลูซิเฟอร์เร่งเกจแล้วคลีฟยกทีม'
  },
  {
    name: 'Bruiser Iron Wall (แทงก์สวนกลับ)',
    blue: ['Chandra', 'Sagar', 'Velajuel', 'Byungchul', 'Camilla'],
    red: ['Oliver', 'Cheongpung', 'Moore', 'Sonia', 'Adriana'],
    blueBan: 'Oliver',
    redBan: 'Byungchul',
    desc: 'กอดป้องกัน บัฟกันสถานะ สวนกลับดาเมจหนักเมื่อศัตรูตีเข้ามา'
  }
];

export default function DraftExplorerView({ onNavigate }) {
  // 5 slots for Blue (Player) and 5 slots for Red (Opponent)
  const [blueTeam, setBlueTeam] = useState([
    MONSTERS.find(m => m.name === 'Oliver') || null,
    MONSTERS.find(m => m.name === 'Cheongpung') || null,
    MONSTERS.find(m => m.name === 'Moore') || null,
    MONSTERS.find(m => m.name === 'Robo') || null,
    MONSTERS.find(m => m.name === 'Ethna') || null
  ]);

  const [redTeam, setRedTeam] = useState([
    MONSTERS.find(m => m.name === 'Chandra') || null,
    MONSTERS.find(m => m.name === 'Sagar') || null,
    MONSTERS.find(m => m.name === 'Velajuel') || null,
    MONSTERS.find(m => m.name === 'Camilla') || null,
    MONSTERS.find(m => m.name === 'Byungchul') || null
  ]);

  const [blueLeader, setBlueLeader] = useState(0); // slot index
  const [redLeader, setRedLeader] = useState(0);

  const [blueBan, setBlueBan] = useState(1); // slot index on red team banned by blue
  const [redBan, setRedBan] = useState(0);  // slot index on blue team banned by red

  // Modal / Drawer state for slot selection
  const [activePicker, setActivePicker] = useState(null); // { team: 'blue' | 'red', slot: number }
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerElement, setPickerElement] = useState('all');

  // Filter monsters for picker
  const filteredPickerMonsters = useMemo(() => {
    const q = pickerSearch.toLowerCase().trim();
    // Exclude already picked monsters across both teams
    const pickedNames = new Set([
      ...blueTeam.filter(Boolean).map(m => m.name.toLowerCase()),
      ...redTeam.filter(Boolean).map(m => m.name.toLowerCase())
    ]);

    return MONSTERS.filter(m => {
      if (pickerElement !== 'all' && m.element !== pickerElement) return false;
      if (q) {
        const matchEn = m.name?.toLowerCase().includes(q);
        const matchTh = m.thaiName?.toLowerCase().includes(q);
        const matchFam = m.family?.toLowerCase().includes(q);
        if (!matchEn && !matchTh && !matchFam) return false;
      }
      return true;
    }).slice(0, 70);
  }, [pickerSearch, pickerElement, blueTeam, redTeam]);

  // Handle slot assignment
  const handleSelectMonster = (monster) => {
    if (!activePicker) return;
    const { team, slot } = activePicker;
    if (team === 'blue') {
      const next = [...blueTeam];
      next[slot] = monster;
      setBlueTeam(next);
    } else {
      const next = [...redTeam];
      next[slot] = monster;
      setRedTeam(next);
    }
    setActivePicker(null);
  };

  // Clear a single slot
  const handleClearSlot = (team, slot, e) => {
    e.stopPropagation();
    if (team === 'blue') {
      const next = [...blueTeam];
      next[slot] = null;
      setBlueTeam(next);
    } else {
      const next = [...redTeam];
      next[slot] = null;
      setRedTeam(next);
    }
  };

  // Reset entire draft
  const handleResetDraft = () => {
    setBlueTeam([null, null, null, null, null]);
    setRedTeam([null, null, null, null, null]);
    setActivePicker(null);
    setBlueBan(null);
    setRedBan(null);
  };

  // Load a preset
  const handleLoadPreset = (preset) => {
    const b = preset.blue.map(name => MONSTERS.find(m => m.name.toLowerCase() === name.toLowerCase()) || null);
    const r = preset.red.map(name => MONSTERS.find(m => m.name.toLowerCase() === name.toLowerCase()) || null);
    setBlueTeam(b);
    setRedTeam(r);
    
    // Find bans
    const bBanIdx = preset.red.findIndex(n => n.toLowerCase() === preset.blueBan.toLowerCase());
    const rBanIdx = preset.blue.findIndex(n => n.toLowerCase() === preset.redBan.toLowerCase());
    setBlueBan(bBanIdx !== -1 ? bBanIdx : 0);
    setRedBan(rBanIdx !== -1 ? rBanIdx : 0);
    setActivePicker(null);
  };

  const [advisorTab, setAdvisorTab] = useState('counters'); // 'counters' | 'synergy' | 'replays'

  // Dynamic Draft Calculation Engine using G3/Legend Metas & SWRT Replays
  const analysis = useMemo(() => {
    return analyzeRtaDraft(blueTeam, redTeam, blueBan, redBan);
  }, [blueTeam, redTeam, blueBan, redBan]);

  return (
    <div className="space-y-6 max-w-[1780px] 2xl:max-w-[1880px] mx-auto pb-16 animate-in fade-in duration-300">
      
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#0c1424] via-[#090e18] to-[#070b12] p-6 sm:p-8 shadow-2xl space-y-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>SWM Draft Engine • Pro Tournament Simulator</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-black">
                RTA S38 LIVE
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              RTA Draft Explorer & Draft Advisor
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
              เครื่องมือจำลอง Pick & Ban 5v5 ระดับทัวร์นาเมนต์การ์เดียน วิเคราะห์โอกาสชนะ คำนวณ Synergy ทีม และแนะนำตัวที่ควรแบน / ตัวเคาน์เตอร์แบบเรียลไทม์
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleResetDraft}
              className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ล้างดราฟต์ใหม่</span>
            </button>
            <button
              onClick={() => onNavigate('rta')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/25"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>ดูสถิติ RTA S38</span>
            </button>
          </div>
        </div>

        {/* Preset Templates */}
        <div className="relative z-10 flex items-center gap-2 overflow-x-auto pb-1 text-xs border-t border-white/[0.06] pt-3">
          <span className="font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            ดราฟต์ตัวอย่างการ์เดียน:
          </span>
          {PRESET_DRAFTS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleLoadPreset(preset)}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] hover:border-purple-500/40 text-slate-300 hover:text-white border border-white/[0.06] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shadow-sm"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Win Probability Bar */}
      <div className="rounded-3xl border border-white/[0.08] bg-[#0a0f19]/80 backdrop-blur-xl p-5 sm:p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2 text-cyan-400">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>ทีมคุณ (BLUE TEAM)</span>
            <span className="text-base sm:text-lg font-mono font-black text-cyan-300">
              {analysis.blueWinProb}%
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-xs">
            <Swords className="w-3.5 h-3.5 text-amber-400" />
            <span>PROJECTED WIN CHANCE</span>
          </div>

          <div className="flex items-center gap-2 text-rose-400">
            <span className="text-base sm:text-lg font-mono font-black text-rose-300">
              {analysis.redWinProb}%
            </span>
            <span>คู่แข่ง (RED TEAM)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse"></span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-3 rounded-full bg-white/[0.04] overflow-hidden flex p-0.5 border border-white/10">
          <div 
            className="h-full rounded-l-full bg-gradient-to-r from-cyan-600 to-blue-500 transition-all duration-500 shadow-md shadow-cyan-500/30"
            style={{ width: `${analysis.blueWinProb}%` }}
          />
          <div 
            className="h-full rounded-r-full bg-gradient-to-l from-rose-600 to-amber-600 transition-all duration-500 shadow-md shadow-rose-500/30"
            style={{ width: `${analysis.redWinProb}%` }}
          />
        </div>
      </div>

      {/* 3. The 5v5 Arena Board */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Blue Team (5 slots) */}
        <div className="rounded-3xl border border-cyan-500/30 bg-[#0a0f19]/80 backdrop-blur-xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-black">
                BLUE TEAM (คุณ)
              </span>
              <span className="text-xs text-slate-400">เลือก 5 มอนสเตอร์</span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              คู่แข่งแบน: <strong className="text-rose-400">{blueTeam[redBan]?.name || 'ยังไม่เลือก'}</strong>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {[0, 1, 2, 3, 4].map((slotIdx) => {
              const monster = blueTeam[slotIdx];
              const isBanned = redBan === slotIdx;
              const isLeader = blueLeader === slotIdx;

              return (
                <div
                  key={slotIdx}
                  onClick={() => setActivePicker({ team: 'blue', slot: slotIdx })}
                  className={`relative rounded-xl border-2 transition-all p-2 text-center cursor-pointer flex flex-col items-center justify-center min-h-[125px] sm:min-h-[145px] select-none ${
                    isBanned
                      ? 'border-rose-500/80 bg-rose-950/20 opacity-60'
                      : monster
                      ? 'border-cyan-500/50 bg-[#0e1929] hover:border-cyan-400 shadow-md'
                      : 'border-dashed border-[#1e2f46] bg-[#080d16] hover:border-cyan-400/60'
                  }`}
                >
                  {/* Leader badge */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setBlueLeader(slotIdx); }}
                    className={`absolute top-1 left-1 p-1 rounded transition-colors ${
                      isLeader ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-amber-400'
                    }`}
                    title={isLeader ? 'Leader Skill Active' : 'ตั้งเป็น Leader Skill'}
                  >
                    <Crown className="w-3 h-3" />
                  </button>

                  {/* Opponent Ban Toggle */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setRedBan(redBan === slotIdx ? null : slotIdx); }}
                    className={`absolute top-1 right-1 p-1 rounded transition-colors ${
                      isBanned ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-rose-400'
                    }`}
                    title={isBanned ? 'ถูกแบนโดยคู่แข่ง' : 'จำลองให้คู่แข่งแบนตัวนี้'}
                  >
                    <Ban className="w-3 h-3" />
                  </button>

                  {monster ? (
                    <>
                      <div className="mt-3 mb-1">
                        <MonsterAvatar monster={monster} size="md" showStars={false} />
                      </div>
                      <div className="font-bold text-white text-xs sm:text-xs truncate w-full px-1">
                        {monster.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate w-full">
                        {monster.thaiName || monster.family}
                      </div>
                      {isBanned && (
                        <div className="absolute inset-0 bg-rose-950/70 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <span className="text-[11px] font-black tracking-wider text-rose-300 bg-rose-900/80 px-2 py-0.5 rounded border border-rose-500/50">
                            BANNED
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 text-slate-400">
                      <span className="text-xl font-light text-cyan-400">+</span>
                      <span className="text-[11px] font-bold text-slate-400">พิก #{slotIdx + 1}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Red Team (5 slots) */}
        <div className="bg-[#120e17] border-2 border-rose-500/30 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2d1928]">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-black">
                RED TEAM (คู่แข่ง)
              </span>
              <span className="text-xs text-slate-400">เลือก 5 มอนสเตอร์</span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              คุณเลือกแบน: <strong className="text-cyan-400">{redTeam[blueBan]?.name || 'ยังไม่เลือก'}</strong>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {[0, 1, 2, 3, 4].map((slotIdx) => {
              const monster = redTeam[slotIdx];
              const isBanned = blueBan === slotIdx;
              const isLeader = redLeader === slotIdx;

              return (
                <div
                  key={slotIdx}
                  onClick={() => setActivePicker({ team: 'red', slot: slotIdx })}
                  className={`relative rounded-xl border-2 transition-all p-2 text-center cursor-pointer flex flex-col items-center justify-center min-h-[125px] sm:min-h-[145px] select-none ${
                    isBanned
                      ? 'border-rose-500/80 bg-rose-950/20 opacity-60'
                      : monster
                      ? 'border-rose-500/50 bg-[#1b101c] hover:border-rose-400 shadow-md'
                      : 'border-dashed border-[#341d2f] bg-[#0c0810] hover:border-rose-400/60'
                  }`}
                >
                  {/* Leader badge */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setRedLeader(slotIdx); }}
                    className={`absolute top-1 left-1 p-1 rounded transition-colors ${
                      isLeader ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-amber-400'
                    }`}
                    title={isLeader ? 'Leader Skill Active' : 'ตั้งเป็น Leader Skill'}
                  >
                    <Crown className="w-3 h-3" />
                  </button>

                  {/* Player Ban Toggle */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setBlueBan(blueBan === slotIdx ? null : slotIdx); }}
                    className={`absolute top-1 right-1 p-1 rounded transition-colors ${
                      isBanned ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-cyan-400'
                    }`}
                    title={isBanned ? 'คุณเลือกแบนตัวนี้' : 'กดเพื่อแบนตัวนี้'}
                  >
                    <Ban className="w-3 h-3" />
                  </button>

                  {monster ? (
                    <>
                      <div className="mt-3 mb-1">
                        <MonsterAvatar monster={monster} size="md" showStars={false} />
                      </div>
                      <div className="font-bold text-white text-xs sm:text-xs truncate w-full px-1">
                        {monster.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate w-full">
                        {monster.thaiName || monster.family}
                      </div>
                      {isBanned && (
                        <div className="absolute inset-0 bg-rose-950/70 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <span className="text-[11px] font-black tracking-wider text-rose-300 bg-rose-900/80 px-2 py-0.5 rounded border border-rose-500/50">
                            BANNED
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 text-slate-400">
                      <span className="text-xl font-light text-rose-400">+</span>
                      <span className="text-[11px] font-bold text-slate-400">พิก #{slotIdx + 1}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 4. Monster Selection Drawer (Popup when clicking a slot) */}
      {activePicker && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0a101b] border-2 border-cyan-500/50 shadow-2xl space-y-3.5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#18273c]">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-white">
                เลือกมอนสเตอร์สำหรับ <strong className={activePicker.team === 'blue' ? 'text-cyan-400' : 'text-rose-400'}>
                  {activePicker.team === 'blue' ? 'BLUE TEAM' : 'RED TEAM'} ตำแหน่ง #{activePicker.slot + 1}
                </strong>
              </span>
              <span className="text-xs text-slate-400">
                (พบ {filteredPickerMonsters.length} ตัว)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'ทั้งหมด' },
                  { id: 'fire', label: '🔥 ไฟ' },
                  { id: 'water', label: '💧 น้ำ' },
                  { id: 'wind', label: '🌪️ ลม' },
                  { id: 'light', label: '✨ แสง' },
                  { id: 'dark', label: '🌑 มืด' }
                ].map((el) => (
                  <button
                    key={el.id}
                    onClick={() => setPickerElement(el.id)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      pickerElement === el.id
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'bg-[#121c2c] text-slate-400 hover:text-white'
                    }`}
                  >
                    {el.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setActivePicker(null)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-[#131c2b] hover:bg-[#1b283d] cursor-pointer"
              >
                ✕ ปิด
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              placeholder="ค้นหาชื่อมอนสเตอร์ (เช่น Oliver, Cheongpung, Moore, Sonia, Sagar, Camilla, Byungchul)..."
              className="w-full bg-[#080d16] border border-[#1b283d] focus:border-cyan-400 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-56 overflow-y-auto pr-1">
            {filteredPickerMonsters.map((m) => (
              <button
                key={m.id}
                onClick={() => handleSelectMonster(m)}
                className="p-1.5 rounded-lg bg-[#0e1624] hover:bg-cyan-950/40 border border-[#1b283d] hover:border-cyan-400 transition-all flex flex-col items-center gap-1 cursor-pointer group"
              >
                <img
                  src={m.avatarUrl || m.imageUrl}
                  alt={m.name}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded object-cover group-hover:scale-105 transition-transform"
                  onError={(e) => { e.target.src = 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png'; }}
                />
                <span className="text-[11px] text-slate-300 group-hover:text-cyan-300 truncate w-full text-center font-medium">
                  {m.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grounded AI coach for the current draft */}
      <AiAdvisorPanel
        resetKey={[...blueTeam, ...redTeam].map((m) => m?.name || '-').join('|') + `|${blueLeader}|${redLeader}|${blueBan}|${redBan}`}
        label="ให้ AI วิเคราะห์ดราฟต์นี้"
        hint="เกมแพลนสองฝั่ง ตัวที่ควรแบน ลำดับเทิร์นและเป้าหมายแรก — อิงสกิลจริงของทั้ง 10 ตัว"
        buildPayload={() => ({
          kind: 'draft',
          blue: blueTeam.filter(Boolean).map((m) => m.name),
          red: redTeam.filter(Boolean).map((m) => m.name),
          blueLeader: blueTeam[blueLeader]?.name,
          redLeader: redTeam[redLeader]?.name,
          blueBan: redTeam[blueBan]?.name,
          redBan: blueTeam[redBan]?.name,
          perspective: 'blue',
        })}
      />

      <AiChatPanel
        compact
        title="ถามต่อเรื่องดราฟต์นี้"
        placeholder="เช่น ถ้าเขาเปิด Oliver ก่อน ฉันควรตอบด้วยอะไร"
        suggestions={['ตัวไหนของฝั่งแดงอันตรายสุดและทำไม', 'ฉันควรเปลี่ยนลีดเป็นใคร', 'ลำดับสปีดที่ต้องการของฝั่งน้ำเงิน']}
        buildContext={() => ({
          draft: `Blue: ${blueTeam.filter(Boolean).map((m) => m.name).join(', ')} | Red: ${redTeam.filter(Boolean).map((m) => m.name).join(', ')}`,
          monsters: [...blueTeam, ...redTeam].filter(Boolean).map((m) => m.name),
        })}
      />

      {/* 5. Draft Intelligence Insights & AI Advisor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Team Archetype Comparison */}
        <div className="bg-[#0c1320] border border-[#1b2b42] rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center gap-2 pb-2 border-b border-[#182638]">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              เปรียบเทียบสถิติทรงทีม (Archetype Radar)
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { label: 'SPD (สปีดเปิดเกม)', key: 'spd' },
              { label: 'CC (สถานะขัดขวาง/ลดเกจ)', key: 'cc' },
              { label: 'BURST DMG (ความแรงปิดเกม)', key: 'dmg' },
              { label: 'EHP / TANK (ความถึกทน/ฮีล)', key: 'tank' },
              { label: 'UTILITY (ล้างบัฟ/กันสถานะ)', key: 'util' }
            ].map((stat, idx) => {
              const bVal = analysis.stats.blue[stat.key];
              const rVal = analysis.stats.red[stat.key];
              const max = Math.max(100, bVal, rVal);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-mono text-cyan-400 font-bold">{bVal}</span>
                    <span className="font-semibold">{stat.label}</span>
                    <span className="font-mono text-rose-400 font-bold">{rVal}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-900 flex overflow-hidden">
                    <div 
                      className="h-full bg-cyan-500 transition-all duration-300"
                      style={{ width: `${(bVal / (bVal + rVal || 1)) * 100}%` }}
                    />
                    <div 
                      className="h-full bg-rose-500 transition-all duration-300"
                      style={{ width: `${(rVal / (bVal + rVal || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: AI Draft Ban Advisor & Replay Insights */}
        <div className="bg-[#0c1320] border border-[#1b2b42] rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-[#182638]">
            <div className="flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                แนะนำเป้าหมายแบน (Threat Ban Advisor)
              </h3>
            </div>
            {analysis.topBanTarget && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                Threat Score: {analysis.topBanTarget.score}/100
              </span>
            )}
          </div>

          {analysis.topBanTarget ? (
            <div className="p-4 rounded-xl bg-gradient-to-br from-rose-950/30 to-[#0e1726] border border-rose-500/30 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-rose-500/40 shrink-0 bg-slate-950">
                  <img
                    src={analysis.topBanTarget.avatarUrl || 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png'}
                    alt={analysis.topBanTarget.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png'; }}
                  />
                </div>
                <div>
                  <div className="text-xs text-rose-400 font-bold uppercase tracking-wider">เป้าหมายแบนอันดับ #1</div>
                  <div className="text-base font-black text-white flex items-center gap-1.5">
                    <span>{analysis.topBanTarget.name}</span>
                    <span className="text-xs text-slate-400 font-normal">({analysis.topBanTarget.thaiName})</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed bg-black/20 p-2.5 rounded-lg border border-white/[0.04]">
                ⚠️ <strong>ทำไมต้องแบน:</strong> {analysis.topBanTarget.reason}
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#080d16] border border-white/[0.06] text-center text-xs text-slate-400">
              เลือกมอนสเตอร์ฝั่งสีแดง เพื่อให้ระบบวิเคราะห์ตัวที่ควรแบน
            </div>
          )}

          {/* Replay Turning Point Insights */}
          {analysis.replayInsights && analysis.replayInsights.length > 0 && (
            <div className="pt-2 border-t border-[#182638] space-y-2">
              <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>รีเพลย์ G3/Legend ที่เคยชนะทรงนี้:</span>
              </div>
              <div className="space-y-1.5">
                {analysis.replayInsights.map((rep, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-[#080d16] border border-white/[0.04] text-[11px] text-slate-300">
                    <span className="text-rose-400 font-bold">{rep.winnerPlayer}</span> ({rep.rank}): {rep.winCondition}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Column 3: Realtime Next Picks & Synergies */}
        <div className="bg-[#0c1320] border border-[#1b2b42] rounded-2xl p-5 space-y-4 shadow-lg flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-[#182638] gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                ผู้ช่วยเลือกพิก (Draft Assistant)
              </h3>
            </div>

            <div className="flex items-center gap-1 bg-[#080d16] p-0.5 rounded-lg border border-white/[0.06]">
              <button
                onClick={() => setAdvisorTab('counters')}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  advisorTab === 'counters'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🔥 แก้ทาง ({analysis.counterRecommendations?.length || 0})
              </button>
              <button
                onClick={() => setAdvisorTab('synergy')}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  advisorTab === 'synergy'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ⚡ คอมโบ ({analysis.synergyRecommendations?.length || 0})
              </button>
            </div>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[320px] pr-1">
            {advisorTab === 'counters' && (
              <>
                {analysis.counterRecommendations && analysis.counterRecommendations.length > 0 ? (
                  analysis.counterRecommendations.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#080d16] border border-[#1b283d] hover:border-amber-400/50 transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={c.monster.avatarUrl || 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png'}
                          alt={c.monster.name}
                          className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                          onError={(e) => { e.target.src = 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png'; }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">{c.monster.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              {c.badge}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">{c.reason}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const emptyIdx = blueTeam.findIndex((m) => !m);
                          const target = emptyIdx !== -1 ? emptyIdx : 4;
                          const next = [...blueTeam];
                          next[target] = c.monster;
                          setBlueTeam(next);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-xs font-bold border border-amber-500/30 transition-all cursor-pointer shrink-0"
                        title="คลิกเพื่อเลือกมอนสเตอร์นี้เข้าทีม Blue ทันที"
                      >
                        + ใส่ทีม
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    เลือกมอนสเตอร์ฝั่งสีแดง เพื่อให้ระบบดึงตัวเคาน์เตอร์ที่เหมาะสม
                  </div>
                )}
              </>
            )}

            {advisorTab === 'synergy' && (
              <>
                {analysis.synergyRecommendations && analysis.synergyRecommendations.length > 0 ? (
                  analysis.synergyRecommendations.map((syn, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#080d16] border border-[#1b283d] hover:border-cyan-400/50 transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={syn.monster.avatarUrl || 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png'}
                          alt={syn.monster.name}
                          className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                          onError={(e) => { e.target.src = 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png'; }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">{syn.monster.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                              {syn.badge}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">{syn.thaiDesc}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const emptyIdx = blueTeam.findIndex((m) => !m);
                          const target = emptyIdx !== -1 ? emptyIdx : 4;
                          const next = [...blueTeam];
                          next[target] = syn.monster;
                          setBlueTeam(next);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 text-xs font-bold border border-cyan-500/30 transition-all cursor-pointer shrink-0"
                        title="คลิกเพื่อเลือกมอนสเตอร์นี้เข้าทีม Blue ทันที"
                      >
                        + ใส่ทีม
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    เลือกมอนสเตอร์ฝั่งสีน้ำเงิน เพื่อให้ระบบจับคู่คอมโบเมต้า RTA
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
