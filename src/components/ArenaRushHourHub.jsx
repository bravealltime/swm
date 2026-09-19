import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Shield, 
  Swords, 
  Zap, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  RotateCcw,
  Sparkles,
  Info,
  Calendar
} from 'lucide-react';
import MonsterAvatar from './MonsterAvatar';

const SERVERS = [
  { id: 'asia', name: 'เซิร์ฟเวอร์ Asia', offset: 7, label: 'เวลาไทย (UTC+7) ปิด 21:00', closeHour: 21 },
  { id: 'global', name: 'เซิร์ฟเวอร์ Global', offset: -8, label: 'เวลาแปซิฟิก (PST / UTC-8) ปิด 22:00', closeHour: 22 },
  { id: 'europe', name: 'เซิร์ฟเวอร์ Europe', offset: 1, label: 'เวลายุโรป (CET / UTC+1) ปิด 22:00', closeHour: 22 },
];

const AD_COUNTERS = [
  {
    enemyLead: 'Psamathe (สปีดลีด 33%) + Clara / Stripper',
    enemyType: 'Speed Threat',
    bestAo: 'Leo + Bastet + Double Lushen / Julie',
    aoArchetype: 'Leo Setup (Zero SPD)',
    clearTime: '15-20 วินาที',
    whyItWorks: 'พาสซีฟของ Leo จะล็อคสปีด Clara และ Psamathe ให้เหลือเท่า Leo ทำให้เราแซงออกเทิร์นแรกและสับกล่องชนะได้ 100%',
    warning: 'ระวังถ้าศัตรูใส่ Will ทั้งทีม หรือมีตัว Nemesis Healer หลายตัว'
  },
  {
    enemyLead: 'Vanessa + Camilla + Byungchul + Ariel (ทีมถึกต้าน Lushen)',
    enemyType: 'Anti-Cleave Stall',
    bestAo: 'Seara + Liebli / John + Bastet + Tiana (Bomb Cleave)',
    aoArchetype: 'Bomb Cleave หรือ Bolverk Mo Long',
    clearTime: '20-30 วินาที',
    whyItWorks: 'ระเบิดไม่สนใจค่า DEF และไม่ติดแกลนซิ่งจากธาตุไฟ/น้ำ/ลม Camilla และ Byungchul จะโดนดาเมจเต็ม 40k+ ทันที',
    warning: 'ต้องมั่นใจว่า Tiana ล้างบัฟ Will ออกหมด และระเบิดลงติด 100%'
  },
  {
    enemyLead: 'Karnal + Camilla + Abellio + Halphas (ทีมกำแพง 15 นาทีสุดท้าย)',
    enemyType: 'Rush Hour Stall',
    bestAo: 'Tiana + Galleon + Zaiross + Kaki หรือ Bolverk Mo Long',
    aoArchetype: 'Fast Strip หรือ Bruiser Percent HP',
    clearTime: '30-45 วินาที',
    whyItWorks: 'Tiana ล้างอมตะของ Halphas ไม่สนค่าความต้านทาน Zaiross รีเซ็ตคูลดาวน์ไม่ให้อมตะทำงานอีก',
    warning: 'ช่วง 10 นาทีสุดท้าย หากไม่ชัวร์ แนะนำ "ข้าม" ไปตีเป้าหมายอื่นที่เร็วกว่าเพื่อประหยัดเวลา'
  },
  {
    enemyLead: 'Triton / Chiwu + Fast Pushback',
    enemyType: 'Fast Strip',
    bestAo: 'Shield / Will Slow Cleave (Tiana Galleon Zaiross Kaki)',
    aoArchetype: 'Shield/Will Turn-2',
    clearTime: '18-25 วินาที',
    whyItWorks: 'ใส่วิล 2-3 ชั้นและชิลด์หนา ปล่อยให้ Triton ล้างไป ดาเมจชุดแรกศัตรูทำอะไรเราไม่ได้ แล้ว Tiana ค่อยล้างสวนกวาดทีม',
    warning: 'อย่าเอาทีมที่ไม่มี Will หรือสปีดกึ่งช้าไปลง เพราะจะโดนขัดเทิร์นจนแพ้'
  },
  {
    enemyLead: 'Leo + Feng Yan / Ragdoll',
    enemyType: 'Bruiser Turn-2',
    bestAo: 'Bolverk + Mo Long + Aaliyah + Woosa',
    aoArchetype: 'Safe HP Shredder',
    clearTime: '45-60 วินาที',
    whyItWorks: 'Bolverk ดูดเลือด 50% และ Mo Long สกิล 3 ตัดเลือด 70% ฆ่าบรูเซอร์เลือดหนาได้โดยไม่สนใจเกราะหรือพาสซีฟลดดาเมจ',
    warning: 'ใช้เวลาต่อสู้นาน ไม่เหมาะสำหรับช่วง 15 นาทีสุดท้ายของ Rush Hour'
  }
];

export default function ArenaRushHourHub({ onNavigate }) {
  const [selectedServer, setSelectedServer] = useState('asia');
  const [now, setNow] = useState(new Date());

  // Wing calculator state
  const [currentScore, setCurrentScore] = useState(1650); // C2
  const [targetScore, setTargetScore] = useState(1850); // G1
  const [winRate, setWinRate] = useState(90);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate Countdown to Sunday 22:00 for selected server
  const countdown = useMemo(() => {
    const srv = SERVERS.find(s => s.id === selectedServer) || SERVERS[0];
    
    // Server's current time in its timezone
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const serverTime = new Date(utcTime + (srv.offset * 3600000));

    // Find next Sunday 22:00 in server time
    const dayOfWeek = serverTime.getDay(); // 0 = Sunday, 1 = Monday ... 6 = Saturday
    let daysUntilSunday = (7 - dayOfWeek) % 7;
    
    // Target Sunday 22:00:00
    const targetSunday = new Date(serverTime);
    targetSunday.setDate(serverTime.getDate() + daysUntilSunday);
    targetSunday.setHours(srv.closeHour, 0, 0, 0);

    // If today is Sunday and already past 22:00, target next Sunday
    if (dayOfWeek === 0 && serverTime.getHours() >= srv.closeHour) {
      targetSunday.setDate(targetSunday.getDate() + 7);
    }

    const diffMs = targetSunday.getTime() - serverTime.getTime();
    const totalSecs = Math.max(0, Math.floor(diffMs / 1000));

    const d = Math.floor(totalSecs / 86400);
    const h = Math.floor((totalSecs % 86400) / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;

    const isRushHourNow = d === 0 && h === 0 && m <= 60; // Final 1 hour

    return {
      days: d,
      hours: h,
      mins: m,
      secs: s,
      isRushHourNow,
      serverTimeStr: serverTime.toLocaleTimeString('th-TH', { hour12: false })
    };
  }, [now, selectedServer]);

  // Wing calculation
  const wingCalc = useMemo(() => {
    const ptsGap = Math.max(0, targetScore - currentScore);
    const ptsPerWin = 10;
    const ptsPerLoss = -10;
    
    // Net expected points per match = (winRate/100 * 10) - ((1 - winRate/100) * 10)
    const netRate = (winRate / 100) * ptsPerWin - ((100 - winRate) / 100) * Math.abs(ptsPerLoss);
    const safeNet = Math.max(1, netRate);

    const matchesNeeded = Math.ceil(ptsGap / safeNet);
    const refillsNeeded = Math.ceil(matchesNeeded / 10);
    const crystalCost = refillsNeeded * 30;

    return {
      ptsGap,
      matchesNeeded,
      refillsNeeded,
      crystalCost
    };
  }, [currentScore, targetScore, winRate]);

  const currentServer = SERVERS.find(s => s.id === selectedServer) || SERVERS[0];
  const rushStartHour = currentServer.closeHour - 1;
  const rushCloseHour = currentServer.closeHour;

  return (
    <div className="space-y-6">
      {/* 1. Countdown & Server Timer Card */}
      <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-r from-[#14120c] via-[#1a150c] to-[#0d0f17] p-6 sm:p-8 shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>ARENA RUSH HOUR COUNTDOWN (SUNDAY {rushStartHour}:00 - {rushCloseHour}:00)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              นับถอยหลังสู่ช่วง Rush Hour ปิดซีซั่นอารีน่า
            </h2>
            <p className="text-xs text-slate-300">
              Rush Hour คือช่วง 1 ชั่วโมงสุดท้ายของทุกคืนวันอาทิตย์ ({rushStartHour}:00 - {rushCloseHour}:00) ที่ทุกคนเร่งตีและเปลี่ยนทีมรับเพื่อรักษาแต้ม
            </p>
          </div>

          {/* Server Selector */}
          <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/10 shrink-0">
            {SERVERS.map(srv => (
              <button
                key={srv.id}
                onClick={() => setSelectedServer(srv.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedServer === srv.id
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {srv.name}
              </button>
            ))}
          </div>
        </div>

        {/* Timer Digits */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-xl mx-auto text-center">
          <div className="bg-black/50 border border-white/10 rounded-2xl p-3 sm:p-4">
            <div className="text-2xl sm:text-4xl font-black text-white font-mono">{countdown.days}</div>
            <div className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold mt-1">วัน (Days)</div>
          </div>
          <div className="bg-black/50 border border-white/10 rounded-2xl p-3 sm:p-4">
            <div className="text-2xl sm:text-4xl font-black text-white font-mono">{String(countdown.hours).padStart(2, '0')}</div>
            <div className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold mt-1">ชั่วโมง (Hours)</div>
          </div>
          <div className="bg-black/50 border border-white/10 rounded-2xl p-3 sm:p-4">
            <div className="text-2xl sm:text-4xl font-black text-white font-mono">{String(countdown.mins).padStart(2, '0')}</div>
            <div className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold mt-1">นาที (Minutes)</div>
          </div>
          <div className="bg-black/50 border border-white/10 rounded-2xl p-3 sm:p-4">
            <div className="text-2xl sm:text-4xl font-black text-amber-400 font-mono">{String(countdown.secs).padStart(2, '0')}</div>
            <div className="text-[10px] sm:text-xs text-amber-400 uppercase font-semibold mt-1">วินาที (Secs)</div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 font-mono">
          เวลาปัจจุบันของเซิร์ฟเวอร์: <span className="text-white font-bold">{countdown.serverTimeStr}</span> • ปิดรอบเวลา {rushCloseHour}:00 น.
        </div>
      </div>

      {/* 2. 3-Phase Defense Switch Strategy */}
      <div className="rounded-3xl border border-white/[0.08] bg-[#0c1220] p-6 sm:p-8 space-y-5">
        <div className="space-y-1">
          <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-4 h-4" />
            <span>กลยุทธ์ 3 จังหวะการสลับทีมตั้งรับ (3-Phase AD Strategy)</span>
          </div>
          <h3 className="text-xl font-bold text-white">
            เคล็ดลับการสลับทีมรับของระดับ Guardian ไม่ให้แต้มตก
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            ผู้เล่นระดับท็อปจะไม่ใช้ทีมตั้งรับเดิมตลอดทั้งชั่วโมง แต่จะแบ่งเป็น 3 จังหวะเวลาเพื่อผลลัพธ์ที่ดีที่สุด:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Phase 1 */}
          <div className="p-4 rounded-2xl bg-[#101726] border border-blue-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                ช่วงที่ 1: {rushStartHour}:00 - {rushStartHour}:30
              </span>
              <span className="text-xs text-slate-400 font-semibold">30 นาทีแรก</span>
            </div>
            <h4 className="font-bold text-white text-sm">⚔️ ทีม Threat ดักสปีด (Bait & Revenge)</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              เป้าหมายคือ <strong>เก็บแต้มชนะจาก Defense Success</strong> ใช้ทีมสปีดลีด 33% (เช่น Psamathe Clara Byungchul) ล่อให้คนรีบกดตีแล้วโดน Clara สตันสวนกลับ
            </p>
            <div className="text-[11px] text-blue-300 bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
              💡 ตัวอย่าง: Psamathe, Clara, Savannah, Byungchul
            </div>
          </div>

          {/* Phase 2 */}
          <div className="p-4 rounded-2xl bg-[#101726] border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ช่วงที่ 2: {rushStartHour}:30 - {rushStartHour}:45
              </span>
              <span className="text-xs text-slate-400 font-semibold">15 นาทีถัดมา</span>
            </div>
            <h4 className="font-bold text-white text-sm">🛡️ ทีมสกัด Lushen (Anti-Cleave)</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              ช่วงที่คนเริ่มใช้ทีม Lushen / Leah เร่งกวาดแต้ม ให้เปลี่ยนเป็นทีม <strong>Nemesis Healer</strong> (เช่น Vanessa Camilla Byungchul Ariel) ทนดาเมจแล้วฮีลเต็มหลอด
            </p>
            <div className="text-[11px] text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
              💡 ตัวอย่าง: Vanessa, Camilla, Byungchul, Ariel (Nemesis)
            </div>
          </div>

          {/* Phase 3 */}
          <div className="p-4 rounded-2xl bg-[#101726] border border-rose-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                ช่วงที่ 3: {rushStartHour}:45 - {rushCloseHour}:00
              </span>
              <span className="text-xs text-rose-400 font-bold">15 นาทีสุดท้าย</span>
            </div>
            <h4 className="font-bold text-white text-sm">🧱 กำแพงหนาถ่วงเวลา (The Wall / Stall)</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              ช่วงตัดสินอันดับ <strong>จุดประสงค์ไม่ใช่การฆ่าศัตรู แต่คือไม่ให้ใครกล้าคลิกตี</strong> ด้วย Halphas + Camilla + Abellio ที่ต้องใช้เวลาตี 2-3 นาทีจนศัตรูหมดเวลา
            </p>
            <div className="text-[11px] text-rose-300 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
              💡 ตัวอย่าง: Karnal, Camilla, Abellio, Halphas
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive AD Counter Lookup */}
      <div className="rounded-3xl border border-white/[0.08] bg-[#0c1220] p-6 sm:p-8 space-y-5">
        <div className="space-y-1">
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Swords className="w-4 h-4" />
            <span>สูตรบุกแก้ทางด่วนช่วง Rush Hour (Fast Counter Matrix)</span>
          </div>
          <h3 className="text-xl font-bold text-white">
            เจอทีมรับแบบนี้ ใช้ทีมบุกไหนปิดเร็วที่สุด (15-30 วินาที)?
          </h3>
          <p className="text-xs text-slate-400">
            เลือกรูปแบบทีมตั้งรับของศัตรูเพื่อดูสูตรบุกที่ปลอดภัยและใช้เวลาน้อยที่สุด
          </p>
        </div>

        <div className="space-y-3">
          {AD_COUNTERS.map((item, idx) => (
            <div 
              key={idx}
              className="p-4 sm:p-5 rounded-2xl bg-[#080d16] border border-white/[0.06] hover:border-emerald-500/30 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="font-bold text-white text-sm">ทีมรับศัตรู: {item.enemyLead}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                    {item.enemyType}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    เวลาตี: {item.clearTime}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                <div className="md:col-span-5 space-y-1">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Swords className="w-3.5 h-3.5" />
                    <span>ทีมบุกแนะนำ: {item.bestAo}</span>
                  </div>
                  <div className="text-slate-400">สไตล์: {item.aoArchetype}</div>
                </div>

                <div className="md:col-span-7 space-y-1.5 text-slate-300">
                  <p className="leading-relaxed"><strong className="text-white">ทำไมถึงชนะ:</strong> {item.whyItWorks}</p>
                  <p className="text-amber-300/90 leading-relaxed"><strong className="text-amber-200">⚠️ ข้อควรระวัง:</strong> {item.warning}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Wing Refill & Crystal Calculator */}
      <div className="rounded-3xl border border-white/[0.08] bg-[#0c1220] p-6 sm:p-8 space-y-5">
        <div className="space-y-1">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-4 h-4" />
            <span>เครื่องคำนวณจำนวนปีก & คริสตัลสำหรับ Rush Hour (Wing & Crystal Budget)</span>
          </div>
          <h3 className="text-xl font-bold text-white">
            ประเมินทรัพยากรที่ต้องเตรียมก่อนกดไต่อันดับ
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1 font-semibold">แต้มปัจจุบันของคุณ:</label>
            <input
              type="number"
              value={currentScore}
              onChange={(e) => setCurrentScore(Number(e.target.value))}
              className="w-full bg-[#080d16] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1 font-semibold">แต้มเป้าหมายที่ต้องการ:</label>
            <input
              type="number"
              value={targetScore}
              onChange={(e) => setTargetScore(Number(e.target.value))}
              className="w-full bg-[#080d16] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1 font-semibold">อัตราชนะที่คาดหวัง (% Win Rate):</label>
            <input
              type="number"
              min="50"
              max="100"
              value={winRate}
              onChange={(e) => setWinRate(Number(e.target.value))}
              className="w-full bg-[#080d16] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-4 rounded-2xl bg-[#080d16] border border-white/[0.06] text-center">
            <div className="text-xs text-slate-400 mb-1">ระยะห่างแต้ม</div>
            <div className="text-2xl font-black text-white font-mono">+{wingCalc.ptsGap}</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#080d16] border border-white/[0.06] text-center">
            <div className="text-xs text-slate-400 mb-1">จำนวนรอบที่ต้องตี</div>
            <div className="text-2xl font-black text-cyan-400 font-mono">~{wingCalc.matchesNeeded} แมตช์</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#080d16] border border-white/[0.06] text-center">
            <div className="text-xs text-slate-400 mb-1">ต้องซื้อปีก (Refill)</div>
            <div className="text-2xl font-black text-amber-400 font-mono">~{wingCalc.refillsNeeded} ครั้ง</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#080d16] border border-white/[0.06] text-center">
            <div className="text-xs text-slate-400 mb-1">คริสตัลที่ต้องเตรียม</div>
            <div className="text-2xl font-black text-pink-400 font-mono">{wingCalc.crystalCost} 💎</div>
          </div>
        </div>
      </div>
    </div>
  );
}
