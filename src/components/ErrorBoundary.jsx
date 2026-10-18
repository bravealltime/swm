import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

// Keeps a crash inside one view from blanking the whole app.
// The parent passes a `key` per route so navigating away resets it.
export default class ErrorBoundary extends React.Component {
  state = { error: null, errorInfo: null, isChunkError: false };

  static getDerivedStateFromError(error) {
    const isChunkError =
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed') ||
      error?.message?.includes('error loading dynamically imported module') ||
      error?.name === 'ChunkLoadError';
    return { error, isChunkError };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });

    const isChunk =
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed') ||
      error?.message?.includes('error loading dynamically imported module') ||
      error?.name === 'ChunkLoadError';

    // Auto-reload to fetch fresh chunk when a new deployment happened on Vercel
    if (isChunk && typeof window !== 'undefined') {
      const reloadKey = 'swm:error_boundary_reload_ts';
      const lastReload = Number(sessionStorage.getItem(reloadKey) || '0');
      if (Date.now() - lastReload > 10000) {
        sessionStorage.setItem(reloadKey, String(Date.now()));
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    if (this.state.isChunkError) {
      return (
        <div role="alert" className="max-w-xl mx-auto my-16 p-6 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center mx-auto animate-spin">
            <RotateCcw className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">🚀 มีการอัปเดตเวอร์ชันใหม่ (New Version)</h2>
          <p className="text-sm text-cyan-200">
            ตรวจพบเวอร์ชันใหม่ล่าสุดของ Summoners War Master กำลังโหลดข้อมูลหน้าเว็บใหม่ให้คุณอัตโนมัติ...
          </p>
          <div className="pt-2">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-sm font-bold shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> โหลดเวอร์ชันใหม่ทันที
            </button>
          </div>
        </div>
      );
    }

    return (
      <div role="alert" className="max-w-xl mx-auto my-16 p-6 rounded-2xl border border-rose-500/30 bg-rose-500/5 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">หน้านี้เกิดข้อผิดพลาด</h2>
        <p className="text-sm text-slate-400">ลองโหลดหน้าใหม่ หรือกลับไปหน้าแรกแล้วลองอีกครั้ง</p>
        {this.state.error?.message && (
          <div className="text-left bg-black/40 border border-rose-500/20 rounded-xl p-3 text-xs text-rose-300 font-mono overflow-x-auto">
            {this.state.error.message}
          </div>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> โหลดหน้าใหม่
          </button>
          <a href="/" className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:text-white text-sm font-bold">
            กลับหน้าแรก
          </a>
        </div>
      </div>
    );
  }
}
