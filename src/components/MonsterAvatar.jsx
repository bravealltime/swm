import React from 'react';

const ELEMENT_STYLES = {
  fire: {
    border: 'border-rose-500/80',
    bg: 'bg-rose-950/40',
    badge: 'bg-rose-600 text-white',
    dot: 'bg-rose-500',
    name: 'ไฟ'
  },
  water: {
    border: 'border-sky-500/80',
    bg: 'bg-sky-950/40',
    badge: 'bg-sky-600 text-white',
    dot: 'bg-sky-400',
    name: 'น้ำ'
  },
  wind: {
    border: 'border-amber-500/80',
    bg: 'bg-amber-950/40',
    badge: 'bg-amber-600 text-white',
    dot: 'bg-amber-400',
    name: 'ลม'
  },
  light: {
    border: 'border-yellow-200/90',
    bg: 'bg-yellow-950/30',
    badge: 'bg-yellow-300 text-slate-950',
    dot: 'bg-yellow-200',
    name: 'แสง'
  },
  dark: {
    border: 'border-purple-500/80',
    bg: 'bg-purple-950/40',
    badge: 'bg-purple-600 text-white',
    dot: 'bg-purple-400',
    name: 'มืด'
  }
};

const ELEMENT_ICONS = {
  fire: 'https://do9d4mpqk497d.cloudfront.net/common/images/elements/fire.png',
  water: 'https://do9d4mpqk497d.cloudfront.net/common/images/elements/water.png',
  wind: 'https://do9d4mpqk497d.cloudfront.net/common/images/elements/wind.png',
  light: 'https://do9d4mpqk497d.cloudfront.net/common/images/elements/light.png',
  dark: 'https://do9d4mpqk497d.cloudfront.net/common/images/elements/dark.png',
};

export default function MonsterAvatar({ 
  monster, 
  size = 'md', 
  showName = false, 
  showStars = true,
  onClick,
  active = false
}) {
  if (!monster) return null;

  const sizeMap = {
    sm: { box: 'w-11 h-11', icon: 'w-3.5 h-3.5', stars: 'text-[8px]', text: 'text-xs' },
    md: { box: 'w-14 h-14 sm:w-16 sm:h-16', icon: 'w-4 h-4', stars: 'text-[9px]', text: 'text-xs' },
    lg: { box: 'w-20 h-20', icon: 'w-5 h-5', stars: 'text-[10px]', text: 'text-sm' },
    xl: { box: 'w-24 h-24', icon: 'w-6 h-6', stars: 'text-xs', text: 'text-base' }
  }[size] || { box: 'w-14 h-14 sm:w-16 sm:h-16', icon: 'w-4 h-4', stars: 'text-[9px]', text: 'text-xs' };

  const elemKey = (monster.element || 'fire').toLowerCase();
  const elem = ELEMENT_STYLES[elemKey] || ELEMENT_STYLES.fire;
  const elemIcon = ELEMENT_ICONS[elemKey] || monster.elementIcon;
  const imgSrc = monster.avatarUrl || monster.imageUrl || monster.image || 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png';
  const displayName = monster.thaiName || monster.nameTh || monster.name || '';
  const engName = monster.name || monster.nameEn || '';

  return (
    <div 
      className={`inline-flex flex-col items-center gap-1.5 ${onClick ? 'cursor-pointer select-none group' : ''}`}
      onClick={onClick}
    >
      <div 
        className={`relative ${sizeMap.box} rounded-lg border-2 ${elem.border} ${elem.bg} overflow-hidden transition-all duration-150 ${
          active ? 'ring-2 ring-blue-400 scale-105' : onClick ? 'group-hover:border-slate-300 group-hover:scale-102' : ''
        }`}
      >
        {/* Official In-Game Monster Portrait */}
        <img 
          src={imgSrc} 
          alt={engName}
          className="w-full h-full object-cover rounded-md bg-black"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png';
          }}
        />

        {/* Real Com2uS Element Icon (Top-Left Badge) */}
        {elemIcon && (
          <img 
            src={elemIcon} 
            alt={elemKey} 
            className={`absolute top-0.5 left-0.5 ${sizeMap.icon} drop-shadow-md z-10 pointer-events-none`}
          />
        )}

        {/* Star Rating Strip (Bottom) */}
        {showStars && (
          <div className="absolute bottom-0 inset-x-0 bg-black/85 py-0.2 flex items-center justify-center text-amber-400 font-bold z-10 leading-none">
            <span className={sizeMap.stars}>
              {'★'.repeat(Math.min(6, monster.stars || 4))}
            </span>
          </div>
        )}
      </div>

      {/* Label under avatar */}
      {showName && (
        <div className="text-center max-w-[84px]">
          <div className={`${sizeMap.text} font-bold text-slate-100 group-hover:text-blue-400 transition-colors truncate`}>
            {displayName.split(' ')[0]}
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {engName}
          </div>
        </div>
      )}
    </div>
  );
}
