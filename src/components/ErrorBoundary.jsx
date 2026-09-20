import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

// Keeps a crash inside one view from blanking the whole app.
// The parent passes a `key` per route so navigating away resets it.
export default class ErrorBoundary extends React.Component {
  state = { error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (!this.state.error) return this.props.children;

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
