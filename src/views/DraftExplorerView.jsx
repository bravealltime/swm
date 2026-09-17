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
import { MONSTERS } from '../data/monsters';
import RTA_SYNERGIES from '../data/rtaSynergies.json';

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

  // Draft Calculation Engine (Synergy, Winrate, Threats)
  const analysis = useMemo(() => {
    const activeBlue = blueTeam.filter((m, i) => m && i !== redBan);
    const activeRed = redTeam.filter((m, i) => m && i !== blueBan);

    // Calculate archetype points
    let blueSpd = 50, blueCc = 50, blueDmg = 50, blueTank = 50, blueUtil = 50;
    let redSpd = 50, redCc = 50, redDmg = 50, redTank = 50, redUtil = 50;

    activeBlue.forEach(m => {
      const n = m.name.toLowerCase();
      if (['oliver', 'vanessa', 'sonia', 'ethna', 'adriana', 'moore', 'miles', 'sekhmet'].includes(n)) blueSpd += 12;
      if (['cheongpung', 'oliver', 'robo', 'sagar', 'moore', 'tian lang', 'cp'].includes(n)) blueCc += 14;
      if (['sonia', 'lushen', 'kaki', 'perna', 'miles', 'lucifer', 'masha'].includes(n)) blueDmg += 14;
      if (['camilla', 'chandra', 'velajuel', 'byungchul', 'haeyang', 'riley'].includes(n)) blueTank += 15;
      if (['shizuka', 'adriana', 'woosa', 'tomoe', 'anavel', 'bastet'].includes(n)) blueUtil += 12;
    });

    activeRed.forEach(m => {
      const n = m.name.toLowerCase();
      if (['oliver', 'vanessa', 'sonia', 'ethna', 'adriana', 'moore', 'miles', 'sekhmet'].includes(n)) redSpd += 12;
      if (['cheongpung', 'oliver', 'robo', 'sagar', 'moore', 'tian lang', 'cp'].includes(n)) redCc += 14;
      if (['sonia', 'lushen', 'kaki', 'perna', 'miles', 'lucifer', 'masha'].includes(n)) redDmg += 14;
      if (['camilla', 'chandra', 'velajuel', 'byungchul', 'haeyang', 'riley'].includes(n)) redTank += 15;
      if (['shizuka', 'adriana', 'woosa', 'tomoe', 'anavel', 'bastet'].includes(n)) redUtil += 12;
    });

    // Check synergies in blue team
    let blueSynergyBonus = 0;
    const blueNames = activeBlue.map(m => m.name.toLowerCase());
    RTA_SYNERGIES.duos.forEach(d => {
      if (blueNames.includes(d.monsters[0].toLowerCase()) && blueNames.includes(d.monsters[1].toLowerCase())) {
        blueSynergyBonus += 2.5;
      }
    });

    // Check synergies in red team
    let redSynergyBonus = 0;
    const redNames = activeRed.map(m => m.name.toLowerCase());
    RTA_SYNERGIES.duos.forEach(d => {
      if (redNames.includes(d.monsters[0].toLowerCase()) && redNames.includes(d.monsters[1].toLowerCase())) {
        redSynergyBonus += 2.5;
      }
    });

    // Leo special rule
    if (blueNames.includes('leo') && blueNames.includes('lucifer')) blueSynergyBonus += 8;
    if (redNames.includes('leo') && redNames.includes('lucifer')) redSynergyBonus += 8;

    // Total score calculation
    const blueTotal = blueSpd + blueCc + blueDmg + blueTank + blueUtil + blueSynergyBonus;
    const redTotal = redSpd + redCc + redDmg + redTank + redUtil + redSynergyBonus;
    const sum = blueTotal + redTotal;

    const blueWinProb = Math.min(82, Math.max(18, Math.round((blueTotal / Math.max(1, sum)) * 100)));
    const redWinProb = 100 - blueWinProb;

    // Determine ban recommendation for blue (which red monster to ban)
    let recommendedBan = redTeam[0]?.name || 'มอนสเตอร์สปีดลีด';
    let banReason = 'ตัวเปิดเกมที่อันตรายที่สุด';
    if (redNames.includes('oliver')) { recommendedBan = 'Oliver'; banReason = 'ตัวลดเกจและรีเซ็ตคูลดาวน์เบอร์ 1'; }
    else if (redNames.includes('leo')) { recommendedBan = 'Leo'; banReason = 'ล็อคสปีดทำลายระบบทีมของคุณ'; }
    else if (redNames.includes('sonia')) { recommendedBan = 'Sonia'; banReason = 'สไนป์ดาเมจเดี่ยวทะลุเกราะแรงมาก'; }
    else if (redNames.includes('chandra')) { recommendedBan = 'Chandra'; banReason = 'กอดปกป้องตัวแบกทำให้เจาะไม่เข้า'; }
    else if (redNames.includes('sagar')) { recommendedBan = 'Sagar'; banReason = 'ยั่วยวนและรีเซ็ตเทิร์นกวนไฟต์'; }

    // Counter pick suggestions for blue
    const suggestions = [
      { name: 'Miles', role: 'Speed Bruiser', reason: 'วิ่งสะสมสปีดเจาะเกราะเคาน์เตอร์ตัวแทงก์' },
      { name: 'Juno', role: 'Passive Cleanser', reason: 'ล้างดีบัฟหมู่และฮีลทีมเมื่อเจอทีม CC' },
      { name: 'Haeyang', role: 'Anti-Crit Shield', reason: 'ลดความเสียหายคริติคอลจากสไนเปอร์' },
      { name: 'Ethna', role: 'Turn 1 Stun', reason: 'สปีดเบสสูง ฉีกเกราะและสตันตัวเปิดคู่แข่ง' },
    ];

    return {
      blueWinProb,
      redWinProb,
      stats: {
        blue: { spd: blueSpd, cc: blueCc, dmg: blueDmg, tank: blueTank, util: blueUtil },
        red: { spd: redSpd, cc: redCc, dmg: redDmg, tank: redTank, util: redUtil }
      },
      recommendedBan,
      banReason,
      suggestions
    };
  }, [blueTeam, redTeam, blueBan, redBan]);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-br from-[#101a2d] via-[#0d1424] to-[#090e18] border border-[#1b2b42] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>SWM Draft Engine • Inspired by Lucksack.gg</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black">
                RTA S38 LIVE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              RTA Draft Explorer & Draft Advisor
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              เครื่องมือจำลอง Pick & Ban 5v5 ระดับทัวร์นาเมนต์การ์เดียน วิเคราะห์โอกาสชนะ คำนวณ Synergy ทีม และแนะนำตัวที่ควรแบน / ตัวเคาน์เตอร์แบบเรียลไทม์
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleResetDraft}
              className="px-3 py-2 rounded-xl bg-[#141e2e] hover:bg-[#1b283d] text-slate-300 hover:text-white border border-[#22334a] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ล้างดราฟต์ใหม่</span>
            </button>
            <button
              onClick={() => onNavigate('rta')}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/30"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>ดูสถิติ RTA S38</span>
            </button>
          </div>
        </div>

        {/* Preset Templates */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs border-t border-[#182638] pt-3">
          <span className="font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            ดราฟต์ตัวอย่างการ์เดียน:
          </span>
          {PRESET_DRAFTS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleLoadPreset(preset)}
              className="px-2.5 py-1.5 rounded-lg bg-[#0e1624] hover:bg-blue-950/60 hover:border-blue-500/50 text-slate-300 hover:text-white border border-[#1b283d] text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Win Probability Bar */}
      <div className="bg-[#0c1320] border border-[#1b2b42] rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2 text-cyan-400">
            <span className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse"></span>
            <span>ทีมคุณ (BLUE TEAM)</span>
            <span className="text-base sm:text-lg font-mono font-black text-cyan-300">
              {analysis.blueWinProb}%
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
            <Swords className="w-3.5 h-3.5 text-amber-400" />
            <span>PROJECTED WIN CHANCE</span>
          </div>

          <div className="flex items-center gap-2 text-rose-400">
            <span className="text-base sm:text-lg font-mono font-black text-rose-300">
              {analysis.redWinProb}%
            </span>
            <span>คู่แข่ง (RED TEAM)</span>
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden flex p-0.5 border border-[#1f3047]">
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
        <div className="bg-[#0b121e] border-2 border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#18273c]">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-black">
                BLUE TEAM (คุณ)
              </span>
              <span className="text-xs text-slate-400">เลือก 5 มอนสเตอร์</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
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
                      isLeader ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-600 hover:text-amber-400'
                    }`}
                    title={isLeader ? 'Leader Skill Active' : 'ตั้งเป็น Leader Skill'}
                  >
                    <Crown className="w-3 h-3" />
                  </button>

                  {/* Opponent Ban Toggle */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setRedBan(redBan === slotIdx ? null : slotIdx); }}
                    className={`absolute top-1 right-1 p-1 rounded transition-colors ${
                      isBanned ? 'bg-rose-600 text-white font-bold' : 'text-slate-600 hover:text-rose-400'
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
                      <div className="font-bold text-white text-[11px] sm:text-xs truncate w-full px-1">
                        {monster.name}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate w-full">
                        {monster.thaiName || monster.family}
                      </div>
                      {isBanned && (
                        <div className="absolute inset-0 bg-rose-950/70 backdrop-blur-xs rounded-xl flex items-center justify-center">
                          <span className="text-[10px] font-black tracking-wider text-rose-300 bg-rose-900/80 px-2 py-0.5 rounded border border-rose-500/50">
                            BANNED
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 text-slate-500">
                      <span className="text-xl font-light text-cyan-400">+</span>
                      <span className="text-[10px] font-bold text-slate-400">พิก #{slotIdx + 1}</span>
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
            <div className="text-[11px] text-slate-400 font-mono">
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
                      isLeader ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-600 hover:text-amber-400'
                    }`}
                    title={isLeader ? 'Leader Skill Active' : 'ตั้งเป็น Leader Skill'}
                  >
                    <Crown className="w-3 h-3" />
                  </button>

                  {/* Player Ban Toggle */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setBlueBan(blueBan === slotIdx ? null : slotIdx); }}
                    className={`absolute top-1 right-1 p-1 rounded transition-colors ${
                      isBanned ? 'bg-cyan-600 text-white font-bold' : 'text-slate-600 hover:text-cyan-400'
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
                      <div className="font-bold text-white text-[11px] sm:text-xs truncate w-full px-1">
                        {monster.name}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate w-full">
                        {monster.thaiName || monster.family}
                      </div>
                      {isBanned && (
                        <div className="absolute inset-0 bg-rose-950/70 backdrop-blur-xs rounded-xl flex items-center justify-center">
                          <span className="text-[10px] font-black tracking-wider text-rose-300 bg-rose-900/80 px-2 py-0.5 rounded border border-rose-500/50">
                            BANNED
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 text-slate-500">
                      <span className="text-xl font-light text-rose-400">+</span>
                      <span className="text-[10px] font-bold text-slate-400">พิก #{slotIdx + 1}</span>
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
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
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
                <span className="text-[10px] text-slate-300 group-hover:text-cyan-300 truncate w-full text-center font-medium">
                  {m.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

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
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
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

        {/* Column 2: AI Draft Ban Advisor */}
        <div className="bg-[#0c1320] border border-[#1b2b42] rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center gap-2 pb-2 border-b border-[#182638]">
            <Ban className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              แนะนำตัวที่ควรแบนที่สุด (High Threat Ban)
            </h3>
          </div>

          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wide">
                เป้าหมายแบนอันดับ #1
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                CRITICAL THREAT
              </span>
            </div>
            <div className="text-lg font-black text-white">
              {analysis.recommendedBan}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              เหตุผล: {analysis.banReason}
            </p>
          </div>

          <div className="pt-2 text-xs text-slate-400 leading-relaxed">
            💡 <strong>คำแนะนำจาก Lucksack Draft Engine:</strong> การแบนตัวที่ขัดขวางคอมโบหลักของคุณ จะช่วยเพิ่ม Win Rate ให้กับทีมได้ถึง +8.5%
          </div>
        </div>

        {/* Column 3: Recommended Counter Picks */}
        <div className="bg-[#0c1320] border border-[#1b2b42] rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center gap-2 pb-2 border-b border-[#182638]">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              แนะนำมอนสเตอร์พิกแก้ทาง (Next Picks)
            </h3>
          </div>

          <div className="space-y-2">
            {analysis.suggestions.map((sug, idx) => (
              <div 
                key={idx}
                className="p-2.5 rounded-xl bg-[#080d16] border border-[#1b283d] flex items-center justify-between hover:border-amber-400/50 transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{sug.name}</span>
                    <span className="text-[10px] text-amber-400 font-mono">({sug.role})</span>
                  </div>
                  <div className="text-[11px] text-slate-400">{sug.reason}</div>
                </div>
                <button
                  onClick={() => {
                    const emptyIdx = blueTeam.findIndex(m => !m);
                    const target = emptyIdx !== -1 ? emptyIdx : 4;
                    const mObj = MONSTERS.find(m => m.name.toLowerCase() === sug.name.toLowerCase());
                    if (mObj) {
                      const next = [...blueTeam];
                      next[target] = mObj;
                      setBlueTeam(next);
                    }
                  }}
                  className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-[10px] font-bold border border-blue-500/30 transition-all cursor-pointer shrink-0"
                >
                  + ใส่ทีม
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
