import React from 'react';
import RuneIcon from './RuneIcon';
import ArtifactIcon from './ArtifactIcon';
import MonsterAvatar from './MonsterAvatar';
import { RUNE_SETS } from '../utils/swexImport';

const CDN = 'https://do9d4mpqk497d.cloudfront.net/common/images/rune_icons/';

// Pointy-top hexagon; slot 1 at the top, then clockwise like the in-game rune screen.
const SLOT_ANGLE = { 1: -90, 2: -30, 3: 30, 4: 90, 5: 150, 6: 210 };
const hexPoints = (cx, cy, r) => Array.from({ length: 6 }, (_, i) => {
  const a = ((-90 + i * 60) * Math.PI) / 180;
  return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
}).join(' ');
const polar = (cx, cy, r, deg) => ({ x: cx + r * Math.cos((deg * Math.PI) / 180), y: cy + r * Math.sin((deg * Math.PI) / 180) });

/**
 * Golden hexagonal rune plate (SVG) with the six runes on their wedges, the monster in the centre,
 * artifacts stacked on the left and the completed rune sets on the right — the in-game layout.
 */
export default function RuneBoard({ info, runesBySlot, artifacts, sets = [], picked, onPick }) {
  const size = 420;
  const cx = size / 2;
  const cy = size / 2;
  const R = 186;
  const slotR = R * 0.62;
  const elementArt = artifacts.find((a) => a.kind === 'element');
  const archArt = artifacts.find((a) => a.kind === 'archetype');
  const setIds = Object.entries(RUNE_SETS).filter(([, name]) => sets.includes(name)).map(([id]) => Number(id));
  const uniqueSets = [...new Set(sets)];

  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      <div className="grid grid-cols-[72px_1fr_72px] sm:grid-cols-[88px_1fr_88px] items-center gap-2">
        {/* artifacts, stacked on the left like the game */}
        <div className="flex flex-col items-center gap-4">
          {[elementArt, archArt].map((art, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              {art ? (
                <button onClick={() => onPick({ kind: 'artifact', item: art })}
                  className={`rounded-full p-[3px] cursor-pointer transition-transform hover:scale-105 ${picked?.item === art ? 'ring-2 ring-amber-300' : ''}`}
                  style={{ background: 'radial-gradient(circle, #f5d78a 0%, #b8862b 45%, #6b4a12 100%)', boxShadow: '0 4px 14px rgba(0,0,0,0.6), inset 0 0 6px rgba(255,230,160,0.5)' }}>
                  <ArtifactIcon artifact={art} size={56} className="!rounded-full !border-0" />
                </button>
              ) : (
                <div className="w-[62px] h-[62px] rounded-full border-2 border-dashed border-amber-500/30 bg-black/30 flex items-center justify-center text-[10px] text-amber-200/50">{i === 0 ? 'ธาตุ' : 'ประเภท'}</div>
              )}
              <span className="text-[10px] text-amber-200/70">{i === 0 ? 'อาร์ติแฟกต์ธาตุ' : 'อาร์ติแฟกต์ประเภท'}</span>
            </div>
          ))}
        </div>

        {/* the plate */}
        <div className="relative" style={{ aspectRatio: '1 / 1' }}>
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full drop-shadow-[0_18px_30px_rgba(0,0,0,0.7)]">
            <defs>
              <linearGradient id="rb-gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#f7e2a4" />
                <stop offset="0.35" stopColor="#d4a84a" />
                <stop offset="0.7" stopColor="#8f6420" />
                <stop offset="1" stopColor="#f1d283" />
              </linearGradient>
              <radialGradient id="rb-plate" cx="50%" cy="45%" r="60%">
                <stop offset="0" stopColor="#c9963a" />
                <stop offset="0.55" stopColor="#8a6122" />
                <stop offset="1" stopColor="#4d3410" />
              </radialGradient>
              <radialGradient id="rb-core" cx="50%" cy="50%" r="50%">
                <stop offset="0" stopColor="#1b2033" />
                <stop offset="1" stopColor="#05070d" />
              </radialGradient>
              <filter id="rb-inner" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feComposite in="SourceGraphic" in2="b" operator="over" />
              </filter>
            </defs>
            {/* outer bevel */}
            <polygon points={hexPoints(cx, cy, R + 12)} fill="url(#rb-gold)" />
            <polygon points={hexPoints(cx, cy, R + 4)} fill="#3a2708" />
            {/* plate */}
            <polygon points={hexPoints(cx, cy, R)} fill="url(#rb-plate)" stroke="#e9c775" strokeWidth="2" />
            {/* wedge spokes */}
            {Array.from({ length: 6 }, (_, i) => {
              const p = polar(cx, cy, R, -90 + i * 60);
              return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#f1d283" strokeWidth="2.5" strokeOpacity="0.8" />;
            })}
            {/* inner ring separating the wedges from the core */}
            <polygon points={hexPoints(cx, cy, R * 0.36)} fill="#2a1c06" stroke="#f1d283" strokeWidth="2" />
            <circle cx={cx} cy={cy} r={R * 0.3} fill="url(#rb-core)" stroke="#e9c775" strokeWidth="3" />
            {/* wedge slot plates */}
            {[1, 2, 3, 4, 5, 6].map((slot) => {
              const p = polar(cx, cy, slotR, SLOT_ANGLE[slot]);
              return <circle key={slot} cx={p.x} cy={p.y} r={38} fill="#20150a" fillOpacity="0.85" stroke="#b8862b" strokeWidth="2" filter="url(#rb-inner)" />;
            })}
          </svg>

          {/* monster in the core */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center" style={{ width: '24%', height: '24%' }}>
            {info ? <MonsterAvatar monster={info} size="lg" showStars={false} /> : null}
          </div>

          {/* runes on their wedges */}
          {[1, 2, 3, 4, 5, 6].map((slot) => {
            const r = runesBySlot[slot];
            const p = polar(50, 50, (slotR / size) * 100, SLOT_ANGLE[slot]);
            return (
              <div key={slot} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                {r ? (
                  <button onClick={() => onPick({ kind: 'rune', item: r })} title={`ช่อง ${slot}`}
                    className={`rounded-full cursor-pointer transition-transform hover:scale-110 ${picked?.item === r ? 'ring-2 ring-amber-200 ring-offset-2 ring-offset-[#3a2708]' : ''}`}>
                    <RuneIcon rune={r} size={62} />
                  </button>
                ) : (
                  <div className="w-[62px] h-[62px] rounded-full flex items-center justify-center">
                    <img src={`${CDN}rune${slot}.png`} alt="" className="w-10 h-10 opacity-35" loading="lazy" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* completed sets on the right, in the purple hex like the game */}
        <div className="flex flex-col items-center gap-1">
          <div className="relative w-[72px] h-[80px] sm:w-[84px] sm:h-[94px]">
            <svg viewBox="0 0 100 112" className="w-full h-full drop-shadow-[0_8px_14px_rgba(0,0,0,0.6)]">
              <defs>
                <linearGradient id="rb-purple" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#c9a4ff" />
                  <stop offset="0.5" stopColor="#6b3fb0" />
                  <stop offset="1" stopColor="#2a1650" />
                </linearGradient>
              </defs>
              <polygon points={hexPoints(50, 56, 54)} fill="url(#rb-purple)" stroke="#e9c775" strokeWidth="3" />
              <polygon points={hexPoints(50, 56, 42)} fill="#1a0f33" stroke="#b892ff" strokeWidth="1.5" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
              {setIds.length ? setIds.slice(0, 2).map((id) => (
                <img key={id} src={`${CDN}${RUNE_SETS[id].toLowerCase()}.png`} alt={RUNE_SETS[id]} className="w-7 h-7 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" loading="lazy" />
              )) : <span className="text-[10px] text-purple-200/60">ไม่ครบเซ็ต</span>}
            </div>
          </div>
          <span className="text-[10px] text-purple-200/80 text-center leading-tight">{uniqueSets.length ? uniqueSets.join(' / ') : 'เซ็ตรูน'}</span>
        </div>
      </div>
    </div>
  );
}
