import React from 'react';
import {
  Crown,
  Lock,
  Sparkles,
  ArrowRight,
  Shield,
  Radio,
  Swords,
  Layers,
  ChevronLeft,
  Home
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function MemberGate({ viewTitle = 'ฟีเจอร์ระดับแข่งขัน', onNavigate, onOpenPaywall }) {
  const { isMember } = useAuth();

  return (
    <div className="w-full max-w-4xl mx-auto py-8 sm:py-16 px-4 text-center animate-in fade-in duration-300">
      <div className="relative rounded-3xl p-6 sm:p-12 bg-gradient-to-b from-[#11192e] via-[#0d1424] to-[#070b14] border-2 border-amber-500/30 shadow-[0_0_60px_rgba(245,158,11,0.18)] overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        {/* Floating Crown Icon */}
        <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-yellow-400/25 to-amber-600/20 border-2 border-amber-400/50 flex items-center justify-center shadow-xl shadow-amber-500/20 mb-6">
          <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 fill-amber-400/20" />
          <div className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-slate-950 border border-amber-400/60 text-amber-400">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        {/* Title */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SWM VIP Member Exclusive</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-amber-300 mb-3">
          {viewTitle} เปิดให้ใช้งานเฉพาะสมาชิก VIP
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed mb-8">
          ฟีเจอร์นี้เป็นระบบยุทธวิธีขั้นสูงระดับแข่งขัน สำหรับการวางแผนกิลด์วอร์ Siege, RTA และฟาร์มสดแบบ Realtime
        </p>

        {/* 4 Key VIP Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-8 text-left">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <Radio className="w-5 h-5 text-cyan-400 mb-1" />
            <div className="text-xs font-bold text-white">Live Monitor</div>
            <div className="text-[10px] text-slate-400">ตรวจจับฟาร์มสด</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <Shield className="w-5 h-5 text-amber-400 mb-1" />
            <div className="text-xs font-bold text-white">Siege War Room</div>
            <div className="text-[10px] text-slate-400">จัด 10 ทีมบุก</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <Swords className="w-5 h-5 text-rose-400 mb-1" />
            <div className="text-xs font-bold text-white">RTA Analytics</div>
            <div className="text-[10px] text-slate-400">จำลองดราฟต์ 5v5</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <Sparkles className="w-5 h-5 text-purple-400 mb-1" />
            <div className="text-xs font-bold text-white">Unlimited AI</div>
            <div className="text-[10px] text-slate-400">ถามโค้ชไม่จำกัด</div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
            <button
              type="button"
              onClick={onOpenPaywall}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-sm font-black shadow-lg shadow-amber-500/25 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
            >
              <Crown className="w-4 h-4 fill-slate-950" />
              <span>อัปเกรดเป็นสมาชิก VIP ทันที</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate?.('dashboard')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-sm font-bold border border-cyan-500/40 transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-95"
            >
              <Home className="w-4 h-4" />
              <span>🏠 กลับหน้าหลัก (Dashboard)</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400 pt-1">
            <button
              type="button"
              onClick={() => {
                if (window.history && window.history.length > 1) {
                  window.history.back();
                } else {
                  onNavigate?.('dashboard');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>ย้อนกลับหน้าที่แล้ว</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate?.('monster-catalog')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            >
              <span>ดูสารานุกรมมอนสเตอร์ & โค้ดฟรี</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
