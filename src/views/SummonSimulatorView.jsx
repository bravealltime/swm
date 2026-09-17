import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  Trophy, 
  Crown, 
  Star, 
  Zap, 
  Coins, 
  History, 
  Award,
  Layers,
  ChevronRight,
  Shield
} from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import allMonstersData from '../data/allMonsters.json';
import { isNonSummonableLd5 } from '../utils/swexImport';

// Approximate in-game shop value per scroll
const SCROLL_TYPES = [
  {
    id: 'ld',
    name: 'คัมภีร์แสง-มืด (LD Scroll)',
    icon: '🌙',
    costThb: 990,
    costUsd: 29.99,
    accent: 'from-purple-600 via-indigo-600 to-amber-500',
    border: 'border-purple-500/40',
    bg: 'bg-purple-950/20',
    rates: { nat5: 0.0035, nat4: 0.08, nat3: 0.9165 },
    rateDesc: '5★: 0.35% • 4★: 8.0% • 3★: 91.65%',
    elements: ['light', 'dark'],
  },
  {
    id: 'mystical',
    name: 'คัมภีร์เวทมนตร์ (Mystical Scroll)',
    icon: '📜',
    costThb: 49,
    costUsd: 1.49,
    accent: 'from-blue-600 via-cyan-600 to-sky-500',
    border: 'border-blue-500/40',
    bg: 'bg-blue-950/20',
    rates: { nat5: 0.005, nat4: 0.08, nat3: 0.915 },
    rateDesc: '5★: 0.50% • 4★: 8.0% • 3★: 91.50%',
    elements: ['water', 'fire', 'wind'],
  },
  {
    id: 'transcendence',
    name: 'คัมภีร์ข้ามภพ (Transcendence Scroll)',
    icon: '👑',
    costThb: 3500,
    costUsd: 99.99,
    accent: 'from-amber-500 via-yellow-500 to-orange-500',
    border: 'border-amber-500/40',
    bg: 'bg-amber-950/20',
    rates: { nat5: 1.0, nat4: 0, nat3: 0 },
    rateDesc: 'การันตี 5★ แท้ 100%',
    elements: ['water', 'fire', 'wind'],
  },
  {
    id: 'legendary_ld',
    name: 'คัมภีร์แสง-มืดในตำนาน (Legendary LD)',
    icon: '✨',
    costThb: 4900,
    costUsd: 149.99,
    accent: 'from-yellow-400 via-purple-600 to-pink-600',
    border: 'border-yellow-500/40',
    bg: 'bg-yellow-950/20',
    rates: { nat5: 0.065, nat4: 0.935, nat3: 0 },
    rateDesc: '5★: 6.50% • 4★: 93.50%',
    elements: ['light', 'dark'],
  },
];

export default function SummonSimulatorView({ onNavigate }) {
  const [selectedScrollId, setSelectedScrollId] = useState('ld');
  const [isSummoning, setIsSummoning] = useState(false);
  const [latestPull, setLatestPull] = useState(null);
  const [recentBatch, setRecentBatch] = useState([]);
  const [history, setHistory] = useState([]);
  const [lightningGrade, setLightningGrade] = useState(null);

  const currentScroll = useMemo(() => {
    return SCROLL_TYPES.find((s) => s.id === selectedScrollId) || SCROLL_TYPES[0];
  }, [selectedScrollId]);

  // Monster pools categorized by elements & stars
  const pools = useMemo(() => {
    const p = {
      ld: { nat5: [], nat4: [], nat3: [] },
      elemental: { nat5: [], nat4: [], nat3: [] },
    };

    allMonstersData.forEach((m) => {
      const ele = (m.element || '').toLowerCase();
      const isLd = ele === 'light' || ele === 'dark';
      const stars = m.natural_stars || m.default_stars || m.stars || 3;
      if (m.name && m.name.includes('(Homunculus)')) return;

      if (isLd) {
        if (stars === 5 && !isNonSummonableLd5(m)) p.ld.nat5.push(m);
        else if (stars === 4) p.ld.nat4.push(m);
        else if (stars === 3) p.ld.nat3.push(m);
      } else {
        if (stars === 5) p.elemental.nat5.push(m);
        else if (stars === 4) p.elemental.nat4.push(m);
        else if (stars === 3) p.elemental.nat3.push(m);
      }
    });

    return p;
  }, []);

  // Stats
  const stats = useMemo(() => {
    const total = history.length;
    const nat5Count = history.filter((h) => h.stars === 5).length;
    const ld5Count = history.filter((h) => h.stars === 5 && (h.element === 'light' || h.element === 'dark')).length;
    const nat4Count = history.filter((h) => h.stars === 4).length;
    const totalCostThb = history.reduce((sum, h) => sum + (h.costThb || 0), 0);
    const totalCostUsd = history.reduce((sum, h) => sum + (h.costUsd || 0), 0);
    const scrollsPerNat5 = nat5Count > 0 ? Math.round(total / nat5Count) : total;

    return {
      total,
      nat5Count,
      ld5Count,
      nat4Count,
      totalCostThb,
      totalCostUsd,
      scrollsPerNat5,
    };
  }, [history]);

  const rollSingle = (scroll) => {
    const rand = Math.random();
    const isLdScroll = scroll.elements.includes('light');
    const targetPools = isLdScroll ? pools.ld : pools.elemental;

    let targetStar = 3;
    if (rand < scroll.rates.nat5) {
      targetStar = 5;
    } else if (rand < scroll.rates.nat5 + scroll.rates.nat4) {
      targetStar = 4;
    }

    const monsterList = targetStar === 5 
      ? targetPools.nat5 
      : targetStar === 4 
      ? targetPools.nat4 
      : targetPools.nat3;

    const chosen = monsterList.length > 0 
      ? monsterList[Math.floor(Math.random() * monsterList.length)] 
      : { name: 'Unknown Monster', element: isLdScroll ? 'dark' : 'fire', stars: targetStar };

    return {
      ...chosen,
      stars: targetStar,
      pulledAt: new Date().toLocaleTimeString('th-TH'),
      costThb: scroll.costThb,
      costUsd: scroll.costUsd,
      scrollName: scroll.name,
      scrollIcon: scroll.icon,
      isLd5: targetStar === 5 && isLdScroll,
    };
  };

  const handleSummon = (count = 1) => {
    if (isSummoning) return;
    setIsSummoning(true);

    const batch = [];
    let highestGrade = null;

    for (let i = 0; i < count; i++) {
      const pull = rollSingle(currentScroll);
      batch.push(pull);
      if (pull.isLd5) highestGrade = 'ld5';
      else if (pull.stars === 5 && highestGrade !== 'ld5') highestGrade = 'nat5';
      else if (pull.stars === 4 && !highestGrade) highestGrade = 'nat4';
    }

    setLightningGrade(highestGrade);

    setTimeout(() => {
      setRecentBatch(batch);
      setLatestPull(batch[batch.length - 1]);
      setHistory((prev) => [...batch, ...prev]);
      setIsSummoning(false);
    }, count === 1 ? 400 : 600);
  };

  const handleClearHistory = () => {
    setHistory([]);
    setRecentBatch([]);
    setLatestPull(null);
    setLightningGrade(null);
  };

  return (
    <div className="space-y-6 max-w-[1780px] 2xl:max-w-[1880px] mx-auto pb-16 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#120b24] via-[#090d16] to-[#0a1524] p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>SWM Summoning Portal • จำลองเปิดกาชาเสมือนจริง</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <span>ตู้จำลองเปิดคัมภีร์แสง-มืด & กาชาพรีเมียม</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              ทดสอบดวงของคุณด้วยเรตสุ่มแท้ตามมาตรฐาน Summoners War (LD 5★ = 0.35%) พร้อมคำนวณมูลค่าเงินจริงและตัววัดดวง (Pity Tracker)
            </p>
          </div>

          {/* Quick Counter Stats */}
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-center min-w-[90px]">
              <div className="text-[10px] text-slate-400 font-bold uppercase">เปิดไปแล้ว</div>
              <div className="text-xl font-black text-white font-mono mt-0.5">{stats.total}</div>
              <div className="text-[10px] text-slate-400">ม้วน</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 text-center min-w-[90px]">
              <div className="text-[10px] text-amber-300 font-bold uppercase flex items-center justify-center gap-1">
                <Crown className="w-3 h-3 text-yellow-300" /> ได้ LD 5★
              </div>
              <div className="text-xl font-black text-yellow-300 font-mono mt-0.5">{stats.ld5Count}</div>
              <div className="text-[10px] text-yellow-400 font-semibold">ตัวระดับโลก</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Scroll Type Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SCROLL_TYPES.map((s) => {
          const isSelected = selectedScrollId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedScrollId(s.id)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3 ${
                isSelected
                  ? `${s.bg} ${s.border} shadow-lg ring-1 ring-white/20`
                  : 'bg-[#0a0f19]/80 border-white/[0.06] hover:border-white/20 hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{s.icon}</span>
                <span className="text-[11px] font-mono font-bold text-slate-400 bg-white/[0.05] px-2 py-0.5 rounded-lg border border-white/5">
                  ฿{s.costThb.toLocaleString()}
                </span>
              </div>

              <div>
                <div className="text-sm font-black text-white">{s.name}</div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">{s.rateDesc}</div>
              </div>

              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-purple-400 to-cyan-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Main Summoning Altar */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#110e24] via-[#070b12] to-black p-6 sm:p-10 shadow-2xl text-center">
        {lightningGrade === 'ld5' && (
          <div className="absolute inset-0 bg-purple-600/20 animate-pulse pointer-events-none" />
        )}
        {lightningGrade === 'nat5' && (
          <div className="absolute inset-0 bg-amber-500/15 animate-pulse pointer-events-none" />
        )}

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          {/* Summon Altar Circle */}
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 mx-auto flex items-center justify-center">
            <div className={`absolute inset-0 rounded-full border-2 border-dashed ${isSummoning ? 'animate-spin border-amber-400' : 'border-white/15'}`} />
            <div className={`absolute inset-3 rounded-full border ${isSummoning ? 'border-purple-400 animate-ping opacity-30' : 'border-white/10'}`} />
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-purple-900/40 via-blue-900/40 to-slate-900 border border-white/20 shadow-2xl flex flex-col items-center justify-center gap-1">
              <span className="text-4xl sm:text-5xl">{currentScroll.icon}</span>
              <span className="text-[10px] font-bold text-slate-300 font-mono">SUMMON PORTAL</span>
            </div>
          </div>

          {/* Summon Controls */}
          <div className="space-y-3">
            <div className="text-xs text-slate-400">
              กำลังใช้ <strong className="text-white">{currentScroll.name}</strong> • มูลค่าต่อม้วนประมาณ ฿{currentScroll.costThb.toLocaleString()} ({currentScroll.costUsd} USD)
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => handleSummon(1)}
                disabled={isSummoning}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-blue-600/25 transition-all cursor-pointer flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-cyan-300" />
                <span>เปิด 1 ม้วน</span>
              </button>

              <button
                onClick={() => handleSummon(10)}
                disabled={isSummoning}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-slate-950 text-sm font-black shadow-lg shadow-amber-500/25 transition-all cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>เปิดรวดเดียว 10 ม้วน (10+1)</span>
              </button>

              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="px-4 py-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/10 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>รีเซ็ตประวัติ</span>
                </button>
              )}
            </div>
          </div>

          {/* Recent Batch Result Display */}
          {recentBatch.length > 0 && (
            <div className="pt-6 border-t border-white/[0.08] space-y-3 animate-in fade-in">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-center gap-2">
                <span>ผลการสุ่มล่าสุด ({recentBatch.length} ตัว):</span>
                {recentBatch.some((p) => p.isLd5) && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-black uppercase tracking-wider animate-bounce">
                    🎉 คัมภีร์แตก! ได้ LD 5★ ระดับตำนาน!
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {recentBatch.map((p, idx) => {
                  const isNat5 = p.stars === 5;
                  return (
                    <div
                      key={idx}
                      onClick={() => onNavigate('where2use', { initialMonster: p.name })}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer hover:scale-105 flex flex-col items-center gap-1.5 text-center min-w-[95px] max-w-[115px] ${
                        p.isLd5
                          ? 'border-yellow-400 bg-gradient-to-b from-yellow-950/40 to-[#0a0f19] shadow-xl shadow-yellow-500/20 ring-2 ring-yellow-400/50'
                          : isNat5
                          ? 'border-amber-500/60 bg-amber-950/20 shadow-md'
                          : p.stars === 4
                          ? 'border-purple-500/40 bg-purple-950/15'
                          : 'border-white/5 bg-white/[0.02]'
                      }`}
                    >
                      <div className="relative">
                        <MonsterAvatar monster={p} size={50} className="rounded-2xl" />
                        <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-slate-900 border border-white/10 text-[9px] font-bold font-mono text-amber-300">
                          {p.stars}★
                        </span>
                      </div>
                      <div className="text-[11px] font-bold text-white truncate max-w-full">
                        {p.name}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate max-w-full">
                        {p.thaiName && p.thaiName !== p.name ? p.thaiName : p.element}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Real-Cost & Pity Summary Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#0a0f19]/80 border border-white/[0.08] text-center">
          <div className="text-xs text-slate-400 font-medium">มูลค่าเงินจำลองที่ใช้ไป</div>
          <div className="text-lg sm:text-xl font-black text-rose-400 font-mono mt-1">
            ฿{stats.totalCostThb.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">~${stats.totalCostUsd.toFixed(2)} USD</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a0f19]/80 border border-white/[0.08] text-center">
          <div className="text-xs text-slate-400 font-medium">เฉลี่ยม้วนต่อ 5 ดาว</div>
          <div className="text-lg sm:text-xl font-black text-cyan-400 font-mono mt-1">
            {stats.scrollsPerNat5} <span className="text-xs text-slate-400">ม้วน</span>
          </div>
          <div className="text-[10px] text-slate-500">ได้ 5★ รวม {stats.nat5Count} ตัว</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a0f19]/80 border border-white/[0.08] text-center">
          <div className="text-xs text-slate-400 font-medium">มอนสเตอร์ 4 ดาวแท้</div>
          <div className="text-lg sm:text-xl font-black text-purple-400 font-mono mt-1">
            {stats.nat4Count} <span className="text-xs text-slate-400">ตัว</span>
          </div>
          <div className="text-[10px] text-purple-300 font-mono">
            {stats.total > 0 ? ((stats.nat4Count / stats.total) * 100).toFixed(1) : 0}% ของทั้งหมด
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a0f19]/80 border border-white/[0.08] text-center">
          <div className="text-xs text-slate-400 font-medium">มอนสเตอร์ 3 ดาว</div>
          <div className="text-lg sm:text-xl font-black text-slate-300 font-mono mt-1">
            {stats.total - stats.nat5Count - stats.nat4Count} <span className="text-xs text-slate-400">ตัว</span>
          </div>
          <div className="text-[10px] text-slate-500">วัตถุดิบปั้นตัว</div>
        </div>
      </div>

      {/* 5. Complete Summon History Log */}
      <div className="rounded-3xl border border-white/[0.08] bg-[#0a0f19]/80 backdrop-blur-xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm sm:text-base font-black text-white">ประวัติการสุ่มทั้งหมด</h3>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-300 text-xs font-mono font-bold">
              {history.length} รายการ
            </span>
          </div>

          {stats.ld5Count > 0 && (
            <div className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>ยินดีด้วย! คุณมี LD 5★ ในสถิติตู้นี้</span>
            </div>
          )}
        </div>

        {history.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
            {history.map((item, idx) => (
              <div
                key={idx}
                onClick={() => onNavigate('where2use', { initialMonster: item.name })}
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer hover:border-white/30 ${
                  item.isLd5
                    ? 'border-yellow-400/60 bg-yellow-950/20 shadow-md'
                    : item.stars === 5
                    ? 'border-amber-500/40 bg-amber-950/15'
                    : item.stars === 4
                    ? 'border-purple-500/30 bg-purple-950/10'
                    : 'border-white/5 bg-white/[0.02]'
                }`}
              >
                <MonsterAvatar monster={item} size={36} className="rounded-xl shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-white truncate">{item.name}</div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span className="text-amber-300 font-mono font-bold">{item.stars}★</span>
                    <span className="text-[9px] font-mono">{item.pulledAt}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            ยังไม่มีประวัติการสุ่ม กดปุ่ม "เปิด 1 ม้วน" หรือ "เปิด 10 ม้วน" ด้านบนเพื่อเริ่มทดสอบดวงของคุณ!
          </div>
        )}
      </div>
    </div>
  );
}