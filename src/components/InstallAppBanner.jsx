import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, PlusSquare, Sparkles, CheckCircle2 } from 'lucide-react';
import { subscribePwaState, promptInstall, isStandalone } from '../services/pwaService';

export default function InstallAppBanner() {
  const [pwaState, setPwaState] = useState({
    isStandalone: false,
    canInstall: false,
    isIos: false,
    isAndroid: false
  });
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    // Check if dismissed recently (within 4 days)
    const dismissedUntil = localStorage.getItem('swm:pwa-dismissed-until');
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      setIsDismissed(true);
    } else {
      setIsDismissed(false);
    }

    const unsubscribe = subscribePwaState((state) => {
      setPwaState(state);
    });

    // Listen to manual open event from sidebar or navbar
    const handleOpenInstall = () => {
      setIsDismissed(false);
      if (pwaState.isIos) {
        setShowIosGuide(true);
      } else if (pwaState.canInstall) {
        promptInstall();
      } else {
        setShowIosGuide(true);
      }
    };
    window.addEventListener('swm:open-install', handleOpenInstall);

    return () => {
      unsubscribe();
      window.removeEventListener('swm:open-install', handleOpenInstall);
    };
  }, [pwaState.isIos, pwaState.canInstall]);

  const handleDismiss = () => {
    setIsDismissed(true);
    // Dismiss for 4 days
    localStorage.setItem('swm:pwa-dismissed-until', String(Date.now() + 4 * 24 * 60 * 60 * 1000));
  };

  const handleInstallClick = async () => {
    if (pwaState.canInstall) {
      const res = await promptInstall();
      if (res?.outcome === 'accepted') {
        setIsDismissed(true);
      }
    } else {
      setShowIosGuide(true);
    }
  };

  // If already running in standalone app mode, hide completely
  if (pwaState.isStandalone || isStandalone()) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom Install Banner */}
      {!isDismissed && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[420px] z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900/95 via-blue-950/90 to-slate-900/95 border border-blue-500/40 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(59,130,246,0.3)] backdrop-blur-xl p-4 text-white">
            {/* Background Glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start gap-3.5">
              {/* App Icon */}
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-blue-400/50 shadow-md bg-[#0b1017] p-1 flex items-center justify-center">
                <img src="/icon-192.png" alt="SWM App" className="w-full h-full object-contain drop-shadow" />
                <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold">
                  ✓
                </span>
              </div>

              {/* Text Information */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm text-white tracking-wide flex items-center gap-1">
                    ติดตั้ง SWM เป็นแอปมือถือ
                  </h4>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    PWA
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                  เปิดเต็มจอ ไม่เกะกะแถบเว็บ โหลดไวเปิดข้างเกมได้ทันที
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all active:scale-95 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{pwaState.isIos ? 'ดูวิธีติดตั้งบน iPhone' : 'ติดตั้งลงเครื่อง'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-400 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    ไว้ทีหลัง
                  </button>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS / General Install Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-gradient-to-b from-slate-900 to-[#0c1424] border border-blue-500/30 p-6 shadow-2xl text-white">
            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#0b1017] border border-blue-400/40 p-1 flex items-center justify-center">
                <img src="/icon-192.png" alt="SWM" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">วิธีติดตั้ง SWM ลงหน้าจอมือถือ</h3>
                <p className="text-xs text-slate-400">เข้าถึงง่าย เปิดเต็มจอ ไม่เปลืองพื้นที่เครื่อง</p>
              </div>
            </div>

            {pwaState.isIos ? (
              /* iOS Safari Instructions */
              <div className="space-y-3.5 my-5 text-xs text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-white">แตะปุ่มแชร์ [Share] ใน Safari</p>
                    <p className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-1">
                      (ไอคอนสี่เหลี่ยมมีลูกศรชี้ขึ้น <Share className="w-3.5 h-3.5 text-blue-400 inline" /> ที่แถบด้านล่างของจอ)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-white">เลื่อนลงแล้วเลือก [เพิ่มไปยังหน้าจอโฮม]</p>
                    <p className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-1">
                      (Add to Home Screen <PlusSquare className="w-3.5 h-3.5 text-cyan-400 inline" />)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-white">แตะ [เพิ่ม] (Add) ที่มุมขวาบน</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      ไอคอนแอป SWM จะไปปรากฏบนหน้าจอหลักพร้อมเปิดเล่นได้ทันที!
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Android / Desktop Instructions */
              <div className="space-y-3.5 my-5 text-xs text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-white">แตะเมนูเพิ่มเติม (จุด 3 จุด ⋮)</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">ที่มุมบนขวาของเบราว์เซอร์ Chrome / Edge</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-white">เลือก [ติดตั้งแอป] หรือ [เพิ่มลงในหน้าจอหลัก]</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">Install App / Add to Home Screen</p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
