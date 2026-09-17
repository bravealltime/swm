import React from 'react';

// Exact SWGT CloudFront CDN for Summoners War Artifact Artwork
const CDN = 'https://do9d4mpqk497d.cloudfront.net/common/images/artifact_icons/';

const QUALITY = { 1: 'common', 2: 'magic', 3: 'rare', 4: 'hero', 5: 'legend' };
const QUALITY_BORDER = {
  1: 'border-slate-500/50 shadow-slate-500/20',
  2: 'border-emerald-400/60 shadow-emerald-500/20',
  3: 'border-sky-400/60 shadow-sky-500/20',
  4: 'border-fuchsia-400/60 shadow-fuchsia-500/20',
  5: 'border-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.35)]',
};

export default function ArtifactIcon({ artifact, size = 56, showLevel = true, className = '' }) {
  if (!artifact) return null;

  const rank = Number(artifact.rank) || 5;
  const quality = QUALITY[rank] || 'legend';
  const isElement = artifact.slot === 1 || artifact.kind === 'element';
  
  // SWGT naming convention:
  // Background: bg_legend.png
  // Frame: element_legend_v2.png or archetype_legend_v2.png
  // Symbol: water_legend_v2.png, fire_legend_v2.png, attack_legend_v2.png, etc.
  const frameImg = isElement
    ? `element_${quality}_v2.png`
    : `archetype_${quality}_v2.png`;

  const symbolAttr = isElement
    ? (artifact.element || 'fire').toLowerCase()
    : (artifact.archetype || 'Attack').toLowerCase();

  const symbolImg = `${symbolAttr}_${quality}_v2.png`;

  return (
    <div
      className={`relative shrink-0 rounded-2xl border-2 overflow-hidden bg-[#070b14] flex items-center justify-center ${QUALITY_BORDER[rank] || QUALITY_BORDER[5]} ${className}`}
      style={{ width: size, height: size }}
      title={`${isElement ? 'Element' : 'Archetype'} Artifact +${artifact.lvl ?? 15} (${quality.toUpperCase()})`}
    >
      {/* 1. Base Quality Background */}
      <img
        src={`${CDN}bg_${quality}.png`}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        onError={(e) => { e.target.style.display = 'none'; }}
      />

      {/* 2. Artifact Style Frame (element or archetype) */}
      <img
        src={`${CDN}${frameImg}`}
        alt=""
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        loading="lazy"
        onError={(e) => { e.target.style.display = 'none'; }}
      />

      {/* 3. Center Artifact Symbol (element or archetype icon) */}
      <img
        src={`${CDN}${symbolImg}`}
        alt={symbolAttr}
        className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] pointer-events-none"
        loading="lazy"
        onError={(e) => { e.target.style.display = 'none'; }}
      />

      {/* +Level Badge */}
      {showLevel && (artifact.lvl !== undefined) && (
        <span className={`absolute -top-1 -left-1 px-1 rounded border text-[9px] font-black font-mono leading-tight z-10 ${
          (artifact.lvl >= 15)
            ? 'bg-amber-400 border-amber-200 text-slate-950 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
            : 'bg-slate-950/90 border-white/20 text-white'
        }`}>
          +{artifact.lvl}
        </span>
      )}
    </div>
  );
}
