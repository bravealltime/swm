import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Upload, Package, Shield, Flame, Trash2, RefreshCw, Search, Lock, ChevronRight, Star, CheckCircle2, XCircle, Compass } from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import allMonstersData from '../data/allMonsters.json';
import guardianMeta from '../data/swrtGuardianMeta.json';
import { buildMonsterIndex, flagFromCountry } from '../data/swrtPlayerAdapter';
import { parseSwexExport, ownedIdSet, loadBox, saveBox, clearBox, baseAwakenedId, BOX_VERSION } from '../utils/swexImport';

const MONSTER_INDEX = buildMonsterIndex(allMonstersData);
const BY_NAME = new Map(allMonstersData.map((m) => [m.name.toLowerCase(), m]));
// The catalog may only hold the 2A (stage 3) or 1A (stage 1) form of a family — try the siblings
const monsterOf = (id) => {
  const n = Number(id);
  if (!n) return null;
  const stage = Math.floor(n / 10) % 10;
  const root = n - stage * 10;
  return MONSTER_INDEX.get(n) || MONSTER_INDEX.get(root + 10) || MONSTER_INDEX.get(root + 30) || MONSTER_INDEX.get(root) || null;
};

const ELEMENT_FILTERS = [
  ['all', 'ทุกธาตุ'], ['water', 'น้ำ'], ['fire', 'ไฟ'], ['wind', 'ลม'], ['light', 'แสง'], ['dark', 'มืด'],
];

export default function MyBoxView({ onNavigate }) {
  const [box, setBox] = useState(() => loadBox());
  const [error, setError] = useState('');
  const [tab, setTab] = useState('box');

  const owned = useMemo(() => ownedIdSet(box), [box]);

  const importFile = async (file) => {
    setError('');
    try {
      const text = await file.text();
      const parsed = parseSwexExport(JSON.parse(text));
      if (!parsed.units.length) throw new Error('ไฟล์นี้ไม่มีมอนสเตอร์เลย');
      saveBox(parsed);
      setBox(parsed);
      setTab('box');
    } catch (err) {
      setError(err.message || 'อ่านไฟล์ไม่สำเร็จ');
    }
  };

  const reset = () => {
    clearBox();
    setBox(null);
  };

  return (
    <div className="space-y-6 max-w-[1780px] 2xl:max-w-[1880px] mx-auto pb-16 animate-in fade-in duration-300">
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#0f2a1a] via-[#090e18] to-[#070b12] p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                กล่องมอนสเตอร์ <span className="bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text text-transparent">ของฉัน</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
                นำเข้าไฟล์ JSON จาก SWEX แล้วดูว่าคุณสร้างทีมแก้ทาง 3MDC สูตรไหนได้ มีมอนเมต้า Guardian ครบแค่ไหน — ประมวลผลในเบราว์เซอร์ทั้งหมด ไม่ส่งไฟล์ขึ้นเซิร์ฟเวอร์
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
        <EmptyState onFile={importFile} />
      ) : (
        <>
          {(box.version || 1) < BOX_VERSION && (
            <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-2">
              <span>ข้อมูลนี้นำเข้าด้วยเวอร์ชันเก่า — นำเข้าไฟล์ใหม่อีกครั้งเพื่อดู SPD รวมรูน, เซ็ตรูน และมอนสเตอร์ที่เพิ่มในสารานุกรม</span>
              <ImportButton onFile={importFile} label="นำเข้าใหม่" icon={RefreshCw} subtle />
            </div>
          )}
          <BoxHeader box={box} onNavigate={onNavigate} />

          <div role="tablist" className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-[#0a0f19]/80 border border-white/[0.08] shadow-lg">
            {[
              { id: 'box', label: `มอนสเตอร์ของฉัน (${box.units.length})`, icon: Package, color: 'bg-emerald-600 shadow-emerald-600/25' },
              { id: 'mdc', label: 'ทีมแก้ทาง 3MDC ที่สร้างได้', icon: Shield, color: 'bg-blue-600 shadow-blue-600/25' },
              { id: 'meta', label: 'มอนเมต้า Guardian ที่มี/ขาด', icon: Flame, color: 'bg-rose-600 shadow-rose-600/25' },
              { id: 'abyss', label: 'ทีม Abyss ที่สร้างได้', icon: Compass, color: 'bg-purple-600 shadow-purple-600/25' },
            ].map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button key={t.id} role="tab" aria-selected={active} onClick={() => setTab(t.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${active ? `${t.color} text-white shadow-lg` : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'}`}>
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              );
            })}
          </div>

          {tab === 'box' && <BoxGrid box={box} onNavigate={onNavigate} />}
          {tab === 'mdc' && <MdcTeams owned={owned} onNavigate={onNavigate} />}
          {tab === 'meta' && <MetaCoverage owned={owned} />}
          {tab === 'abyss' && <AbyssTeams owned={owned} onNavigate={onNavigate} />}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function ImportButton({ onFile, label, icon: Icon = Upload, subtle = false }) {
  const inputRef = useRef(null);
  return (
    <>
      <input ref={inputRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
      <button
        onClick={() => inputRef.current?.click()}
        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer ${
          subtle ? 'bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
        }`}
      >
        <Icon className="w-4 h-4" /> {label}
      </button>
    </>
  );
}

function EmptyState({ onFile }) {
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
      <ImportButton onFile={onFile} label="เลือกไฟล์ JSON" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left pt-4 max-w-4xl mx-auto">
        {[
          ['1', 'ติดตั้ง SWEX', 'Summoners War Exporter (Windows/Mac) แล้วเปิดคู่กับเกมผ่าน proxy ตามคู่มือหน้า AegisLink'],
          ['2', 'Export โปรไฟล์', 'ในเกมเข้า Login หน้าแรก 1 ครั้ง SWEX จะสร้างไฟล์ JSON ให้ในโฟลเดอร์ Files'],
          ['3', 'นำเข้าที่นี่', 'ไฟล์ถูกอ่านในเบราว์เซอร์ของคุณเท่านั้น เก็บเฉพาะรายชื่อมอนสเตอร์และค่าสเตตัสไว้ในเครื่อง'],
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
  const nat5 = box.units.filter((u) => { const m = monsterOf(baseAwakenedId(u.masterId)); return (m?.stars || 0) >= 5; }).length;
  const six = box.units.filter((u) => u.stars === 6).length;
  const fastest = [...box.units].sort((a, b) => b.spd - a.spd)[0];
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-[#0a0f19]/90 p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          ['มอนสเตอร์', box.units.length, 'text-white'],
          ['เนเชอรัล 5★', nat5, 'text-amber-300'],
          ['ระดับ 6★', six, 'text-emerald-300'],
        ].map(([label, value, color]) => (
          <div key={label} className="px-4 py-2.5 rounded-xl bg-[#0a0f18] border border-slate-800 min-w-[90px]">
            <div className="text-[11px] text-slate-400">{label}</div>
            <div className={`text-xl font-black font-mono ${color}`}>{value}</div>
          </div>
        ))}
      </div>
      <button
        onClick={() => onNavigate('player-tracker', { initialPlayer: box.wizard.name })}
        className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shrink-0"
        title={fastest ? `มอนเร็วสุดของคุณ: ${monsterOf(fastest.masterId)?.name || fastest.masterId} (${fastest.spd} SPD)` : ''}
      >
        <Search className="w-4 h-4" /> ดูสถิติ RTA ของฉัน <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

const SORTS = [['spd', 'SPD'], ['hp', 'HP'], ['atk', 'ATK'], ['def', 'DEF'], ['stars', 'ดาว/เลเวล']];

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
    const key = sort === 'stars' ? null : sort;
    return list.sort((a, b) => (key ? (b[key] || 0) - (a[key] || 0) : b.stars - a.stars || b.level - a.level || b.spd - a.spd));
  }, [box, element, minStars, query, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 bg-[#0a0f19]/80 border border-white/[0.08] rounded-2xl p-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {ELEMENT_FILTERS.map(([id, label]) => (
            <button key={id} onClick={() => setElement(id)} className={`px-2.5 py-1.5 rounded-lg font-bold cursor-pointer ${element === id ? 'bg-emerald-600 text-white' : 'bg-white/[0.04] text-slate-300 hover:text-white'}`}>{label}</button>
          ))}
          <span className="text-slate-500 mx-1">|</span>
          {SORTS.map(([id, label]) => (
            <button key={id} onClick={() => setSort(id)} className={`px-2.5 py-1.5 rounded-lg font-bold cursor-pointer ${sort === id ? 'bg-cyan-600 text-white' : 'bg-white/[0.04] text-slate-300 hover:text-white'}`}>{label}</button>
          ))}
          <span className="text-slate-500 mx-1">|</span>
          {[6, 5, 4, 1].map((n) => (
            <button key={n} onClick={() => setMinStars(n)} className={`px-2.5 py-1.5 rounded-lg font-bold cursor-pointer ${minStars === n ? 'bg-amber-500 text-slate-950' : 'bg-white/[0.04] text-slate-300 hover:text-white'}`}>{n === 1 ? 'ทุกดาว' : `${n}★ ขึ้นไป`}</button>
          ))}
        </div>
        <div className="relative lg:ml-auto lg:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาชื่อมอนสเตอร์..." className="w-full bg-[#0d1422] border border-white/10 focus:border-emerald-400 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none" />
        </div>
      </div>

      <div className="text-xs text-slate-400">แสดง {rows.length} จาก {box.units.length} ตัว</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2">
        {rows.map((u, i) => (
          <button
            key={`${u.masterId}-${i}`}
            onClick={() => u.info && onNavigate('where2use', { initialMonster: u.info.name })}
            title={u.info ? `ดูว่า ${u.info.name} ใช้ที่ไหนได้บ้าง` : `ไม่พบ #${u.masterId} ในสารานุกรม`}
            className="p-3 rounded-2xl bg-[#0a0f19]/80 border border-white/[0.06] hover:border-emerald-500/40 flex items-center gap-3 text-left cursor-pointer"
          >
            {u.info ? <MonsterAvatar monster={u.info} size="sm" showStars={false} /> : <div className="w-11 h-11 rounded-xl bg-slate-800 shrink-0" />}
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">{u.info?.name || `#${u.masterId}`}</div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {u.stars}★ · Lv.{u.level}</div>
              <div className="text-[11px] font-mono text-cyan-300" title={u.baseSpd ? `พื้นฐาน ${u.baseSpd}` : ''}>
                SPD {u.spd}{u.sets?.length ? <span className="text-slate-400"> · {u.sets.join('/')}</span> : u.runes ? <span className="text-slate-400"> · {u.runes} รูน</span> : null}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function MdcTeams({ owned, onNavigate }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let alive = true;
    import('../data/allMdcData.json').then((m) => { if (alive) setData(m.default); });
    return () => { alive = false; };
  }, []);

  const result = useMemo(() => {
    if (!data) return null;
    let totalCounters = 0;
    const defenses = data.map((def) => {
      const counters = def.counters || [];
      totalCounters += counters.length;
      const buildable = counters.filter((c) => (c.monsters || []).length > 0 && c.monsters.every((m) => owned.has(Number(m.com2usId))));
      return { def, buildable, total: counters.length };
    });
    const buildableTotal = defenses.reduce((s, d) => s + d.buildable.length, 0);
    // Counters missing exactly one monster: which single summon unlocks the most recipes?
    const unlocks = new Map();
    for (const def of data) {
      for (const c of def.counters || []) {
        const missing = (c.monsters || []).filter((m) => !owned.has(Number(m.com2usId)));
        if (missing.length === 1) {
          const id = Number(missing[0].com2usId);
          const e = unlocks.get(id) || { id, n: 0, name: missing[0].name };
          e.n += 1;
          unlocks.set(id, e);
        }
      }
    }
    const nextSummons = [...unlocks.values()].sort((a, b) => b.n - a.n).slice(0, 8).map((e) => ({ ...e, info: monsterOf(e.id) }));
    return { defenses: defenses.sort((a, b) => b.buildable.length - a.buildable.length), totalCounters, buildableTotal, nextSummons };
  }, [data, owned]);

  if (!result) return <div className="p-12 text-center text-slate-400 text-sm" role="status">กำลังตรวจสอบสูตรแก้ทาง 3MDC กับกล่องของคุณ...</div>;

  const covered = result.defenses.filter((d) => d.buildable.length > 0).length;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          ['สูตรแก้ทางที่สร้างได้', `${result.buildableTotal.toLocaleString()} / ${result.totalCounters.toLocaleString()}`, 'text-emerald-300'],
          ['ทีมตั้งรับที่คุณแก้ได้', `${covered} / ${result.defenses.length}`, 'text-blue-300'],
          ['ครอบคลุม', `${result.defenses.length ? Math.round((covered / result.defenses.length) * 100) : 0}%`, 'text-amber-300'],
        ].map(([label, value, color]) => (
          <div key={label} className="p-4 rounded-2xl bg-[#0a0f19]/80 border border-white/[0.08]">
            <div className="text-xs text-slate-400">{label}</div>
            <div className={`text-2xl font-black font-mono mt-1 ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {result.nextSummons.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20">
          <div className="text-sm font-bold text-white">ได้ตัวไหนเพิ่ม ปลดล็อกสูตรได้มากสุด</div>
          <div className="text-[11px] text-slate-400 mb-3">นับสูตรที่คุณขาดมอนสเตอร์แค่ตัวเดียว</div>
          <div className="flex flex-wrap gap-2">
            {result.nextSummons.map((m) => (
              <div key={m.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#0a0f19]/80 border border-white/[0.08]">
                {m.info ? <MonsterAvatar monster={m.info} size="xs" showStars={false} /> : null}
                <div className="text-[11px]"><div className="font-bold text-white">{m.info?.name || m.name}</div><div className="text-amber-300 font-mono">+{m.n} สูตร</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {result.defenses.map(({ def, buildable, total }) => (
          <div key={def.id} className={`p-4 rounded-2xl border ${buildable.length ? 'bg-[#0a0f19]/80 border-white/[0.08]' : 'bg-[#0a0f19]/40 border-white/[0.04] opacity-60'}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {(def.defenseMonsters || []).map((m, i) => <MonsterAvatar key={i} monster={m} size="xs" showStars={false} />)}
                </div>
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
                <button onClick={() => onNavigate('3mdc', { search: def.title })} className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer">
                  เปิดใน 3MDC <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            {buildable.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {buildable.slice(0, 4).map((c) => (
                  <div key={c.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
                    <div className="flex items-center gap-1">{c.monsters.map((m, i) => <MonsterAvatar key={i} monster={m} size="xs" showStars={false} />)}</div>
                    <div className="text-[11px]">
                      <div className="font-bold text-white">{c.title}</div>
                      <div className="text-slate-400 font-mono">★ {Number(c.rating).toFixed(1)}</div>
                    </div>
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

function MetaCoverage({ owned }) {
  const sides = guardianMeta.meta?.replaySides || 0;
  const top = (guardianMeta.monsters || []).slice(0, 40).map((m) => ({ ...m, info: monsterOf(m.id), have: owned.has(Number(m.id)), pickRate: sides ? +((m.picks / sides) * 100).toFixed(1) : 0 }));
  const have = top.filter((m) => m.have).length;
  if (!top.length) return <div className="p-12 text-center text-slate-400 text-sm">ยังไม่มีข้อมูลเมต้า Guardian</div>;
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-[#0a0f19]/80 border border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
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
      const clean = pm.name.replace(/\s*\(.*\)$/, '').toLowerCase();
      const info = BY_NAME.get(clean) || BY_NAME.get(pm.name.toLowerCase());
      return { ...pm, info, have: info ? owned.has(Number(info.com2usId)) : false };
    });
    const have = mons.filter((m) => m.have).length;
    return { d, mons, have };
  }).sort((a, b) => (b.have / (b.mons.length || 1)) - (a.have / (a.mons.length || 1)));

  return (
    <div className="space-y-2">
      {rows.map(({ d, mons, have }) => (
        <div key={d.id} className="p-4 rounded-2xl bg-[#0a0f19]/80 border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-3">
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
