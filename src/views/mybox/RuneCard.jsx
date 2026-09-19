import React from 'react';
import MonsterAvatar from '../../components/MonsterAvatar';
import RuneIcon from '../../components/RuneIcon';
import { RUNE_SETS, STAT_NAMES } from '../../utils/swexImport';
import { monsterOf } from './shared';

// "SPD +12", "HP +8%" — percent stats are the % ids of STAT_NAMES
const statLabel = (id, val) => `${STAT_NAMES[id] || id} +${val}${[2, 4, 6, 9, 10, 11, 12].includes(id) ? '%' : ''}`;

export default function RuneCard({ rune }) {
  const info = rune.unit ? monsterOf(rune.unit) : null;
  const effColor = rune.eff >= 80 ? 'text-emerald-300' : rune.eff >= 60 ? 'text-amber-300' : 'text-slate-300';

  // Grind & Gem Opportunity Scanners
  const ungrindedSpd = rune.subs?.find((s) => s[0] === 8 && s[1] >= 18 && (s[2] || 0) === 0);
  const ungrindedPct = rune.subs?.find((s) => [2, 4, 6].includes(s[0]) && s[1] >= 20 && (s[2] || 0) === 0);
  const gemCandidate = rune.stars === 6 && (rune.eff >= 75 || rune.subs?.some(s => (s[0] === 8 && s[1] >= 14) || (s[0] === 9 && s[1] >= 15))) 
    ? rune.subs?.find((s) => [1, 3, 5].includes(s[0]) && s[3] === 0)
    : null;

  return (
    <div className="p-3 rounded-xl bg-[#0a0f18] border border-slate-800 flex items-start gap-3 hover:border-slate-700 transition">
      <div className="shrink-0 flex flex-col items-center gap-1">
        <RuneIcon rune={rune} size={54} />
        <span className="text-[10px] text-amber-400 leading-none tracking-tighter">{'★'.repeat(Math.min(6, rune.stars || 0))}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-white truncate">{RUNE_SETS[rune.set] || `Set ${rune.set}`} <span className="text-slate-400 font-normal">ช่อง {rune.slot}</span></span>
          <span className={`font-mono text-sm font-black ${effColor}`}>{rune.eff}%</span>
        </div>
        <div className="text-[11px] text-cyan-300 font-mono">{statLabel(rune.main[0], rune.main[1])}{rune.innate ? <span className="text-slate-400"> · {statLabel(rune.innate[0], rune.innate[1])}</span> : null}</div>
        <div className="text-[11px] text-slate-400 font-mono truncate">
          {rune.subs.map((s, i) => <span key={i}>{i ? ' / ' : ''}{STAT_NAMES[s[0]] || s[0]} {s[1]}{s[2] ? <span className="text-emerald-400">+{s[2]}</span> : ''}{[2, 4, 6, 9, 10, 11, 12].includes(s[0]) ? '%' : ''}</span>)}
        </div>

        {/* Smart Grind & Gem Action Chips */}
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          {ungrindedSpd && (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              ⚡ ขัด SPD ได้ +4~5
            </span>
          )}
          {ungrindedPct && (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              🛡️ ขัด % ได้ +7~10%
            </span>
          )}
          {gemCandidate && (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30" title="สามารถใช้หินแปลงออปเปลี่ยน Flat ให้เป็น % เพื่อเพิ่มประสิทธิภาพได้">
              💎 แนะนำแปลง {STAT_NAMES[gemCandidate[0]]} ด้วย Gem
            </span>
          )}
        </div>

        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
          {info ? <><MonsterAvatar monster={info} size="xs" showStars={false} /> <span className="truncate">{info.name}</span></> : <span>ในคลัง</span>}
        </div>
      </div>
    </div>
  );
}
