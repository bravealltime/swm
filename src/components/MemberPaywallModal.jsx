import React, { useState } from 'react';
import {
  Crown,
  Sparkles,
  Shield,
  Zap,
  Check,
  X,
  Swords,
  Radio,
  Layers,
  ArrowRight,
  ExternalLink,
  Flame,
  Award
} from 'lucide-react';
import { VIP_PLANS } from '../utils/memberPolicy';
import { useAuth } from '../contexts/AuthContext';

export default function MemberPaywallModal({ isOpen, onClose }) {
  const { isMember, setMemberStatus } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [copied, setCopied] = useState(false);
  const [activatedSuccess, setActivatedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopyPromptPay = () => {
    navigator.clipboard?.writeText('0812345678');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleQuickActivate = () => {
    setMemberStatus(true);
    setActivatedSuccess(true);
    setTimeout(() => {
      setActivatedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl my-6 bg-gradient-to-b from-[#11192e] via-[#0b101f] to-[#070b14] border-2 border-amber-500/40 rounded-3xl p-5 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.25)] text-slate-100 overflow-hidden">
        {/* Glow ambient background circles */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="ปิดหน้าต่าง"
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center max-w-xl mx-auto space-y-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black tracking-wider uppercase">
            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>SWM VIP Membership System</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 drop-shadow-sm">
            ปลดล็อกระบบยุทธวิธี & เครื่องมือแข่งขันระดับ Pro
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            เข้าถึงระบบฟาร์มสด Realtime, จัด 10 ทีมบุก Siege Deck Builder, สถิติ RTA เชิงลึก, และการ์ดเกมสะสม TCG ทุกแบบโดยไม่มีข้อจำกัด
          </p>
        </div>

        {/* Active Member Status Notice */}
        {isMember && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-400" />
              <span>ไอดีของคุณมีสิทธิ์สมาชิก <strong>SWM VIP Member (Active)</strong> เรียบร้อยแล้ว! ใช้งานทุกฟีเจอร์ได้ทันที</span>
            </div>
            <button
              onClick={() => {
                setMemberStatus(false);
              }}
              className="text-[11px] text-slate-400 hover:text-rose-300 underline"
            >
              สลับเป็นโหมดบุคคลทั่วไป (เพื่อทดสอบ)
            </button>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {VIP_PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative rounded-2xl p-5 sm:p-6 transition-all cursor-pointer border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-amber-500/15 via-slate-900/90 to-slate-950 border-amber-400 shadow-xl shadow-amber-500/15 ring-2 ring-amber-400/30'
                    : 'bg-slate-900/60 border-slate-700/60 hover:border-slate-500 hover:bg-slate-900/80'
                }`}
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-amber-300 px-2.5 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/30">
                    {plan.badge}
                  </span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-600'}`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                {/* Plan Name & Price */}
                <div>
                  <h3 className="text-lg font-black text-white">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 my-2">
                    <span className="text-3xl font-black text-amber-400">฿{plan.price}</span>
                    <span className="text-xs text-slate-400">/ {plan.period}</span>
                  </div>
                  <p className="text-xs text-slate-300 mb-4">{plan.desc}</p>
                </div>

                {/* Features List */}
                <div className="space-y-2 border-t border-slate-800/80 pt-3">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action & Subscription Options */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left space-y-0.5">
            <div className="text-xs font-bold text-slate-200 flex items-center justify-center sm:justify-start gap-1.5">
              <span>💳 สมัครสมาชิกผ่าน QR พร้อมเพย์ หรือ โอนเงิน</span>
              <button
                type="button"
                onClick={handleCopyPromptPay}
                className="text-[11px] text-amber-400 hover:text-amber-300 underline font-mono"
              >
                {copied ? '✓ คัดลอกเลขแล้ว!' : 'คัดลอกเบอร์พร้อมเพย์'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              แจ้งสลิปเพื่อเปิดสิทธิ์ผ่านแชท หรือกดปุ่มเปิดทดลองใช้งานทันทีด้านล่าง
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleQuickActivate}
              disabled={activatedSuccess}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-60"
            >
              <Crown className="w-4 h-4 text-slate-950 fill-slate-950" />
              <span>{activatedSuccess ? '✓ ปลดล็อก VIP สำเร็จ!' : isMember ? 'ต่ออายุสมาชิก' : 'เปิดใช้งานสิทธิ์ VIP ทันที'}</span>
            </button>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="mt-4 text-center text-[11px] text-slate-400">
          <span>🔒 ปลอดภัย 100% • รองรับการใช้งานผ่านมือถือ & พีซี • สิทธิ์ผูกกับบัญชี SWM ของคุณ</span>
        </div>
      </div>
    </div>
  );
}
