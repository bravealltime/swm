import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Upload, Package, Shield, Flame, Trash2, RefreshCw, Search, Lock, ChevronRight, Star, CheckCircle2, XCircle,
  Compass, LayoutDashboard, Gauge, Gem, Zap, Castle, X, AlertTriangle, Sparkles, FolderSync, FolderOpen, Pause,
} from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import RuneIcon from '../components/RuneIcon';
import allMonstersData from '../data/allMonsters.json';
import guardianMeta from '../data/swrtGuardianMeta.json';
import { buildMonsterIndex, flagFromCountry } from '../data/swrtPlayerAdapter';
import { parseSwexExport, ownedIdSet, loadBox, saveBox, clearBox, baseAwakenedId, BOX_VERSION, RUNE_SETS, STAT_NAMES } from '../utils/swexImport';
import { supportsFolderWatch, loadDirHandle, clearDirHandle, pickSwexFolder, ensurePermission, findNewestExport } from '../utils/swexWatcher';

const WATCH_INTERVAL_MS = 20 * 1000;

const MONSTER_INDEX = buildMonsterIndex(allMonstersData);
const BY_NAME = new Map(allMonstersData.map((m) => [m.name.toLowerCase(), m]));
const BY_IMAGE = new Map(allMonstersData.map((m) => [(m.avatarUrl || m.imageUrl || '').split('/').pop(), m]));

// The catalog may only hold the 2A (stage 3) or 1A (stage 1) form of a family — try the siblings
const monsterOf = (id) => {
  const n = Number(id);
  if (!n) return null;
  const stage = Math.floor(n / 10) % 10;
  const root = n - stage * 10;
  return MONSTER_INDEX.get(n) || MONSTER_INDEX.get(root + 10) || MONSTER_INDEX.get(root + 30) || MONSTER_INDEX.get(root) || null;
};
const monsterByName = (name) => BY_NAME.get(String(name || '').replace(/\s*\(.*\)$/, '').toLowerCase()) || BY_NAME.get(String(name || '').toLowerCase()) || null;
const monsterByImage = (url) => BY_IMAGE.get(String(url || '').split('/').pop()) || null;

const ELEMENT_FILTERS = [['all', 'ทุกธาตุ'], ['water', 'น้ำ'], ['fire', 'ไฟ'], ['wind', 'ลม'], ['light', 'แสง'], ['dark', 'มืด']];
const ELEMENT_COLOR = { water: 'bg-sky-500', fire: 'bg-rose-500', wind: 'bg-amber-400', light: 'bg-yellow-200', dark: 'bg-purple-500' };
const ELEMENT_TH = { water: 'น้ำ', fire: 'ไฟ', wind: 'ลม', light: 'แสง', dark: 'มืด' };

const TABS = [
  { id: 'overview', label: 'ภาพรวม', icon: LayoutDashboard, color: 'bg-emerald-600 shadow-emerald-600/25' },
  { id: 'box', label: 'มอนสเตอร์', icon: Package, color: 'bg-cyan-600 shadow-cyan-600/25' },
  { id: 'teams', label: 'ทีมที่สร้างได้', icon: Shield, color: 'bg-blue-600 shadow-blue-600/25' },
  { id: 'meta', label: 'เมต้า Guardian', icon: Flame, color: 'bg-rose-600 shadow-rose-600/25' },
  { id: 'speed', label: 'จูนสปีดทีม', icon: Gauge, color: 'bg-amber-600 shadow-amber-600/25' },
  { id: 'runes', label: 'วิเคราะห์รูน', icon: Gem, color: 'bg-purple-600 shadow-purple-600/25' },
];

const card = 'rounded-2xl border border-white/[0.08] bg-[#0a0f19]/80';

// "2026-09-10 21:04" -> "8 วันที่แล้ว"
function agoLabel(stamp) {
  if (!stamp) return '';
  const t = new Date(stamp.replace(' ', 'T'));
  if (Number.isNaN(t.getTime())) return stamp;
  const days = Math.floor((Date.now() - t.getTime()) / 86400000);
  if (days <= 0) return 'วันนี้';
  if (days === 1) return 'เมื่อวาน';
  if (days < 30) return `${days} วันที่แล้ว`;
  if (days < 365) return `${Math.floor(days / 30)} เดือนที่แล้ว`;
  return `${Math.floor(days / 365)} ปีที่แล้ว`;
}

export default function MyBoxView({ onNavigate }) {
  const [box, setBox] = useState(() => loadBox());
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');

  const owned = useMemo(() => ownedIdSet(box), [box]);
  const mdc = useMdcAnalysis(owned, !!box);

  const importFile = async (file, { auto = false } = {}) => {
    setError('');
    try {
      const text = await file.text();
      const parsed = parseSwexExport(JSON.parse(text));
      if (!parsed.units.length) throw new Error('ไฟล์นี้ไม่มีมอนสเตอร์เลย');
      parsed.source = { name: file.name, modified: file.lastModified || 0, auto };
      if (!saveBox(parsed)) setError('บันทึกลงเครื่องไม่สำเร็จ (พื้นที่ไม่พอ) — ยังดูได้จนกว่าจะปิดแท็บ');
      setBox(parsed);
      if (!auto) setTab('overview');
      return true;
    } catch (err) {
      setError(err.message || 'อ่านไฟล์ไม่สำเร็จ');
      return false;
    }
  };

  const reset = () => { clearBox(); setBox(null); };

  // --- auto-sync from the SWEX folder (Chromium desktop) ---------------------
  const [watch, setWatch] = useState({ status: supportsFolderWatch() ? 'idle' : 'unsupported', handle: null, lastCheck: null, newest: null });
  const boxRef = useRef(box);
  boxRef.current = box;

  const checkFolder = async (handle) => {
    try {
      if (!(await ensurePermission(handle))) { setWatch((w) => ({ ...w, status: 'needs-permission' })); return; }
      const newest = await findNewestExport(handle);
      const loadedAt = boxRef.current?.source?.modified || 0;
      if (newest && newest.lastModified > loadedAt) await importFile(newest.file, { auto: true });
      setWatch((w) => ({ ...w, status: 'watching', lastCheck: Date.now(), newest: newest ? { name: newest.name, modified: newest.lastModified } : null }));
    } catch (err) {
      setWatch((w) => ({ ...w, status: 'error', error: err.message }));
    }
  };

  // restore a previously chosen folder on mount
  useEffect(() => {
    if (!supportsFolderWatch()) return;
    let alive = true;
    loadDirHandle().then(async (handle) => {
      if (!alive || !handle) return;
      const ok = await ensurePermission(handle);
      setWatch((w) => ({ ...w, handle, status: ok ? 'watching' : 'needs-permission' }));
    });
    return () => { alive = false; };
  }, []);

  // poll while watching; also re-check when the tab regains focus
  useEffect(() => {
    if (watch.status !== 'watching' || !watch.handle) return;
    const handle = watch.handle;
    checkFolder(handle);
    const timer = setInterval(() => checkFolder(handle), WATCH_INTERVAL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') checkFolder(handle); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch.status, watch.handle]);

  const startWatching = async () => {
    try {
      const handle = await pickSwexFolder();
      setWatch({ status: 'watching', handle, lastCheck: null, newest: null });
    } catch (err) {
      if (err?.name !== 'AbortError') setError(err.message || 'เลือกโฟลเดอร์ไม่สำเร็จ');
    }
  };
  const grantAgain = async () => {
    if (watch.handle && (await ensurePermission(watch.handle, { request: true }))) setWatch((w) => ({ ...w, status: 'watching' }));
  };
  const stopWatching = async () => {
    await clearDirHandle();
    setWatch({ status: 'idle', handle: null, lastCheck: null, newest: null });
  };

  return (
    <div className="space-y-6 max-w-[1780px] 2xl:max-w-[1880px] mx-auto pb-16 animate-in fade-in duration-300">
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#0f2a1a] via-[#090e18] to-[#070b12] p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"><Package className="w-6 h-6" /></div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                กล่องมอนสเตอร์ <span className="bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text text-transparent">ของฉัน</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
                นำเข้าไฟล์ JSON จาก SWEX แล้วดูทีมที่สร้างได้ จูนสปีดด้วยค่าจริง และวิเคราะห์รูนทั้งกล่อง — ประมวลผลในเบราว์เซอร์ทั้งหมด ไม่ส่งไฟล์ขึ้นเซิร์ฟเวอร์
              </p>
            </div>
          </div>
          {box && (
            <div className="flex items-center gap-2 shrink-0">
              <ImportButton onFile={importFile} label="นำเข้าใหม่" icon={RefreshCw} subtle />
              <button onClick={reset} className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <Trash2 className="w-4 h-4" /> ลบข้อมูลออกจากเครื่อง
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 text-sm text-rose-200 flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {!box ? (
        <EmptyState onFile={importFile} onWatch={supportsFolderWatch() ? startWatching : null} />
      ) : (
        <>
          {(box.version || 1) < BOX_VERSION && (
            <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> ข้อมูลนี้นำเข้าด้วยเวอร์ชันเก่า — นำเข้าไฟล์ใหม่อีกครั้งเพื่อใช้ SPD รวมรูน, เซ็ตรูน, จูนสปีด และวิเคราะห์รูน</span>
              <ImportButton onFile={importFile} label="นำเข้าใหม่" icon={RefreshCw} subtle />
            </div>
          )}
          <BoxHeader box={box} onNavigate={onNavigate} />
          <SyncCard watch={watch} box={box} onStart={startWatching} onGrant={grantAgain} onStop={stopWatching} />

          <div role="tablist" className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-[#0a0f19]/80 border border-white/[0.08] shadow-lg sticky top-[68px] z-30 backdrop-blur-xl">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button key={t.id} role="tab" aria-selected={active} onClick={() => setTab(t.id)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${active ? `${t.color} text-white shadow-lg` : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'}`}>
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              );
            })}
          </div>

          {tab === 'overview' && <Overview box={box} mdc={mdc} owned={owned} onTab={setTab} onNavigate={onNavigate} />}
          {tab === 'box' && <BoxGrid box={box} onNavigate={onNavigate} />}
          {tab === 'teams' && <Teams owned={owned} mdc={mdc} onNavigate={onNavigate} />}
          {tab === 'meta' && <MetaCoverage owned={owned} />}
          {tab === 'speed' && <SpeedTuner box={box} onNavigate={onNavigate} />}
          {tab === 'runes' && <Runes box={box} />}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// shared: 3MDC buildability analysis (loaded once, reused by overview + teams)

function useMdcAnalysis(owned, enabled) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!enabled || data) return;
    let alive = true;
    import('../data/allMdcData.json').then((m) => { if (alive) setData(m.default); });
    return () => { alive = false; };
  }, [enabled, data]);

  return useMemo(() => {
    if (!data) return null;
    let totalCounters = 0;
    const unlocks = new Map();
    const defenses = data.map((def) => {
      const counters = def.counters || [];
      totalCounters += counters.length;
      const buildable = [];
      for (const c of counters) {
        const mons = c.monsters || [];
        if (!mons.length) continue;
        const missing = mons.filter((m) => !owned.has(Number(m.com2usId)));
        if (missing.length === 0) buildable.push(c);
        else if (missing.length === 1) {
          const id = Number(missing[0].com2usId);
          const e = unlocks.get(id) || { id, n: 0, name: missing[0].name };
          e.n += 1;
          unlocks.set(id, e);
        }
      }
      return { def, buildable, total: counters.length };
    });
    const buildableTotal = defenses.reduce((s, d) => s + d.buildable.length, 0);
    const covered = defenses.filter((d) => d.buildable.length > 0).length;
    const nextSummons = [...unlocks.values()].sort((a, b) => b.n - a.n).slice(0, 8).map((e) => ({ ...e, info: monsterOf(e.id) }));
    return { defenses: defenses.sort((a, b) => b.buildable.length - a.buildable.length), totalCounters, buildableTotal, covered, nextSummons };
  }, [data, owned]);
}

// ---------------------------------------------------------------------------

function SyncCard({ watch, box, onStart, onGrant, onStop }) {
  if (watch.status === 'unsupported') {
    return (
      <div className={`${card} p-3.5 flex items-center gap-3 text-xs text-slate-400`}>
        <FolderSync className="w-4 h-4 text-slate-500 shrink-0" />
        ซิงก์อัตโนมัติจากโฟลเดอร์ SWEX ใช้ได้บน Chrome / Edge เดสก์ท็อป — เบราว์เซอร์นี้ต้องกด "นำเข้าใหม่" เอง
      </div>
    );
  }
  const time = (ms) => (ms ? new Date(ms).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-');
  const isLive = watch.status === 'watching';
  return (
    <div className={`${card} p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl border shrink-0 ${isLive ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/[0.04] border-white/10 text-slate-400'}`}>
          <FolderSync className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <div className="font-bold text-white flex items-center gap-2">
            ซิงก์อัตโนมัติจากโฟลเดอร์ SWEX
            {isLive && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE</span>}
            {watch.status === 'needs-permission' && <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-bold">ต้องอนุญาตอีกครั้ง</span>}
            {watch.status === 'error' && <span className="px-1.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[10px] font-bold">ผิดพลาด</span>}
          </div>
          <div className="text-slate-400 mt-0.5">
            {isLive
              ? `ตรวจทุก ${WATCH_INTERVAL_MS / 1000} วินาที • ตรวจล่าสุด ${time(watch.lastCheck)} • ไฟล์ล่าสุด ${watch.newest?.name || '-'} (${time(watch.newest?.modified)})${box?.source?.auto ? ' • ข้อมูลปัจจุบันมาจากการซิงก์' : ''}`
              : watch.status === 'needs-permission'
              ? 'เบราว์เซอร์ต้องการให้ยืนยันสิทธิ์อ่านโฟลเดอร์อีกครั้งหลังเปิดใหม่'
              : watch.status === 'error'
              ? watch.error
              : 'เลือกโฟลเดอร์ Files ของ SWEX ครั้งเดียว ทุกครั้งที่ SWEX สร้างไฟล์ใหม่ (ล็อกอินเกม) หน้านี้จะอัปเดตเอง'}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {watch.status === 'idle' && (
          <button onClick={onStart} className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <FolderOpen className="w-4 h-4" /> เลือกโฟลเดอร์ SWEX
          </button>
        )}
        {watch.status === 'needs-permission' && (
          <button onClick={onGrant} className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer">อนุญาตอ่านโฟลเดอร์</button>
        )}
        {(isLive || watch.status === 'needs-permission' || watch.status === 'error') && (
          <button onClick={onStop} className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <Pause className="w-4 h-4" /> หยุดซิงก์
          </button>
        )}
      </div>
    </div>
  );
}

function ImportButton({ onFile, label, icon: Icon = Upload, subtle = false }) {
  const inputRef = useRef(null);
  return (
    <>
      <input ref={inputRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
      <button onClick={() => inputRef.current?.click()}
        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer ${subtle ? 'bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'}`}>
        <Icon className="w-4 h-4" /> {label}
      </button>
    </>
  );
}

function EmptyState({ onFile, onWatch }) {
  const [dragging, setDragging] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
      className={`rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center space-y-5 transition-colors ${dragging ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/15 bg-[#0a0f19]/80'}`}
    >
      <Upload className="w-12 h-12 text-emerald-400 mx-auto" />
      <div>
        <h2 className="text-lg font-bold text-white">ลากไฟล์ SWEX JSON มาวางที่นี่</h2>
        <p className="text-sm text-slate-400 mt-1">หรือกดปุ่มเพื่อเลือกไฟล์ (ชื่อไฟล์มักเป็น <span className="font-mono text-slate-300">ชื่อไอดี-เลขไอดี.json</span>)</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <ImportButton onFile={onFile} label="เลือกไฟล์ JSON" />
        {onWatch && (
          <button onClick={onWatch} className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200">
            <FolderSync className="w-4 h-4 text-emerald-400" /> หรือเลือกโฟลเดอร์ SWEX เพื่อซิงก์อัตโนมัติ
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left pt-4 max-w-4xl mx-auto">
        {[
          ['1', 'ติดตั้ง SWEX', 'Summoners War Exporter (Windows/Mac) แล้วเปิดคู่กับเกมผ่าน proxy ตามคู่มือหน้า AegisLink'],
          ['2', 'Export โปรไฟล์', 'ในเกมเข้า Login หน้าแรก 1 ครั้ง SWEX จะสร้างไฟล์ JSON ให้ในโฟลเดอร์ Files'],
          ['3', 'นำเข้าที่นี่', 'ไฟล์ถูกอ่านในเบราว์เซอร์ของคุณเท่านั้น เก็บเฉพาะมอนสเตอร์ รูน และค่าสเตตัสไว้ในเครื่อง'],
        ].map(([n, title, desc]) => (
          <div key={n} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <div className="text-xs font-black text-emerald-400 font-mono">ขั้นตอน {n}</div>
            <div className="text-sm font-bold text-white mt-1">{title}</div>
            <div className="text-xs text-slate-400 mt-1 leading-relaxed">{desc}</div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5"><Lock className="w-3.5 h-3.5" /> ไม่มีการอัปโหลด — ปิดแท็บแล้วข้อมูลยังอยู่ในเครื่องนี้จนกว่าคุณจะกดลบ</p>
    </div>
  );
}

function BoxHeader({ box, onNavigate }) {
  const nat5 = box.units.filter((u) => (monsterOf(u.masterId)?.stars || 0) >= 5).length;
  const six = box.units.filter((u) => u.stars === 6).length;
  const runes = box.runes?.length || 0;
  return (
    <div className={`${card} p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4`}>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl">{flagFromCountry(box.wizard.country)}</div>
        <div>
          <div className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 flex-wrap">
            {box.wizard.name}
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-slate-300">Lv.{box.wizard.level}</span>
            {box.wizard.guild && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300">{box.wizard.guild}</span>}
          </div>
          <div className="text-xs text-slate-400 mt-1">นำเข้าเมื่อ {box.importedAt.slice(0, 16).replace('T', ' ')} • เก็บในเครื่องนี้เท่านั้น</div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
        {[
          ['มอนสเตอร์', box.units.length, 'text-white'],
          ['เนเชอรัล 5★', nat5, 'text-amber-300'],
          ['ระดับ 6★', six, 'text-emerald-300'],
          ['รูน', runes, 'text-purple-300'],
        ].map(([label, value, color]) => (
          <div key={label} className="px-3 sm:px-4 py-2.5 rounded-xl bg-[#0a0f18] border border-slate-800">
            <div className="text-[11px] text-slate-400">{label}</div>
            <div className={`text-lg sm:text-xl font-black font-mono ${color}`}>{value.toLocaleString()}</div>
          </div>
        ))}
      </div>
      <button onClick={() => onNavigate('player-tracker', { initialPlayer: box.wizard.name })}
        className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shrink-0">
        <Search className="w-4 h-4" /> ดูสถิติ RTA ของฉัน <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview

function Overview({ box, mdc, owned, onTab, onNavigate }) {
  const withInfo = useMemo(() => box.units.map((u) => ({ ...u, info: monsterOf(u.masterId) })), [box]);
  const fastest = useMemo(() => [...withInfo].filter((u) => u.info).sort((a, b) => b.spd - a.spd).slice(0, 6), [withInfo]);
  const bestRuned = useMemo(() => [...withInfo].filter((u) => u.info && u.runes >= 6).sort((a, b) => (b.runeEff || 0) - (a.runeEff || 0)).slice(0, 5), [withInfo]);
  const elements = useMemo(() => {
    const c = { water: 0, fire: 0, wind: 0, light: 0, dark: 0 };
    for (const u of withInfo) if ((u.info?.stars || 0) >= 5) c[u.element] = (c[u.element] || 0) + 1;
    return c;
  }, [withInfo]);
  const sets = useMemo(() => {
    const c = {};
    for (const u of box.units) for (const s of u.sets || []) c[s] = (c[s] || 0) + 1;
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [box]);
  const metaTop = (guardianMeta.monsters || []).slice(0, 40);
  const metaHave = metaTop.filter((m) => owned.has(Number(m.id))).length;
  const avgEff = box.runes?.length ? (box.runes.reduce((s, r) => s + r.eff, 0) / box.runes.length).toFixed(1) : null;
  const nat5Total = Object.values(elements).reduce((a, b) => a + b, 0) || 1;
  const latestNat5 = useMemo(() => withInfo
    .filter((u) => u.info && (u.info.stars || 0) >= 5 && u.obtained)
    .sort((a, b) => (b.obtained > a.obtained ? 1 : -1))
    .slice(0, 8), [withInfo]);

  return (
    <div className="space-y-4">
      {latestNat5.length > 0 && (
        <div className={`${card} p-4`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><Star className="w-4 h-4 text-amber-400 fill-amber-400" /> เนเชอรัล 5★ ที่ได้รับล่าสุด</h3>
            <span className="text-[11px] text-slate-400">ล่าสุด {agoLabel(latestNat5[0].obtained)}</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {latestNat5.map((u, i) => (
              <button key={`${u.masterId}-${u.obtained}-${i}`} onClick={() => onNavigate('where2use', { initialMonster: u.info.name })}
                className={`shrink-0 w-28 p-2.5 rounded-2xl border text-center cursor-pointer transition-colors ${i === 0 ? 'bg-amber-500/[0.08] border-amber-500/40 hover:border-amber-400' : 'bg-[#0a0f18] border-slate-800 hover:border-white/20'}`}>
                <div className="flex justify-center"><MonsterAvatar monster={u.info} size="md" showStars={false} /></div>
                <div className="text-xs font-bold text-white truncate mt-1.5">{u.info.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{u.info.thaiName !== u.info.name ? u.info.thaiName : ELEMENT_TH[u.element]}</div>
                <div className={`text-[11px] font-mono mt-0.5 ${i === 0 ? 'text-amber-300' : 'text-slate-500'}`}>{agoLabel(u.obtained)}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile label="สูตรแก้ทาง 3MDC ที่สร้างได้" value={mdc ? `${mdc.buildableTotal.toLocaleString()}` : '…'} sub={mdc ? `แก้หอได้ ${mdc.covered}/${mdc.defenses.length} ทีม` : 'กำลังคำนวณ'} color="text-blue-300" onClick={() => onTab('teams')} />
        <Tile label="มอนเมต้า Guardian ที่มี" value={`${metaHave}/${metaTop.length}`} sub="จาก 40 ตัวที่ถูกเลือกบ่อยสุด" color="text-rose-300" onClick={() => onTab('meta')} />
        <Tile label="เร็วที่สุดในกล่อง" value={fastest[0] ? `${fastest[0].spd} SPD` : '-'} sub={fastest[0]?.info?.name || ''} color="text-amber-300" onClick={() => onTab('speed')} />
        <Tile label="ประสิทธิภาพรูนเฉลี่ย" value={avgEff ? `${avgEff}%` : 'นำเข้าใหม่'} sub={`${(box.runes?.length || 0).toLocaleString()} รูน`} color="text-purple-300" onClick={() => onTab('runes')} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* fastest */}
        <div className={`${card} p-4 space-y-3`}>
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> เร็วที่สุด 6 ตัว (รวมรูน)</h3>
          {fastest.map((u, i) => (
            <button key={`${u.masterId}-${i}`} onClick={() => onNavigate('where2use', { initialMonster: u.info.name })} className="w-full flex items-center gap-3 text-left hover:bg-white/[0.03] rounded-xl p-1 cursor-pointer">
              <span className="text-[11px] font-mono text-slate-500 w-4">{i + 1}</span>
              <MonsterAvatar monster={u.info} size="xs" showStars={false} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">{u.info.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{(u.sets || []).join('/') || '-'}</div>
              </div>
              <span className="font-mono text-sm font-black text-amber-300">{u.spd}</span>
            </button>
          ))}
        </div>

        {/* best runed */}
        <div className={`${card} p-4 space-y-3`}>
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Gem className="w-4 h-4 text-purple-400" /> รูนดีที่สุด 5 ตัว (เฉลี่ย 6 ใบ)</h3>
          {bestRuned.length ? bestRuned.map((u, i) => (
            <div key={`${u.masterId}-${i}`} className="flex items-center gap-3 p-1">
              <span className="text-[11px] font-mono text-slate-500 w-4">{i + 1}</span>
              <MonsterAvatar monster={u.info} size="xs" showStars={false} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">{u.info.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{(u.sets || []).join('/') || '-'} · SPD {u.spd}</div>
              </div>
              <span className="font-mono text-sm font-black text-purple-300">{u.runeEff}%</span>
            </div>
          )) : <div className="text-xs text-slate-400">นำเข้าไฟล์ใหม่เพื่อดูประสิทธิภาพรูน</div>}
        </div>

        {/* distribution */}
        <div className={`${card} p-4 space-y-4`}>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-cyan-400" /> เนเชอรัล 5★ แยกธาตุ</h3>
            <div className="flex h-3 rounded-full overflow-hidden mt-3 bg-slate-800">
              {Object.entries(elements).map(([el, n]) => n > 0 && <div key={el} className={ELEMENT_COLOR[el]} style={{ width: `${(n / nat5Total) * 100}%` }} title={`${ELEMENT_TH[el]} ${n}`} />)}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-300">
              {Object.entries(elements).map(([el, n]) => (
                <span key={el} className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${ELEMENT_COLOR[el]}`} /> {ELEMENT_TH[el]} <span className="font-mono text-white">{n}</span></span>
              ))}
            </div>
          </div>
          {sets.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-white">เซ็ตรูนที่ใช้บ่อย</h3>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {sets.map(([name, n]) => <span key={name} className="text-[11px] px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-200">{name} <span className="font-mono text-slate-400">×{n}</span></span>)}
              </div>
            </div>
          )}
        </div>
      </div>

      {mdc?.nextSummons?.length > 0 && <NextSummons list={mdc.nextSummons} />}
    </div>
  );
}

function Tile({ label, value, sub, color, onClick }) {
  return (
    <button onClick={onClick} className={`${card} p-4 text-left hover:border-white/20 transition-colors cursor-pointer`}>
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`text-2xl font-black font-mono mt-1 ${color}`}>{value}</div>
      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">{sub} <ChevronRight className="w-3 h-3" /></div>
    </button>
  );
}

function NextSummons({ list }) {
  return (
    <div className="p-4 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20">
      <div className="text-sm font-bold text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400" /> ได้ตัวไหนเพิ่ม ปลดล็อกสูตร 3MDC ได้มากสุด</div>
      <div className="text-[11px] text-slate-400 mb-3">นับสูตรที่คุณขาดมอนสเตอร์แค่ตัวเดียว</div>
      <div className="flex flex-wrap gap-2">
        {list.map((m) => (
          <div key={m.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#0a0f19]/80 border border-white/[0.08]">
            {m.info ? <MonsterAvatar monster={m.info} size="xs" showStars={false} /> : null}
            <div className="text-[11px]"><div className="font-bold text-white">{m.info?.name || m.name}</div><div className="text-amber-300 font-mono">+{m.n} สูตร</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Box grid

const SORTS = [['spd', 'SPD'], ['runeEff', 'รูน %'], ['hp', 'HP'], ['atk', 'ATK'], ['def', 'DEF'], ['stars', 'ดาว/เลเวล'], ['obtained', 'ได้มาล่าสุด']];

function BoxGrid({ box, onNavigate }) {
  const [element, setElement] = useState('all');
  const [minStars, setMinStars] = useState(5);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('spd');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = box.units
      .map((u) => ({ ...u, info: monsterOf(u.masterId) || monsterOf(baseAwakenedId(u.masterId)) }))
      .filter((u) => (element === 'all' || u.element === element) && u.stars >= minStars)
      .filter((u) => !q || (u.info?.name || '').toLowerCase().includes(q) || (u.info?.thaiName || '').includes(q));
    if (sort === 'obtained') return list.sort((a, b) => ((b.obtained || '') > (a.obtained || '') ? 1 : -1));
    const key = sort === 'stars' ? null : sort;
    return list.sort((a, b) => (key ? (b[key] || 0) - (a[key] || 0) : b.stars - a.stars || b.level - a.level || b.spd - a.spd));
  }, [box, element, minStars, query, sort]);

  const chip = (active, color = 'bg-emerald-600') => `px-2.5 py-1.5 rounded-lg font-bold cursor-pointer ${active ? `${color} text-white` : 'bg-white/[0.04] text-slate-300 hover:text-white'}`;

  return (
    <div className="space-y-4">
      <div className={`${card} flex flex-col lg:flex-row lg:items-center gap-3 p-3`}>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {ELEMENT_FILTERS.map(([id, label]) => <button key={id} onClick={() => setElement(id)} className={chip(element === id)}>{label}</button>)}
          <span className="text-slate-600 mx-1">|</span>
          {SORTS.map(([id, label]) => <button key={id} onClick={() => setSort(id)} className={chip(sort === id, 'bg-cyan-600')}>{label}</button>)}
          <span className="text-slate-600 mx-1">|</span>
          {[6, 5, 4, 1].map((n) => <button key={n} onClick={() => setMinStars(n)} className={chip(minStars === n, 'bg-amber-500 !text-slate-950')}>{n === 1 ? 'ทุกดาว' : `${n}★ ขึ้นไป`}</button>)}
        </div>
        <div className="relative lg:ml-auto lg:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาชื่อมอนสเตอร์..." className="w-full bg-[#0d1422] border border-white/10 focus:border-emerald-400 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none" />
        </div>
      </div>

      <div className="text-xs text-slate-400">แสดง {rows.length} จาก {box.units.length} ตัว • คลิกเพื่อดูว่าใช้ที่ไหนได้บ้าง</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2">
        {rows.map((u, i) => (
          <button key={`${u.masterId}-${i}`} onClick={() => u.info && onNavigate('where2use', { initialMonster: u.info.name })}
            title={u.info ? `ดูว่า ${u.info.name} ใช้ที่ไหนได้บ้าง` : `ไม่พบ #${u.masterId} ในสารานุกรม`}
            className={`${card} p-3 hover:border-emerald-500/40 flex items-center gap-3 text-left cursor-pointer`}>
            {u.info ? <MonsterAvatar monster={u.info} size="sm" showStars={false} /> : <div className="w-11 h-11 rounded-xl bg-slate-800 shrink-0" />}
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">{u.info?.name || `#${u.masterId}`}</div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {u.stars}★ · Lv.{u.level}{u.runeEff ? <span className="text-purple-300 font-mono"> · {u.runeEff}%</span> : null}</div>
              <div className="text-[11px] font-mono text-cyan-300" title={u.baseSpd ? `พื้นฐาน ${u.baseSpd}` : ''}>
                SPD {u.spd}{u.sets?.length ? <span className="text-slate-400"> · {u.sets.join('/')}</span> : u.runes ? <span className="text-slate-400"> · {u.runes} รูน</span> : null}
              </div>
              {sort === 'obtained' && u.obtained && <div className="text-[11px] text-amber-300/90">{agoLabel(u.obtained)}</div>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Teams: 3MDC / Siege defense / Abyss

function Teams({ owned, mdc, onNavigate }) {
  const [kind, setKind] = useState('mdc');
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {[['mdc', 'ทีมแก้ทาง 3MDC', Shield], ['siege', 'ทีมตั้งรับ Siege', Castle], ['abyss', 'ทีม Abyss Hard', Compass]].map(([id, label, Icon]) => (
          <button key={id} onClick={() => setKind(id)} className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer ${kind === id ? 'bg-blue-600 text-white' : 'bg-white/[0.04] text-slate-300 hover:text-white'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>
      {kind === 'mdc' && <MdcTeams mdc={mdc} onNavigate={onNavigate} />}
      {kind === 'siege' && <SiegeDefenses owned={owned} onNavigate={onNavigate} />}
      {kind === 'abyss' && <AbyssTeams owned={owned} onNavigate={onNavigate} />}
    </div>
  );
}

function MdcTeams({ mdc, onNavigate }) {
  if (!mdc) return <div className="p-12 text-center text-slate-400 text-sm" role="status">กำลังตรวจสอบสูตรแก้ทาง 3MDC กับกล่องของคุณ...</div>;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          ['สูตรแก้ทางที่สร้างได้', `${mdc.buildableTotal.toLocaleString()} / ${mdc.totalCounters.toLocaleString()}`, 'text-emerald-300'],
          ['ทีมตั้งรับที่คุณแก้ได้', `${mdc.covered} / ${mdc.defenses.length}`, 'text-blue-300'],
          ['ครอบคลุม', `${mdc.defenses.length ? Math.round((mdc.covered / mdc.defenses.length) * 100) : 0}%`, 'text-amber-300'],
        ].map(([label, value, color]) => (
          <div key={label} className={`${card} p-4`}>
            <div className="text-xs text-slate-400">{label}</div>
            <div className={`text-2xl font-black font-mono mt-1 ${color}`}>{value}</div>
          </div>
        ))}
      </div>
      {mdc.nextSummons.length > 0 && <NextSummons list={mdc.nextSummons} />}
      <div className="space-y-2">
        {mdc.defenses.map(({ def, buildable, total }) => (
          <div key={def.id} className={`p-4 rounded-2xl border ${buildable.length ? 'bg-[#0a0f19]/80 border-white/[0.08]' : 'bg-[#0a0f19]/40 border-white/[0.04] opacity-60'}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">{(def.defenseMonsters || []).map((m, i) => <MonsterAvatar key={i} monster={m} size="xs" showStars={false} />)}</div>
                <div>
                  <div className="text-sm font-bold text-white">{def.title}</div>
                  <div className="text-[11px] text-slate-400">{def.towerType === 'nat4' ? 'หอ 4 ดาว' : 'หอ 5 ดาว'} • {def.difficulty}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-mono font-bold ${buildable.length ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {buildable.length ? <CheckCircle2 className="w-4 h-4 inline mr-1" /> : <XCircle className="w-4 h-4 inline mr-1" />}
                  สร้างได้ {buildable.length} / {total} สูตร
                </span>
                <button onClick={() => onNavigate('3mdc', { search: def.title })} className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer">เปิดใน 3MDC <ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
            {buildable.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {buildable.slice(0, 4).map((c) => (
                  <div key={c.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
                    <div className="flex items-center gap-1">{c.monsters.map((m, i) => <MonsterAvatar key={i} monster={m} size="xs" showStars={false} />)}</div>
                    <div className="text-[11px]"><div className="font-bold text-white">{c.title}</div><div className="text-slate-400 font-mono">★ {Number(c.rating).toFixed(1)}</div></div>
                  </div>
                ))}
                {buildable.length > 4 && <span className="text-[11px] text-slate-400 self-center">+{buildable.length - 4} สูตร</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SiegeDefenses({ owned, onNavigate }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let alive = true;
    import('../data/defenseTrendingFull.json').then((m) => { if (alive) setData(Array.isArray(m.default) ? m.default : Object.values(m.default)); });
    return () => { alive = false; };
  }, []);
  if (!data) return <div className="p-12 text-center text-slate-400 text-sm" role="status">กำลังโหลดทีมตั้งรับ...</div>;

  const rows = data.map((d) => {
    const mons = [d.leader, d.monster2, d.monster3].filter(Boolean).map((m) => {
      const info = monsterByImage(m.img) || monsterByName(m.name);
      return { name: m.name, info, have: info ? owned.has(Number(info.com2usId)) : false };
    });
    const have = mons.filter((m) => m.have).length;
    return { d, mons, have, usage: d.stats?.[3] || '' };
  }).sort((a, b) => b.have - a.have || a.d.id - b.d.id);
  const full = rows.filter((r) => r.have === 3).length;

  return (
    <div className="space-y-3">
      <div className={`${card} p-4 flex flex-wrap items-center justify-between gap-2`}>
        <div className="text-sm font-bold text-white">ทีมตั้งรับยอดนิยมทั่วโลกที่คุณตั้งได้ครบ: <span className="text-emerald-300 font-mono">{full}</span> / {rows.length}</div>
        <button onClick={() => onNavigate('trending', { subItem: 'defense-trending' })} className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer">ดูสถิติทีมตั้งรับ <ChevronRight className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
        {rows.map(({ d, mons, have, usage }) => (
          <div key={d.id} className={`p-3 rounded-2xl border flex items-center gap-3 ${have === 3 ? 'bg-emerald-500/[0.05] border-emerald-500/25' : 'bg-[#0a0f19]/60 border-white/[0.06]'}`}>
            <div className="flex items-center gap-1">
              {mons.map((m, i) => (
                <div key={i} className={m.have ? '' : 'opacity-35 grayscale'} title={`${m.name}${m.have ? '' : ' (ไม่มี)'}`}>
                  {m.info ? <MonsterAvatar monster={m.info} size="xs" showStars={false} /> : <div className="w-8 h-8 rounded-lg bg-slate-800" />}
                </div>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">{mons.map((m) => m.name).join(' + ')}</div>
              <div className="text-[11px] text-slate-400 font-mono">{usage}</div>
            </div>
            <span className={`text-xs font-mono font-bold ${have === 3 ? 'text-emerald-400' : 'text-slate-400'}`}>{have}/3</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AbyssTeams({ owned, onNavigate }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let alive = true;
    import('../data/dungeonAbyssData.json').then((m) => { if (alive) setData(Array.isArray(m.default) ? m.default : Object.values(m.default)); });
    return () => { alive = false; };
  }, []);
  if (!data) return <div className="p-12 text-center text-slate-400 text-sm" role="status">กำลังโหลดทีมดันเจี้ยน...</div>;

  const rows = data.map((d) => {
    const mons = (d.popularMonsters || []).map((pm) => {
      const info = monsterByImage(pm.img) || monsterByName(pm.name);
      return { ...pm, info, have: info ? owned.has(Number(info.com2usId)) : false };
    });
    const have = mons.filter((m) => m.have).length;
    return { d, mons, have };
  }).sort((a, b) => (b.have / (b.mons.length || 1)) - (a.have / (a.mons.length || 1)));

  return (
    <div className="space-y-2">
      {rows.map(({ d, mons, have }) => (
        <div key={d.id} className={`${card} p-4 flex flex-col md:flex-row md:items-center justify-between gap-3`}>
          <div>
            <div className="text-sm font-bold text-white">{d.name}</div>
            <div className="text-[11px] text-slate-400">เวลาเฉลี่ย {d.avgTime} • สำเร็จ {d.successRate}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {mons.map((m, i) => (
              <span key={i} className={`text-[11px] px-2 py-1 rounded-lg border flex items-center gap-1 ${m.have ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' : 'bg-white/[0.03] border-white/[0.06] text-slate-500'}`}>
                {m.have ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />} {m.name}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={`text-xs font-mono font-bold ${have === mons.length && mons.length ? 'text-emerald-400' : 'text-slate-300'}`}>มี {have}/{mons.length}</span>
            <button onClick={() => onNavigate('dungeons')} className="text-xs font-bold text-purple-300 hover:text-purple-200 flex items-center gap-1 cursor-pointer">ดูทีม <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Guardian meta coverage

function MetaCoverage({ owned }) {
  const sides = guardianMeta.meta?.replaySides || 0;
  const top = (guardianMeta.monsters || []).slice(0, 40).map((m) => ({ ...m, info: monsterOf(m.id), have: owned.has(Number(m.id)), pickRate: sides ? +((m.picks / sides) * 100).toFixed(1) : 0 }));
  const have = top.filter((m) => m.have).length;
  if (!top.length) return <div className="p-12 text-center text-slate-400 text-sm">ยังไม่มีข้อมูลเมต้า Guardian</div>;
  return (
    <div className="space-y-4">
      <div className={`${card} p-4 flex flex-wrap items-center justify-between gap-3`}>
        <div>
          <div className="text-sm font-bold text-white">คุณมีมอนเมต้า Guardian {have} จาก {top.length} ตัวที่ถูกเลือกบ่อยสุด</div>
          <div className="text-xs text-slate-400">อิงจากรีเพลย์ Guardian สาธารณะ {Math.round(sides / 2).toLocaleString()} แมตช์ (SWRT)</div>
        </div>
        <div className="w-full sm:w-64 bg-slate-800 h-2 rounded-full overflow-hidden"><div className="bg-rose-500 h-full" style={{ width: `${(have / top.length) * 100}%` }} /></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2">
        {top.map((m, i) => (
          <div key={m.id} className={`p-3 rounded-2xl border flex items-center gap-3 ${m.have ? 'bg-emerald-500/[0.05] border-emerald-500/25' : 'bg-[#0a0f19]/60 border-white/[0.06] opacity-70'}`}>
            <span className="text-[11px] font-mono text-slate-500 w-5">{i + 1}</span>
            {m.info ? <MonsterAvatar monster={m.info} size="xs" showStars={false} /> : <div className="w-8 h-8 rounded-lg bg-slate-800" />}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">{m.info?.name || `#${m.id}`}</div>
              <div className="text-[11px] text-slate-400 font-mono">Pick {m.pickRate}%</div>
            </div>
            {m.have ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <XCircle className="w-4 h-4 text-slate-600 shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Team speed tuner using real (rune-included) SPD

const LEADS = [[0, 'ไม่มีลีด'], [13, '+13%'], [19, '+19%'], [24, '+24%'], [28, '+28%'], [33, '+33%']];
const TICKS = [[286, 'Tick 1'], [239, 'Tick 2'], [205, 'Tick 3'], [179, 'Tick 4']];
const tickOf = (combat) => TICKS.find(([min]) => combat >= min)?.[1] || 'Tick 5+';

function SpeedTuner({ box, onNavigate }) {
  const [team, setTeam] = useState([]); // indexes into box.units
  const [query, setQuery] = useState('');
  const [lead, setLead] = useState(24);
  const [totem, setTotem] = useState(15);
  const [flag, setFlag] = useState(5);

  const units = useMemo(() => box.units.map((u, idx) => ({ ...u, idx, info: monsterOf(u.masterId) })).filter((u) => u.info), [box]);
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return units.filter((u) => !team.includes(u.idx) && (u.info.name.toLowerCase().includes(q) || (u.info.thaiName || '').includes(q))).sort((a, b) => b.spd - a.spd).slice(0, 8);
  }, [units, query, team]);

  const bonus = 1 + (lead + totem + flag) / 100;
  const rows = team.map((idx) => units.find((u) => u.idx === idx)).filter(Boolean)
    .map((u) => ({ ...u, combat: Math.floor(u.spd * bonus) }))
    .sort((a, b) => b.combat - a.combat)
    .map((u, i, arr) => ({ ...u, gap: i === 0 ? null : arr[i - 1].combat - u.combat, tick: tickOf(u.combat) }));

  const add = (idx) => { if (team.length < 5 && !team.includes(idx)) setTeam([...team, idx]); setQuery(''); };
  const fillFastest = () => setTeam(units.slice().sort((a, b) => b.spd - a.spd).slice(0, 5).map((u) => u.idx));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${card} p-4 space-y-3 lg:col-span-1`}>
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Gauge className="w-4 h-4 text-amber-400" /> เลือกมอนสเตอร์ (สูงสุด 5)</h3>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="พิมพ์ชื่อจากกล่องของคุณ..." disabled={team.length >= 5}
              className="w-full bg-[#0d1422] border border-white/10 focus:border-amber-400 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none disabled:opacity-50" />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#0c1322] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden max-h-72 overflow-y-auto">
                {suggestions.map((u) => (
                  <button key={u.idx} onClick={() => add(u.idx)} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.05] text-left cursor-pointer">
                    <MonsterAvatar monster={u.info} size="xs" showStars={false} />
                    <span className="text-xs font-bold text-white flex-1 truncate">{u.info.name} <span className="text-slate-400 font-normal">{u.stars}★</span></span>
                    <span className="font-mono text-xs text-amber-300">{u.spd}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={fillFastest} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-200 cursor-pointer">ใส่ 5 ตัวที่เร็วสุด</button>
            {team.length > 0 && <button onClick={() => setTeam([])} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/[0.04] border border-white/10 text-slate-300 cursor-pointer">ล้างทีม</button>}
          </div>
          <div className="space-y-2 pt-2 border-t border-white/[0.06] text-xs">
            <label className="flex items-center justify-between gap-2 text-slate-300">ลีดสปีด
              <select value={lead} onChange={(e) => setLead(Number(e.target.value))} className="bg-[#0d1422] border border-white/10 rounded-lg px-2 py-1 text-slate-100">
                {LEADS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="flex items-center justify-between gap-2 text-slate-300">โทเท็มสปีด <span className="font-mono text-amber-300">{totem}%</span>
              <input type="range" min="0" max="15" value={totem} onChange={(e) => setTotem(Number(e.target.value))} className="w-32 accent-amber-500" />
            </label>
            <label className="flex items-center justify-between gap-2 text-slate-300">ธงกิลด์ <span className="font-mono text-amber-300">{flag}%</span>
              <input type="range" min="0" max="5" value={flag} onChange={(e) => setFlag(Number(e.target.value))} className="w-32 accent-amber-500" />
            </label>
          </div>
        </div>

        <div className={`${card} p-4 lg:col-span-2`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">ลำดับเทิร์น (Combat SPD = SPD รวมรูน × {bonus.toFixed(2)})</h3>
            <button onClick={() => onNavigate('speed')} className="text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer">เครื่องคำนวณเต็ม <ChevronRight className="w-4 h-4" /></button>
          </div>
          {rows.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">เลือกมอนสเตอร์จากกล่องเพื่อดูลำดับเทิร์นด้วยค่าสปีดจริง</div>
          ) : (
            <div className="space-y-2">
              {rows.map((u, i) => (
                <div key={u.idx} className="flex items-center gap-3 p-3 rounded-xl bg-[#0a0f18] border border-slate-800">
                  <span className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-black text-xs flex items-center justify-center shrink-0">{i + 1}</span>
                  <MonsterAvatar monster={u.info} size="sm" showStars={false} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-white truncate">{u.info.name} <span className="text-[11px] text-slate-400 font-normal">{(u.sets || []).join('/')}</span></div>
                    <div className="text-[11px] text-slate-400 font-mono">SPD {u.spd} (พื้นฐาน {u.baseSpd}) → Combat <span className="text-amber-300 font-bold">{u.combat}</span> · {u.tick}</div>
                  </div>
                  {u.gap !== null && (
                    <span className={`text-[11px] font-mono px-2 py-1 rounded-lg border ${u.gap <= 3 ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-white/[0.03] border-white/[0.08] text-slate-300'}`} title="ห่างจากตัวก่อนหน้า">
                      −{u.gap}{u.gap <= 3 ? ' เสี่ยงโดนแซง' : ''}
                    </span>
                  )}
                  <button onClick={() => setTeam(team.filter((t) => t !== u.idx))} className="p-1 text-slate-500 hover:text-rose-300 cursor-pointer" aria-label="เอาออก"><X className="w-4 h-4" /></button>
                </div>
              ))}
              <p className="text-[11px] text-slate-500 pt-1">ยังไม่รวมบัฟสปีดในสนามและ ATB boost — ใช้เครื่องคำนวณเต็มสำหรับกรณีตัวเปิดเกจ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rune analysis

const statLabel = (id, val, pct) => `${STAT_NAMES[id] || id} +${val}${[2, 4, 6, 9, 10, 11, 12].includes(id) ? '%' : ''}${pct ? '' : ''}`;

function Runes({ box }) {
  const runes = box.runes || [];
  const [set, setSet] = useState('all');
  const [slot, setSlot] = useState('all');
  const [where, setWhere] = useState('all'); // all | equipped | inventory
  const [minEff, setMinEff] = useState(0);

  if (!runes.length) {
    return <div className={`${card} p-12 text-center text-slate-400 text-sm`}>ไม่มีข้อมูลรูน — นำเข้าไฟล์ SWEX ใหม่อีกครั้ง (เวอร์ชันนี้เก็บรูนทุกใบ)</div>;
  }

  const equipped = runes.filter((r) => r.unit);
  const inventory = runes.filter((r) => !r.unit);
  const avg = (list) => (list.length ? (list.reduce((s, r) => s + r.eff, 0) / list.length).toFixed(1) : '0');
  const great = runes.filter((r) => r.eff >= 80).length;
  const sellable = inventory.filter((r) => r.eff < 45 && r.lvl < 12);
  const bestUnequipped = [...inventory].sort((a, b) => b.eff - a.eff).slice(0, 8);
  const setCounts = Object.entries(runes.reduce((acc, r) => { acc[r.set] = (acc[r.set] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]);

  const filtered = runes
    .filter((r) => (set === 'all' || r.set === Number(set)) && (slot === 'all' || r.slot === Number(slot)) && r.eff >= minEff)
    .filter((r) => where === 'all' || (where === 'equipped' ? r.unit : !r.unit))
    .sort((a, b) => b.eff - a.eff)
    .slice(0, 60);

  const chip = (active) => `px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${active ? 'bg-purple-600 text-white' : 'bg-white/[0.04] text-slate-300 hover:text-white'}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          ['รูนทั้งหมด', runes.length.toLocaleString(), `ใส่อยู่ ${equipped.length.toLocaleString()} • ในคลัง ${inventory.length.toLocaleString()}`, 'text-white'],
          ['ประสิทธิภาพเฉลี่ย', `${avg(runes)}%`, `ใส่อยู่ ${avg(equipped)}% • คลัง ${avg(inventory)}%`, 'text-purple-300'],
          ['รูนระดับดีมาก (≥80%)', great, 'เทียบรูน 6★ ที่ออกซับสูงสุด', 'text-emerald-300'],
          ['ในคลังที่น่าขาย', sellable.length, 'ต่ำกว่า 45% และยังไม่ +12', 'text-rose-300'],
          ['เซ็ตที่มีมากสุด', RUNE_SETS[setCounts[0]?.[0]] || '-', `${setCounts[0]?.[1] || 0} ใบ`, 'text-amber-300'],
        ].map(([label, value, sub, color]) => (
          <div key={label} className={`${card} p-4`}>
            <div className="text-xs text-slate-400">{label}</div>
            <div className={`text-2xl font-black font-mono mt-1 ${color}`}>{value}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {bestUnequipped.length > 0 && (
        <div className={`${card} p-4`}>
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4 text-purple-400" /> รูนดีในคลังที่ยังไม่ได้ใส่</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
            {bestUnequipped.map((r) => <RuneCard key={r.id} rune={r} />)}
          </div>
        </div>
      )}

      <div className={`${card} overflow-hidden`}>
        <div className="flex flex-wrap items-center gap-1.5 p-3 border-b border-white/[0.06]">
          <select value={set} onChange={(e) => setSet(e.target.value)} className="bg-[#0d1422] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-100">
            <option value="all">ทุกเซ็ต</option>
            {setCounts.map(([id, n]) => <option key={id} value={id}>{RUNE_SETS[id] || id} ({n})</option>)}
          </select>
          <span className="text-slate-600 mx-1">|</span>
          <button onClick={() => setSlot('all')} className={chip(slot === 'all')}>ทุกช่อง</button>
          {[1, 2, 3, 4, 5, 6].map((n) => <button key={n} onClick={() => setSlot(String(n))} className={chip(slot === String(n))}>ช่อง {n}</button>)}
          <span className="text-slate-600 mx-1">|</span>
          {[['all', 'ทั้งหมด'], ['equipped', 'ใส่อยู่'], ['inventory', 'ในคลัง']].map(([id, l]) => <button key={id} onClick={() => setWhere(id)} className={chip(where === id)}>{l}</button>)}
          <label className="ml-auto flex items-center gap-2 text-xs text-slate-300">≥ <span className="font-mono text-purple-300 w-8">{minEff}%</span>
            <input type="range" min="0" max="100" step="5" value={minEff} onChange={(e) => setMinEff(Number(e.target.value))} className="w-28 accent-purple-500" />
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 p-3">
          {filtered.map((r) => <RuneCard key={r.id} rune={r} />)}
          {filtered.length === 0 && <div className="col-span-full py-8 text-center text-xs text-slate-400">ไม่มีรูนตามเงื่อนไข</div>}
        </div>
        <p className="text-[11px] text-slate-500 px-4 pb-3">ประสิทธิภาพคำนวณแบบ SWOP: (1 + ผลรวมซับ÷ค่าสูงสุดของรูน 6★) ÷ 2.8 — รูน 100% คือทุกซับออกสูงสุด</p>
      </div>
    </div>
  );
}

function RuneCard({ rune }) {
  const info = rune.unit ? monsterOf(rune.unit) : null;
  const effColor = rune.eff >= 80 ? 'text-emerald-300' : rune.eff >= 60 ? 'text-amber-300' : 'text-slate-300';
  return (
    <div className="p-3 rounded-xl bg-[#0a0f18] border border-slate-800 flex items-start gap-3">
      <div className="shrink-0 flex flex-col items-center gap-1">
        <RuneIcon rune={rune} size={54} />
        <span className="text-[10px] text-amber-400 leading-none tracking-tighter">{'★'.repeat(Math.min(6, rune.stars || 0))}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-white truncate">{RUNE_SETS[rune.set] || `Set ${rune.set}`} <span className="text-slate-400 font-normal">ช่อง {rune.slot}</span></span>
          <span className={`font-mono text-sm font-black ${effColor}`}>{rune.eff}%</span>
        </div>
        <div className="text-[11px] text-cyan-300 font-mono">{statLabel(rune.main[0], rune.main[1])}{rune.innate ? <span className="text-slate-400"> · {statLabel(rune.innate[0], rune.innate[1])}</span> : null}</div>
        <div className="text-[11px] text-slate-400 font-mono truncate">
          {rune.subs.map((s, i) => <span key={i}>{i ? ' / ' : ''}{STAT_NAMES[s[0]] || s[0]} {s[1]}{s[2] ? <span className="text-emerald-400">+{s[2]}</span> : ''}{[2, 4, 6, 9, 10, 11, 12].includes(s[0]) ? '%' : ''}</span>)}
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
          {info ? <><MonsterAvatar monster={info} size="xs" showStars={false} /> <span className="truncate">{info.name}</span></> : <span>ในคลัง</span>}
        </div>
      </div>
    </div>
  );
}
