import React from 'react';
import { Shield, Sparkles, Trophy, Award, Zap, Sliders } from 'lucide-react';

export default function AccountRadarChart({ radarData, onExportCard, isExporting }) {
  const { axes = [], overallScore = 75, overallGrade = 'A', gradeLabel = '', advice = '' } = radarData || {};

  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const r = 105;
  const numPoints = axes.length || 6;

  const angleAt = (i) => (i * 2 * Math.PI) / numPoints - Math.PI / 2;

  // Concentric polygon rings at 25%, 50%, 75%, 100%
  const rings = [0.25, 0.5, 0.75, 1.0];

  const ringPolygonPoints = (scale) => {
    return Array.from({ length: numPoints }, (_, i) => {
      const a = angleAt(i);
      const x = cx + Math.cos(a) * (r * scale);
      const y = cy + Math.sin(a) * (r * scale);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  // Data polygon points
  const dataPolygonPoints = axes.map((axis, i) => {
    const scale = Math.max(0.1, Math.min(1.0, (axis.score || 50) / 100));
    const a = angleAt(i);
    const x = cx + Math.cos(a) * (r * scale);
    const y = cy + Math.sin(a) * (r * scale);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const gradeColors = {
    'S+': { text: 'text-rose-400', bg: 'bg-rose-500/20 border-rose-500/40', badge: 'bg-gradient-to-r from-rose-500 to-amber-500' },
    'S': { text: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/40', badge: 'bg-gradient-to-r from-amber-500 to-yellow-500' },
    'A': { text: 'text-purple-400', bg: 'bg-purple-500/20 border-purple-500/40', badge: 'bg-gradient-to-r from-purple-500 to-indigo-500' },
    'B': { text: 'text-sky-400', bg: 'bg-sky-500/20 border-sky-500/40', badge: 'bg-gradient-to-r from-sky-500 to-blue-500' },
    'C': { text: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40', badge: 'bg-gradient-to-r from-emerald-500 to-teal-500' },
  };
  const theme = gradeColors[overallGrade] || gradeColors.A;

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0a0f19] p-5 sm:p-7 shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Trophy className="w-4 h-4" />
            <span>Summoner Power Radar • วิเคราะห์ไอดี 6 มิติ</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            เรดาร์ขุมกำลังของไอดี (Account Assessment)
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3.5 py-1.5 rounded-2xl border flex items-center gap-2 font-mono font-bold text-sm ${theme.bg}`}>
            <span className="text-xs text-slate-400">เกรดรวม</span>
            <span className={`text-xl font-black ${theme.text}`}>{overallGrade}</span>
            <span className="text-xs font-normal text-slate-300">({overallScore}/100)</span>
          </div>

          {onExportCard && (
            <button
              onClick={onExportCard}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isExporting ? 'กำลังบันทึก...' : 'แชร์การ์ดเรดาร์'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Chart and Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* SVG Radar Chart */}
        <div className="lg:col-span-6 flex justify-center py-2 relative">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
            {/* Concentric grid rings */}
            {rings.map((scale, idx) => (
              <polygon
                key={idx}
                points={ringPolygonPoints(scale)}
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={idx === rings.length - 1 ? 1.5 : 1}
              />
            ))}

            {/* Radial spokes */}
            {axes.map((_, i) => {
              const a = angleAt(i);
              const x2 = cx + Math.cos(a) * r;
              const y2 = cy + Math.sin(a) * r;
              return (
                <line
                  key={i}
                  x1={cx}
                  y1={cy}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
              );
            })}

            {/* Data Polygon Fill & Stroke */}
            <polygon
              points={dataPolygonPoints}
              fill="rgba(56, 189, 248, 0.25)"
              stroke="#38bdf8"
              strokeWidth="2.5"
            />

            {/* Vertex points */}
            {axes.map((axis, i) => {
              const scale = Math.max(0.1, Math.min(1.0, (axis.score || 50) / 100));
              const a = angleAt(i);
              const px = cx + Math.cos(a) * (r * scale);
              const py = cy + Math.sin(a) * (r * scale);
              return (
                <circle
                  key={i}
                  cx={px}
                  cy={py}
                  r="4.5"
                  fill="#fff"
                  stroke="#0284c7"
                  strokeWidth="2"
                />
              );
            })}

            {/* Labels around chart */}
            {axes.map((axis, i) => {
              const a = angleAt(i);
              const labelRadius = r + 24;
              const lx = cx + Math.cos(a) * labelRadius;
              const ly = cy + Math.sin(a) * labelRadius;
              const isRight = Math.cos(a) > 0.1;
              const isLeft = Math.cos(a) < -0.1;
              const align = isRight ? 'start' : isLeft ? 'end' : 'middle';

              return (
                <text
                  key={i}
                  x={lx}
                  y={ly}
                  textAnchor={align}
                  dominantBaseline="central"
                  className="fill-slate-300 text-[11px] font-bold"
                >
                  {axis.label}
                </text>
              );
            })}
          </svg>
        </div>

        {/* 6 Dimension Details */}
        <div className="lg:col-span-6 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            รายละเอียดคะแนนแต่ละด้าน (Scores Breakdown)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {axes.map((axis) => (
              <div 
                key={axis.key} 
                className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 transition flex justify-between items-center"
              >
                <div>
                  <div className="text-xs text-slate-400 font-medium">{axis.label}</div>
                  <div className="text-xs text-slate-200 font-mono font-bold mt-0.5">{axis.value}</div>
                </div>
                <div className="text-right">
                  <div className={`text-base font-black font-mono ${
                    axis.score >= 80 ? 'text-emerald-400' : axis.score >= 65 ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                    {axis.score}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">/ 100</div>
                </div>
              </div>
            ))}
          </div>

          {/* Actionable Advice Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 border border-blue-500/20 text-xs leading-relaxed text-slate-300">
            <div className="font-bold text-blue-300 mb-1 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>{gradeLabel}</span>
            </div>
            <p>{advice}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
