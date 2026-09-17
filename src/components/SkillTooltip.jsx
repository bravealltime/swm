import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Zap, Shield, Swords, Info, Clock, Target, Layers } from 'lucide-react';

export default function SkillTooltip({ 
  skill, 
  leaderSkill, 
  children, 
  placement = 'top',
  size = 'md' 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, position: 'top' });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  const calculatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 240;
    const padding = 12;

    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    // Keep in viewport horizontally
    if (left < padding) left = padding;
    if (left + tooltipWidth > window.innerWidth - padding) {
      left = window.innerWidth - tooltipWidth - padding;
    }

    let top = rect.top - tooltipHeight - 8;
    let pos = 'top';

    // If overflows top, show below
    if (top < padding) {
      top = rect.bottom + 8;
      pos = 'bottom';
    }

    setCoords({ top, left, position: pos });
  };

  const handleMouseEnter = () => {
    calculatePosition();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  // Click toggle for touch devices
  const handleClick = (e) => {
    e.stopPropagation();
    calculatePosition();
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleScrollOrResize = () => {
      if (isOpen) setIsOpen(false);
    };
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  if (!skill && !leaderSkill) {
    return <>{children}</>;
  }

  return (
    <div 
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {children}

      {isOpen && (
        <div 
          ref={tooltipRef}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: '320px',
            zIndex: 99999
          }}
          className="pointer-events-none animate-in fade-in zoom-in-95 duration-150 bg-[#0d1522] border border-[#22334d] text-white rounded-xl p-3.5 shadow-2xl shadow-black/80 backdrop-blur-md"
        >
          {leaderSkill ? (
            /* Leader Skill Tooltip */
            <div className="space-y-2">
              <div className="flex items-center gap-2 border-b border-[#1c2a3f] pb-2">
                <img 
                  src={leaderSkill.iconUrl} 
                  alt="Leader" 
                  className="w-8 h-8 rounded-lg bg-black/40 border border-amber-500/40 p-0.5"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[11px] font-bold">
                      LEADER
                    </span>
                    <span className="text-xs font-bold text-white">ลีดเดอร์สกิล</span>
                  </div>
                  <div className="text-xs text-amber-300/90 font-semibold">
                    เพิ่ม {leaderSkill.attribute} +{leaderSkill.amount}%
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {leaderSkill.textTh}
              </p>

              <div className="text-[11px] text-slate-400 border-t border-[#1c2a3f] pt-1.5 font-mono">
                {leaderSkill.textEn}
              </div>
            </div>
          ) : (
            /* Active / Passive Skill Tooltip */
            <div className="space-y-2.5">
              {/* Header */}
              <div className="flex items-start gap-2.5 border-b border-[#1c2a3f] pb-2">
                <img 
                  src={skill.iconUrl} 
                  alt={skill.name} 
                  className="w-9 h-9 rounded-lg bg-black/50 border border-blue-500/40 p-0.5 shrink-0"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://do9d4mpqk497d.cloudfront.net/common/images/skills36/skill_icon_0001_0_0.png';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-1.5 py-0.2 rounded text-[11px] font-extrabold uppercase ${
                      skill.isPassive 
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                        : skill.slot === 1 
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : skill.slot === 2
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {skill.slotLabel}
                    </span>

                    {skill.cooldown && (
                      <span className="flex items-center gap-1 text-[11px] text-sky-400 bg-sky-950/60 px-1.5 py-0.2 rounded border border-sky-800/40 font-mono">
                        <Clock className="w-2.5 h-2.5" />
                        {skill.cooldown} เทิร์น
                      </span>
                    )}

                    {skill.isAoe && (
                      <span className="text-[11px] text-indigo-300 bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-800/40">
                        AOE หมู่
                      </span>
                    )}

                    {skill.hits > 1 && (
                      <span className="text-[11px] text-yellow-300 bg-yellow-950/60 px-1.5 py-0.2 rounded border border-yellow-800/40 font-mono">
                        {skill.hits} Hits
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-bold text-white truncate mt-1">
                    {skill.name}
                  </div>
                </div>
              </div>

              {/* Description in Thai */}
              <div className="text-xs text-slate-200 leading-relaxed font-sans">
                {skill.descriptionTh || skill.description}
              </div>

              {/* Multiplier / Scaling Formula */}
              {(skill.multiplier || (skill.scalesWith && skill.scalesWith.length > 0)) && (
                <div className="bg-[#080d14] rounded-lg p-2 border border-[#1a2536] text-xs space-y-1">
                  {skill.multiplier && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold">สูตรดาเมจตัวคูณ:</span>
                      <span className="text-amber-400 font-mono font-semibold">{skill.multiplier}</span>
                    </div>
                  )}
                  {skill.scalesWith && skill.scalesWith.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold">สเกลดาเมจตาม:</span>
                      <span className="text-emerald-400 font-bold">{skill.scalesWith.join(', ')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Debuffs / Buffs Effects */}
              {skill.effects && skill.effects.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {skill.effects.map((eff, i) => (
                    <span 
                      key={i} 
                      className={`px-1.5 py-0.5 rounded text-[11px] font-bold border ${eff.badgeClass || 'bg-slate-800 text-slate-300 border-slate-700'}`}
                    >
                      {eff.nameTh || eff.name} {eff.chance ? `(${eff.chance}%)` : ''}
                    </span>
                  ))}
                </div>
              )}

              {/* Skill-ups */}
              {skill.skillups && skill.skillups.length > 0 && (
                <div className="border-t border-[#1c2a3f] pt-1.5">
                  <div className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                    <Layers className="w-2.5 h-2.5" />
                    อัปเกรดเลเวลสกิล (Skill Ups สูงสุด Lv.{skill.maxLevel || (skill.skillups.length + 1)}):
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300">
                    {skill.skillups.map((up, idx) => (
                      <div key={idx} className="flex items-center gap-1 text-slate-300 font-mono">
                        <span className="text-slate-400">Lv.{idx + 2}:</span>
                        <span>{up}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
