import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Upload, Package, Shield, Flame, Trash2, RefreshCw, Search, Lock, ChevronRight, Star, CheckCircle2, XCircle,
  Compass, LayoutDashboard, Gauge, Gem, Zap, Castle, X, AlertTriangle, Sparkles, FolderSync, FolderOpen, Pause,
  Download, Trophy, Award, Check, Layers, Sliders, Crown, Eye, EyeOff, Share2, Radio, Plug, RotateCcw
} from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import RuneIcon from '../components/RuneIcon';
import MonsterDetailModal from '../components/MonsterDetailModal';
import AiChatPanel from '../components/AiChatPanel';
import MetaTeamsFromBox from '../components/MetaTeamsFromBox';
import { teamsFromBox } from '../utils/metaTeams';
import { summarizeBoxForAi, keyMonstersForAi } from '../utils/boxSummary';
import ArtifactIcon from '../components/ArtifactIcon';
import allMonstersData from '../data/allMonsters.json';
import guardianMeta from '../data/swrtGuardianMeta.json';
import { buildMonsterIndex, flagFromCountry } from '../data/swrtPlayerAdapter';
import { parseSwexExport, ownedIdSet, loadBox, saveBox, clearBox, baseAwakenedId, BOX_VERSION, RUNE_SETS, STAT_NAMES, getArtifactsFromBox, ARTIFACT_EFFECT_NAMES, loadDemoBox, isNonSummonableLd5 } from '../utils/swexImport';
import { supportsFolderWatch, loadDirHandle, clearDirHandle, pickSwexFolder, ensurePermission, findNewestExport } from '../utils/swexWatcher';
import { exportAllDataAsJSON, importDataFromJSON } from '../services/storageService';
import { loadPublicSettings } from '../services/adminClient';
import * as aegisLive from '../services/aegisLive';
import { exportLdShowcaseCard } from '../utils/cardExporter';
import AccountRadarChart from '../components/AccountRadarChart';
import { calculateAccountRadar } from '../utils/accountRadar';

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

const ELEMENT_FILTERS = [['all', 'ทุกธาตุ'], ['water', 'น้ำ'], ['fire', 'ไฟ'], ['wind', 'ลม'], ['light', 'แสง'], ['dark', 'มืด'], ['ld', '✨ แสง-มืด']];
const ELEMENT_COLOR = { water: 'bg-sky-500', fire: 'bg-rose-500', wind: 'bg-amber-400', light: 'bg-yellow-200', dark: 'bg-purple-500', ld: 'bg-gradient-to-r from-yellow-200 to-purple-500' };
const ELEMENT_TH = { water: 'น้ำ', fire: 'ไฟ', wind: 'ลม', light: 'แสง', dark: 'มืด', ld: 'แสง-มืด' };

const TABS = [
  { id: 'overview', label: 'ภาพรวม', icon: LayoutDashboard, color: 'bg-emerald-600 shadow-emerald-600/25' },
  { id: 'box', label: 'มอนสเตอร์', icon: Package, color: 'bg-cyan-600 shadow-cyan-600/25' },
  { id: 'pokedex', label: 'ตู้สะสม Nat 5 & ทำเนียบ LD5', icon: Trophy, color: 'bg-amber-600 shadow-amber-600/25' },
  { id: 'artifacts', label: 'ค้นหาอาร์ติแฟกต์', icon: Layers, color: 'bg-teal-600 shadow-teal-600/25' },
  { id: 'efficiency', label: 'สแกนหินขัด & หินแปลง (Grind/Gem)', icon: Sparkles, color: 'bg-violet-600 shadow-violet-600/25' },
  { id: 'defense', label: 'สร้างทีมรับ Siege', icon: Castle, color: 'bg-indigo-600 shadow-indigo-600/25' },
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

export default function MyBoxView({ onNavigate, tab: initialTab, subItem }) {
  const [box, setBox] = useState(() => loadBox());
  const [error, setError] = useState('');
  const [tab, setTab] = useState(() => initialTab || subItem || 'overview');

  useEffect(() => {
    if (initialTab || subItem) setTab(initialTab || subItem);
  }, [initialTab, subItem]);

  const owned = useMemo(() => ownedIdSet(box), [box]);
  const [openUnit, setOpenUnit] = useState(null); // unit (with .info) shown in the rune/artifact page
  const mdc = useMdcAnalysis(owned, !!box);

  const handleLoadDemo = () => {
    const demo = loadDemoBox();
    setBox(demo);
    setError('');
  };

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

  // --- real-time link to the AegisLink SWEX plugin --------------------------
  const [live, setLive] = useState(() => ({ ...aegisLive.getState() }));
  useEffect(() => aegisLive.subscribe((type, payload, st) => {
    if (type === 'state') setLive({ ...st });
    if (type === 'box') { setBox(payload); setError(''); }
  }), []);
  const startLive = () => aegisLive.start();
  const stopLive = () => aegisLive.stop();
  // the back-office can switch the live link off for everyone
  const [liveAllowed, setLiveAllowed] = useState(true);
  useEffect(() => {
    loadPublicSettings?.()
      ?.then((s) => {
        if (s?.features?.liveLink === false) {
          setLiveAllowed(false);
          aegisLive.stop({ forget: false });
        }
      })
      ?.catch(() => {});
  }, []);

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
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                onClick={() => exportAllDataAsJSON()}
                className="px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                title="สำรองข้อมูลทั้งหมด (มอนสเตอร์ + รูน + สงครามกิลด์) เป็นไฟล์ JSON"
              >
                <Download className="w-4 h-4" /> สำรองข้อมูล JSON
              </button>
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

      {!box && (
        <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-r from-amber-950/20 via-[#0a0f19] to-blue-950/20 p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-white">ยังไม่มีข้อมูลมอนสเตอร์ในเครื่อง — กำลังแสดงในโหมดสารบัญ (Catalog Mode)</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 uppercase">
                    Catalog Mode
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  คุณสามารถเปิดดู "ตู้สะสม Nat 5 & ทำเนียบ LD 5★", ค้นหาอาร์ติแฟกต์ หรือทดลองทุกระบบทันทีโดยกดโหลดไอดีตัวอย่าง Guardian G3
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={handleLoadDemo}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <Trophy className="w-4 h-4 text-slate-950" />
                โหลดไอดีตัวอย่าง Guardian G3 (ทดลองทันที)
              </button>
              <ImportButton onFile={importFile} label="นำเข้าไฟล์ SWEX" />
            </div>
          </div>
        </div>
      )}

      {box && (box.version || 1) < BOX_VERSION && (
        <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> ข้อมูลนี้นำเข้าด้วยเวอร์ชันเก่า — นำเข้าไฟล์ใหม่อีกครั้งเพื่อใช้ SPD รวมรูน, เซ็ตรูน, จูนสปีด และวิเคราะห์รูน</span>
          <ImportButton onFile={importFile} label="นำเข้าใหม่" icon={RefreshCw} subtle />
        </div>
      )}

      {box && <BoxHeader box={box} onNavigate={onNavigate} onClearDemo={reset} onImport={importFile} />}
      {liveAllowed && <LiveCard live={live} box={box} onStart={startLive} onStop={stopLive} onNavigate={onNavigate} />}
      {box && live.status === 'off' && <SyncCard watch={watch} box={box} onStart={startWatching} onGrant={grantAgain} onStop={stopWatching} />}

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

      {tab === 'overview' && (box ? <Overview box={box} mdc={mdc} owned={owned} onTab={setTab} onNavigate={onNavigate} onOpenUnit={setOpenUnit} /> : <EmptyState onFile={importFile} onWatch={supportsFolderWatch() ? startWatching : null} onLoadDemo={handleLoadDemo} onLive={liveAllowed ? startLive : null} />)}
      {tab === 'box' && (box ? <BoxGrid box={box} onNavigate={onNavigate} onOpenUnit={setOpenUnit} /> : <EmptyState onFile={importFile} onWatch={supportsFolderWatch() ? startWatching : null} onLoadDemo={handleLoadDemo} onLive={liveAllowed ? startLive : null} />)}
      {tab === 'pokedex' && <PokedexCollection box={box} onNavigate={onNavigate} onLoadDemo={handleLoadDemo} />}
      {tab === 'artifacts' && <ArtifactSearchEngine box={box} onNavigate={onNavigate} />}
      {tab === 'efficiency' && (box ? <RuneEfficiencyAndQuads box={box} /> : <EmptyState onFile={importFile} onWatch={supportsFolderWatch() ? startWatching : null} onLoadDemo={handleLoadDemo} onLive={liveAllowed ? startLive : null} />)}
      {tab === 'defense' && (box ? <SiegeDefenseBuilder box={box} onNavigate={onNavigate} /> : <EmptyState onFile={importFile} onWatch={supportsFolderWatch() ? startWatching : null} onLoadDemo={handleLoadDemo} onLive={liveAllowed ? startLive : null} />)}
      {tab === 'teams' && <Teams owned={owned} mdc={mdc} onNavigate={onNavigate} />}
      {tab === 'meta' && (box
        ? <div className="space-y-6"><MetaTeamsFromBox box={box} owned={owned} monsterOf={monsterOf} onNavigate={onNavigate} /><MetaCoverage owned={owned} /></div>
        : <EmptyState onFile={importFile} onWatch={supportsFolderWatch() ? startWatching : null} onLoadDemo={handleLoadDemo} onLive={liveAllowed ? startLive : null} />)}
      {tab === 'speed' && (box ? <SpeedTuner box={box} onNavigate={onNavigate} /> : <EmptyState onFile={importFile} onWatch={supportsFolderWatch() ? startWatching : null} onLoadDemo={handleLoadDemo} onLive={liveAllowed ? startLive : null} />)}
      {tab === 'runes' && (box ? <Runes box={box} /> : <EmptyState onFile={importFile} onWatch={supportsFolderWatch() ? startWatching : null} onLoadDemo={handleLoadDemo} onLive={liveAllowed ? startLive : null} />)}

      {openUnit && box && (
        <MonsterDetailModal unit={openUnit} box={box} onClose={() => setOpenUnit(null)} onNavigate={(view, params) => { setOpenUnit(null); onNavigate(view, params); }} />
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

function LiveCard({ live, box, onStart, onStop, onNavigate }) {
  const time = (ms) => (ms ? new Date(ms).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-');
  const isLive = live.status === 'live';
  const tone = isLive ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' : live.status === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : live.status === 'connecting' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-white/[0.04] border-white/10 text-slate-400';
  return (
    <div className={`${card} p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 ${isLive ? 'border-cyan-500/30' : ''}`}>
      <div className="flex items-start gap-3 min-w-0">
        <div className={`p-2 rounded-xl border shrink-0 ${tone}`}><Radio className="w-4 h-4" /></div>
        <div className="text-xs min-w-0">
          <div className="font-bold text-white flex items-center gap-2 flex-wrap">
            เชื่อมต่อ SWEX แบบเรียลไทม์ (AegisLink)
            {isLive && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-200 text-[10px] font-bold"><span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" /> LIVE</span>}
            {live.status === 'connecting' && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-200 text-[10px] font-bold"><RefreshCw className="w-3 h-3 animate-spin" /> กำลังเชื่อมต่อ</span>}
            {live.status === 'error' && <span className="px-1.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[10px] font-bold">ไม่พบปลั๊กอิน</span>}
          </div>
          <div className="text-slate-400 mt-0.5 leading-relaxed">
            {isLive
              ? live.wizard
                ? <>ไอดี <span className="text-white font-bold">{live.wizard.name}</span> • {live.units} ตัว • อัปเดตล่าสุด {time(live.lastEventAt)} <span className="font-mono text-slate-500">({live.lastCommand})</span> • รับเหตุการณ์แล้ว {live.events} ครั้ง — เปลี่ยนรูน/อัปเกรด/ขายในเกม หน้านี้จะขยับตามทันที</>
                : <>เชื่อมต่อปลั๊กอินแล้ว — รอเข้าเกม (หน้า Login) 1 ครั้ง ปลั๊กอินจะส่งกล่องทั้งหมดมาให้เอง{box ? ' ระหว่างนี้ยังแสดงข้อมูลที่นำเข้าไว้ก่อน' : ''}</>
              : live.status === 'connecting'
              ? <>กำลังหาปลั๊กอินที่ <span className="font-mono">127.0.0.1:{live.port}</span> — เปิด SWEX ไว้ เปิดใช้ AegisLink ในแท็บ Plugins แล้วเข้าเกม (ถ้าเบราว์เซอร์ถามสิทธิ์ "เครือข่ายในเครื่อง" ให้กดอนุญาต)</>
              : live.status === 'error'
              ? live.error
              : 'ติดตั้งปลั๊กอิน AegisLink ใน SWEX แล้วกดเชื่อมต่อ — กล่องมอนสเตอร์ รูน อาร์ติแฟกต์ และข้อมูลกิลด์/Siege จะอัปเดตทันทีที่เปลี่ยนในเกม โดยไม่ต้อง export ไฟล์อีก (ข้อมูลวิ่งเฉพาะในเครื่องคุณ)'}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        <button onClick={() => onNavigate?.('aegislink')} className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
          <Plug className="w-4 h-4" /> วิธีติดตั้งปลั๊กอิน
        </button>
        {live.status === 'off' && (
          <button onClick={onStart} className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <Radio className="w-4 h-4" /> เชื่อมต่อ SWEX
          </button>
        )}
        {live.status === 'error' && (
          <button onClick={() => { onStop(); onStart(); }} className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"><RotateCcw className="w-4 h-4" /> ลองใหม่</button>
        )}
        {live.status !== 'off' && (
          <button onClick={onStop} className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <Pause className="w-4 h-4" /> ตัดการเชื่อมต่อ
          </button>
        )}
      </div>
    </div>
  );
}

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

function EmptyState({ onFile, onWatch, onLoadDemo, onLive }) {
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
        {onLoadDemo && (
          <button onClick={onLoadDemo} className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <Trophy className="w-4 h-4 text-slate-950" /> โหลดไอดีตัวอย่าง Guardian G3 (ทดลองทันที)
          </button>
        )}
        {onLive && (
          <button onClick={onLive} className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20">
            <Radio className="w-4 h-4" /> เชื่อมต่อ SWEX แบบเรียลไทม์ (AegisLink)
          </button>
        )}
        {onWatch && (
          <button onClick={onWatch} className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200">
            <FolderSync className="w-4 h-4 text-emerald-400" /> หรือเลือกโฟลเดอร์ SWEX เพื่อซิงก์อัตโนมัติ
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left pt-4 max-w-4xl mx-auto">
        {[
          ['1', 'ติดตั้ง SWEX', 'Summoners War Exporter (Windows/Mac) แล้วเปิดคู่กับเกมผ่าน proxy ตามคู่มือหน้า AegisLink'],
          ['2', 'เรียลไทม์หรือไฟล์', 'ติดตั้งปลั๊กอิน AegisLink แล้วกด "เชื่อมต่อ SWEX" กล่องจะอัปเดตทันทีที่เปลี่ยนรูนในเกม — หรือจะ export ไฟล์ JSON มาวางก็ได้'],
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

function BoxHeader({ box, onNavigate, onClearDemo, onImport }) {
  const units = box?.units || [];
  const wizard = box?.wizard || { name: 'PedictU', level: 100, country: 'TH' };
  const nat5 = units.filter((u) => (monsterOf(u.masterId)?.stars || u.naturalStars || 0) >= 5).length;
  const six = units.filter((u) => u.stars === 6).length;
  const runes = box?.runes?.length || 0;
  return (
    <div className={`${card} p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4`}>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl">{flagFromCountry(wizard.country)}</div>
        <div>
          <div className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 flex-wrap">
            {wizard.name}
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-slate-300">Lv.{wizard.level}</span>
            {wizard.guild && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300">{wizard.guild}</span>}
            {box?.isDemo && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> บัญชีตัวอย่าง Guardian G3 (Demo)
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {box?.isDemo
              ? 'ข้อมูลจำลองเพื่อการทดสอบทุกฟังก์ชัน • สามารถกด "นำเข้าใหม่" ด้านบนเพื่อใส่ไฟล์จริงของคุณ'
              : `นำเข้าเมื่อ ${box?.importedAt?.slice(0, 16).replace('T', ' ') || '-'} • เก็บในเครื่องนี้เท่านั้น`}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
        {[
          ['มอนสเตอร์', units.length, 'text-white'],
          ['เนเชอรัล 5★', nat5, 'text-amber-300'],
          ['ระดับ 6★', six, 'text-emerald-300'],
          ['รูน', runes, 'text-purple-300'],
        ].map(([label, value, color]) => (
          <div key={label} className="px-3 sm:px-4 py-2.5 rounded-xl bg-[#0a0f19] border border-white/[0.08]">
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

function Overview({ box, mdc, owned, onTab, onNavigate, onOpenUnit }) {
  const withInfo = useMemo(() => box.units.map((u) => ({ ...u, info: monsterOf(u.masterId) })), [box]);
  const fastest = useMemo(() => [...withInfo].filter((u) => u.info).sort((a, b) => b.spd - a.spd).slice(0, 6), [withInfo]);
  const bestRuned = useMemo(() => [...withInfo].filter((u) => u.info && u.runes >= 6).sort((a, b) => (b.runeEff || 0) - (a.runeEff || 0)).slice(0, 5), [withInfo]);
  const elements = useMemo(() => {
    const c = { water: 0, fire: 0, wind: 0, light: 0, dark: 0, pureLight: 0, pureDark: 0 };
    for (const u of withInfo) {
      if ((u.info?.stars || 0) >= 5 && !u.info?.name?.includes('(Homunculus)')) {
        c[u.element] = (c[u.element] || 0) + 1;
        const isFree = isNonSummonableLd5(u) || (u.info && isNonSummonableLd5(u.info));
        if (!isFree) {
          if (u.element === 'light') c.pureLight++;
          if (u.element === 'dark') c.pureDark++;
        }
      }
    }
    return c;
  }, [withInfo]);
  const sets = useMemo(() => {
    const c = {};
    for (const u of box.units) for (const s of u.sets || []) c[s] = (c[s] || 0) + 1;
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [box]);
  const metaTop = (guardianMeta.monsters || []).slice(0, 40);
  const metaHave = metaTop.filter((m) => owned.has(Number(m.id))).length;
  const metaTeams = useMemo(() => teamsFromBox(guardianMeta, owned), [owned]);
  const avgEff = box.runes?.length ? (box.runes.reduce((s, r) => s + r.eff, 0) / box.runes.length).toFixed(1) : null;
  const nat5Total = (elements.water + elements.fire + elements.wind + elements.light + elements.dark) || 1;
  const latestNat5 = useMemo(() => withInfo
    .filter((u) => {
      const isNat5 = u.info && (u.info.stars || 0) >= 5 && !u.info.name?.includes('(Homunculus)') && u.obtained;
      if (!isNat5) return false;
      const isLd = u.element === 'light' || u.element === 'dark';
      if (isLd && (isNonSummonableLd5(u) || isNonSummonableLd5(u.info))) return false;
      return true;
    })
    .sort((a, b) => (b.obtained > a.obtained ? 1 : -1))
    .slice(0, 8), [withInfo]);

  const radarData = useMemo(() => calculateAccountRadar(box), [box]);

  return (
    <div className="space-y-4">
      {/* 6-Axis Summoner Power Radar */}
      <AccountRadarChart radarData={radarData} />
      {latestNat5.length > 0 && (
        <div className={`${card} p-4`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><Star className="w-4 h-4 text-amber-400 fill-amber-400" /> เนเชอรัล 5★ ที่ได้รับล่าสุด</h3>
            <span className="text-[11px] text-slate-400">ล่าสุด {agoLabel(latestNat5[0].obtained)}</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {latestNat5.map((u, i) => (
              <button key={`${u.masterId}-${u.obtained}-${i}`} onClick={() => onOpenUnit(u)}
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
        <Tile label="ทีมเมต้า Guardian ที่เล่นได้ทันที" value={`${metaTeams.readyTrios.length + metaTeams.readyDuos.length}`} sub={`${metaTeams.readyTrios.length} ทีม 3 ตัว · ${metaTeams.readyDuos.length} คู่ · มีมอนเมต้า ${metaHave}/${metaTop.length}`} color="text-rose-300" onClick={() => onTab('meta')} />
        <Tile label="เร็วที่สุดในกล่อง" value={fastest[0] ? `${fastest[0].spd} SPD` : '-'} sub={fastest[0]?.info?.name || ''} color="text-amber-300" onClick={() => onTab('speed')} />
        <Tile label="ประสิทธิภาพรูนเฉลี่ย" value={avgEff ? `${avgEff}%` : 'นำเข้าใหม่'} sub={`${(box.runes?.length || 0).toLocaleString()} รูน`} color="text-purple-300" onClick={() => onTab('runes')} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* fastest */}
        <div className={`${card} p-4 space-y-3`}>
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> เร็วที่สุด 6 ตัว (รวมรูน)</h3>
          {fastest.map((u, i) => (
            <button key={`${u.masterId}-${i}`} onClick={() => onOpenUnit(u)} className="w-full flex items-center gap-3 text-left hover:bg-white/[0.03] rounded-xl p-1 cursor-pointer">
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
              {Object.entries(elements).filter(([k]) => !k.startsWith('pure')).map(([el, n]) => n > 0 && <div key={el} className={ELEMENT_COLOR[el]} style={{ width: `${(n / nat5Total) * 100}%` }} title={`${ELEMENT_TH[el]} ${n}`} />)}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-300">
              {Object.entries(elements).filter(([k]) => !k.startsWith('pure')).map(([el, n]) => {
                const pure = el === 'light' ? elements.pureLight : el === 'dark' ? elements.pureDark : null;
                return (
                  <span key={el} className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${ELEMENT_COLOR[el]}`} /> {ELEMENT_TH[el]} <span className="font-mono text-white">{n}</span>
                    {pure !== null && (
                      <span className="text-[10px] text-amber-300 font-mono font-medium" title={`เปิดได้เองจากคัมภีร์ ${pure} ตัว (ไม่รวมตัวฟิวชั่น/แจกฟรี)`}>
                        (เปิดเอง {pure})
                      </span>
                    )}
                  </span>
                );
              })}
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

      <AiChatPanel
        title="ถามโค้ช AI เกี่ยวกับกล่องของฉัน"
        placeholder="เช่น จัดทีม GB12 ที่เร็วสุดจากกล่องฉัน / ควรตกตัวไหนต่อ / Seara ฉันควรใส่รูนอะไร"
        suggestions={['จัดทีม Giant Abyss Hard ที่เร็วสุดจากกล่องของฉัน', 'ฉันควรตกมอนสเตอร์ตัวไหนต่อเพื่อเล่น RTA', 'ทีม 3MDC ที่ดีที่สุดที่ฉันสร้างได้ตอนนี้', 'มอนสเตอร์ตัวไหนในกล่องรูนแย่สุดและควรแก้ก่อน']}
        buildContext={() => ({ box: summarizeBoxForAi(box, monsterOf), monsters: keyMonstersForAi(box, monsterOf) })}
      />
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

function BoxGrid({ box, onNavigate, onOpenUnit }) {
  const [element, setElement] = useState('all');
  const [minStars, setMinStars] = useState(5);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('spd');
  const [hideFreeLd, setHideFreeLd] = useState(() => {
    try {
      const saved = localStorage.getItem('swm:hide-free-ld');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [onlyPureNat5, setOnlyPureNat5] = useState(false);

  const toggleHideFreeLd = () => {
    setHideFreeLd((prev) => {
      const next = !prev;
      try { localStorage.setItem('swm:hide-free-ld', String(next)); } catch {}
      return next;
    });
  };

  const hiddenFreeCount = useMemo(() => {
    if (!box?.units) return 0;
    return box.units.filter((u) => {
      const info = monsterOf(u.masterId) || monsterOf(baseAwakenedId(u.masterId));
      return isNonSummonableLd5(u) || (info && isNonSummonableLd5(info));
    }).length;
  }, [box?.units]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = box.units
      .map((u) => {
        const info = monsterOf(u.masterId) || monsterOf(baseAwakenedId(u.masterId));
        const isFree = isNonSummonableLd5(u) || (info && isNonSummonableLd5(info));
        const isNat5 = (u.naturalStars === 5 || info?.stars === 5 || info?.natural_stars === 5) && !info?.name?.includes('(Homunculus)');
        return { ...u, info, isFree, isNat5 };
      })
      .filter((u) => {
        if (element === 'all') return true;
        if (element === 'ld') return u.element === 'light' || u.element === 'dark';
        return u.element === element;
      })
      .filter((u) => {
        if (onlyPureNat5) {
          return (u.element === 'light' || u.element === 'dark') && u.isNat5 && !u.isFree;
        }
        return u.stars >= minStars;
      })
      .filter((u) => !(hideFreeLd && u.isFree))
      .filter((u) => !q || (u.info?.name || '').toLowerCase().includes(q) || (u.info?.thaiName || '').includes(q));
    if (sort === 'obtained') return list.sort((a, b) => ((b.obtained || '') > (a.obtained || '') ? 1 : -1));
    const key = sort === 'stars' ? null : sort;
    return list.sort((a, b) => (key ? (b[key] || 0) - (a[key] || 0) : b.stars - a.stars || b.level - a.level || b.spd - a.spd));
  }, [box, element, minStars, query, sort, hideFreeLd, onlyPureNat5]);

  const chip = (active, color = 'bg-emerald-600') => `px-2.5 py-1.5 rounded-lg font-bold cursor-pointer ${active ? `${color} text-white` : 'bg-white/[0.04] text-slate-300 hover:text-white'}`;

  return (
    <div className="space-y-4">
      <div className={`${card} flex flex-col lg:flex-row lg:items-center gap-3 p-3`}>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {ELEMENT_FILTERS.map(([id, label]) => <button key={id} onClick={() => setElement(id)} className={chip(element === id)}>{label}</button>)}
          <span className="text-slate-600 mx-1">|</span>
          {SORTS.map(([id, label]) => <button key={id} onClick={() => setSort(id)} className={chip(sort === id, 'bg-cyan-600')}>{label}</button>)}
          <span className="text-slate-600 mx-1">|</span>
          {[6, 5, 4, 1].map((n) => <button key={n} onClick={() => { setMinStars(n); setOnlyPureNat5(false); }} className={chip(!onlyPureNat5 && minStars === n, 'bg-amber-500 !text-slate-950')}>{n === 1 ? 'ทุกดาว' : `${n}★ ขึ้นไป`}</button>)}
          <span className="text-slate-600 mx-1">|</span>
          {/* Quick Filter: Pure LD 5★ */}
          <button
            onClick={() => setOnlyPureNat5(!onlyPureNat5)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              onlyPureNat5
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 border-amber-400 font-black shadow-md'
                : 'bg-white/[0.04] text-amber-300 hover:text-white border-amber-500/30'
            }`}
            title="กรองแสดงเฉพาะมอนสเตอร์แสง-มืด 5 ดาวแท้ที่เปิดได้เอง (ไม่รวมตัวฟิวชั่น/แจกฟรี)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>LD 5★ เปิดเอง</span>
          </button>
          <span className="text-slate-600 mx-1">|</span>
          {/* Toggle to Hide Non-Summonable / Free LD */}
          <button
            onClick={toggleHideFreeLd}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              hideFreeLd
                ? 'bg-purple-600/30 text-purple-300 border-purple-500/40 shadow-sm'
                : 'bg-white/[0.04] text-slate-400 hover:text-white border-white/5'
            }`}
            title="ซ่อนมอนสเตอร์แสง-มืดที่เปิดไม่ได้จากคัมภีร์ เช่น Veromos, Jeanne, Elsharion, Eirgar, Altaïr, Homunculus"
          >
            {hideFreeLd ? <EyeOff className="w-3.5 h-3.5 text-purple-300" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{hideFreeLd ? 'ซ่อน LD แจกฟรี (เหลือเปิดเอง)' : 'รวมตัวแจกฟรี'}</span>
            {hiddenFreeCount > 0 && hideFreeLd && (
              <span className="px-1.5 py-0.2 rounded-full bg-purple-500/30 text-purple-200 text-[10px] font-mono">
                -{hiddenFreeCount}
              </span>
            )}
          </button>
        </div>
        <div className="relative lg:ml-auto lg:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาชื่อมอนสเตอร์..." className="w-full bg-[#0d1422] border border-white/10 focus:border-emerald-400 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none" />
        </div>
      </div>

      <div className="text-xs text-slate-400">
        แสดง {rows.length} จาก {box.units.length} ตัว
        {hideFreeLd && hiddenFreeCount > 0 && (
          <span className="text-purple-300 ml-1.5 font-medium">
            • ซ่อนตัวแจกฟรี/ฟิวชั่น {hiddenFreeCount} ตัว (แสดงเฉพาะเปิดได้เอง)
          </span>
        )}
        {' '}• คลิกเพื่อเปิดหน้ารูน/อาร์ติแฟกต์ของตัวนั้น
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2">
        {rows.map((u, i) => (
          <button key={`${u.uid || u.masterId}-${i}`} onClick={() => onOpenUnit(u)}
            title={u.info ? `ดูรูน อาร์ติแฟกต์ และสเตตัสของ ${u.info.name}` : `ไม่พบ #${u.masterId} ในสารานุกรม`}
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

  // Grind & Gem Opportunity Scanners
  const ungrindedSpd = rune.subs?.find((s) => s[0] === 8 && s[1] >= 18 && (s[2] || 0) === 0);
  const ungrindedPct = rune.subs?.find((s) => [2, 4, 6].includes(s[0]) && s[1] >= 20 && (s[2] || 0) === 0);
  const gemCandidate = rune.stars === 6 && (rune.eff >= 75 || rune.subs?.some(s => (s[0] === 8 && s[1] >= 14) || (s[0] === 9 && s[1] >= 15))) 
    ? rune.subs?.find((s) => [1, 3, 5].includes(s[0]) && s[3] === 0)
    : null;

  return (
    <div className="p-3 rounded-xl bg-[#0a0f18] border border-slate-800 flex items-start gap-3 hover:border-slate-700 transition">
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

        {/* Smart Grind & Gem Action Chips */}
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          {ungrindedSpd && (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              ⚡ ขัด SPD ได้ +4~5
            </span>
          )}
          {ungrindedPct && (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              🛡️ ขัด % ได้ +7~10%
            </span>
          )}
          {gemCandidate && (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30" title="สามารถใช้หินแปลงออปเปลี่ยน Flat ให้เป็น % เพื่อเพิ่มประสิทธิภาพได้">
              💎 แนะนำแปลง {STAT_NAMES[gemCandidate[0]]} ด้วย Gem
            </span>
          )}
        </div>

        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
          {info ? <><MonsterAvatar monster={info} size="xs" showStars={false} /> <span className="truncate">{info.name}</span></> : <span>ในคลัง</span>}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. Rune Efficiency & Quad Rolls Scanner
// ---------------------------------------------------------------------------

function RuneEfficiencyAndQuads({ box }) {
  const [filter, setFilter] = useState('ungrinded-spd'); // 'ungrinded-spd', 'ungrinded-pct', 'gem-candidates', 'all-quads', 'quad-spd', 'all-ungrinded', 'top-eff'
  const runes = box?.runes || [];

  // Grind & Gem Scanner Analysis
  const analysis = useMemo(() => {
    let sumEff = 0;
    let effCount = 0;
    let count100 = 0;
    let count90 = 0;

    const ungrindedSpd = [];
    const ungrindedPct = [];
    const gemCandidates = [];
    const quadSpd = [];
    const quadStats = [];
    const ungrinded = [];
    const topEff = [...runes].sort((a, b) => (b.eff || 0) - (a.eff || 0)).slice(0, 30);

    for (const r of runes) {
      const eff = r.eff || 0;
      if (r.stars === 6) {
        sumEff += eff;
        effCount++;
      }
      if (eff >= 100) count100++;
      if (eff >= 90) count90++;

      let hasQuadSpd = false;
      let hasQuadOther = false;
      let hasMissingGrind = false;
      let hasHighUngrindedSpd = false;
      let hasHighUngrindedPct = false;
      let hasFlatGemCandidate = false;

      const hasGoodSub = (r.subs || []).some(s => (s[0] === 8 && s[1] >= 14) || (s[0] === 9 && s[1] >= 15));

      for (const s of r.subs || []) {
        const statId = s[0];
        const baseVal = s[1] || 0;
        const grindVal = s[2] || 0;
        const isEnchanted = s[3] === 1;

        // Quad Roll heuristics
        if (statId === 8 && baseVal >= 20) hasQuadSpd = true;
        if ([2, 4, 6].includes(statId) && baseVal >= 28) hasQuadOther = true;
        if (statId === 9 && baseVal >= 22) hasQuadOther = true;
        if (statId === 10 && baseVal >= 25) hasQuadOther = true;

        // High Roll Ungrinded SPD (SPD >= 18 and grindVal === 0)
        if (statId === 8 && baseVal >= 18 && grindVal === 0) {
          hasHighUngrindedSpd = true;
        }

        // High Roll Ungrinded % Stats (HP%, ATK%, DEF% >= 20% and grindVal === 0)
        if ([2, 4, 6].includes(statId) && baseVal >= 20 && grindVal === 0) {
          hasHighUngrindedPct = true;
        }

        // Gem Conversion Candidate: Flat HP (1), Flat ATK (3), Flat DEF (5) on 6★ high-eff runes
        if (r.stars === 6 && [1, 3, 5].includes(statId) && !isEnchanted && (eff >= 74 || hasGoodSub)) {
          hasFlatGemCandidate = true;
        }

        // Generic ungrinded
        if (r.stars === 6 && [1, 2, 3, 4, 5, 6, 8].includes(statId) && grindVal === 0 && r.lvl >= 12) {
          hasMissingGrind = true;
        }
      }

      if (hasHighUngrindedSpd) ungrindedSpd.push(r);
      if (hasHighUngrindedPct) ungrindedPct.push(r);
      if (hasFlatGemCandidate) gemCandidates.push(r);
      if (hasQuadSpd) quadSpd.push(r);
      if (hasQuadOther) quadStats.push(r);
      if (hasMissingGrind) ungrinded.push(r);
    }

    return {
      avgEff: effCount > 0 ? (sumEff / effCount).toFixed(1) : '0.0',
      total6Star: effCount,
      count100,
      count90,
      ungrindedSpd: ungrindedSpd.sort((a, b) => (b.eff || 0) - (a.eff || 0)),
      ungrindedPct: ungrindedPct.sort((a, b) => (b.eff || 0) - (a.eff || 0)),
      gemCandidates: gemCandidates.sort((a, b) => (b.eff || 0) - (a.eff || 0)),
      quadSpd: quadSpd.sort((a, b) => (b.eff || 0) - (a.eff || 0)),
      quadStats: quadStats.sort((a, b) => (b.eff || 0) - (a.eff || 0)),
      ungrinded: ungrinded.sort((a, b) => (b.eff || 0) - (a.eff || 0)),
      topEff,
    };
  }, [runes]);

  const displayedRunes = useMemo(() => {
    if (filter === 'ungrinded-spd') return analysis.ungrindedSpd;
    if (filter === 'ungrinded-pct') return analysis.ungrindedPct;
    if (filter === 'gem-candidates') return analysis.gemCandidates;
    if (filter === 'quad-spd') return analysis.quadSpd;
    if (filter === 'all-ungrinded') return analysis.ungrinded;
    if (filter === 'top-eff') return analysis.topEff;
    // 'all-quads'
    const map = new Map();
    [...analysis.quadSpd, ...analysis.quadStats].forEach((r) => map.set(r.id, r));
    return Array.from(map.values()).sort((a, b) => (b.eff || 0) - (a.eff || 0));
  }, [filter, analysis]);

  return (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`${card} p-4 text-center border-cyan-500/30 bg-cyan-950/20`}>
          <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">⚡ SPD ≥ 18 ยังไม่ขัด</div>
          <div className="text-2xl font-black text-white mt-1">{analysis.ungrindedSpd.length} <span className="text-xs text-cyan-400">ชิ้น</span></div>
          <div className="text-[10px] text-slate-400 mt-0.5">ขัดหินตำนานได้ถึง +22~+25</div>
        </div>
        <div className={`${card} p-4 text-center border-amber-500/30 bg-amber-950/20`}>
          <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">🛡️ % สเตตัส ≥ 20% ยังไม่ขัด</div>
          <div className="text-2xl font-black text-white mt-1">{analysis.ungrindedPct.length} <span className="text-xs text-amber-400">ชิ้น</span></div>
          <div className="text-[10px] text-slate-400 mt-0.5">HP%/ATK%/DEF% โรลสูงขาดหินขัด</div>
        </div>
        <div className={`${card} p-4 text-center border-pink-500/30 bg-pink-950/20`}>
          <div className="text-[11px] font-bold text-pink-300 uppercase tracking-wider">💎 ช่องเหมาะใส่หินแปลงออป</div>
          <div className="text-2xl font-black text-white mt-1">{analysis.gemCandidates.length} <span className="text-xs text-pink-400">ชิ้น</span></div>
          <div className="text-[10px] text-slate-400 mt-0.5">แปลง Flat Stat เป็น % เพิ่มประสิทธิภาพ</div>
        </div>
        <div className={`${card} p-4 text-center border-purple-500/30 bg-purple-950/20`}>
          <div className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">Quad Rolls ทั้งหมด</div>
          <div className="text-2xl font-black text-white mt-1">{analysis.quadSpd.length + analysis.quadStats.length} <span className="text-xs text-purple-400">ชิ้น</span></div>
          <div className="text-[10px] text-slate-400 mt-0.5">สปีด 4 เด้ง {analysis.quadSpd.length} ชิ้น</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={`${card} p-4 space-y-4`}>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter('ungrinded-spd')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'ungrinded-spd' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/25' : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            ⚡ สปีดสูงยังไม่ขัด (SPD ≥ 18) ({analysis.ungrindedSpd.length})
          </button>
          <button
            onClick={() => setFilter('ungrinded-pct')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'ungrinded-pct' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25' : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            🛡️ % สูงยังไม่ขัด (≥ 20%) ({analysis.ungrindedPct.length})
          </button>
          <button
            onClick={() => setFilter('gem-candidates')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'gem-candidates' ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/25' : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            💎 เหมาะใส่หินแปลงออป (Flat to %) ({analysis.gemCandidates.length})
          </button>
          <button
            onClick={() => setFilter('all-quads')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'all-quads' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25' : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            ⚡ Quad Rolls ({analysis.quadSpd.length + analysis.quadStats.length})
          </button>
          <button
            onClick={() => setFilter('all-ungrinded')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'all-ungrinded' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            🔧 รูนทั้งหมดที่ขาดหินขัด ({analysis.ungrinded.length})
          </button>
          <button
            onClick={() => setFilter('top-eff')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'top-eff' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25' : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            🏆 Top 30 ประสิทธิภาพ
          </button>
        </div>

        {/* Rune Grid Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {displayedRunes.map((r) => (
            <RuneCard key={r.id} rune={r} />
          ))}
          {displayedRunes.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">
              ไม่พบรูนตามเงื่อนไขที่เลือก
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Pokedex & Missing Nat 5 / LD 5★ Showcase (ตู้สะสม Nat 5 & ทำเนียบ LD 5★)
// ---------------------------------------------------------------------------

const TOP_LD5_HALL_OF_FAME = [
  { name: 'Tian Lang', com2usId: '21214', element: 'light', tier: 'SSS', role: 'ตัวตัดเทิร์นขัดจังหวะยอดฮิต & สตริปสตันหมู่', rtaRating: '99.8%' },
  { name: 'Giana', com2usId: '15715', element: 'dark', tier: 'SSS', role: 'สตริปหมู่ติดสตัน 100% & ปาระเบิดพิฆาต', rtaRating: '99.5%' },
  { name: 'Nephthys', com2usId: '20515', element: 'dark', tier: 'SSS', role: 'ลดเกจ + ใบ้ + เจาะเกราะหมู่ทะลุต้านทาน 100%', rtaRating: '99.7%' },
  { name: 'Lucifer', com2usId: '23114', element: 'light', tier: 'SSS', role: 'ดึงเกจทั้งทีมทันทีเมื่อมีดาเมจเกินเกณฑ์ (Cleave Engine)', rtaRating: '99.4%' },
  { name: 'Ragdoll', com2usId: '16615', element: 'dark', tier: 'SSS', role: 'ดึงเกจเพื่อนทั้งทีมทุกครั้งที่โดนคริติคอล', rtaRating: '99.2%' },
  { name: 'Maximilian', com2usId: '25715', element: 'dark', tier: 'SSS', role: 'ดาเมจคลีฟสุดโหด + สโลว์ + ลดเกจ + เจาะเกราะ', rtaRating: '99.3%' },
  { name: 'Veronica', com2usId: '26114', element: 'light', tier: 'SSS', role: 'สปีดลีดเดอร์ + ดึงคูลดาวน์ + ปลดบัฟ + ตอดดาเมจ', rtaRating: '99.6%' },
  { name: 'Julianne', com2usId: '14714', element: 'light', tier: 'SS', role: 'อมตะดูดเลือดเพื่อน + วันช็อตเป้าเดี่ยวสตัน', rtaRating: '98.5%' },
  { name: 'Shan', com2usId: '14614', element: 'light', tier: 'SS', role: 'สปีดลีดเดอร์ + สปีดบัฟ + บูสต์เกจ + สตันหมู่', rtaRating: '98.2%' },
  { name: 'Han', com2usId: '13515', element: 'dark', tier: 'SS', role: 'สปีดลีดเดอร์ + สตันเดี่ยว 100% วนเทิร์นไม่หยุด', rtaRating: '98.0%' },
  { name: 'Asima', com2usId: '17914', element: 'light', tier: 'SS', role: 'เจาะเกราะหมู่ + แปะพิษไม่สนต้านทาน + ตอดดาเมจหนัก', rtaRating: '98.7%' },
  { name: 'Zerath', com2usId: '14414', element: 'light', tier: 'SS', role: 'ดาเมจคลีฟหมู่มหาศาลตาม % เลือดสูงสุด', rtaRating: '98.1%' },
  { name: 'Kiki', com2usId: '25215', element: 'dark', tier: 'SS', role: 'แพสซีฟกระจายดีบัฟทุกเทิร์น & ดูดเกจศัตรู', rtaRating: '97.9%' },
  { name: 'Lora', com2usId: '16114', element: 'light', tier: 'SS', role: 'สปีดลีด + สตริปหมู่ + เพิ่มบัฟป้องกัน + สโลว์', rtaRating: '98.4%' },
  { name: 'Destiny', com2usId: '26115', element: 'dark', tier: 'SS', role: 'เจาะเกราะทะลุการป้องกัน 100% สังหารเป้าหมายเดี่ยว', rtaRating: '98.2%' },
  { name: 'Wedjat', com2usId: '17014', element: 'light', tier: 'SS', role: 'สปีดลีด RTA + บูสต์เกจ + บัฟเกราะป้องกันตามสปีด', rtaRating: '97.8%' },
  { name: 'Craig / M. BISON', com2usId: '24714', element: 'light', tier: 'SS', role: 'สละเลือด 50% บูสต์เกจเต็ม + เพิ่มพลังโจมตีคลีฟ', rtaRating: '97.6%' },
  { name: 'Gurkha / M. BISON', com2usId: '24715', element: 'dark', tier: 'SS', role: 'ยั่วยุเคาน์เตอร์ไม่รู้จบ + ฟื้นเลือดเมื่อโดนตี', rtaRating: '97.5%' },
  { name: 'Talisman / RYU', com2usId: '24514', element: 'light', tier: 'SS', role: 'สกัดกั้นดาเมจ + หมัดระเบิดหมู่ทะลุต้านทาน', rtaRating: '97.3%' },
  { name: 'Vancliffe / RYU', com2usId: '24515', element: 'dark', tier: 'SS', role: 'ยืดระยะเวลาดีบัฟ + สตริปหมู่สตันสุดกวน', rtaRating: '97.2%' },
  { name: 'Cadiz', com2usId: '14715', element: 'dark', tier: 'SS', role: 'แจกดีบัฟ 4 ชนิด + ดึงเกจทั้งทีมทุกการโจมตี', rtaRating: '97.4%' },
  { name: 'Vivachel', com2usId: '19315', element: 'dark', tier: 'SS', role: 'สลับหลอดเลือด & สลับเกจโจมตีฉับพลัน', rtaRating: '97.8%' },
  { name: 'Eleanor', com2usId: '21514', element: 'light', tier: 'SS', role: 'ลดอัตราคริติคอลของศัตรูทั้งทีม + ปลดดีบัฟ', rtaRating: '96.8%' },
  { name: 'Alexandra', com2usId: '21515', element: 'dark', tier: 'SS', role: 'สะท้อนดาเมจ 30% + กางโล่หนา + สตริปตอดเลือดยับ', rtaRating: '96.7%' },
  { name: 'Yeonhwa', com2usId: '23914', element: 'light', tier: 'SS', role: 'บรรเลงเพลงตัดเกจ & สตริปทุกครั้งที่ศัตรูออกเทิร์น', rtaRating: '96.5%' },
  { name: 'Sylvia', com2usId: '19015', element: 'dark', tier: 'SS', role: 'สปีดลีดเดอร์กิลด์ + ดึงเพื่อนรุมตีฟรีทุกเทิร์น', rtaRating: '97.1%' },
  { name: 'Pater', com2usId: '22315', element: 'dark', tier: 'SS', role: 'แปลงร่างล้างดีบัฟทั้งทีมทันทีเมื่อเพื่อนโดน CC', rtaRating: '97.6%' },
  { name: 'Valantis', com2usId: '22314', element: 'light', tier: 'SS', role: 'สตริปหมู่ติดสตัน Despair + ชุบชีวิตตัวเอง', rtaRating: '97.3%' },
  { name: 'Woonsa', com2usId: '18615', element: 'dark', tier: 'SS', role: 'เบสสปีดสูงปรี๊ด 118 สตริปหมู่ + ขโมยบัฟเป็นโล่', rtaRating: '97.7%' },
  { name: 'Narsha', com2usId: '23414', element: 'light', tier: 'SSS', role: 'ขโมยสปีด + เจาะเกราะวนเทิร์นเดี่ยวรัวๆ', rtaRating: '99.0%' },
  { name: 'Xiana', com2usId: '23415', element: 'dark', tier: 'SS', role: 'ใบ้หมู่ + ลดเกจ 100% + ปิดผนึกสกิลศัตรู', rtaRating: '96.9%' },
  { name: 'Shun', com2usId: '26414', element: 'light', tier: 'SS', role: 'ผูกเงาส่งผ่านดาเมจ + กำจัดเป้าหมายทันที', rtaRating: '96.5%' },
  { name: 'Ritsu', com2usId: '26415', element: 'dark', tier: 'SS', role: 'ขังศัตรูในมิติเงา 1v1 ปิดการช่วยเพื่อนทั้งทีม', rtaRating: '96.8%' },
  { name: 'Dorothy', com2usId: '25414', element: 'light', tier: 'SS', role: 'ทำลายเลือดสูงสุดศัตรู + ระเบิดดาเมจหมู่กวาดล้าง', rtaRating: '96.4%' },
  { name: 'Thebae', com2usId: '18215', element: 'dark', tier: 'SS', role: 'แปะตรา Brand หมู่ + ดาเมจทะลุเกราะตาม HP', rtaRating: '96.2%' },
  { name: 'Celia', com2usId: '19314', element: 'light', tier: 'SS', role: 'แพสซีฟสตริปบัฟศัตรู + หลับทุกเทิร์น', rtaRating: '96.6%' },
  { name: 'Artamiel', com2usId: '13914', element: 'light', tier: 'S', role: 'ฮีโร่สัญลักษณ์เกม สวนกลับเมื่อศัตรูคริ + สตริปบัฟ', rtaRating: '95.5%' },
  { name: 'Fermion', com2usId: '13915', element: 'dark', tier: 'S', role: 'แทงก์ถึกทนดาเมจเพิ่มขึ้นตามเพื่อนที่ตาย + ยั่วยุ', rtaRating: '95.8%' },
  { name: 'Nicki', com2usId: '16115', element: 'dark', tier: 'SS', role: 'ล้างดีบัฟทั้งทีม + บัฟดาเมจ 3 เทิร์น + ฮีลแรง', rtaRating: '97.2%' },
  { name: 'Pontos', com2usId: '20414', element: 'light', tier: 'SS', role: 'สปีดลีด 24% + อมตะและกันดีบัฟทั้งทีม 3 เทิร์น', rtaRating: '97.5%' },
];

function PokedexCollection({ box, onNavigate, onLoadDemo }) {
  const [eleFilter, setEleFilter] = useState('all');
  const [ownershipFilter, setOwnershipFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState('element');
  const [hofFilter, setHofFilter] = useState('all');

  const units = box?.units || [];

  // Robust ID & Name Matching Set
  const ownedSet = useMemo(() => {
    const set = new Set();
    units.forEach((u) => {
      const mId = Number(u.masterId);
      if (mId) {
        set.add(mId);
        set.add(String(mId));
        const baseId = baseAwakenedId(mId);
        set.add(baseId);
        set.add(String(baseId));
        set.add(`m-${mId}`);
        set.add(`m-${baseId}`);
      }
      if (u.name) set.add(u.name.toLowerCase().trim());
      const info = monsterOf(u.masterId) || monsterOf(baseAwakenedId(u.masterId));
      if (info?.name) set.add(info.name.toLowerCase().trim());
      if (info?.com2usId) {
        set.add(Number(info.com2usId));
        set.add(String(info.com2usId));
        set.add(`m-${info.com2usId}`);
      }
    });
    return set;
  }, [units]);

  const checkIsOwned = useMemo(() => {
    return (m) => {
      if (!box || !units.length) return false;
      const num = Number(m.com2usId || String(m.id || '').replace(/\D/g, ''));
      if (num && (ownedSet.has(num) || ownedSet.has(String(num)) || ownedSet.has(`m-${num}`))) return true;
      if (m.id && ownedSet.has(m.id)) return true;
      if (m.name && ownedSet.has(m.name.toLowerCase().trim())) return true;
      return false;
    };
  }, [box, units.length, ownedSet]);

  // Extract all Nat 5 monsters in catalog
  const nat5Catalog = useMemo(() => {
    const map = new Map();
    for (const m of allMonstersData) {
      const isNat5 = m.natural_stars === 5 || m.default_stars === 5 || m.stars === 5;
      if (isNat5 && m.name && !m.name.includes('(Homunculus)')) {
        const key = m.name.toLowerCase();
        if (!map.has(key)) map.set(key, m);
      }
    }
    return Array.from(map.values());
  }, []);

  // Option to hide non-summonable LDs (Veromos, Jeanne, Elsharion, Eirgar, Altair, Homunculus)
  const [hideNonSummonLd, setHideNonSummonLd] = useState(() => {
    try {
      const saved = localStorage.getItem('swm:hide-non-summon-ld');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleHideNonSummonLd = () => {
    setHideNonSummonLd((prev) => {
      const next = !prev;
      try { localStorage.setItem('swm:hide-non-summon-ld', String(next)); } catch {}
      return next;
    });
  };

  // Owned Natural 5★ Light/Dark monsters with rich data
  const ownedLd5s = useMemo(() => {
    return units
      .map((u) => {
        const info = monsterOf(u.masterId) || monsterOf(baseAwakenedId(u.masterId)) || monsterByName(u.name);
        const ele = (u.element || info?.element || '').toLowerCase();
        const isLd = ele === 'light' || ele === 'dark';
        const isNat5 = (info?.stars === 5 || info?.natural_stars === 5 || u.naturalStars === 5) && !info?.name?.includes('(Homunculus)');
        if (isLd && isNat5) {
          const isNonSummon = isNonSummonableLd5(u) || (info && isNonSummonableLd5(info));
          return {
            ...u,
            name: info?.name || u.name || 'Unknown',
            thaiName: info?.thaiName || u.thaiName || '',
            avatarUrl: info?.avatarUrl || info?.imageUrl || u.avatarUrl || '',
            element: ele,
            isNonSummon,
            info,
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [units]);

  const pureOwnedLd5s = useMemo(() => ownedLd5s.filter((u) => !u.isNonSummon), [ownedLd5s]);
  const freeOwnedLd5s = useMemo(() => ownedLd5s.filter((u) => u.isNonSummon), [ownedLd5s]);
  const displayedLd5s = hideNonSummonLd ? pureOwnedLd5s : ownedLd5s;

  const [ldShelfTab, setLdShelfTab] = useState(() => (displayedLd5s.length > 0 ? 'owned' : 'hall-of-fame'));

  // Sync shelf tab when box changes
  useEffect(() => {
    if (displayedLd5s.length > 0) {
      setLdShelfTab('owned');
    }
  }, [displayedLd5s.length]);

  // Active catalog respecting hideNonSummonLd
  const activeCatalog = useMemo(() => {
    if (!hideNonSummonLd) return nat5Catalog;
    return nat5Catalog.filter((m) => !isNonSummonableLd5(m));
  }, [nat5Catalog, hideNonSummonLd]);

  // Breakdown by element
  const statsByElement = useMemo(() => {
    const counts = {
      water: { owned: 0, total: 0 },
      fire: { owned: 0, total: 0 },
      wind: { owned: 0, total: 0 },
      light: { owned: 0, total: 0 },
      dark: { owned: 0, total: 0 },
    };

    for (const m of activeCatalog) {
      const ele = (m.element || 'fire').toLowerCase();
      if (counts[ele]) {
        counts[ele].total++;
        if (checkIsOwned(m)) {
          counts[ele].owned++;
        }
      }
    }
    return counts;
  }, [activeCatalog, checkIsOwned]);

  const totalOwned = useMemo(() => {
    return Object.values(statsByElement).reduce((s, c) => s + c.owned, 0);
  }, [statsByElement]);
  const totalNat5 = activeCatalog.length;
  const overallPct = totalNat5 > 0 ? Math.round((totalOwned / totalNat5) * 100) : 0;

  // Hall of Fame monsters with ownership matching
  const hallOfFameMonsters = useMemo(() => {
    return TOP_LD5_HALL_OF_FAME.map((entry) => {
      const num = Number(entry.com2usId);
      const catalogMonster = monsterOf(num) || monsterByName(entry.name) || allMonstersData.find((m) => m.name.toLowerCase() === entry.name.toLowerCase());
      const isOwned = checkIsOwned(entry) || (catalogMonster && checkIsOwned(catalogMonster));
      const ownedUnit = isOwned
        ? units.find((u) => u.masterId === num || baseAwakenedId(u.masterId) === num || u.name?.toLowerCase() === entry.name.toLowerCase())
        : null;
      return {
        ...entry,
        monster: catalogMonster,
        isOwned,
        ownedUnit,
      };
    });
  }, [checkIsOwned, units]);

  const filteredHof = useMemo(() => {
    return hallOfFameMonsters.filter((item) => {
      if (hofFilter === 'sss' && item.tier !== 'SSS') return false;
      if (hofFilter === 'light' && item.element !== 'light') return false;
      if (hofFilter === 'dark' && item.element !== 'dark') return false;
      if (hofFilter === 'owned' && !item.isOwned) return false;
      return true;
    });
  }, [hallOfFameMonsters, hofFilter]);

  // Catalog filtered and sorted
  const filteredMonsters = useMemo(() => {
    let list = activeCatalog.filter((m) => {
      // Element filter
      if (eleFilter !== 'all' && (m.element || '').toLowerCase() !== eleFilter) return false;

      // Ownership filter
      const isOwned = checkIsOwned(m);
      if (ownershipFilter === 'owned' && !isOwned) return false;
      if (ownershipFilter === 'missing' && isOwned) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = m.name?.toLowerCase().includes(q);
        const matchThai = m.thaiName?.toLowerCase().includes(q);
        const matchFamily = m.family?.toLowerCase().includes(q) || m.thaiFamily?.toLowerCase().includes(q);
        if (!matchName && !matchThai && !matchFamily) return false;
      }

      return true;
    });

    if (sortMode === 'name') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortMode === 'owned-first') {
      list.sort((a, b) => {
        const ownA = checkIsOwned(a) ? 1 : 0;
        const ownB = checkIsOwned(b) ? 1 : 0;
        return ownB - ownA || (a.name || '').localeCompare(b.name || '');
      });
    } else {
      const eleOrder = { water: 1, fire: 2, wind: 3, light: 4, dark: 5 };
      list.sort((a, b) => {
        const oA = eleOrder[(a.element || '').toLowerCase()] || 9;
        const oB = eleOrder[(b.element || '').toLowerCase()] || 9;
        return oA - oB || (a.name || '').localeCompare(b.name || '');
      });
    }

    return list;
  }, [activeCatalog, eleFilter, ownershipFilter, searchQuery, sortMode, checkIsOwned]);

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & COMPLETION BANNER */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#0d1627] via-[#090e18] to-[#120f24] p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 shrink-0 shadow-lg shadow-amber-500/10">
              <Trophy className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Summoners War Pokedex & Showcase
                </span>
                {box?.isDemo && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Guardian Demo Account
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                ตู้สะสมเกียรติยศ Nat 5 & ทำเนียบ LD 5★ ระดับโลก
              </h2>
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                เช็คสารบัญความคืบหน้า 5 ดาวแท้ทั้งหมด 455 ตัว พร้อมตู้โชว์มอนสเตอร์แสง-มืดระดับตำนาน และสถิติการครอบครองในไอดีของคุณ
              </p>
            </div>
          </div>

          {/* Quick Progress Indicator */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center sm:text-right">
              <div className="text-[11px] text-slate-400 font-medium">ความคืบหน้า 5 ดาวแท้ทั้งหมด</div>
              <div className="text-xl font-black text-amber-300 mt-0.5 font-mono">
                {totalOwned} <span className="text-xs text-slate-400">/ {totalNat5} ตัว</span>
                <span className="ml-2 text-sm px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  {overallPct}%
                </span>
              </div>
              <div className="w-full sm:w-48 bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden mx-auto sm:ml-auto">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${overallPct}%` }}
                />
              </div>
            </div>

            {(!box || !box.units?.length) && onLoadDemo && (
              <button
                onClick={onLoadDemo}
                className="px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>โหลดไอดีตัวอย่าง Guardian</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. DUAL-MODE LD 5★ TROPHY CABINET (ตู้เกียรติยศแสง-มืด) */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-b from-[#140e26] via-[#090d16] to-[#070b12] p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
        {/* Ambient Rarity Glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-yellow-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Header & Mode Switcher */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-yellow-500/20 to-purple-500/20 border border-yellow-500/40 text-yellow-300 shadow shrink-0">
                <Crown className="w-6 h-6 text-yellow-300" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 flex-wrap">
                  <span>ตู้เกียรติยศ LD 5★ (แสง-มืดแท้ระดับตำนาน)</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 text-xs font-bold border border-yellow-500/30 font-mono">
                    {displayedLd5s.length} ตัวในไอดี
                  </span>
                  {hideNonSummonLd && freeOwnedLd5s.length > 0 && (
                    <span className="text-[11px] text-slate-400 font-normal">
                      (ซ่อนตัวฟิวชั่น/แจกฟรี {freeOwnedLd5s.length} ตัว: {freeOwnedLd5s.map((u) => u.name).join(', ')})
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  มอนสเตอร์ระดับสมบัติล้ำค่าที่สุดในเกม Summoners War
                </p>
              </div>
            </div>

            {/* Controls: Hide Filter Toggle + Mode Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Export LD5 Showcase Card PNG */}
              <button
                onClick={() => exportLdShowcaseCard({ wizardName: box?.wizard?.name || 'Summoner', ld5List: displayedLd5s })}
                className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/20"
                title="บันทึกรูปการ์ดตู้สะสม LD 5★ เป็นไฟล์ PNG สำหรับแชร์โซเชียล"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>บันทึกรูปตู้สะสม LD (PNG)</span>
              </button>

              {/* Toggle to Hide Non-Summonable LDs */}
              <button
                onClick={toggleHideNonSummonLd}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  hideNonSummonLd
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25 shadow-sm'
                    : 'bg-white/[0.04] text-slate-400 border-white/10 hover:text-white'
                }`}
                title="ซ่อนมอนสเตอร์แสง-มืดที่ไม่ได้เปิดได้เองจากคัมภีร์ เช่น ตัวผสม/ฟิวชั่น (Veromos, Jeanne), เหรียญโบราณ (Elsharion, Eirgar, Altaïr), และโฮมุนครุส"
              >
                {hideNonSummonLd ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{hideNonSummonLd ? 'ซ่อนแสงมืดที่ไม่ได้เปิดได้เอง' : 'แสดงแสงมืดทั้งหมด (รวมฟิวชั่น)'}</span>
                {freeOwnedLd5s.length > 0 && hideNonSummonLd && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                    -{freeOwnedLd5s.length}
                  </span>
                )}
              </button>

              {/* Mode Toggle Buttons */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10 self-start sm:self-auto">
                <button
                  onClick={() => setLdShelfTab('owned')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    ldShelfTab === 'owned'
                      ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>มอนสเตอร์ในไอดีของฉัน ({displayedLd5s.length})</span>
                </button>
                <button
                  onClick={() => setLdShelfTab('hall-of-fame')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    ldShelfTab === 'hall-of-fame'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5 text-purple-300" />
                  <span>ทำเนียบ 40 ตัวท็อปเมต้าโลก</span>
                </button>
              </div>
            </div>
          </div>

          {/* VIEW A: OWNED LD 5★ TROPHY SHELF */}
          {ldShelfTab === 'owned' && (
            <div>
              {displayedLd5s.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
                  {displayedLd5s.map((u, idx) => {
                    const isLight = u.element === 'light';
                    return (
                      <div
                        key={idx}
                        onClick={() => onNavigate('where2use', { initialMonster: u.name })}
                        className={`relative group p-4 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] shadow-xl ${
                          u.isNonSummon
                            ? 'border-slate-600/40 bg-gradient-to-b from-slate-900/60 via-[#0a0f19] to-black shadow-slate-500/10 hover:border-slate-400'
                            : isLight
                            ? 'border-yellow-400/40 bg-gradient-to-b from-yellow-950/30 via-[#0a0f19] to-black shadow-yellow-500/10 hover:border-yellow-400/70'
                            : 'border-purple-500/40 bg-gradient-to-b from-purple-950/30 via-[#0a0f19] to-black shadow-purple-500/10 hover:border-purple-400/70'
                        }`}
                      >
                        {/* Pedestal Top Accent */}
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                              u.isNonSummon
                                ? 'bg-slate-500/20 text-slate-300 border-slate-500/40'
                                : isLight
                                ? 'bg-yellow-400/20 text-yellow-200 border-yellow-400/40'
                                : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            }`}
                          >
                            {u.isNonSummon ? '🔨 ผสม / แจกฟรี' : isLight ? '☀️ Light 5★ (Gacha)' : '🌙 Dark 5★ (Gacha)'}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-amber-300">
                            +{u.spd - u.baseSpd} SPD
                          </span>
                        </div>

                        {/* Centered Avatar */}
                        <div className="flex flex-col items-center text-center gap-2">
                          <div className="relative">
                            <MonsterAvatar
                              monster={u.info || u}
                              size={68}
                              className={`rounded-2xl border-2 shadow-2xl ${
                                u.isNonSummon
                                  ? 'border-slate-500/60'
                                  : isLight
                                  ? 'border-yellow-400/60'
                                  : 'border-purple-400/60'
                              }`}
                            />
                            <span className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-emerald-500 text-white shadow">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          </div>

                          <div>
                            <div className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                              {u.name}
                            </div>
                            {u.thaiName && u.thaiName !== u.name && (
                              <div className="text-[11px] text-slate-400">{u.thaiName}</div>
                            )}
                          </div>

                          {/* Quick Stats Badges */}
                          <div className="w-full pt-2 mt-1 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-300">
                            <span className="font-semibold text-slate-400">
                              {u.sets && u.sets.length > 0 ? u.sets.join(' / ') : 'ยังไม่ใส่เซ็ต'}
                            </span>
                            {u.runeEff > 0 && (
                              <span className="font-mono text-emerald-400 font-bold">
                                {u.runeEff}% Eff
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : hideNonSummonLd && freeOwnedLd5s.length > 0 ? (
                /* Empty state when user only has non-summonable LDs and has hidden them */
                <div className="py-10 sm:py-14 text-center space-y-4 rounded-2xl bg-white/[0.02] border border-white/5 p-6">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white">
                      ยังไม่พบมอนสเตอร์แสง-มืด 5 ดาวแท้ (เปิดได้เองจากคัมภีร์) ในไอดีนี้
                    </h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      ขณะนี้เปิดโหมด <span className="text-amber-300 font-semibold">"ซ่อนแสงมืดที่ไม่ได้เปิดได้เอง"</span> อยู่ โดยไอดีของคุณมีมอนสเตอร์ LD 5★ จากฟิวชั่น/แจกฟรี <span className="text-white font-bold">{freeOwnedLd5s.length} ตัว</span> ({freeOwnedLd5s.map((u) => u.name).join(', ')})
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      onClick={toggleHideNonSummonLd}
                      className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Eye className="w-4 h-4 text-amber-300" />
                      <span>คลิกเพื่อแสดงตัวฟิวชั่น/แจกฟรี ({freeOwnedLd5s.length} ตัว)</span>
                    </button>
                    <button
                      onClick={() => setLdShelfTab('hall-of-fame')}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/20 transition-all"
                    >
                      <Crown className="w-4 h-4 text-yellow-300" />
                      <span>เปิดดูทำเนียบ 40 มอนสเตอร์ LD 5★ เมต้าสูงสุดระดับโลก</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-10 sm:py-14 text-center space-y-4 rounded-2xl bg-white/[0.02] border border-white/5 p-6">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white">
                      ยังไม่พบมอนสเตอร์แสง-มืด 5 ดาวแท้ในไอดีนี้
                    </h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      มอนสเตอร์แสง-มืดแท้ (LD 5★) มีโอกาสออกเพียง 0.35% จากคัมภีร์แสง-มืด ขอให้การซัมมอนครั้งต่อไปของคุณได้รับแสงสว่างระดับตำนานครับ!
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => setLdShelfTab('hall-of-fame')}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/20 transition-all"
                    >
                      <Crown className="w-4 h-4 text-yellow-300" />
                      <span>เปิดดูทำเนียบ 40 มอนสเตอร์ LD 5★ เมต้าสูงสุดระดับโลก</span>
                    </button>
                    {onLoadDemo && (
                      <button
                        onClick={onLoadDemo}
                        className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>🎮 โหลดไอดีตัวอย่าง Guardian G3 เพื่อทดสอบตู้สะสม</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW B: 40 META LD 5★ GUARDIAN HALL OF FAME */}
          {ldShelfTab === 'hall-of-fame' && (
            <div className="space-y-4">
              {/* Filter Chips */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="text-xs text-slate-400 font-medium">
                  แสดง {filteredHof.length} จาก 40 สุดยอดมอนสเตอร์ LD 5★ เมต้า RTA สากล
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    ['all', 'ทั้งหมด (40)'],
                    ['sss', 'ระดับ SSS (7)'],
                    ['light', 'ธาตุแสง (☀️)'],
                    ['dark', 'ธาตุมืด (🌙)'],
                    ['owned', `ที่คุณครอบครอง (${hallOfFameMonsters.filter((m) => m.isOwned).length})`],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setHofFilter(key)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        hofFilter === key
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 40 Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {filteredHof.map((item, idx) => {
                  const isLight = item.element === 'light';
                  return (
                    <div
                      key={idx}
                      onClick={() => onNavigate('where2use', { initialMonster: item.name })}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between gap-2.5 ${
                        item.isOwned
                          ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400 shadow-md shadow-emerald-950/30'
                          : 'bg-[#0a0f19] border-white/[0.08] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative shrink-0">
                          <MonsterAvatar
                            monster={item.monster || item}
                            size={52}
                            className={`rounded-2xl border-2 ${
                              item.isOwned ? 'border-emerald-400' : isLight ? 'border-yellow-400/40' : 'border-purple-400/40'
                            }`}
                          />
                          {item.isOwned ? (
                            <span className="absolute -top-1 -right-1 p-0.5 rounded-full bg-emerald-500 text-white shadow">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="absolute -top-1 -right-1 p-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/10 shadow">
                              <Lock className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[10px] font-black px-1.5 py-0.2 rounded font-mono ${
                                item.tier === 'SSS'
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              }`}
                            >
                              {item.tier}
                            </span>
                            <span className="text-xs font-black text-white group-hover:text-amber-300 transition-colors truncate">
                              {item.name}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {item.monster?.thaiName || (isLight ? 'ธาตุแสง' : 'ธาตุมืด')}
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-1 mt-1 font-medium leading-relaxed">
                            {item.role}
                          </div>
                        </div>
                      </div>

                      {/* Card Bottom Status Badge */}
                      <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px]">
                        <span className="text-[10px] font-mono text-slate-400">
                          เรตติ้ง RTA {item.rtaRating}
                        </span>
                        {item.isOwned ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> ครอบครองแล้ว
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-white/5 text-slate-400 text-[10px] font-medium flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> มอนสเตอร์ในฝัน
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. NAT 5 COMPLETION PROGRESS BY ELEMENT */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <span>ความคืบหน้าการสะสม 5 ดาวแท้แยกตามธาตุ</span>
            <span className="text-xs text-slate-400 font-normal hidden sm:inline">
              (คลิกที่การ์ดธาตุเพื่อกรองสารบัญทันที)
            </span>
          </div>
          {eleFilter !== 'all' && (
            <button
              onClick={() => setEleFilter('all')}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
            >
              แสดงทุกธาตุ
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(statsByElement).map(([ele, val]) => {
            const pct = val.total > 0 ? Math.round((val.owned / val.total) * 100) : 0;
            const isSelected = eleFilter === ele;
            return (
              <div
                key={ele}
                onClick={() => setEleFilter(isSelected ? 'all' : ele)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-center ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-500/15 ring-2 ring-cyan-400/30'
                    : `${card} hover:border-white/20 hover:bg-white/[0.04]`
                }`}
              >
                <div className="text-xs font-bold capitalize text-slate-300 mb-1 flex items-center justify-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${ELEMENT_COLOR[ele]}`} />
                  <span>ธาตุ{ELEMENT_TH[ele]}</span>
                </div>
                <div className="text-xl font-black text-white font-mono">
                  {val.owned} <span className="text-xs text-slate-400 font-normal">/ {val.total}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 mt-2.5 overflow-hidden">
                  <div className={`h-full ${ELEMENT_COLOR[ele]} transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[11px] text-slate-400 mt-1.5 font-mono font-bold">{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. NAT 5 CATALOG CHECKLIST & SEARCH ENGINE */}
      <div className={`${card} p-5 sm:p-6 space-y-4`}>
        {/* Search & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-white">
              สารบัญ 5 ดาวแท้ทั้งหมด
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-300 text-xs font-bold font-mono">
              {filteredMonsters.length} / {nat5Catalog.length}
            </span>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อมอนสเตอร์ (Seara, Byungchul, บยองชอล, เซียร์ร่า)..."
              className="w-full bg-[#070b12] border border-white/10 focus:border-cyan-400 rounded-xl pl-10 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills & Sort Options */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
          {/* Element Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {ELEMENT_FILTERS.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setEleFilter(id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  eleFilter === id
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Ownership Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              ['all', 'ทั้งหมด'],
              ['owned', `ครอบครองแล้ว (${totalOwned})`],
              ['missing', `ยังไม่มี (${totalNat5 - totalOwned})`],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setOwnershipFilter(id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  ownershipFilter === id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {label}
              </button>
            ))}

            {/* Hide Non-Summonable LD Filter Toggle */}
            <button
              onClick={toggleHideNonSummonLd}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                hideNonSummonLd
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white border-white/5'
              }`}
              title="ซ่อนมอนสเตอร์แสง-มืดที่ไม่ได้เปิดได้เองจากคัมภีร์ เช่น Veromos, Jeanne, Elsharion, Eirgar, Altaïr"
            >
              {hideNonSummonLd ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{hideNonSummonLd ? 'ซ่อน LD ฟรี/ฟิวชั่น' : 'แสดง LD ฟรี/ฟิวชั่น'}</span>
            </button>

            {/* Sort Mode */}
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
              className="bg-[#070b12] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="element">เรียงตามธาตุ</option>
              <option value="name">เรียงตามชื่อ A-Z</option>
              <option value="owned-first">มอนสเตอร์ที่มีขึ้นก่อน</option>
            </select>
          </div>
        </div>

        {/* Monster Checklist Grid */}
        {filteredMonsters.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2.5 pt-2">
            {filteredMonsters.map((m) => {
              const isOwned = checkIsOwned(m);
              return (
                <div
                  key={m.id || m.name}
                  onClick={() => onNavigate('where2use', { initialMonster: m.name })}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer group hover:scale-105 ${
                    isOwned
                      ? 'border-emerald-500/50 bg-gradient-to-b from-emerald-950/25 to-[#0a0f19] shadow-md shadow-emerald-950/30'
                      : 'border-white/5 bg-white/[0.02] opacity-45 grayscale hover:opacity-80 hover:grayscale-0'
                  }`}
                  title={`${m.name} (${m.thaiName || m.element}) - คลิกเพื่อดูคู่มือ & สกิล`}
                >
                  <div className="relative">
                    <MonsterAvatar monster={m} size={46} className="rounded-xl" />
                    {isOwned ? (
                      <span className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="absolute -top-1 -right-1 bg-slate-800 text-slate-400 rounded-full p-0.5 border border-white/10 shadow">
                        <Lock className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-bold text-slate-200 truncate max-w-full group-hover:text-cyan-300 transition-colors">
                    {m.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-full">
                    {m.thaiName && m.thaiName !== m.name ? m.thaiName : `${ELEMENT_TH[m.element] || m.element}`}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            ไม่พบมอนสเตอร์ 5 ดาวแท้ตามเงื่อนไขที่เลือก
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Siege Defense Builder from Owned Monsters
// ---------------------------------------------------------------------------

function SiegeDefenseBuilder({ box, onNavigate }) {
  const [slot1, setSlot1] = useState(null); // Leader
  const [slot2, setSlot2] = useState(null);
  const [slot3, setSlot3] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const units = box?.units || [];

  const availableUnits = useMemo(() => {
    return units.filter((u) => {
      if (!searchTerm) return true;
      return u.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [units, searchTerm]);

  // Turn Order calculation
  const turnOrder = useMemo(() => {
    const selected = [slot1, slot2, slot3].filter(Boolean);
    if (selected.length === 0) return [];
    return [...selected].sort((a, b) => (b.spd || 0) - (a.spd || 0));
  }, [slot1, slot2, slot3]);

  return (
    <div className="space-y-6">
      <div className={`${card} p-6 space-y-6`}>
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            🏰 จำลองและวิเคราะห์ทีมตั้งรับ Siege (3 ตัว)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            เลือก 3 มอนสเตอร์จากกล่องของคุณ เพื่อวิเคราะห์ความเร็วออกเทิร์น (Speed Gap), การจูนสปีด, และสถิติแก้ทาง
          </p>
        </div>

        {/* 3 Selected Slots */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Slot 1: Leader */}
          <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-950/10 flex flex-col items-center text-center space-y-3">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-bold">
              ลีดเดอร์ (Slot 1)
            </span>
            {slot1 ? (
              <div className="space-y-2">
                <MonsterAvatar name={slot1.name} size={64} className="rounded-2xl mx-auto shadow-lg" />
                <div className="font-bold text-white text-sm">{slot1.name}</div>
                <div className="text-xs font-mono text-cyan-300">SPD: {slot1.spd} ({slot1.baseSpd}+{slot1.spd - slot1.baseSpd})</div>
                <button
                  onClick={() => setSlot1(null)}
                  className="px-2.5 py-1 text-[11px] rounded bg-white/5 hover:bg-rose-500/20 text-rose-300"
                >
                  ถอดออก
                </button>
              </div>
            ) : (
              <div className="py-6 text-xs text-slate-400">คลิกเลือกมอนสเตอร์ด้านล่าง</div>
            )}
          </div>

          {/* Slot 2 */}
          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col items-center text-center space-y-3">
            <span className="px-2 py-0.5 rounded bg-white/10 text-slate-300 text-xs font-bold">
              สมาชิก (Slot 2)
            </span>
            {slot2 ? (
              <div className="space-y-2">
                <MonsterAvatar name={slot2.name} size={64} className="rounded-2xl mx-auto shadow-lg" />
                <div className="font-bold text-white text-sm">{slot2.name}</div>
                <div className="text-xs font-mono text-cyan-300">SPD: {slot2.spd} ({slot2.baseSpd}+{slot2.spd - slot2.baseSpd})</div>
                <button
                  onClick={() => setSlot2(null)}
                  className="px-2.5 py-1 text-[11px] rounded bg-white/5 hover:bg-rose-500/20 text-rose-300"
                >
                  ถอดออก
                </button>
              </div>
            ) : (
              <div className="py-6 text-xs text-slate-400">คลิกเลือกมอนสเตอร์ด้านล่าง</div>
            )}
          </div>

          {/* Slot 3 */}
          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col items-center text-center space-y-3">
            <span className="px-2 py-0.5 rounded bg-white/10 text-slate-300 text-xs font-bold">
              สมาชิก (Slot 3)
            </span>
            {slot3 ? (
              <div className="space-y-2">
                <MonsterAvatar name={slot3.name} size={64} className="rounded-2xl mx-auto shadow-lg" />
                <div className="font-bold text-white text-sm">{slot3.name}</div>
                <div className="text-xs font-mono text-cyan-300">SPD: {slot3.spd} ({slot3.baseSpd}+{slot3.spd - slot3.baseSpd})</div>
                <button
                  onClick={() => setSlot3(null)}
                  className="px-2.5 py-1 text-[11px] rounded bg-white/5 hover:bg-rose-500/20 text-rose-300"
                >
                  ถอดออก
                </button>
              </div>
            ) : (
              <div className="py-6 text-xs text-slate-400">คลิกเลือกมอนสเตอร์ด้านล่าง</div>
            )}
          </div>
        </div>

        {/* Turn Order Analysis */}
        {turnOrder.length === 3 && (
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
            <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
              ⚡ ลำดับการออกเทิร์นจริง (Combat Turn Order):
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {turnOrder.map((m, idx) => (
                <div key={m.name} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-bold text-white">{m.name}</span>
                  <span className="text-xs font-mono text-cyan-400 font-semibold">{m.spd} SPD</span>
                  {idx < 2 && <ChevronRight className="w-4 h-4 text-slate-500" />}
                </div>
              ))}
            </div>
            <div className="text-xs text-slate-300 pt-1">
              ส่วนต่างสปีดเทิร์น 1 ➔ 2: <strong>{turnOrder[0].spd - turnOrder[1].spd} SPD</strong> | เทิร์น 2 ➔ 3: <strong>{turnOrder[1].spd - turnOrder[2].spd} SPD</strong>
              {turnOrder[0].spd - turnOrder[1].spd <= 10 && turnOrder[1].spd - turnOrder[2].spd <= 10 ? (
                <span className="ml-2 text-emerald-400 font-bold">✓ สปีดจูนชิดกันดีมาก ลดโอกาสโดนแทรกเทิร์น</span>
              ) : (
                <span className="ml-2 text-amber-400 font-bold">⚠️ ช่องว่างสปีดห่างเกิน 10 อาจเสี่ยงโดนศัตรูแทรกเทิร์น</span>
              )}
            </div>
          </div>
        )}

        {/* Monster Selector Palette */}
        <div className="space-y-3 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">คลิกเพื่อใส่มอนสเตอร์ลงช่องที่ว่าง</span>
            <input
              type="text"
              placeholder="ค้นหาชื่อมอนสเตอร์ใน Box..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
            {availableUnits.map((u, idx) => {
              const uKey = u.uid || `${u.masterId}-${idx}`;
              const isPicked = (slot1?.uid || slot1?.masterId) === (u.uid || u.masterId) || 
                               (slot2?.uid || slot2?.masterId) === (u.uid || u.masterId) || 
                               (slot3?.uid || slot3?.masterId) === (u.uid || u.masterId);
              return (
                <button
                  key={uKey}
                  disabled={isPicked}
                  onClick={() => {
                    if (!slot1) setSlot1(u);
                    else if (!slot2) setSlot2(u);
                    else if (!slot3) setSlot3(u);
                  }}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                    isPicked
                      ? 'opacity-30 border-white/5 bg-transparent cursor-not-allowed'
                      : 'border-white/10 bg-white/[0.03] hover:border-cyan-400/50 hover:bg-white/[0.06]'
                  }`}
                >
                  <MonsterAvatar name={u.name} size={44} className="rounded-xl" />
                  <div className="text-[11px] font-bold text-white truncate max-w-full">{u.name}</div>
                  <div className="text-[10px] font-mono text-cyan-300">+{u.spd - u.baseSpd} SPD</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. Artifact Substat Search Engine
// ---------------------------------------------------------------------------

function ArtifactSearchEngine({ box, onNavigate }) {
  const [selectedSubstatPreset, setSelectedSubstatPreset] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('all'); // 'all', '1' (element), '2' (archetype)
  const [selectedElement, setSelectedElement] = useState('all');
  const [selectedArchetype, setSelectedArchetype] = useState('all');
  const [whereFilter, setWhereFilter] = useState('all'); // 'all', 'equipped', 'inventory'
  const [minVal, setMinVal] = useState(0);

  const artifacts = useMemo(() => getArtifactsFromBox(box), [box]);

  const PRESETS = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: '207', label: '⚡ ดาเมจตามสปีด (Add\'l SPD)', statIds: [207], hint: 'Juno, Miles, Dominic, Moore' },
    { id: '302', label: '💥 ดาเมจคริ สกิล 3', statIds: [302], hint: 'Savannah, Lushen, Daphnis, Sonia' },
    { id: 'recovery', label: '🩸 ฟื้นฟูเลือด (Recovery)', statIds: [304, 305, 306], hint: 'Riley, Abellio, Lulu, Ariel' },
    { id: '208', label: '🛡️ ลดดาเมจคริที่ได้รับ', statIds: [208], hint: 'แทงก์ / ตัวแก้ทางบอมบ์ / RTA' },
    { id: '400', label: '🩸 ดูดเลือด (Life Drain)', statIds: [400], hint: 'Douglas, Laika, Chow, Rakan' },
    { id: '403', label: '🎯 คริเป้าหมายเดี่ยว', statIds: [403], hint: 'Sonia, Adriana, Claire, Covenant' },
    { id: '204', label: '🏹 ดาเมจตาม HP', statIds: [204], hint: 'Mo Long, Skogul, Eshir, Karnal' },
    { id: '205', label: '⚔️ ดาเมจตาม ATK', statIds: [205], hint: 'Kaki, Dominic, Seara, Liebli' },
    { id: '206', label: '🛡️ ดาเมจตาม DEF', statIds: [206], hint: 'Tractor, Feng Yan, Copper, Verad' },
    { id: '404', label: '⏱️ ดาเมจคริเทิร์นแรก', statIds: [404], hint: 'ทีมสปีดวันช็อต / Tiana Cleave' },
  ];

  const activePreset = PRESETS.find((p) => p.id === selectedSubstatPreset);

  // Filter artifacts
  const filteredArtifacts = useMemo(() => {
    return artifacts.filter((art) => {
      // Slot filter
      if (selectedSlot === '1' && art.slot !== 1) return false;
      if (selectedSlot === '2' && art.slot !== 2) return false;

      // Element filter (for slot 1)
      if (selectedElement !== 'all' && art.element && art.element.toLowerCase() !== selectedElement) return false;

      // Archetype filter (for slot 2)
      if (selectedArchetype !== 'all' && art.archetype && art.archetype.toLowerCase() !== selectedArchetype.toLowerCase()) return false;

      // Where filter
      if (whereFilter === 'equipped' && (!art.unit || art.unit === 0)) return false;
      if (whereFilter === 'inventory' && art.unit && art.unit !== 0) return false;

      // Preset Substat filter
      if (activePreset && activePreset.statIds) {
        const hasStat = art.subs.some((s) => activePreset.statIds.includes(s[0]) && s[1] >= minVal);
        if (!hasStat) return false;
      }

      // Keyword search
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const hasInEffect = art.subs.some((s) => {
          const name = (ARTIFACT_EFFECT_NAMES[s[0]] || '').toLowerCase();
          return name.includes(q);
        });
        const hasInType = (art.element || '').toLowerCase().includes(q) || (art.archetype || '').toLowerCase().includes(q);
        if (!hasInEffect && !hasInType) return false;
      }

      return true;
    });
  }, [artifacts, selectedSlot, selectedElement, selectedArchetype, whereFilter, activePreset, minVal, searchKeyword]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-teal-500/20 bg-gradient-to-r from-teal-950/60 via-[#0a0f19] to-cyan-950/60 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              ARTIFACT SUBSTAT SEARCH ENGINE
            </div>
            <h2 className="text-2xl font-black text-white">
              ค้นหาอาร์ติแฟกต์ในไอดี <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300">ตามออปชั่นเด็ด</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              ค้นหาอาร์ติแฟกต์ที่มีดาเมจตามสปีด, ดาเมจคริสกิล 3, ดูดเลือด หรือฟื้นฟูเลือด เพื่อเลือกใส่ให้กับตัวละครที่คุณกำลังจะปั้นได้ทันที
            </p>
          </div>
          <div className="flex items-center gap-3 bg-black/40 border border-white/10 p-3 px-4 rounded-2xl">
            <div className="text-center">
              <div className="text-[10px] uppercase font-bold text-teal-400">อาร์ติแฟกต์ในไอดี</div>
              <div className="text-2xl font-black text-white">{artifacts.length} <span className="text-xs text-slate-400">ชิ้น</span></div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-[10px] uppercase font-bold text-cyan-400">ตรงเงื่อนไข</div>
              <div className="text-2xl font-black text-emerald-400">{filteredArtifacts.length} <span className="text-xs text-slate-400">ชิ้น</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Substat Preset Chips */}
      <div className={`${card} p-5 space-y-4`}>
        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          เลือกออปชั่นเด็ดที่ต้องการค้นหา (Substat Presets):
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const isSelected = selectedSubstatPreset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedSubstatPreset(p.id);
                  setMinVal(0);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/25 border border-teal-400'
                    : 'bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] border border-white/10'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Filters Row: Slot, Element, Archetype, Where, Search input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-white/5">
          {/* Search Keyword */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาชื่อออปชั่น / ธาตุ..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
            />
          </div>

          {/* Slot */}
          <div>
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-white/5 border border-white/10 text-slate-200 focus:outline-none"
            >
              <option value="all" className="bg-[#0b101c]">ช่อง: ทั้งหมด (ธาตุ + สาย)</option>
              <option value="1" className="bg-[#0b101c]">ช่องซ้าย: ธาตุ (Element)</option>
              <option value="2" className="bg-[#0b101c]">ช่องขวา: สาย (Archetype)</option>
            </select>
          </div>

          {/* Element */}
          <div>
            <select
              value={selectedElement}
              onChange={(e) => setSelectedElement(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-white/5 border border-white/10 text-slate-200 focus:outline-none"
            >
              <option value="all" className="bg-[#0b101c]">ธาตุ: ทั้งหมด</option>
              <option value="water" className="bg-[#0b101c]">ธาตุน้ำ (Water)</option>
              <option value="fire" className="bg-[#0b101c]">ธาตุไฟ (Fire)</option>
              <option value="wind" className="bg-[#0b101c]">ธาตุลม (Wind)</option>
              <option value="light" className="bg-[#0b101c]">ธาตุแสง (Light)</option>
              <option value="dark" className="bg-[#0b101c]">ธาตุมืด (Dark)</option>
            </select>
          </div>

          {/* Archetype */}
          <div>
            <select
              value={selectedArchetype}
              onChange={(e) => setSelectedArchetype(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-white/5 border border-white/10 text-slate-200 focus:outline-none"
            >
              <option value="all" className="bg-[#0b101c]">สาย: ทั้งหมด</option>
              <option value="attack" className="bg-[#0b101c]">สายโจมตี (Attack)</option>
              <option value="defense" className="bg-[#0b101c]">สายป้องกัน (Defense)</option>
              <option value="hp" className="bg-[#0b101c]">สายเลือด (HP)</option>
              <option value="support" className="bg-[#0b101c]">สายสนับสนุน (Support)</option>
            </select>
          </div>

          {/* Where */}
          <div>
            <select
              value={whereFilter}
              onChange={(e) => setWhereFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-white/5 border border-white/10 text-slate-200 focus:outline-none"
            >
              <option value="all" className="bg-[#0b101c]">ที่อยู่: ทั้งหมด</option>
              <option value="equipped" className="bg-[#0b101c]">ใส่อยู่บนมอนสเตอร์</option>
              <option value="inventory" className="bg-[#0b101c]">ในคลัง (พร้อมใส่)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Artifacts Grid Result */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredArtifacts.map((art) => {
          const isElement = art.slot === 1;
          const label = isElement
            ? `${(art.element || 'fire').toUpperCase()} Artifact (ธาตุ${ELEMENT_TH[art.element] || 'ไฟ'})`
            : `${art.archetype || 'Attack'} Artifact (สาย${art.archetype || 'โจมตี'})`;

          const unitInfo = art.unit ? monsterOf(art.unit) : null;
          const mainStatLabel = art.main[0] === 1 ? `HP +${art.main[1]}` : art.main[0] === 3 ? `ATK +${art.main[1]}` : `DEF +${art.main[1]}`;

          return (
            <div
              key={art.id}
              className="p-4 rounded-2xl bg-[#090e18] border border-white/10 hover:border-teal-500/40 transition-all flex flex-col justify-between space-y-3 shadow-lg"
            >
              <div className="space-y-2">
                {/* Header with SWGT Artifact Icon */}
                <div className="flex items-center gap-3">
                  <ArtifactIcon artifact={art} size={52} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate">{label}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        +15 ★★★★★
                      </span>
                    </div>
                    <div className="text-xs font-mono text-cyan-300 font-bold mt-1 bg-white/[0.02] px-2 py-0.5 rounded border border-white/5 inline-block">
                      Main: {mainStatLabel}
                    </div>
                  </div>
                </div>

                {/* Substats List */}
                <div className="space-y-1.5 pt-1">
                  {art.subs.map((s, sIdx) => {
                    const statId = s[0];
                    const val = s[1];
                    const isHighlighted = activePreset?.statIds?.includes(statId);
                    const effectName = ARTIFACT_EFFECT_NAMES[statId] || `Stat #${statId}`;

                    return (
                      <div
                        key={sIdx}
                        className={`text-xs p-1.5 rounded-lg flex items-center justify-between transition-colors ${
                          isHighlighted
                            ? 'bg-teal-500/20 border border-teal-500/40 text-teal-200 font-bold'
                            : 'bg-white/[0.02] text-slate-300'
                        }`}
                      >
                        <span className="truncate pr-2">{effectName}</span>
                        <span className="font-mono font-bold text-right shrink-0">+{val}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer: Where Equipped */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span className="text-[11px]">สถานะ:</span>
                {unitInfo ? (
                  <div className="flex items-center gap-1.5 text-white font-medium">
                    <MonsterAvatar monster={unitInfo} size="xs" showStars={false} />
                    <span className="truncate max-w-[130px]">{unitInfo.name}</span>
                  </div>
                ) : (
                  <span className="text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded">
                    ✓ ในคลัง (พร้อมใส่)
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filteredArtifacts.length === 0 && (
          <div className="col-span-full py-16 text-center text-xs text-slate-400">
            ไม่พบอาร์ติแฟกต์ตามเงื่อนไขที่เลือก — ลองเปลี่ยนตัวเลือกออปชั่นเด็ด หรือเลือกธาตุ/สายอื่นดูครับ
          </div>
        )}
      </div>
    </div>
  );
}


