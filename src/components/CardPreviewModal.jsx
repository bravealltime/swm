import React, { useState, useEffect, useCallback } from 'react';
import { X, Download, Copy, Check, Sparkles, Image as ImageIcon } from 'lucide-react';

export default function CardPreviewModal({ isOpen: propIsOpen, onClose: propOnClose, cardData: propCardData }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [internalData, setInternalData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Allow either controlled props or window event trigger
  const isOpen = propIsOpen !== undefined ? propIsOpen : internalOpen;
  const cardData = propCardData || internalData;

  const handleClose = useCallback(() => {
    setInternalOpen(false);
    setCopied(false);
    if (propOnClose) propOnClose();
  }, [propOnClose]);

  // Listen to global card export events
  useEffect(() => {
    const onCardPreviewEvent = (e) => {
      if (e.detail?.dataUrl) {
        setInternalData(e.detail);
        setInternalOpen(true);
        setCopied(false);
      }
    };
    window.addEventListener('swm:card-preview', onCardPreviewEvent);
    return () => window.removeEventListener('swm:card-preview', onCardPreviewEvent);
  }, []);

  // Keyboard shortcut: ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleClose]);

  const handleCopy = async () => {
    if (!cardData?.dataUrl) return;
    try {
      const res = await fetch(cardData.dataUrl);
      const blob = await res.blob();
      if (navigator.clipboard && typeof window.ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new window.ClipboardItem({ [blob.type || 'image/png']: blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return;
      }
    } catch (err) {
      console.warn('Direct image clipboard copy not permitted, falling back:', err);
    }

    try {
      await navigator.clipboard.writeText(cardData.dataUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Copy fallback failed:', err);
    }
  };

  const handleDownload = () => {
    if (!cardData?.dataUrl) return;
    const link = document.createElement('a');
    link.download = cardData.filename || 'SWM_Card.png';
    link.href = cardData.dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen || !cardData?.dataUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-preview-title"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative w-full max-w-5xl max-h-[94vh] flex flex-col bg-[#0b1120] border border-slate-700/80 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 id="card-preview-title" className="text-sm sm:text-base font-bold text-white truncate">
                {cardData.title || 'ตัวอย่างรูปการ์ด (Card Preview)'}
              </h3>
              <p className="text-[11px] text-slate-400 truncate font-mono">
                {cardData.filename || 'SWM_Card.png'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Preview Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-[#070b14] relative min-h-[220px]">
          <div className="relative group max-w-full flex items-center justify-center">
            <img
              src={cardData.dataUrl}
              alt={cardData.title || 'Card Preview'}
              className="max-h-[66vh] w-auto max-w-full object-contain rounded-xl shadow-2xl border border-amber-500/20 ring-1 ring-white/10 transition-transform duration-200"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-900/95 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>คลิกขวาที่รูปเพื่อบันทึกหรือคัดลอกรูปภาพได้โดยตรง</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              ปิด
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                copied
                  ? 'bg-emerald-600/25 border border-emerald-500/50 text-emerald-300'
                  : 'bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-slate-200 hover:text-white'
              }`}
              title="คัดลอกรูปภาพเพื่อไปวางใน Discord, Line, Facebook"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>คัดลอกรูปแล้ว! ✓</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-300" />
                  <span>คัดลอกรูปภาพ</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลดรูป (PNG)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
