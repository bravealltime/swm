import React, { useState, useMemo } from 'react';
import { 
  Gauge, 
  Zap, 
  RotateCcw, 
  Info, 
  ArrowRight, 
  Sparkles, 
  ShieldAlert, 
  Sliders, 
  CheckCircle2, 
  Search 
} from 'lucide-react';

const SPEED_PRESETS = [
  { name: 'Spectra (สเปกตร้า)', spd: 126, type: 'Booster / Slow' },
  { name: 'Kabilla (คาบิลล่า)', spd: 120, type: 'Booster 30%' },
  { name: 'Ethna (เอธน่า)', spd: 119, type: 'Fast Stripper/Nuker' },
  { name: 'Triton (ไตรตัน)', spd: 116, type: 'AOE Stripper' },
  { name: 'Eshir (เอเชียร์ 2A)', spd: 115, type: 'Booster / Predator' },
  { name: 'Bernard (เบอร์นาร์ด)', spd: 111, type: 'Booster 30%' },
  { name: 'Savannah (ซาวันนาห์)', spd: 110, type: 'Rider / Pushback' },
  { name: 'Miles (ไมลส์)', spd: 106, type: 'SPD Scaling Nuker' },
  { name: 'Orion (โอไรออน)', spd: 106, type: 'Harmless Prank' },
  { name: 'Clara (คลาร่า 2A)', spd: 103, type: 'Stun / Strip' },
  { name: 'Juno (จูโน่)', spd: 100, type: 'Passive Passive' },
  { name: 'Bastet (บาสเตต)', spd: 99, type: 'ATB + Shield' },
  { name: 'Tiana (ทีอาน่า)', spd: 96, type: 'Irresistible Strip' },
];

export default function SpeedCalculatorView() {
  const [baseSpd, setBaseSpd] = useState(115); // Eshir default
  const [selectedMonsterName, setSelectedMonsterName] = useState('Eshir (เอเชียร์ 2A)');
  const [runeSpd, setRuneSpd] = useState(175);
  const [hasSwift, setHasSwift] = useState(true);
  const [speedLead, setSpeedLead] = useState(24);
  const [totemBonus, setTotemBonus] = useState(15); // Sky Tribe Totem 0-15% (Max is 15%)
  const [guildFlag, setGuildFlag] = useState(5); // Guild Speed Flag 0-5%
  const [hasSpdBuff, setHasSpdBuff] = useState(false);

  // Anti-cut tuning state
  const [atbBoostPercent, setAtbBoostPercent] = useState(30); // 30% ATB boost (Bernard, Bastet, Eshir)

  // Formulas
  // Swift bonus = 25% of Base SPD
  const swiftBonus = hasSwift ? Math.floor(baseSpd * 0.25) : 0;
  // Speed lead = % of Base SPD
  const leadBonus = Math.floor(baseSpd * (speedLead / 100));
  // Sky Tribe Totem + Guild Flag = % of Base SPD
  const buildingBonus = Math.floor(baseSpd * ((totemBonus + guildFlag) / 100));

  const combatSpdBeforeBuff = Number(baseSpd) + Number(runeSpd) + swiftBonus + leadBonus + buildingBonus;
  const totalCombatSpd = hasSpdBuff 
    ? Math.floor(combatSpdBeforeBuff * 1.33) 
    : combatSpdBeforeBuff;

  // Anti-cut calculation:
  // To not get cut when ATB boosted by X%, the follow-up monster's combat SPD must generally be:
  // Required Combat SPD >= Total Booster Combat SPD * (1 - (ATB Boost % / 100)) / (1 + small tick buffer)
  // Standard SW formula: Required Combat SPD >= Booster Combat SPD * (100 - ATB%) / 100
  // e.g. With 30% boost, follower needs roughly >= 71.5% of booster's combat speed
  const requiredFollowerCombatSpd = Math.ceil(combatSpdBeforeBuff * (1 - (atbBoostPercent / 100) * 0.95));

  const tickBrackets = [
    { tick: 'Tick 1 (ความเร็วสูงสุด ระดับการ์เดียน)', minCombatSpd: 286, desc: 'ออกเทิร์นแรกแน่นอนในเกือบทุกสถานการณ์ (G1-G3 Meta)' },
    { tick: 'Tick 2 (ระดับแข่งขัน Conqueror/Guardian)', minCombatSpd: 239, desc: 'มาตรฐานตัวเปิดทีมกิลด์วอร์ระดับแข่งขัน C3-G1' },
    { tick: 'Tick 3 (มาตรฐานตัวทำเกม / Follow-up)', minCombatSpd: 205, desc: 'ตัวดาเมจ หรือตัวคุมจังหวะจูนตามหลังตัวเปิด' },
    { tick: 'Tick 4 (ตัวช้า / ตัวแทงก์ / ตัวรับดาเมจ)', minCombatSpd: 179, desc: 'ตัวรับดาเมจ หรือตัวปิดจ็อบท้ายเทิร์น' },
  ];

  const currentBracket = tickBrackets.find(b => totalCombatSpd >= b.minCombatSpd) || {
    tick: 'Tick 5+ (ช้า)', minCombatSpd: 0, desc: 'ความเร็วไม่เพียงพอในสังเวียนกิลด์วอร์'
  };

  const handleSelectPreset = (preset) => {
    setBaseSpd(preset.spd);
    setSelectedMonsterName(preset.name);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[#1c2738] pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
          <Gauge className="w-4 h-4" />
          Speed Tick & Anti-Cut Calculator • ระบบคำนวณสปีดทิกและจูนความเร็ว
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          เครื่องคำนวณความเร็วจริงในสนามต่อสู้ (Combat Speed & Tick Calculator)
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          คำนวณความเร็วจริงในสนามต่อสู้ (Combat SPD) รวมผลลัพธ์ของรูน Swift, ลีดเดอร์สปีด, เสาสปีดอารีน่า (Sky Tribe Totem), ธงกิลด์ และบัฟความเร็ว พร้อมฟังก์ชันคำนวณป้องกันศัตรูแทรกเทิร์น
        </p>
      </div>

      {/* Quick Monster Presets */}
      <div className="bg-[#101724] border border-[#1d2b3f] p-4 sm:p-5 rounded-2xl shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            กดเลือกมอนสเตอร์เพื่อดึง Base SPD อัตโนมัติ:
          </span>
          {selectedMonsterName && (
            <span className="text-xs text-cyan-400 font-mono font-bold">
              กำลังเลือก: {selectedMonsterName} ({baseSpd} Base SPD)
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {SPEED_PRESETS.map((p) => {
            const isActive = baseSpd === p.spd && selectedMonsterName === p.name;
            return (
              <button
                key={p.name}
                onClick={() => handleSelectPreset(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30'
                    : 'bg-[#0c121c] border border-[#1d2b3f] text-slate-300 hover:text-white hover:bg-[#152030]'
                }`}
              >
                <span>{p.name}</span>
                <span className={`text-[11px] font-mono px-1 rounded ${isActive ? 'bg-black/20 text-slate-950' : 'bg-[#152030] text-cyan-400'}`}>
                  {p.spd}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Panel (6 cols) */}
        <div className="lg:col-span-6 bg-[#101724] border border-[#1d2b3f] p-6 rounded-2xl space-y-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#1d2b3f]">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              กำหนดค่าความเร็วและบัฟ
            </h2>
            <button
              onClick={() => {
                setBaseSpd(115);
                setSelectedMonsterName('Eshir (เอเชียร์ 2A)');
                setRuneSpd(175);
                setHasSwift(true);
                setSpeedLead(24);
                setTotemBonus(15);
                setGuildFlag(5);
                setHasSpdBuff(false);
              }}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> รีเซ็ต
            </button>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            {/* Base SPD */}
            <div>
              <div className="flex justify-between font-bold text-slate-300 mb-1">
                <span>ความเร็วพื้นฐาน (Base SPD):</span>
                <span className="text-blue-400 font-mono text-base font-black">{baseSpd}</span>
              </div>
              <input
                type="number"
                min="80"
                max="135"
                value={baseSpd}
                onChange={(e) => {
                  setBaseSpd(Number(e.target.value));
                  setSelectedMonsterName('กำหนดเอง');
                }}
                className="w-full bg-[#0c121c] border border-[#1d2b3f] rounded-xl px-3.5 py-2 text-base text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Rune SPD */}
            <div>
              <div className="flex justify-between font-bold text-slate-300 mb-1">
                <span>ความเร็วจากรูน (+SPD):</span>
                <span className="text-emerald-400 font-mono text-base font-black">+{runeSpd}</span>
              </div>
              <input
                type="number"
                min="0"
                max="260"
                value={runeSpd}
                onChange={(e) => setRuneSpd(Number(e.target.value))}
                className="w-full bg-[#0c121c] border border-[#1d2b3f] rounded-xl px-3.5 py-2 text-base text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Sky Tribe Totem Building */}
            <div>
              <div className="flex justify-between font-bold text-slate-300 mb-1">
                <span>เสาสปีดอารีน่า (Sky Tribe Totem):</span>
                <span className="text-amber-400 font-mono text-sm font-black">+{totemBonus}% ({Math.floor(baseSpd * (totemBonus / 100))} SPD)</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                value={totemBonus}
                onChange={(e) => setTotemBonus(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>0% (Lv 0)</span>
                <span>7.5% (Lv 15)</span>
                <span>15% (Max Lv 30)</span>
              </div>
            </div>

            {/* Guild Speed Flag */}
            <div>
              <div className="flex justify-between font-bold text-slate-300 mb-1">
                <span>ธงสปีดกิลด์ (Guild Flag):</span>
                <span className="text-purple-400 font-mono text-sm font-black">+{guildFlag}% ({Math.floor(baseSpd * (guildFlag / 100))} SPD)</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                value={guildFlag}
                onChange={(e) => setGuildFlag(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            {/* Speed Lead Selector */}
            <div>
              <div className="flex justify-between font-bold text-slate-300 mb-1">
                <span>ลีดเดอร์ความเร็ว (Speed Leader):</span>
                <span className="text-cyan-400 font-mono font-bold">+{speedLead}% ({leadBonus} SPD)</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[0, 19, 24, 33].map((lead) => (
                  <button
                    key={lead}
                    onClick={() => setSpeedLead(lead)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      speedLead === lead
                        ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                        : 'bg-[#0c121c] border border-[#1d2b3f] text-slate-400 hover:text-white'
                    }`}
                  >
                    {lead === 0 ? 'ไม่มีลีด' : `+${lead}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Swift Set Checkbox */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0c121c] border border-[#1d2b3f]">
              <div>
                <span className="font-bold text-white text-xs block">ใส่เซ็ตรูน Swift (+25% Base SPD)</span>
                <span className="text-[11px] text-slate-400">เพิ่ม +{Math.floor(baseSpd * 0.25)} สปีดจากการใส่เซ็ต Swift 4 ชิ้น</span>
              </div>
              <input
                type="checkbox"
                checked={hasSwift}
                onChange={(e) => setHasSwift(e.target.checked)}
                className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
              />
            </div>

            {/* Combat Speed Buff */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0c121c] border border-[#1d2b3f]">
              <div>
                <span className="font-bold text-white text-xs block">มีบัฟความเร็วในการต่อสู้ (SPD Buff +33%)</span>
                <span className="text-[11px] text-slate-400">คูณความเร็วจริงในเทิร์น x1.33 เท่า</span>
              </div>
              <input
                type="checkbox"
                checked={hasSpdBuff}
                onChange={(e) => setHasSpdBuff(e.target.checked)}
                className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Output & Anti-Cut Panel (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Result Card */}
          <div className="bg-[#101724] border border-[#1d2b3f] p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                ความเร็วจริงในสนาม (COMBAT SPD)
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                {currentBracket.tick}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-cyan-400">
                {totalCombatSpd}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                (ก่อนบัฟ: {combatSpdBeforeBuff})
              </span>
            </div>

            {/* Breakdown Formula */}
            <div className="p-3 bg-[#0c121c] rounded-xl border border-[#1d2b3f] text-xs font-mono space-y-1 text-slate-300">
              <div className="text-[11px] text-slate-400 font-bold uppercase mb-1">รายละเอียดสูตรคำนวณ:</div>
              <div>Base ({baseSpd}) + รูน (+{runeSpd}) = {baseSpd + runeSpd}</div>
              <div>+ Swift (+{swiftBonus}) + ลีด (+{leadBonus}) + เสา/ธง (+{buildingBonus}) = <strong className="text-cyan-400">{combatSpdBeforeBuff}</strong></div>
              {hasSpdBuff && <div>x บัฟสปีด (+33%) = <strong className="text-emerald-400">{totalCombatSpd} Combat SPD</strong></div>}
            </div>
          </div>

          {/* Anti-Cut Tuning Tool */}
          <div className="bg-[#101724] border border-cyan-500/40 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-base font-extrabold text-white">
                  คำนวณป้องกันศัตรูแทรกเทิร์น (Anti-Cut Speed Tuning)
                </h3>
                <p className="text-xs text-slate-400">
                  ถ้าตัวเปิดมีความเร็ว {combatSpdBeforeBuff} สปีด ตัวต่อไปต้องเร็วเท่าไหร่ถึงไม่โดนแซง?
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1 text-xs">
              <div>
                <div className="flex justify-between font-bold text-slate-300 mb-1">
                  <span>สกิลดึงเกจของตัวเปิด (ATB Boost):</span>
                  <span className="text-cyan-400 font-mono font-bold">+{atbBoostPercent}%</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[20, 30, 33].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setAtbBoostPercent(pct)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        atbBoostPercent === pct
                          ? 'bg-cyan-600 text-white'
                          : 'bg-[#0c121c] border border-[#1d2b3f] text-slate-400'
                      }`}
                    >
                      +{pct}% {pct === 30 ? '(Bernard/Bastet)' : pct === 20 ? '(Orion)' : '(Tiana)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-[#0c121c] rounded-xl border border-cyan-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold">ความเร็วขั้นต่ำของตัวตาม (Follow-up):</span>
                  <span className="text-lg font-mono font-black text-emerald-400">
                    ≥ {requiredFollowerCombatSpd} Combat SPD
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  💡 หากตัวแก้บัฟ (Stripper), ลดเกราะ หรือตัวดาเมจของคุณมี Combat SPD ถึง <strong className="text-white">{requiredFollowerCombatSpd}</strong> ฝั่งตรงข้ามที่มีความเร็วน้อยกว่าตัวเปิดจะไม่สามารถแทรกเทิร์นเข้ามาคั่นได้แน่นอน
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
