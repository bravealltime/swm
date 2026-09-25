import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, X, Volume2, VolumeX, Shield, Zap, AlertCircle } from 'lucide-react';
import * as aegisLive from '../services/aegisLive';
import { isAudioMuted, toggleAudioMute, playLegendAlertSound } from '../utils/soundEffects';

export default function LiveAlertBanner({ onNavigate }) {
  const [liveState, setLiveState] = useState(() => aegisLive.getState());
  const [muted, setMuted] = useState(() => isAudioMuted());
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    return aegisLive.subscribe((type, payload, st) => {
      setLiveState({ ...st });
      if (st.liveAlert) {
        setVisible(true);
      }
    });
  }, []);

  const alert = liveState.liveAlert;
  if (!alert || !visible) return null;

  const handleMuteToggle = (e) => {
    e.stopPropagation();
    const next = toggleAudioMute();
    setMuted(next);
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    setVisible(false);
    aegisLive.dismissLiveAlert();
  };

  const isLegend = alert.type === 'legend_rune' || alert.type === 'nat5_summon';

  return (
    <aside
      aria-label="การแจ้งเตือนสด SWEX"
      className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 fade-in duration-300"
    >
      <div
        className={`relative overflow-hidden rounded-3xl border p-4 sm:p-5 shadow-2xl backdrop-blur-xl transition-all ${
          isLegend
            ? 'bg-gradient-to-r from-amber-950/90 via-[#181105]/95 to-amber-950/90 border-amber-500/50 shadow-amber-500/20'
            : 'bg-gradient-to-r from-slate-900/95 via-[#0e1726]/95 to-slate-900/95 border-emerald-500/40 shadow-emerald-500/10'
        }`}
      >
        {/* Ambient Glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-start gap-3.5">
          <div
            className={`p-3 rounded-2xl shrink-0 border shadow-lg ${
              isLegend
                ? 'bg-gradient-to-br from-amber-500/25 to-yellow-500/10 border-amber-500/40 text-amber-300 animate-pulse'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            }`}
          >
            {alert.type === 'nat5_summon' ? (
              <Trophy className="w-6 h-6 text-amber-300" />
            ) : alert.type === 'legend_rune' ? (
              <Sparkles className="w-6 h-6 text-amber-300" />
            ) : (
              <Zap className="w-6 h-6 text-emerald-400" />
            )}
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  isLegend
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {alert.badge || 'สดจากเกม (SWEX)'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">เมื่อสักครู่</span>
            </div>

            <h4 className="text-sm font-black text-white mt-1 leading-snug truncate">
              {alert.title}
            </h4>

            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {alert.desc}
            </p>

            {alert.rune?.reason && (
              <div className="mt-2 text-[11px] px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/5 text-slate-300">
                💡 <span className="font-medium text-amber-200">{alert.rune.reason}</span>
              </div>
            )}

            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/[0.06]">
              {onNavigate && (
                <button
                  onClick={() => {
                    handleDismiss();
                    onNavigate(alert.type === 'nat5_summon' ? 'my-box' : 'live-farm-monitor');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                >
                  <span>{alert.type === 'nat5_summon' ? 'ดูกล่องมอนสเตอร์' : 'ดูจอเช็คการฟาร์มสด'}</span>
                </button>
              )}

              <button
                onClick={handleMuteToggle}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                title={muted ? 'เปิดเสียงแจ้งเตือน' : 'ปิดเสียงแจ้งเตือน'}
              >
                {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            aria-label="ปิดการแจ้งเตือน"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
