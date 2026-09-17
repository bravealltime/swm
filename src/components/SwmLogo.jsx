import React from 'react';

export default function SwmLogo({ size = 'md', showText = true, className = '' }) {
  const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-base', sub: 'text-[10px]' },
    md: { icon: 'w-9 h-9', text: 'text-xl', sub: 'text-[11px]' },
    lg: { icon: 'w-12 h-12', text: 'text-2xl', sub: 'text-xs' },
    xl: { icon: 'w-16 h-16', text: 'text-3xl', sub: 'text-sm' }
  }[size] || { icon: 'w-9 h-9', text: 'text-xl', sub: 'text-[11px]' };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* SWM Tactical Shield Emblem SVG */}
      <div className={`relative ${sizeMap.icon} shrink-0 flex items-center justify-center`}>
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Hexagonal Outer Shield */}
          <polygon 
            points="50,4 92,26 92,74 50,96 8,74 8,26" 
            className="fill-[#0c1424] stroke-blue-500" 
            strokeWidth="4" 
            strokeLinejoin="round"
          />
          {/* Inner Accent Ring */}
          <polygon 
            points="50,12 84,30 84,70 50,88 16,70 16,30" 
            className="fill-blue-950/40 stroke-cyan-400/40" 
            strokeWidth="2" 
            strokeLinejoin="round"
          />
          {/* Tactical Crosshair / Blades */}
          <path 
            d="M50 18 L50 82 M22 50 L78 50" 
            stroke="rgba(56, 189, 248, 0.3)" 
            strokeWidth="2" 
            strokeDasharray="4 3" 
          />
          {/* Central SWM Emblem Geometry */}
          <path 
            d="M32 38 L50 26 L68 38 L68 62 L50 74 L32 62 Z" 
            className="fill-blue-600/30 stroke-cyan-400" 
            strokeWidth="3" 
            strokeLinejoin="round"
          />
          {/* Glowing Center Core */}
          <circle cx="50" cy="50" r="7" className="fill-cyan-300 shadow-cyan-400" />
          <polygon points="50,30 64,40 50,50 36,40" className="fill-amber-400/80" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`${sizeMap.text} font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 font-mono`}>
              SWM
            </span>
            <span className="px-1.5 py-0.2 rounded bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-mono font-extrabold text-[10px] uppercase tracking-wider shadow-sm">
              MASTER
            </span>
          </div>
          <span className={`${sizeMap.sub} text-slate-400 font-medium tracking-tight mt-1 leading-none`}>
            Summoners War Tactical Intelligence
          </span>
        </div>
      )}
    </div>
  );
}
