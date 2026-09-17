import React from 'react';
import { RUNE_SETS } from '../utils/swexImport';

// Same layered artwork SWGT uses: quality background + slot shape + set symbol, all from the
// official Com2uS CDN. Sizes are in px; the layers are square.
const CDN = 'https://do9d4mpqk497d.cloudfront.net/common/images/rune_icons/';
const QUALITY = { 1: 'common', 2: 'magic', 3: 'rare', 4: 'hero', 5: 'legend' };
const QUALITY_RING = {
  1: 'ring-slate-500/60', 2: 'ring-emerald-400/70', 3: 'ring-sky-400/70', 4: 'ring-fuchsia-400/70', 5: 'ring-amber-400/80',
};

export default function RuneIcon({ rune, size = 56, showLevel = true, className = '' }) {
  const quality = QUALITY[rune.q] || QUALITY[rune.q0] || 'common';
  const setName = (RUNE_SETS[rune.set] || '').toLowerCase();
  const slot = Math.min(6, Math.max(1, rune.slot || 1));
  return (
    <div
      className={`relative shrink-0 rounded-full ring-2 ${QUALITY_RING[rune.q] || QUALITY_RING[1]} ${rune.ancient ? 'shadow-[0_0_10px_rgba(251,191,36,0.6)]' : ''} ${className}`}
      style={{ width: size, height: size }}
      title={`${RUNE_SETS[rune.set] || 'Rune'} ช่อง ${slot} ${rune.stars}★ +${rune.lvl}${rune.ancient ? ' (Ancient)' : ''}`}
    >
      <img src={`${CDN}bg_${quality}.png`} alt="" className="absolute inset-0 w-full h-full rounded-full" loading="lazy" />
      <img src={`${CDN}rune${slot}.png`} alt="" className="absolute inset-0 w-full h-full" loading="lazy" />
      {setName && (
        // set symbol sits in the middle of the rune, the way the game draws it
        <img src={`${CDN}${setName}.png`} alt={RUNE_SETS[rune.set]} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" style={{ width: size * 0.5, height: size * 0.5 }} loading="lazy" />
      )}
      {showLevel && rune.lvl > 0 && (
        <span className={`absolute -top-1 -left-1 px-1 rounded border text-[10px] font-black font-mono leading-tight ${
          rune.lvl >= 15 ? 'bg-amber-400 border-amber-200 text-slate-950 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : rune.lvl >= 12 ? 'bg-slate-950/90 border-amber-400/60 text-amber-200' : 'bg-slate-950/90 border-white/20 text-white'
        }`}>+{rune.lvl}</span>
      )}
      {rune.ancient ? <span className="absolute -top-1 -right-1 px-1 rounded bg-amber-500 text-slate-950 text-[9px] font-black leading-tight">A</span> : null}
    </div>
  );
}
