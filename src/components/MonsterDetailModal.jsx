import React, { useEffect, useMemo, useState } from 'react';
import { X, Compass, Star, Gem, Sparkles, Info } from 'lucide-react';
import MonsterAvatar from './MonsterAvatar';
import RuneIcon from './RuneIcon';
import ArtifactIcon from './ArtifactIcon';
import { RUNE_SETS, STAT_NAMES, ARTIFACT_EFFECT_NAMES } from '../utils/swexImport';

// In-game rune screen: six rune slots around the portrait, element artifact left, archetype right.
// Slot positions (percent of the hex box), clockwise from the top like the game.
const SLOT_POS = {
  1: { left: '50%', top: '4%' },
  2: { left: '90%', top: '27%' },
  3: { left: '90%', top: '73%' },
  4: { left: '50%', top: '96%' },
  5: { left: '10%', top: '73%' },
  6: { left: '10%', top: '27%' },
};

const PCT_STATS = new Set([2, 4, 6, 9, 10, 11, 12]);
const fmtStat = (id, v) => `${STAT_NAMES[id] || `#${id}`} +${v}${PCT_STATS.has(id) ? '%' : ''}`;

// Set bonuses that change the stat sheet (per completed set)
const SET_BONUS = { 1: ['hp', 15], 2: ['def', 15], 3: ['spd', 25], 4: ['cr', 12], 5: ['cd', 40], 6: ['acc', 20], 7: ['res', 20], 8: ['atk', 35] };
const SET_PIECES = { 1: 2, 2: 2, 3: 4, 4: 2, 5: 4, 6: 2, 7: 2, 8: 4, 10: 4, 11: 4, 13: 4, 14: 2, 15: 2, 16: 2, 17: 2, 18: 2, 19: 2, 20: 2, 21: 2, 22: 2, 23: 2, 24: 2, 25: 1 };
const ARTIFACT_MAIN = { 100: ['hp', 'HP'], 101: ['atk', 'ATK'], 102: ['def', 'DEF'] };

/** Total stats the way the game shows them: base + flat + % of base + set bonuses (+ artifact main). */
function computeStats(unit, runes, artifacts) {
  const base = { hp: unit.hp || 0, atk: unit.atk || 0, def: unit.def || 0, spd: unit.baseSpd || unit.spd || 0, cr: unit.cr || 0, cd: unit.cd || 0, res: unit.res || 0, acc: unit.acc || 0 };
  const flat = { hp: 0, atk: 0, def: 0, spd: 0, cr: 0, cd: 0, res: 0, acc: 0 };
  const pct = { hp: 0, atk: 0, def: 0, spd: 0 };
  const KEY = { 1: ['hp', 'flat'], 2: ['hp', 'pct'], 3: ['atk', 'flat'], 4: ['atk', 'pct'], 5: ['def', 'flat'], 6: ['def', 'pct'], 8: ['spd', 'flat'], 9: ['cr', 'flat'], 10: ['cd', 'flat'], 11: ['res', 'flat'], 12: ['acc', 'flat'] };
  const apply = (id, v) => { const k = KEY[id]; if (!k) return; if (k[1] === 'pct') pct[k[0]] += v; else flat[k[0]] += v; };
  const setCount = {};
  for (const r of runes) {
    setCount[r.set] = (setCount[r.set] || 0) + 1;
    apply(r.main[0], r.main[1]);
    if (r.innate) apply(r.innate[0], r.innate[1]);
    for (const s of r.subs || []) apply(s[0], (s[1] || 0) + (s[2] || 0));
  }
  const sets = [];
  for (const [id, n] of Object.entries(setCount)) {
    const times = Math.floor(n / (SET_PIECES[id] || 2));
    for (let i = 0; i < times; i++) {
      sets.push(RUNE_SETS[id] || `Set${id}`);
      const b = SET_BONUS[id];
      if (b) { if (['hp', 'atk', 'def', 'spd'].includes(b[0])) pct[b[0]] += b[1]; else flat[b[0]] += b[1]; }
    }
  }
  for (const a of artifacts) {
    const m = ARTIFACT_MAIN[a.main?.[0]];
    if (m) flat[m[0]] += a.main[1] || 0;
  }
  const total = {};
  for (const k of Object.keys(base)) total[k] = Math.floor(base[k] + (pct[k] ? (base[k] * pct[k]) / 100 : 0) + flat[k]);
  return { base, total, sets };
}

function RuneDetail({ rune, unitName }) {
  const effColor = rune.eff >= 80 ? 'text-emerald-300' : rune.eff >= 60 ? 'text-amber-300' : 'text-slate-300';
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <RuneIcon rune={rune} size={64} />
        <div>
          <div className="text-base font-black text-white">{RUNE_SETS[rune.set] || `Set ${rune.set}`} <span className="text-slate-400 font-semibold">ช่อง {rune.slot}</span></div>
          <div className="text-xs text-amber-400">{'★'.repeat(Math.min(6, rune.stars || 0))} <span className="text-slate-400">+{rune.lvl}{rune.ancient ? ' · รูนโบราณ' : ''}</span></div>
          <div className={`text-sm font-mono font-black ${effColor}`}>ประสิทธิภาพ {rune.eff}%</div>
        </div>
      </div>
      <div className="rounded-xl bg-[#070b14] border border-white/[0.06] divide-y divide-white/[0.05] text-sm">
        <div className="flex justify-between px-3 py-2"><span className="text-slate-400">หลัก</span><span className="font-mono font-bold text-cyan-300">{fmtStat(rune.main[0], rune.main[1])}</span></div>
        {rune.innate && <div className="flex justify-between px-3 py-2"><span className="text-slate-400">ติดตัว</span><span className="font-mono text-slate-200">{fmtStat(rune.innate[0], rune.innate[1])}</span></div>}
        {(rune.subs || []).map((s, i) => (
          <div key={i} className="flex justify-between px-3 py-2">
            <span className="text-slate-400">ซับ {i + 1}</span>
            <span className="font-mono text-slate-200">
              {STAT_NAMES[s[0]] || s[0]} +{s[1]}{s[2] ? <span className="text-emerald-400"> (+{s[2]} เจียร)</span> : null}{PCT_STATS.has(s[0]) ? '%' : ''}{s[3] ? <span className="text-fuchsia-300 text-[11px]"> ● อัญมณี</span> : null}
            </span>
          </div>
        ))}
      </div>
      <div className="text-[11px] text-slate-500">ใส่อยู่กับ {unitName}</div>
    </div>
  );
}

function ArtifactDetail({ artifact }) {
  const main = ARTIFACT_MAIN[artifact.main?.[0]];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <ArtifactIcon artifact={artifact} size={64} />
        <div>
          <div className="text-base font-black text-white">{artifact.kind === 'element' ? `อาร์ติแฟกต์ธาตุ (${artifact.element})` : `อาร์ติแฟกต์ประเภท (${artifact.archetype})`}</div>
          <div className="text-xs text-slate-400">+{artifact.lvl} · ระดับ {artifact.rank}</div>
        </div>
      </div>
      <div className="rounded-xl bg-[#070b14] border border-white/[0.06] divide-y divide-white/[0.05] text-sm">
        <div className="flex justify-between px-3 py-2"><span className="text-slate-400">หลัก</span><span className="font-mono font-bold text-cyan-300">{main ? `${main[1]} +${artifact.main[1]}` : `#${artifact.main?.[0]} +${artifact.main?.[1]}`}</span></div>
        {(artifact.subs || []).map((s, i) => (
          <div key={i} className="flex justify-between gap-3 px-3 py-2">
            <span className="text-slate-300 text-xs leading-snug">{ARTIFACT_EFFECT_NAMES[s[0]] || `เอฟเฟกต์ #${s[0]}`}</span>
            <span className="font-mono text-slate-200 shrink-0">+{s[1]}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MonsterDetailModal({ unit, box, onClose, onNavigate }) {
  const [picked, setPicked] = useState(null); // { kind: 'rune' | 'artifact', item }

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const info = unit.info;
  const runes = useMemo(() => {
    const all = box?.runes || [];
    // v5 boxes link runes by unit id; older ones only by monster id (ambiguous for duplicates)
    const byUid = unit.uid ? all.filter((r) => r.uid === unit.uid) : [];
    return (byUid.length ? byUid : all.filter((r) => !r.uid && r.unit === unit.masterId)).sort((a, b) => a.slot - b.slot);
  }, [box, unit]);
  const artifacts = useMemo(() => (box?.artifacts || []).filter((a) => unit.uid && a.unit === unit.uid), [box, unit]);
  const stats = useMemo(() => computeStats(unit, runes, artifacts), [unit, runes, artifacts]);
  const bySlot = Object.fromEntries(runes.map((r) => [r.slot, r]));
  const elementArt = artifacts.find((a) => a.kind === 'element');
  const archArt = artifacts.find((a) => a.kind === 'archetype');
  const legacy = !unit.uid;

  const statRows = [
    ['HP', 'hp'], ['ATK', 'atk'], ['DEF', 'def'], ['SPD', 'spd'], ['CRI Rate', 'cr'], ['CRI Dmg', 'cd'], ['RES', 'res'], ['ACC', 'acc'],
  ];
  const isPct = (k) => ['cr', 'cd', 'res', 'acc'].includes(k);

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={`รูนและอาร์ติแฟกต์ของ ${info?.name || unit.masterId}`}
        className="w-full sm:max-w-5xl max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#0a0f19] shadow-2xl">
        {/* header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 p-4 sm:p-5 bg-[#0a0f19]/95 backdrop-blur border-b border-white/[0.06]">
          <div className="flex items-center gap-3 min-w-0">
            {info ? <MonsterAvatar monster={info} size="md" showStars={false} /> : <div className="w-14 h-14 rounded-xl bg-slate-800" />}
            <div className="min-w-0">
              <div className="text-lg sm:text-xl font-black text-white truncate">{info?.name || `#${unit.masterId}`} {info?.thaiName && info.thaiName !== info.name ? <span className="text-slate-400 text-sm font-semibold">· {info.thaiName}</span> : null}</div>
              <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                <span className="text-amber-400">{'★'.repeat(Math.min(6, unit.stars || 0))}</span>
                <span>Lv.{unit.level}</span>
                {unit.obtained && <span>· ได้เมื่อ {unit.obtained.slice(0, 10)}</span>}
                {stats.sets.length > 0 && <span className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10 text-slate-200">{stats.sets.join(' / ')}</span>}
                {unit.runeEff ? <span className="text-purple-300 font-mono">รูน {unit.runeEff}%</span> : null}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {info && (
              <button onClick={() => onNavigate('where2use', { initialMonster: info.name })} className="hidden sm:flex px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200 text-xs font-bold items-center gap-1.5 cursor-pointer">
                <Compass className="w-4 h-4 text-emerald-400" /> ใช้ที่ไหนได้บ้าง
              </button>
            )}
            <button onClick={onClose} aria-label="ปิด" className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 p-4 sm:p-5">
          {/* rune board */}
          <div className="lg:col-span-3">
            {legacy && (
              <div className="mb-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs text-amber-200 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" /> ข้อมูลเวอร์ชันเก่าแยกรูนของมอนสเตอร์ตัวซ้ำไม่ได้ — นำเข้าไฟล์ใหม่เพื่อดูรูนที่ถูกต้องของตัวนี้
              </div>
            )}
            <div className="relative mx-auto w-full max-w-[520px] aspect-[1.25/1] rounded-3xl bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.10),transparent_60%)] border border-white/[0.06]">
              {/* element artifact (left) / archetype artifact (right) like the in-game screen */}
              <div className="absolute left-[1%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                {elementArt ? (
                  <button onClick={() => setPicked({ kind: 'artifact', item: elementArt })} className={`rounded-2xl cursor-pointer ${picked?.item === elementArt ? 'ring-2 ring-amber-400' : ''}`}><ArtifactIcon artifact={elementArt} size={56} /></button>
                ) : <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center text-[10px] text-slate-500">ธาตุ</div>}
                <span className="text-[10px] text-slate-500">อาร์ติแฟกต์ธาตุ</span>
              </div>
              <div className="absolute right-[1%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                {archArt ? (
                  <button onClick={() => setPicked({ kind: 'artifact', item: archArt })} className={`rounded-2xl cursor-pointer ${picked?.item === archArt ? 'ring-2 ring-amber-400' : ''}`}><ArtifactIcon artifact={archArt} size={56} /></button>
                ) : <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center text-[10px] text-slate-500">ประเภท</div>}
                <span className="text-[10px] text-slate-500">อาร์ติแฟกต์ประเภท</span>
              </div>

              {/* hex of runes around the portrait */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[62%] aspect-square">
                <div className="absolute inset-[26%] rounded-full bg-[#0b1220] border border-amber-500/20 shadow-[0_0_40px_rgba(251,191,36,0.15)] flex items-center justify-center">
                  {info ? <MonsterAvatar monster={info} size="lg" showStars={false} /> : null}
                </div>
                {[1, 2, 3, 4, 5, 6].map((slot) => {
                  const r = bySlot[slot];
                  const pos = SLOT_POS[slot];
                  return (
                    <div key={slot} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: pos.left, top: pos.top }}>
                      {r ? (
                        <button onClick={() => setPicked({ kind: 'rune', item: r })} className={`rounded-full cursor-pointer transition-transform hover:scale-105 ${picked?.item === r ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#0a0f19]' : ''}`} title={`ช่อง ${slot}`}>
                          <RuneIcon rune={r} size={60} />
                        </button>
                      ) : (
                        <div className="w-[60px] h-[60px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center text-xs text-slate-600">{slot}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 text-center">คลิกรูนหรืออาร์ติแฟกต์เพื่อดูค่าเต็ม • รูน {runes.length}/6 · อาร์ติแฟกต์ {artifacts.length}/2</div>
          </div>

          {/* right column: picked item detail or stat sheet */}
          <div className="lg:col-span-2 space-y-4">
            {picked ? (
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">{picked.kind === 'rune' ? <Gem className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />} รายละเอียด</div>
                  <button onClick={() => setPicked(null)} className="text-[11px] text-slate-400 hover:text-white cursor-pointer">ปิด</button>
                </div>
                {picked.kind === 'rune' ? <RuneDetail rune={picked.item} unitName={info?.name || ''} /> : <ArtifactDetail artifact={picked.item} />}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/[0.08] bg-[#070b14] p-4 text-xs text-slate-400 flex items-center gap-2"><Info className="w-4 h-4 shrink-0" /> เลือกรูนทางซ้ายเพื่อดูค่าหลัก / ซับ / เจียร / ประสิทธิภาพ</div>
            )}

            <div className="rounded-2xl border border-white/[0.08] bg-[#070b14] overflow-hidden">
              <div className="px-4 py-2.5 text-xs font-bold text-white border-b border-white/[0.06] flex items-center gap-2"><Star className="w-3.5 h-3.5 text-amber-400" /> สเตตัสรวม (พื้นฐาน → รวมรูน/เซ็ต/อาร์ติแฟกต์)</div>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-white/[0.05]">
                  {statRows.map(([label, k]) => (
                    <tr key={k}>
                      <td className="px-4 py-1.5 text-slate-400">{label}</td>
                      <td className="px-2 py-1.5 text-right font-mono text-slate-500">{stats.base[k]}{isPct(k) ? '%' : ''}</td>
                      <td className="px-2 py-1.5 text-center text-slate-600">→</td>
                      <td className={`px-4 py-1.5 text-right font-mono font-bold ${stats.total[k] > stats.base[k] ? 'text-emerald-300' : 'text-slate-200'}`}>{stats.total[k].toLocaleString()}{isPct(k) ? '%' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="px-4 py-2 text-[10px] text-slate-500 border-t border-white/[0.06]">ค่าที่คำนวณจากรูน/เซ็ต/อาร์ติแฟกต์หลัก ยังไม่รวมโบนัสอาคาร ลีด และซับสเตตัสอาร์ติแฟกต์</p>
            </div>

            {info && (
              <button onClick={() => onNavigate('where2use', { initialMonster: info.name })} className="sm:hidden w-full px-3 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                <Compass className="w-4 h-4" /> ใช้ที่ไหนได้บ้าง
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
