import React, { useState } from 'react';
import { Layers, Sparkles, Radio, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import * as aegisLive from '../services/aegisLive';
import { saveBox } from '../utils/boxStorage';
import { parseSwexExport } from '../utils/swexImport';
import { playDropSound } from '../utils/soundEffects';

export default function AccountSuiteHeader({ activeTab, onNavigate }) {
  const [syncing, setSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState(null);

  const handleQuickSync = async () => {
    setSyncing(true);
    setSyncNotice(null);
    try {
      let syncedBox = null;
      let sourceName = '';

      // 1. Try AegisLink live snapshot
      const snap = await aegisLive.fetchLiveSnapshot().catch(() => null);
      if (snap?.success && snap.box?.units?.length > 0) {
        syncedBox = snap.box;
        sourceName = 'AegisLink (สด)';
      }

      // 2. Try Global Cloud Storage CDN (Supabase 24/7 — works on mobile 4G without PC)
      if (!syncedBox) {
        try {
          const { pullBoxFromCloud } = await import('../services/cloudSyncService');
          const current = (await import('../utils/boxStorage')).loadBox();
          const targetKey = current?.wizard?.name || 'pedictu';
          const cloudRes = await pullBoxFromCloud(targetKey);
          if (cloudRes?.ok && cloudRes.box?.units?.length > 0) {
            syncedBox = cloudRes.box;
            sourceName = 'Cloud CDN (24 ชม.)';
          }
        } catch {}
      }

      // 3. Try Supabase Cloud Auth
      if (!syncedBox) {
        try {
          const { getSupabase } = await import('../services/supabaseClient');
          const supabase = await getSupabase();
          const { data: { session } } = (await supabase?.auth.getSession()) || {};
          if (session?.user) {
            const { data } = await supabase.from('user_profiles').select('box_data').eq('id', session.user.id).single();
            if (data?.box_data) {
              let parsed = data.box_data;
              if (parsed.unit_list && !Array.isArray(parsed.units)) parsed = parseSwexExport(parsed);
              if (parsed?.units?.length > 0) {
                syncedBox = parsed;
                sourceName = 'Supabase Cloud';
              }
            }
          }
        } catch {}
      }

      // 4. Try /data/my_profile.json
      if (!syncedBox) {
        const res = await fetch('/data/my_profile.json').catch(() => null);
        if (res && res.ok) {
          const json = await res.json();
          let parsed = json;
          if (parsed.unit_list && !Array.isArray(parsed.units)) parsed = parseSwexExport(parsed);
          if (parsed?.units?.length > 0) {
            syncedBox = parsed;
            sourceName = 'โฟลเดอร์ GG';
          }
        }
      }

      if (syncedBox && syncedBox.units?.length > 0) {
        syncedBox.source = { name: sourceName, modified: Date.now(), auto: true, live: true };
        saveBox(syncedBox);
        window.dispatchEvent(new CustomEvent('swm:box-updated'));
        playDropSound();
        setSyncNotice({ text: `✨ ซิงค์ไอดี ${syncedBox.wizard?.name || ''} สำเร็จ (${syncedBox.units.length} มอนสเตอร์) [${sourceName}]`, success: true });
        setTimeout(() => setSyncNotice(null), 4000);
      } else {
        throw new Error('ไม่พบข้อมูลไอดีล่าสุด กรุณาเปิดเกมขณะรัน SWEX หรือนำเข้าไฟล์ JSON');
      }
    } catch (err) {
      setSyncNotice({ text: err.message || 'ซิงค์ข้อมูลไม่สำเร็จ', success: false });
      setTimeout(() => setSyncNotice(null), 4000);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="w-full mb-6 space-y-3">
      <div className="bg-[#0b121e]/90 backdrop-blur-xl border border-white/[0.08] p-1.5 sm:p-2 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-xl">
        {/* Navigation Tabs Switcher */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => onNavigate('my-box')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === 'my-box'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400/40'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Layers className="w-4 h-4 text-blue-300" />
            <span>📦 กล่องของฉัน (My Box)</span>
          </button>

          <button
            onClick={() => onNavigate('ai-account-audit')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === 'ai-account-audit'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 font-black border border-amber-300/40'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${activeTab === 'ai-account-audit' ? 'text-slate-950' : 'text-amber-400'}`} />
            <span>🤖 AI ตรวจสุขภาพไอดี (Health Check)</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
              activeTab === 'ai-account-audit' ? 'bg-black/20 text-slate-950' : 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
            }`}>
              G2-G3
            </span>
          </button>

          <button
            onClick={() => onNavigate('live-farm-monitor')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === 'live-farm-monitor'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 font-black border border-emerald-300/40'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Radio className={`w-4 h-4 ${activeTab === 'live-farm-monitor' ? 'text-slate-950' : 'text-emerald-400'}`} />
            <span>📡 จอตรวจจับฟาร์มสด (Live Monitor)</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </button>
        </div>

        {/* Sync Buttons */}
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('swm:open-cloud-sync'))}
            className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            title="เปิด QR Code หรือ Magic Link สำหรับดูบนมือถือผ่าน 4G/5G โดยไม่ต้องเปิดคอม"
          >
            <span>📱 ซิงค์ไปมือถือ</span>
          </button>

          <button
            onClick={handleQuickSync}
            disabled={syncing}
            className="w-full md:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            title="ดึงข้อมูลล่าสุดจากเกมทันทีโดยไม่ต้องเลือกไฟล์"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-950 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'กำลังซิงค์...' : '🔄 ซิงค์ข้อมูลสด (1-Click)'}</span>
          </button>
        </div>
      </div>

      {syncNotice && (
        <div
          role="status"
          className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-1 duration-200 ${
            syncNotice.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {syncNotice.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{syncNotice.text}</span>
        </div>
      )}
    </div>
  );
}
