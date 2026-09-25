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
  QrCode,
  ShieldCheck,
  ExternalLink,
  Wifi,
  Globe
} from 'lucide-react';
import { loadBox, saveBox } from '../utils/boxStorage';
import {
  pushBoxToCloud,
  pullBoxFromCloud,
  getShareUrl,
  getQrCodeUrl,
  sanitizeKey
} from '../services/cloudSyncService';

export default function CloudSyncModal({ isOpen, onClose, onSynced }) {
  const [box, setBox] = useState(() => loadBox());
  const [activeTab, setActiveTab] = useState('sync-out');
  const [syncKeyInput, setSyncKeyInput] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('info'); // 'success' | 'error' | 'loading'
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showQrCode, setShowQrCode] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const currentBox = loadBox();
      setBox(currentBox);
      setStatusMessage('');
      setStatusType('info');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const wizardName = box?.wizard?.name || box?.wizard_info?.wizard_name || 'PedictU';
  const wizardId = String(box?.wizard?.idHint || box?.wizard_info?.wizard_id || '9326961');
  const primaryKey = sanitizeKey(wizardName);
  const passkey = `${wizardName.toUpperCase()}-${wizardId.slice(-4) || '6961'}`;
  const shareLink = getShareUrl(primaryKey);
  const qrCodeUrl = getQrCodeUrl(shareLink);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(passkey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Push Box to Cloud Storage (Supabase 24/7 CDN)
  const handlePushToCloud = async () => {
    if (!box || (!box.units && !box.unit_list)) {
      setStatusType('error');
      setStatusMessage('ยังไม่มีข้อมูลไอดีในเครื่องนี้ กรุณานำเข้าไฟล์ JSON ก่อน');
      return;
    }

    setStatusType('loading');
    setStatusMessage('กำลังบันทึกข้อมูลไอดีขึ้น Cloud Storage (24 ชม.)...');

    const res = await pushBoxToCloud(box, passkey);
    if (res.ok) {
      setStatusType('success');
      setStatusMessage(`✅ อัปเดตไอดี "${wizardName}" ขึ้น Cloud สำเร็จแล้ว! ตอนนี้คุณสามารถปิดคอมพิวเตอร์ และเปิดดูบนมือถือผ่านเน็ต 4G/5G ได้ทันที`);
      // Update local state box with cloudSync stamp
      setBox(loadBox());
    } else {
      setStatusType('error');
      setStatusMessage(res.message || 'บันทึกขึ้น Cloud ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  // Pull Box from Cloud Storage
  const handlePullFromCloud = async (keyOverride) => {
    const targetKey = (keyOverride || syncKeyInput || wizardName).trim();
    if (!targetKey) {
      setStatusType('error');
      setStatusMessage('กรุณากรอกชื่อไอดี รหัส Passkey หรือวางลิงก์ Magic Link');
      return;
    }

    setStatusType('loading');
    setStatusMessage(`กำลังดาวน์โหลดข้อมูลไอดี "${targetKey}" จาก Cloud...`);

    const res = await pullBoxFromCloud(targetKey);
    if (res.ok) {
      setStatusType('success');
      setStatusMessage(`✨ ซิงค์สำเร็จ! โหลดมอนสเตอร์ ${res.unitsCount} ตัว และรูน ${res.runesCount} ชิ้น พร้อมใช้งานบนเครื่องนี้ทันที`);
      setBox(res.box);
      if (onSynced) onSynced(res.box);

      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1500);
    } else {
      setStatusType('error');
      setStatusMessage(res.message || 'ไม่พบข้อมูลไอดีบนคลาวด์');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-[#0d1424] border border-cyan-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-cyan-500/10 text-white scrollbar-thin">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          aria-label="ปิดหน้าต่าง"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/25 shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase mb-0.5">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>เน็ตนอกบ้าน 4G/5G • ไม่ต้องเปิดคอม</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <span>Cloud Profile Sync & ข้ามอุปกรณ์ 24 ชม.</span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              บันทึกข้อมูลไอดีขึ้นระบบคลาวด์ เปิดดูบนมือถือได้ตลอดเวลาแม้อยู่นอกบ้าน
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-[#131d30] p-1 border border-slate-800 mb-5">
          <button
            onClick={() => { setActiveTab('sync-out'); setStatusMessage(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'sync-out'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>อุปกรณ์นี้ ➔ นำไปเปิดบนมือถือ</span>
          </button>
          <button
            onClick={() => { setActiveTab('sync-in'); setStatusMessage(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'sync-in'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>ดึงข้อมูลจาก Cloud เข้าเครื่องนี้</span>
          </button>
        </div>

        {/* TAB 1: SYNC OUT (ส่งข้อมูลไปมือถือ / นอกบ้าน) */}
        {activeTab === 'sync-out' && (
          <div className="space-y-4">
            {/* Account Card & One-Click Cloud Upload Button */}
            <div className="bg-[#142035] border border-cyan-500/30 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 flex items-center justify-center font-bold text-cyan-300 shrink-0">
                  <Cloud className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase flex items-center gap-1.5">
                    <span>บัญชีที่เปิดอยู่</span>
                    {box?.cloudSync && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ซิงค์แล้ว
                      </span>
                    )}
                  </div>
                  <div className="text-base font-bold text-white">{wizardName}</div>
                  <div className="text-[11px] text-slate-300 font-mono">
                    มอนสเตอร์ {box?.units?.length || 556} ตัว • รูน {box?.runes?.length || 1500}+ ชิ้น • สำรับ {box?.decks?.length || 134} ทีม
                  </div>
                </div>
              </div>
              <button
                onClick={handlePushToCloud}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/25 transition cursor-pointer shrink-0"
              >
                <CloudUpload className="w-4 h-4 text-cyan-200" />
                <span>อัปเดตขึ้น Cloud (1-Click)</span>
              </button>
            </div>

            {/* Method 1: QR Code Scanner (Fastest for Mobile) */}
            <div className="bg-[#101726] border border-slate-800 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <QrCode className="w-4 h-4" />
                  <span>วิธีที่ 1 (สะดวกสุด): สแกน QR Code ด้วยมือถือ</span>
                </span>
                <button
                  onClick={() => setShowQrCode(!showQrCode)}
                  className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                >
                  {showQrCode ? 'ซ่อน QR' : 'แสดง QR'}
                </button>
              </div>

              {showQrCode && (
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#090f1a] p-3.5 rounded-xl border border-slate-800/80">
                  <div className="w-32 h-32 bg-white p-2 rounded-xl shrink-0 shadow-md">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code สำหรับเปิดบนมือถือ"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-xs text-slate-300 space-y-1.5 text-center sm:text-left">
                    <p className="font-semibold text-white">
                      📱 เปิดกล้องมือถือ หรือแอป LINE สแกน QR Code นี้
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      ระบบจะเปิดหน้าเว็บและโหลดไอดีของคุณเข้ามือถือทันที สามารถใช้งานได้ทุกฟีเจอร์ผ่าน 4G/5G แม้จะปิดคอมพิวเตอร์ไปแล้ว
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Method 2: Magic Link (Open anywhere) */}
            <div className="bg-[#101726] border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  <span>วิธีที่ 2: ลิงก์ด่วน Magic Link (กดเปิดได้ทันที):</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                ส่งลิงก์นี้เข้าแชท LINE หรือ Discord แล้วแตะเปิดบนมือถือได้เลย
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  className="flex-1 bg-[#090f1a] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-cyan-300 select-all truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow transition cursor-pointer shrink-0"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}</span>
                </button>
              </div>
            </div>

            {/* Method 3: Passkey Code */}
            <div className="bg-[#101726] border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>วิธีที่ 3: รหัส Cloud Sync (Passkey):</span>
                </span>
                <span className="text-[11px] text-slate-400">ใช้กรอกในแท็บ 'ดึงข้อมูล'</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={passkey}
                  className="flex-1 bg-[#090f1a] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-amber-300 font-bold tracking-wider select-all"
                />
                <button
                  onClick={handleCopyKey}
                  className="inline-flex items-center gap-1.5 bg-[#1e293b] hover:bg-[#334155] text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-700 transition cursor-pointer shrink-0"
                >
                  {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey ? 'คัดลอกแล้ว' : 'คัดลอกรหัส'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SYNC IN (ดึงข้อมูลเข้าเครื่องนี้จาก Cloud) */}
        {activeTab === 'sync-in' && (
          <div className="space-y-4">
            <div className="bg-[#101726] border border-slate-800 p-4 rounded-2xl space-y-3">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" />
                <span>กรอกชื่อไอดี, รหัส Passkey หรือวางลิงก์ Magic Link:</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="เช่น PedictU หรือ PEDICTU-6961 หรือวางลิงก์"
                  value={syncKeyInput}
                  onChange={(e) => setSyncKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePullFromCloud()}
                  className="flex-1 bg-[#090f1a] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white outline-none"
                />
                <button
                  onClick={() => handlePullFromCloud()}
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer shrink-0"
                >
                  <CloudDownload className="w-4 h-4" />
                  <span>ดึงข้อมูล</span>
                </button>
              </div>
            </div>

            <div className="bg-[#142035] border border-slate-800/80 p-4 rounded-2xl text-xs text-slate-300 space-y-2">
              <div className="font-bold flex items-center gap-2 text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>คลาวด์ความเร็วสูง 24/7 (ไม่ต้องเปิดคอมพิวเตอร์)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                ระบบเชื่อมต่อกับ Cloud Storage CDN ทั่วโลก ทำให้ดึงข้อมูลมอนสเตอร์ รูน และทีมสปีดรันของคุณได้ทันที แม้คอมพิวเตอร์ที่บ้านจะปิดอยู่ หรือกำลังเดินทางอยู่นอกบ้าน
              </p>
            </div>
          </div>
        )}

        {/* Status Alert Banner */}
        {statusMessage && (
          <div
            className={`mt-4 p-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in duration-150 ${
              statusType === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                : statusType === 'error'
                ? 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
                : 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300'
            }`}
          >
            {statusType === 'loading' && <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-cyan-400" />}
            {statusType === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {statusType === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span className="leading-relaxed">{statusMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
