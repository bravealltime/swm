import React, { useState, useEffect } from 'react';
import {
  Download, Copy, Check, Terminal, ShieldCheck, Zap, RefreshCw, Radio, ArrowRight, Code2, FileText,
  Lock, Layers, AlertCircle, Database, Plug, Pause, Package, Castle, Wifi, WifiOff,
} from 'lucide-react';
import * as aegisLive from '../services/aegisLive';
import PLUGIN_INDEX_JS from '../../plugins/aegislink/index.js?raw';
import PLUGIN_PACKAGE_JSON from '../../plugins/aegislink/package.json?raw';

const PLUGIN_VERSION = (PLUGIN_INDEX_JS.match(/const version = '([^']+)'/) || [])[1] || '2.0.0';

const FILES = {
  'index.js': PLUGIN_INDEX_JS,
  'package.json': PLUGIN_PACKAGE_JSON,
};

function downloadText(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const time = (ms) => new Date(ms).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export default function PluginCompanionView({ onNavigate }) {
  const [live, setLive] = useState(() => ({ ...aegisLive.getState() }));
  useEffect(() => aegisLive.subscribe((type, _payload, st) => { if (type === 'state' || type === 'box' || type === 'guild') setLive({ ...st }); }), []);

  const [activeFile, setActiveFile] = useState('index.js');
  const [copied, setCopied] = useState('');
  const [port, setPort] = useState(() => aegisLive.getPort());
  const [probe, setProbe] = useState(null); // { ok, text }

  const copy = (name) => {
    navigator.clipboard?.writeText(FILES[name]);
    setCopied(name);
    setTimeout(() => setCopied(''), 1800);
  };

  const testConnection = async () => {
    aegisLive.setPort(port);
    setProbe({ ok: null, text: 'กำลังทดสอบ…' });
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(`${aegisLive.baseUrl()}/status`, { cache: 'no-store', signal: ctrl.signal });
      clearTimeout(t);
      const j = await res.json();
      setProbe({ ok: true, text: `พบ ${j.plugin} v${j.version} • ${j.hasSnapshot ? `กล่องของ ${j.wizard?.name} (${j.units} ตัว)` : 'ยังไม่มีกล่อง — เข้าเกมสักครั้ง'} • แพ็กเก็ตกิลด์ ${j.guildCommands?.length || 0} ชนิด` });
    } catch {
      setProbe({ ok: false, text: `ติดต่อ 127.0.0.1:${port} ไม่ได้ — เปิด SWEX, เปิดใช้ AegisLink ในแท็บ Plugins แล้วดูว่า log ขึ้น "live server ready" (ถ้าเบราว์เซอร์ถามสิทธิ์เครือข่ายในเครื่อง ให้กดอนุญาต)` });
    }
  };

  const isLive = live.status === 'live';
  const statusTone = isLive ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' : live.status === 'connecting' ? 'text-amber-200 bg-amber-500/10 border-amber-500/30' : live.status === 'error' ? 'text-rose-200 bg-rose-500/10 border-rose-500/30' : 'text-slate-300 bg-white/5 border-white/10';

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1c2738] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">SWEX plugin • real-time link</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1 flex items-center gap-3">
            <span>🛡️ ปลั๊กอิน AegisLink</span>
            <span className="text-xs font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2.5 py-0.5 rounded-full">v{PLUGIN_VERSION}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            ติดตั้งครั้งเดียวใน Summoners War Exporter แล้วเว็บ SWM จะเห็นกล่องมอนสเตอร์ รูน อาร์ติแฟกต์ และข้อมูลกิลด์/Siege ของคุณ <strong className="text-white">แบบเรียลไทม์</strong> — เปลี่ยนรูนในเกม หน้าเว็บขยับตามทันที ไม่ต้อง export ไฟล์ JSON อีก
          </p>
        </div>

        <div className={`border px-4 py-3 rounded-xl flex items-center gap-3 self-start lg:self-center ${statusTone}`}>
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-black/30 border border-white/10">
            {isLive ? <Wifi className="w-4 h-4 animate-pulse" /> : <WifiOff className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] uppercase font-mono tracking-wider opacity-70">สถานะการเชื่อมต่อ</div>
            <div className="text-xs sm:text-sm font-bold">
              {isLive ? (live.wizard ? `LIVE • ${live.wizard.name} (${live.units} ตัว)` : 'LIVE • รอเข้าเกมเพื่อรับกล่อง') : live.status === 'connecting' ? 'กำลังหาปลั๊กอิน…' : live.status === 'error' ? 'ไม่พบปลั๊กอิน' : 'ยังไม่ได้เชื่อมต่อ'}
            </div>
          </div>
          {live.status === 'off' || live.status === 'error' ? (
            <button onClick={() => { if (live.status === 'error') aegisLive.stop(); aegisLive.start(); }} className="ml-2 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"><Radio className="w-3.5 h-3.5" /> เชื่อมต่อ</button>
          ) : (
            <button onClick={() => aegisLive.stop()} className="ml-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"><Pause className="w-3.5 h-3.5" /> ตัด</button>
          )}
        </div>
      </div>

      {/* data flow */}
      <div className="bg-[#111927] border border-[#1e2a3c] p-4 sm:p-5 rounded-xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-3"><Layers className="w-4 h-4 text-cyan-400" /> ข้อมูลวิ่งอย่างไร (ทั้งหมดอยู่ในเครื่องคุณ)</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ['1', '📱 เกม Summoners War', 'เล่นตามปกติ ผ่าน proxy ของ SWEX (มือถือ/อีมูเลเตอร์)', 'text-cyan-400'],
            ['2', '🧩 SWEX + AegisLink', 'ปลั๊กอินอ่านแพ็กเก็ต: กล่องตอนล็อกอิน, ทุกการเปลี่ยนรูน/อาร์ติแฟกต์, หน้ากิลด์/Siege', 'text-cyan-300'],
            ['3', '🔌 เซิร์ฟเวอร์ในเครื่อง', 'ปลั๊กอินเปิด http://127.0.0.1:7391 ให้เฉพาะเว็บ SWM และ localhost อ่านได้ ไม่ส่งออกอินเทอร์เน็ต', 'text-indigo-300'],
            ['4', '🌐 เว็บ SWM ในเบราว์เซอร์', 'รับสตรีมเหตุการณ์ (SSE) แล้วอัปเดตกล่องของฉันและห้องบัญชาการกิลด์ทันที', 'text-emerald-400'],
          ].map(([n, title, desc, tone], i) => (
            <div key={n} className="bg-[#152030] border border-[#22334a] p-3.5 rounded-xl relative">
              <div className={`text-[11px] font-mono ${tone}`}>STEP {n}</div>
              <div className="text-sm font-bold text-white mt-1">{title}</div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{desc}</p>
              {i < 3 && <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* left: install + console */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#111927] border border-[#1e2a3c] p-4 sm:p-5 rounded-xl space-y-4">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2"><Plug className="w-4 h-4 text-cyan-400" /> ติดตั้ง 5 ขั้นตอน</h2>
            <ol className="space-y-2.5 text-sm text-slate-300">
              {[
                <>ดาวน์โหลด <code className="text-cyan-300">index.js</code> และ <code className="text-cyan-300">package.json</code> จากกล่องด้านขวา (หรือคัดลอกโค้ด)</>,
                <>เปิดโฟลเดอร์ปลั๊กอินของ SWEX: <code className="text-slate-200">%USERPROFILE%\Documents\Summoners War Exporter Files\plugins\</code> (หรือกด <strong>Open plugins folder</strong> ในแท็บ Plugins ของ SWEX) แล้วสร้างโฟลเดอร์ <code className="text-cyan-300">aegislink</code> วางไฟล์ทั้งสองลงไป</>,
                <>ปิด-เปิด SWEX ใหม่ → แท็บ <strong>Plugins</strong> → เปิด <strong>AegisLink</strong> (ค่าเริ่มต้นใช้พอร์ต 7391) ดู log ต้องขึ้น <span className="font-mono text-emerald-300">live server ready</span></>,
                <>กลับมาที่เว็บ กด <strong className="text-cyan-300">เชื่อมต่อ</strong> (มุมขวาบน หรือที่หน้า "กล่องของฉัน") — ถ้า Chrome/Edge ถามสิทธิ์ "เข้าถึงอุปกรณ์ในเครือข่ายในเครื่อง" ให้กด <strong>อนุญาต</strong></>,
                <>เข้าเกมผ่าน SWEX 1 ครั้ง (หน้า Login) ปลั๊กอินจะส่งกล่องทั้งหมดมาให้ จากนั้นทุกการอัปเกรด/ใส่/ขายรูน และการเปิดหน้ากิลด์/Siege จะอัปเดตทันที</>,
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 w-6 h-6 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-200 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-2 pt-1">
              <button onClick={() => onNavigate?.('my-box')} className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"><Package className="w-4 h-4" /> ไปหน้ากล่องของฉัน</button>
              <button onClick={() => onNavigate?.('guild-war-room')} className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"><Castle className="w-4 h-4" /> ห้องบัญชาการกิลด์</button>
            </div>
          </div>

          {/* live console */}
          <div className="bg-[#0b111c] border border-[#1e2a3c] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2a3c] bg-[#111927]">
              <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2"><Terminal className="w-4 h-4 text-emerald-400" /> เหตุการณ์ล่าสุดจากปลั๊กอิน</span>
              <span className="text-[11px] text-slate-500 font-mono">seq {live.seq} • {live.events} เหตุการณ์</span>
            </div>
            <div className="p-3 font-mono text-[11px] space-y-1.5 max-h-[280px] overflow-y-auto">
              {live.recent.length === 0 ? (
                <div className="text-slate-500 py-6 text-center">ยังไม่มีเหตุการณ์ — กดเชื่อมต่อแล้วเข้าเกม</div>
              ) : live.recent.map((e, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-slate-500 shrink-0">{time(e.at)}</span>
                  <span className={`shrink-0 w-12 ${e.kind === 'error' ? 'text-rose-400' : e.kind === 'guild' ? 'text-amber-300' : e.kind === 'box' ? 'text-emerald-300' : 'text-cyan-300'}`}>{e.kind.toUpperCase()}</span>
                  <span className="text-slate-300 break-all">{e.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#111927] border border-[#1e2a3c] p-4 sm:p-5 rounded-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3"><Database className="w-4 h-4 text-indigo-400" /> ปลั๊กอินส่งอะไรมาบ้าง</h3>
            <div className="grid sm:grid-cols-2 gap-2 text-xs text-slate-300">
              {[
                ['📦 กล่องทั้งหมดตอนล็อกอิน', 'HubUserLogin → มอนสเตอร์ รูน อาร์ติแฟกต์ ทุกชิ้น'],
                ['💎 ทุกการเปลี่ยนรูน/อาร์ติแฟกต์', 'อัปเกรด ใส่ ถอด ขาย เจียร/ใส่หินแปลง ตีค่าใหม่ — ส่งเฉพาะชิ้นที่เปลี่ยน'],
                ['🐉 การเปลี่ยนมอนสเตอร์', 'ตื่นตัว/ตื่นสอง อัปดาว เลเวล ขาย/บูชา'],
                ['🏰 กิลด์ & Siege', 'ข้อมูลกิลด์ สมาชิก แมตช์ Siege ป้อม ทีมตั้งรับ ผลการรบ (ส่งเมื่อคุณเปิดหน้านั้นในเกม)'],
                ['🌍 World Guild Battle', 'แมตช์และผลการรบ'],
                ['🔒 ไม่ส่ง', 'รหัสผ่าน โทเค็น ข้อมูลชำระเงิน — ปลั๊กอินอ่านเฉพาะแพ็กเก็ตข้อมูลเกม'],
              ].map(([t, d]) => (
                <div key={t} className="p-2.5 rounded-lg bg-[#162232] border border-[#213045]"><div className="font-bold text-white">{t}</div><div className="text-slate-400 mt-0.5">{d}</div></div>
              ))}
            </div>
          </div>
        </div>

        {/* right: files + settings */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#111927] border border-[#1e2a3c] p-4 sm:p-5 rounded-xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5"><Code2 className="w-3.5 h-3.5 text-cyan-400" /> ไฟล์ปลั๊กอิน</span>
              <button onClick={() => { downloadText('index.js', FILES['index.js']); downloadText('package.json', FILES['package.json']); }} className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"><Download className="w-3.5 h-3.5" /> ดาวน์โหลดทั้ง 2 ไฟล์</button>
            </div>
            <div className="flex items-center gap-1 border-b border-[#1c2738]">
              {Object.keys(FILES).map((name) => (
                <button key={name} onClick={() => setActiveFile(name)} className={`px-3 py-1.5 text-xs font-mono rounded-t-lg cursor-pointer ${activeFile === name ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>{name}</button>
              ))}
              <div className="ml-auto flex items-center gap-1 pb-1">
                <button onClick={() => copy(activeFile)} className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-white text-[11px] rounded font-mono flex items-center gap-1 border border-slate-600 cursor-pointer">
                  {copied === activeFile ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />} {copied === activeFile ? 'คัดลอกแล้ว' : 'คัดลอก'}
                </button>
                <button onClick={() => downloadText(activeFile, FILES[activeFile])} className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-white text-[11px] rounded font-mono flex items-center gap-1 border border-slate-600 cursor-pointer"><Download className="w-3 h-3" /> ดาวน์โหลด</button>
              </div>
            </div>
            <pre className="bg-[#0b111c] border border-[#1c2738] rounded-lg p-3 text-[10.5px] leading-relaxed text-slate-300 font-mono max-h-[360px] overflow-auto whitespace-pre">{FILES[activeFile]}</pre>
          </div>

          <div className="bg-[#111927] border border-[#1e2a3c] p-4 sm:p-5 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-400" /> การเชื่อมต่อ</h3>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <span className="shrink-0">พอร์ตปลั๊กอิน</span>
              <input type="number" min="1024" max="65535" value={port} onChange={(e) => setPort(Number(e.target.value) || aegisLive.DEFAULT_PORT)} className="w-24 bg-[#162232] border border-[#233348] rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-300" />
              <span className="text-slate-500">(ต้องตรงกับ livePort ในการตั้งค่าปลั๊กอิน)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button onClick={testConnection} className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"><RefreshCw className="w-3.5 h-3.5" /> ทดสอบการเชื่อมต่อ</button>
              {live.status === 'off' || live.status === 'error' ? (
                <button onClick={() => { aegisLive.setPort(port); if (live.status === 'error') aegisLive.stop(); aegisLive.start(); }} className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"><Radio className="w-3.5 h-3.5" /> เชื่อมต่อและจำไว้</button>
              ) : null}
            </div>
            {probe && (
              <div className={`text-xs p-2.5 rounded-lg border flex items-start gap-2 ${probe.ok === true ? 'text-emerald-200 bg-emerald-500/10 border-emerald-500/30' : probe.ok === false ? 'text-rose-200 bg-rose-500/10 border-rose-500/30' : 'text-slate-300 bg-white/5 border-white/10'}`}>
                {probe.ok === false ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />} <span>{probe.text}</span>
              </div>
            )}
            <p className="text-[11px] text-slate-500 flex items-start gap-1.5"><Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" /> ปลั๊กอินรับการเชื่อมต่อจาก 127.0.0.1 เท่านั้น และตอบเฉพาะเว็บ SWM / localhost (ตรวจ Origin) เว็บอื่นที่เปิดอยู่จะอ่านข้อมูลไม่ได้ ไม่มีการอัปโหลดขึ้นเซิร์ฟเวอร์ใด ๆ</p>
          </div>

          <div className="bg-[#111927] border border-[#1e2a3c] p-4 sm:p-5 rounded-xl space-y-2 text-xs text-slate-400">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> แก้ปัญหาที่พบบ่อย</h3>
            <ul className="space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>ไม่พบปลั๊กอิน: ดู log ของ SWEX ว่ามี "live server ready" ถ้าไม่มี ให้ตรวจว่าโฟลเดอร์คือ <code>plugins/aegislink/index.js</code> แล้วรีสตาร์ต SWEX</li>
              <li>พอร์ตชน (EADDRINUSE): เปลี่ยน <code>livePort</code> ในปลั๊กอิน แล้วใส่พอร์ตเดียวกันด้านบน</li>
              <li>เชื่อมต่อได้แต่กล่องว่าง: ต้องเข้าเกมผ่าน SWEX 1 ครั้งหลังเปิดปลั๊กอิน (หน้า Login ส่งกล่องทั้งหมด)</li>
              <li>ข้อมูลกิลด์ไม่มา: ปลั๊กอินจะได้รับเมื่อคุณเปิดหน้ากิลด์ / แผนที่ Siege / บันทึกการรบในเกม</li>
              <li>Firefox/Safari: ใช้ Chrome หรือ Edge — เบราว์เซอร์อื่นอาจบล็อกการเชื่อมต่อจากเว็บ https ไป 127.0.0.1</li>
            </ul>
            <p className="pt-1 text-slate-500 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> ปลั๊กอินเป็นโค้ดเปิด อ่านได้ทั้งหมดในกล่องด้านบน</p>
          </div>
        </div>
      </div>
    </div>
  );
}
