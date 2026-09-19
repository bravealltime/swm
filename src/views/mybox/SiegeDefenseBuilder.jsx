import React, { useState, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import MonsterAvatar from '../../components/MonsterAvatar';
import { card } from './shared';

// ---------------------------------------------------------------------------
// 3. Siege Defense Builder from Owned Monsters
// ---------------------------------------------------------------------------

export default function SiegeDefenseBuilder({ box }) {
  const [slot1, setSlot1] = useState(null); // Leader
  const [slot2, setSlot2] = useState(null);
  const [slot3, setSlot3] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const units = useMemo(() => box?.units || [], [box]);

  const availableUnits = useMemo(() => {
    return units.filter((u) => {
      if (!searchTerm) return true;
      return u.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [units, searchTerm]);

  // Turn Order calculation
  const turnOrder = useMemo(() => {
    const selected = [slot1, slot2, slot3].filter(Boolean);
    if (selected.length === 0) return [];
    return [...selected].sort((a, b) => (b.spd || 0) - (a.spd || 0));
  }, [slot1, slot2, slot3]);

  return (
    <div className="space-y-6">
      <div className={`${card} p-6 space-y-6`}>
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            🏰 จำลองและวิเคราะห์ทีมตั้งรับ Siege (3 ตัว)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            เลือก 3 มอนสเตอร์จากกล่องของคุณ เพื่อวิเคราะห์ความเร็วออกเทิร์น (Speed Gap), การจูนสปีด, และสถิติแก้ทาง
          </p>
        </div>

        {/* 3 Selected Slots */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Slot 1: Leader */}
          <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-950/10 flex flex-col items-center text-center space-y-3">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-bold">
              ลีดเดอร์ (Slot 1)
            </span>
            {slot1 ? (
              <div className="space-y-2">
                <MonsterAvatar name={slot1.name} size={64} className="rounded-2xl mx-auto shadow-lg" />
                <div className="font-bold text-white text-sm">{slot1.name}</div>
                <div className="text-xs font-mono text-cyan-300">SPD: {slot1.spd} ({slot1.baseSpd}+{slot1.spd - slot1.baseSpd})</div>
                <button
                  onClick={() => setSlot1(null)}
                  className="px-2.5 py-1 text-[11px] rounded bg-white/5 hover:bg-rose-500/20 text-rose-300"
                >
                  ถอดออก
                </button>
              </div>
            ) : (
              <div className="py-6 text-xs text-slate-400">คลิกเลือกมอนสเตอร์ด้านล่าง</div>
            )}
          </div>

          {/* Slot 2 */}
          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col items-center text-center space-y-3">
            <span className="px-2 py-0.5 rounded bg-white/10 text-slate-300 text-xs font-bold">
              สมาชิก (Slot 2)
            </span>
            {slot2 ? (
              <div className="space-y-2">
                <MonsterAvatar name={slot2.name} size={64} className="rounded-2xl mx-auto shadow-lg" />
                <div className="font-bold text-white text-sm">{slot2.name}</div>
                <div className="text-xs font-mono text-cyan-300">SPD: {slot2.spd} ({slot2.baseSpd}+{slot2.spd - slot2.baseSpd})</div>
                <button
                  onClick={() => setSlot2(null)}
                  className="px-2.5 py-1 text-[11px] rounded bg-white/5 hover:bg-rose-500/20 text-rose-300"
                >
                  ถอดออก
                </button>
              </div>
            ) : (
              <div className="py-6 text-xs text-slate-400">คลิกเลือกมอนสเตอร์ด้านล่าง</div>
            )}
          </div>

          {/* Slot 3 */}
          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col items-center text-center space-y-3">
            <span className="px-2 py-0.5 rounded bg-white/10 text-slate-300 text-xs font-bold">
              สมาชิก (Slot 3)
            </span>
            {slot3 ? (
              <div className="space-y-2">
                <MonsterAvatar name={slot3.name} size={64} className="rounded-2xl mx-auto shadow-lg" />
                <div className="font-bold text-white text-sm">{slot3.name}</div>
                <div className="text-xs font-mono text-cyan-300">SPD: {slot3.spd} ({slot3.baseSpd}+{slot3.spd - slot3.baseSpd})</div>
                <button
                  onClick={() => setSlot3(null)}
                  className="px-2.5 py-1 text-[11px] rounded bg-white/5 hover:bg-rose-500/20 text-rose-300"
                >
                  ถอดออก
                </button>
              </div>
            ) : (
              <div className="py-6 text-xs text-slate-400">คลิกเลือกมอนสเตอร์ด้านล่าง</div>
            )}
          </div>
        </div>

        {/* Turn Order Analysis */}
        {turnOrder.length === 3 && (
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
            <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
              ⚡ ลำดับการออกเทิร์นจริง (Combat Turn Order):
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {turnOrder.map((m, idx) => (
                <div key={m.name} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-bold text-white">{m.name}</span>
                  <span className="text-xs font-mono text-cyan-400 font-semibold">{m.spd} SPD</span>
                  {idx < 2 && <ChevronRight className="w-4 h-4 text-slate-500" />}
                </div>
              ))}
            </div>
            <div className="text-xs text-slate-300 pt-1">
              ส่วนต่างสปีดเทิร์น 1 ➔ 2: <strong>{turnOrder[0].spd - turnOrder[1].spd} SPD</strong> | เทิร์น 2 ➔ 3: <strong>{turnOrder[1].spd - turnOrder[2].spd} SPD</strong>
              {turnOrder[0].spd - turnOrder[1].spd <= 10 && turnOrder[1].spd - turnOrder[2].spd <= 10 ? (
                <span className="ml-2 text-emerald-400 font-bold">✓ สปีดจูนชิดกันดีมาก ลดโอกาสโดนแทรกเทิร์น</span>
              ) : (
                <span className="ml-2 text-amber-400 font-bold">⚠️ ช่องว่างสปีดห่างเกิน 10 อาจเสี่ยงโดนศัตรูแทรกเทิร์น</span>
              )}
            </div>
          </div>
        )}

        {/* Monster Selector Palette */}
        <div className="space-y-3 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">คลิกเพื่อใส่มอนสเตอร์ลงช่องที่ว่าง</span>
            <input
              type="text"
              placeholder="ค้นหาชื่อมอนสเตอร์ใน Box..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
            {availableUnits.map((u, idx) => {
              const uKey = u.uid || `${u.masterId}-${idx}`;
              const isPicked = (slot1?.uid || slot1?.masterId) === (u.uid || u.masterId) || 
                               (slot2?.uid || slot2?.masterId) === (u.uid || u.masterId) || 
                               (slot3?.uid || slot3?.masterId) === (u.uid || u.masterId);
              return (
                <button
                  key={uKey}
                  disabled={isPicked}
                  onClick={() => {
                    if (!slot1) setSlot1(u);
                    else if (!slot2) setSlot2(u);
                    else if (!slot3) setSlot3(u);
                  }}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                    isPicked
                      ? 'opacity-30 border-white/5 bg-transparent cursor-not-allowed'
                      : 'border-white/10 bg-white/[0.03] hover:border-cyan-400/50 hover:bg-white/[0.06]'
                  }`}
                >
                  <MonsterAvatar name={u.name} size={44} className="rounded-xl" />
                  <div className="text-[11px] font-bold text-white truncate max-w-full">{u.name}</div>
                  <div className="text-[10px] font-mono text-cyan-300">+{u.spd - u.baseSpd} SPD</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
