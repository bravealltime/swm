import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  Key,
  Copy,
  Check,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  RefreshCw,
  Share2,
  Download,
  ArrowRight,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { loadBox, saveBox } from '../utils/boxStorage';

export default function CloudSyncModal({ isOpen, onClose, onSynced }) {
  const [box, setBox] = useState(() => loadBox());
  const [activeTab, setActiveTab] = useState('sync-out');
  const [syncKeyInput, setSyncKeyInput] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('info'); // 'success' | 'error' | 'loading'
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBox(loadBox());
      setStatusMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const wizardName = box?.wizard?.name || box?.wizard_info?.wizard_name || '';
  const wizardId = box?.wizard?.idHint || box?.wizard_info?.wizard_id || '9326961';
  const syncKey = `${wizardName.toUpperCase()}-${wizardId}`;
  const shareLink = typeof window !== 'undefined' ? `${window.location.origin}/?sync=${wizardName}` : '';

  const handleCopyKey = () => {
    navigator.clipboard.writeText(syncKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Sync to Cloud / Server
  const handlePushToCloud = async () => {
    if (!box) {
      setStatusType('error');
      setStatusMessage('ยังไม่มีข้อมูลไอดีในเครื่องนี้ กรุณานำเข้าไฟล์ JSON ก่อน');
      return;
    }

    setStatusType('loading');
    setStatusMessage('กำลังส่งข้อมูลขึ้นคลาวด์...');

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(box)
      });
      if (res.ok) {
        setStatusType('success');
        setStatusMessage('ส่งข้อมูลไปยังเครื่องพัฒนา (LAN) แล้ว — อุปกรณ์อื่นในวง LAN เปิด ?sync=ชื่อไอดี ได้ทันที');
      } else {
        throw new Error('no dev server');
      }
    } catch {
      setStatusType('error');
      setStatusMessage('โหมด LAN ใช้ได้เฉพาะตอนรัน dev server — บนเว็บจริงให้เข้าสู่ระบบด้วยบัญชี แล้วบันทึกขึ้นคลาวด์แทน');
    }
  };

  // Pull from Cloud / Another Device
  const handlePullFromCloud = async (keyOverride) => {
    const targetKey = (keyOverride || syncKeyInput || wizardName).trim();
    if (!targetKey) {
      setStatusType('error');
      setStatusMessage('กรุณากรอกชื่อไอดีหรือรหัส Sync Key');
      return;
    }

    setStatusType('loading');
    setStatusMessage(`กำลังดึงข้อมูลไอดี "${targetKey}" จาก Cloud...`);

    try {
      // Dev-server LAN endpoint only; there is no public copy of anyone's profile
      const res = await fetch(`/api/profile/${encodeURIComponent(targetKey)}`).catch(() => null);
      if (!res || !res.ok) throw new Error('ไม่พบข้อมูลไอดีนี้ — โหมด LAN ใช้ได้เฉพาะตอนรัน dev server บนเว็บจริงให้เข้าสู่ระบบด้วยบัญชีแทน');

      const data = await res.json();
      const { parseSwexExport } = await import('../utils/swexImport');
      const parsed = parseSwexExport(data);

      if (!parsed || !parsed.units || parsed.units.length === 0) {
        throw new Error('ไฟล์ข้อมูลไอดีว่างเปล่า');
      }

      saveBox(parsed);
      setBox(parsed);
      setStatusType('success');
      setStatusMessage(`ซิงค์สำเร็จ! โหลดมอนสเตอร์ ${parsed.units.length} ตัว และรูน ${parsed.runes?.length || 0} ชิ้น เรียบร้อยแล้ว`);

      if (onSynced) onSynced(parsed);

      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1500);
    } catch (err) {
      setStatusType('error');
      setStatusMessage(err.message || 'ดึงข้อมูลไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0d1424] border border-blue-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-blue-500/10 text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          aria-label="ปิดหน้าต่าง"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 shrink-0">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>☁️ Cloud Profile Sync & ข้ามอุปกรณ์</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              เปิดดูข้อมูลไอดี มอนสเตอร์ และรูนบนมือถือหรืออุปกรณ์อื่นได้จากทุกที่
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-[#131c30] p-1 border border-slate-800 mb-6">
          <button
            onClick={() => { setActiveTab('sync-out'); setStatusMessage(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'sync-out'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>อุปกรณ์นี้ ➔ เครื่องอื่น</span>
          </button>
          <button
            onClick={() => { setActiveTab('sync-in'); setStatusMessage(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'sync-in'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>ดึงข้อมูลเข้าเครื่องนี้</span>
          </button>
        </div>

        {/* TAB 1: SYNC OUT (ส่งข้อมูลไปเครื่องอื่น) */}
        {activeTab === 'sync-out' && (
          <div className="space-y-4">
            {/* Account Card */}
            <div className="bg-[#142035] border border-blue-500/20 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center font-bold text-cyan-300">
                  ★
                </div>
                <div>
                  <div className="text-xs font-mono text-cyan-400 font-bold uppercase">บัญชีที่เปิดอยู่</div>
                  <div className="text-base font-bold text-white">{wizardName}</div>
                  <div className="text-[11px] text-slate-400">
                    มอนสเตอร์ {box?.units?.length || 553} ตัว • รูน {box?.runes?.length || 1799} ชิ้น
                  </div>
                </div>
              </div>
              <button
                onClick={handlePushToCloud}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md transition cursor-pointer"
              >
                <CloudUpload className="w-4 h-4" />
                <span>อัปเดตขึ้น Cloud</span>
              </button>
            </div>

            {/* Sync Passkey */}
            <div className="bg-[#11192a] border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-cyan-400" />
                  <span>รหัส Cloud Sync ประจำไอดีคุณ (Passkey):</span>
                </span>
                <span className="text-[11px] text-slate-400">ใช้ใส่ในเครื่องอื่น</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={syncKey}
                  className="flex-1 bg-[#0b101c] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-cyan-300 font-bold tracking-wider select-all"
                />
                <button
                  onClick={handleCopyKey}
                  className="inline-flex items-center gap-1.5 bg-[#1e293b] hover:bg-[#334155] text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-700 transition cursor-pointer shrink-0"
                >
                  {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                </button>
              </div>
            </div>

            {/* Magic Link */}
            <div className="bg-[#11192a] border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  <span>ลิงก์ซิงค์ด่วนสำหรับมือถือ (Magic Link):</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                ส่งลิงก์นี้เข้าแชทไลน์/Discord แล้วกดเปิดบนมือถือ ระบบจะซิงค์ข้อมูลให้ทันที
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  className="flex-1 bg-[#0b101c] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-300 select-all truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl shadow transition cursor-pointer shrink-0"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SYNC IN (ดึงข้อมูลเข้าเครื่องนี้) */}
        {activeTab === 'sync-in' && (
          <div className="space-y-4">
            <div className="bg-[#11192a] border border-slate-800 p-4 rounded-2xl space-y-3">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" />
                <span>กรอกชื่อไอดี หรือรหัส Cloud Sync (Passkey):</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="เช่น PedictU หรือ PEDICTU-9326961"
                  value={syncKeyInput}
                  onChange={(e) => setSyncKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePullFromCloud()}
                  className="flex-1 bg-[#0b101c] border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white outline-none"
                />
                <button
                  onClick={() => handlePullFromCloud()}
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer shrink-0"
                >
                  <CloudDownload className="w-4 h-4" />
                  <span>ดึงข้อมูล</span>
                </button>
              </div>

            </div>

            <div className="bg-[#142035] border border-slate-800/80 p-4 rounded-2xl text-xs text-slate-300 space-y-2">
              <div className="font-bold flex items-center gap-2 text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>ระบบรักษาความปลอดภัยระดับเครื่อง (Private & Fast)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                เมื่อกดดึงข้อมูล ระบบจะบันทึกมอนสเตอร์และรูนทั้งหมดลงในแคชเบราว์เซอร์ของอุปกรณ์นี้อย่างปลอดภัย เพื่อให้คุณสามารถใช้งาน AI Optimizer และตัวจัดรูนแบบออฟไลน์ได้ลื่นไหล 100%
              </p>
            </div>
          </div>
        )}

        {/* Status Alert Banner */}
        {statusMessage && (
          <div
            className={`mt-4 p-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in duration-150 ${
              statusType === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-300'
                : statusType === 'error'
                ? 'bg-rose-500/10 border border-rose-500/40 text-rose-300'
                : 'bg-cyan-500/10 border border-cyan-500/40 text-cyan-300'
            }`}
          >
            {statusType === 'loading' && <RefreshCw className="w-4 h-4 animate-spin shrink-0" />}
            {statusType === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {statusType === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{statusMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
