import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Crown,
  Star,
  Zap,
  TrendingUp,
  RotateCcw,
  Calendar,
  Layers,
  ChevronRight,
  Flame,
  HelpCircle,
  Coins,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import MonsterAvatar from './MonsterAvatar';
import {
  calculateGachaProbabilities,
  calculateWishlistOdds,
  calculateSaltIndex,
  calculateTimeline,
  POPULAR_DREAM_LD5S,
  TOTAL_SUMMONABLE_LD5_COUNT,
  GACHA_RATES
} from '../utils/gachaPredictor';

export default function GachaLuckPredictor({ onNavigate }) {
  // Inventory of scrolls
  const [inventory, setInventory] = useState({
    mystical: 120,
    ld: 15,
    legendary: 5,
    allAttribute: 2,
    transcendence: 0,
    legendaryLd: 0,
    summoningStones: 500,
  });

  // Selected Wishlist Monster
  const [selectedWishlistMonster, setSelectedWishlistMonster] = useState(POPULAR_DREAM_LD5S[0]);

  // Wishlist summon simulation result
  const [wishlistSimResult, setWishlistSimResult] = useState(null);
  const [isSimulatingWishlist, setIsSimulatingWishlist] = useState(false);

  // Dry streak for Salt Gauge
  const [dryStreakLd, setDryStreakLd] = useState(180);

  // Farming pace for timeline (monthly LD scrolls)
  const [monthlyPace, setMonthlyPace] = useState(15);

  // Handle inventory input change
  const handleCountChange = (field, delta) => {
    setInventory((prev) => ({
      ...prev,
      [field]: Math.max(0, (Number(prev[field]) || 0) + delta),
    }));
  };

  const handleSetCount = (field, val) => {
    setInventory((prev) => ({
      ...prev,
      [field]: Math.max(0, Number(val) || 0),
    }));
  };

  // Quick Preset Packs
  const applyPreset = (presetKey) => {
    if (presetKey === 'f2p') {
      setInventory({ mystical: 150, ld: 12, legendary: 6, allAttribute: 2, transcendence: 0, legendaryLd: 0, summoningStones: 750 });
    } else if (presetKey === 'streamer') {
      setInventory({ mystical: 500, ld: 45, legendary: 25, allAttribute: 10, transcendence: 1, legendaryLd: 2, summoningStones: 2500 });
    } else if (presetKey === 'ld_only') {
      setInventory({ mystical: 0, ld: 30, legendary: 0, allAttribute: 0, transcendence: 0, legendaryLd: 3, summoningStones: 0 });
    }
  };

  // Calculate Overall Probabilities
  const probData = useMemo(() => {
    return calculateGachaProbabilities(inventory);
  }, [inventory]);

  // Calculate Wishlist Odds
  const wishlistOdds = useMemo(() => {
    return calculateWishlistOdds(inventory);
  }, [inventory]);

  // Calculate Salt Index
  const saltData = useMemo(() => {
    return calculateSaltIndex(dryStreakLd);
  }, [dryStreakLd]);

  // Calculate Timeline
  const timelineData = useMemo(() => {
    return calculateTimeline(inventory.ld, monthlyPace);
  }, [inventory.ld, monthlyPace]);

  // Run Wishlist Pull Simulator until target monster is pulled
  const runWishlistSimulation = () => {
    setIsSimulatingWishlist(true);
    setWishlistSimResult(null);

    setTimeout(() => {
      // Single LD pull chance for specific LD5 = 0.0035 / TOTAL_SUMMONABLE_LD5_COUNT
      const specificRate = GACHA_RATES.ld.ld5 / TOTAL_SUMMONABLE_LD5_COUNT;
      let pulls = 0;
      let found = false;
      const maxPulls = 80000;

      while (!found && pulls < maxPulls) {
        pulls++;
        if (Math.random() < specificRate) {
          found = true;
          break;
        }
      }

      const costThb = pulls * GACHA_RATES.ld.costThb;
      setWishlistSimResult({
        pulls,
        found,
        costThb,
        monsterName: selectedWishlistMonster.name,
        thaiName: selectedWishlistMonster.thaiName,
      });
      setIsSimulatingWishlist(false);
    }, 400);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Probability Showcase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Regular Nat5 Probability Card */}
        <div className="relative rounded-3xl p-6 sm:p-7 border border-blue-500/30 bg-gradient-to-br from-[#0c1527] via-[#090e1a] to-[#070b14] shadow-2xl overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
                <span>โอกาสได้มอนสเตอร์ 5★ ทั่วไป</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-lg">
                รวม {probData.totalSummons} ม้วน
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-blue-400 font-mono">
                {probData.probAtLeastOneNat5}%
              </span>
              <span className="text-xs text-slate-400">โอกาสได้ $\ge$ 1 ตัว</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden border border-white/5">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, probData.probAtLeastOneNat5)}%` }}
              />
            </div>

            <div className="text-xs text-slate-300 flex items-center justify-between pt-1">
              <span>มูลค่าคัมภีร์ในคลัง: <strong className="text-white font-mono">฿{probData.totalValueThb.toLocaleString()}</strong></span>
              <span className="text-blue-300 font-bold">
                {probData.probAtLeastOneNat5 >= 80 ? '🔥 โอกาสแตกสูงมาก' : probData.probAtLeastOneNat5 >= 50 ? '✨ โอกาสเกินครึ่ง' : 'สะสมเพิ่มเพื่อความชัวร์'}
              </span>
            </div>
          </div>
        </div>

        {/* LD 5★ Probability Card */}
        <div className="relative rounded-3xl p-6 sm:p-7 border border-amber-500/40 bg-gradient-to-br from-[#1c1208] via-[#120c06] to-[#0a0703] shadow-2xl shadow-amber-500/10 overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>โอกาสได้มอนสเตอร์แสง-มืด LD 5★</span>
              </span>
              <span className="text-[11px] font-mono text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                เรตแท้ 0.35%
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 font-mono">
                {probData.probAtLeastOneLd5}%
              </span>
              <span className="text-xs text-slate-400">โอกาสได้ $\ge$ 1 ตัว</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden border border-white/5">
              <div
                className="bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(2, probData.probAtLeastOneLd5))}%` }}
              />
            </div>

            <div className="text-xs text-slate-300 flex items-center justify-between pt-1">
              <span>คัมภีร์ LD ในมือ: <strong className="text-amber-300 font-mono">{inventory.ld}</strong> ม้วน</span>
              <span className="text-amber-400 font-bold">
                {probData.probAtLeastOneLd5 >= 50 ? '👑 แสงมืดระดับตำนาน' : probData.probAtLeastOneLd5 >= 15 ? '⚡ ลุ้นสายฟ้าม่วงได้เลย' : 'ต้องอาศัยแต้มบุญ'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Scroll Inventory Input Section */}
      <div className="rounded-3xl border border-white/[0.08] bg-[#0a0f19]/80 backdrop-blur-xl p-5 sm:p-7 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              <span>กรอกจำนวนคัมภีร์ที่มีในคลังของคุณ (Scroll Inventory)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              ระบบจะคำนวณความน่าจะเป็นสะสมแบบทวินาม (Binomial Distribution) อัตโนมัติทันที
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 font-medium mr-1">สูตรสำเร็จ:</span>
            <button
              onClick={() => applyPreset('f2p')}
              className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition cursor-pointer"
            >
              สายฟรี 3 เดือน
            </button>
            <button
              onClick={() => applyPreset('streamer')}
              className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 text-xs font-semibold transition cursor-pointer"
            >
              เปิดกล่องใหญ่
            </button>
            <button
              onClick={() => applyPreset('ld_only')}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-xs font-semibold transition cursor-pointer"
            >
              เฉพาะ LD
            </button>
          </div>
        </div>

        {/* Scroll Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Mystical Scrolls */}
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span className="flex items-center gap-1.5">📜 คัมภีร์เวทมนตร์ (MS)</span>
              <span className="text-[10px] text-slate-400 font-mono">0.50%</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCountChange('mystical', -10)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                value={inventory.mystical}
                onChange={(e) => handleSetCount('mystical', e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg py-1.5 text-center font-mono font-bold text-white text-sm focus:outline-none focus:border-blue-400"
              />
              <button
                onClick={() => handleCountChange('mystical', 10)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* LD Scrolls */}
          <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-purple-200">
              <span className="flex items-center gap-1.5">🌙 คัมภีร์แสง-มืด (LD)</span>
              <span className="text-[10px] text-purple-300 font-mono">0.35%</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCountChange('ld', -5)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                value={inventory.ld}
                onChange={(e) => handleSetCount('ld', e.target.value)}
                className="w-full bg-slate-900 border border-purple-500/40 rounded-lg py-1.5 text-center font-mono font-bold text-amber-300 text-sm focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={() => handleCountChange('ld', 5)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Legendary Scrolls */}
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span className="flex items-center gap-1.5">👑 คัมภีร์ในตำนาน (LS)</span>
              <span className="text-[10px] text-slate-400 font-mono">6.50%</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCountChange('legendary', -1)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                value={inventory.legendary}
                onChange={(e) => handleSetCount('legendary', e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg py-1.5 text-center font-mono font-bold text-white text-sm focus:outline-none focus:border-blue-400"
              />
              <button
                onClick={() => handleCountChange('legendary', 1)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Transcendence Scrolls */}
          <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-200">
              <span className="flex items-center gap-1.5">🌟 ข้ามภพ (Trans)</span>
              <span className="text-[10px] text-amber-300 font-mono font-bold">100%</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCountChange('transcendence', -1)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                value={inventory.transcendence}
                onChange={(e) => handleSetCount('transcendence', e.target.value)}
                className="w-full bg-slate-900 border border-amber-500/40 rounded-lg py-1.5 text-center font-mono font-bold text-amber-300 text-sm focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={() => handleCountChange('transcendence', 1)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Dream Monster Wishlist & Specific Odds */}
      <div className="rounded-3xl border border-white/[0.08] bg-[#0a0f19]/80 backdrop-blur-xl p-5 sm:p-7 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>DREAM MONSTER WISHLIST • ตัวในฝัน</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              คำนวณโอกาสเปิดได้มอนสเตอร์ที่คุณต้องการโดยเฉพาะ
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              จากคลัง LD5 ที่สามารถสุ่มได้ทั้งหมด {TOTAL_SUMMONABLE_LD5_COUNT} ตัวในเกม
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-right shrink-0">
            <div className="text-[11px] text-amber-300 font-medium">โอกาสที่จะได้ตัวนี้จากคลังของคุณ</div>
            <div className="text-2xl font-black text-amber-300 font-mono mt-0.5">
              {wishlistOdds.probSpecificPercent}%
            </div>
            <div className="text-[10px] text-slate-400">อัตราเดี่ยว 1 ใน {wishlistOdds.oneInX.toLocaleString()} ม้วน</div>
          </div>
        </div>

        {/* Popular LD5 Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {POPULAR_DREAM_LD5S.map((m) => {
            const isSelected = selectedWishlistMonster.name === m.name;
            return (
              <button
                key={m.name}
                onClick={() => {
                  setSelectedWishlistMonster(m);
                  setWishlistSimResult(null);
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400'
                    : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">{m.name}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${m.element === 'light' ? 'bg-amber-400/20 text-amber-300' : 'bg-purple-500/20 text-purple-300'}`}>
                      {m.element.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">{m.thaiName}</div>
                </div>
                <div className="text-[9px] text-slate-500 leading-tight line-clamp-2">
                  {m.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Instant Wishlist Pull Simulator */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>อยากรู้ไหมว่าต้องเปิดกี่ม้วนถึงจะได้ <strong>{selectedWishlistMonster.name}</strong>?</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              กดจำลองเปิดสุ่มแบบ Real-time จนกว่าจะเจอตัวในฝัน
            </div>
          </div>

          <button
            onClick={runWishlistSimulation}
            disabled={isSimulatingWishlist}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isSimulatingWishlist ? 'กำลังสุ่มจนกว่าจะเจอ...' : `🧪 จำลองเปิดหา ${selectedWishlistMonster.name} ทันที`}
          </button>
        </div>

        {/* Wishlist Simulator Result Banner */}
        {wishlistSimResult && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-slate-900 border border-amber-500/40 text-xs sm:text-sm text-amber-200 animate-in fade-in zoom-in-95 duration-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-white text-base">
              <span>🎉 สำเร็จ! สุ่มได้ {wishlistSimResult.monsterName} ({wishlistSimResult.thaiName}) แล้ว!</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/20">
                <span className="text-[11px] text-slate-400 block">จำนวนม้วน LD ที่ใช้ไป</span>
                <span className="text-xl font-mono font-black text-amber-300">{wishlistSimResult.pulls.toLocaleString()} ม้วน</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/20">
                <span className="text-[11px] text-slate-400 block">มูลค่าเงินจริงโดยประมาณ</span>
                <span className="text-xl font-mono font-black text-white">฿{wishlistSimResult.costThb.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/20">
                <span className="text-[11px] text-slate-400 block">ความยากของสถิติ</span>
                <span className="text-xl font-mono font-black text-cyan-300">
                  {wishlistSimResult.pulls < 10000 ? 'ดวงดีมาก!' : wishlistSimResult.pulls < 30000 ? 'ตามเกณฑ์เฉลี่ย' : 'สู้ชีวิตสุดๆ'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Salt Index & Luck Gauge (มาตรวัดความเกลือ) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-white/[0.08] bg-[#0a0f19]/80 backdrop-blur-xl p-5 sm:p-7 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div>
              <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-400" />
                <span>SALT & LUCK GAUGE • มาตรวัดความเกลือ</span>
              </span>
              <h4 className="text-lg font-black text-white mt-1">
                สถิติความเกลือสะสมของคุณ
              </h4>
            </div>
            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${saltData.badge}`}>
              {saltData.grade}
            </span>
          </div>

          <div className="space-y-3">
            <label className="text-xs text-slate-300 block">
              จำนวนคัมภีร์แสง-มืด (LD) ที่เปิดสะสมไปแล้วแต่ยังไม่ออก LD5:
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="1000"
                step="10"
                value={dryStreakLd}
                onChange={(e) => setDryStreakLd(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <span className="text-base font-mono font-black text-white w-20 text-right">
                {dryStreakLd} ม้วน
              </span>
            </div>
          </div>

          {/* Salt Level Feedback */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">ระดับความซวยเมื่อเทียบกับผู้เล่นทั่วโลก:</span>
              <span className={`font-mono font-bold text-sm ${saltData.color}`}>
                ซวยกว่า {saltData.unluckierThanPercent}% ของผู้เล่น
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${saltData.unluckierThanPercent}%` }}
              />
            </div>
            <p className="text-xs text-slate-300 pt-1 leading-relaxed">
              💡 {saltData.desc}
            </p>
          </div>
        </div>

        {/* 5. Timeline Predictor (ต้องเก็บอีกกี่วัน?) */}
        <div className="rounded-3xl border border-white/[0.08] bg-[#0a0f19]/80 backdrop-blur-xl p-5 sm:p-7 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div>
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>TIMELINE PREDICTOR • คาดการณ์วันได้ LD5</span>
              </span>
              <h4 className="text-lg font-black text-white mt-1">
                จะต้องใช้เวลาอีกประมาณกี่วัน?
              </h4>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs text-slate-300 block">
              อัตราการฟาร์มคัมภีร์ LD ของคุณ (เฉลี่ยต่อเดือน):
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'สายฟรีทั่วไป', pace: 10 },
                { label: 'สายฟาร์มหนัก', pace: 18 },
                { label: 'สายเปย์แพ็กเกจ', pace: 35 },
              ].map((item) => (
                <button
                  key={item.pace}
                  onClick={() => setMonthlyPace(item.pace)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition cursor-pointer ${
                    monthlyPace === item.pace
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold'
                      : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <div>{item.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{item.pace} ม้วน/ด.</div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">คาดการณ์วันที่โอกาสแตะ 50%:</span>
              <span className="text-sm font-black text-cyan-300 font-mono">{timelineData.targetDateThai}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>ต้องสะสม LD เพิ่มอีกประมาณ:</span>
              <span className="font-mono font-bold text-white">{timelineData.remainingTo50} ม้วน (~{timelineData.monthsTo50} เดือน)</span>
            </div>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-white/5 leading-relaxed">
              *การคำนวณอ้างอิงจากเกณฑ์มัธยฐาน 198 ม้วนตามสถิติของเกม Summoners War
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
