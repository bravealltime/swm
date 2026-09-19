import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, RefreshCw, Activity, Database, Settings, Bot, PlayCircle, AlertTriangle, CheckCircle2, XCircle,
  Server, Cloud, GitBranch, Megaphone, Wrench, Radio, Lock, ExternalLink, Save, Loader2, Clock, Users, Zap, Trophy, ShieldOff, Trash2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { adminFetch } from '../services/adminClient';
import * as aegisLive from '../services/aegisLive';

const card = 'rounded-2xl border border-white/[0.08] bg-[#0a0f19]/80';
const fmtTime = (iso) => (iso ? new Date(iso).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '-');
const ago = (iso) => {
  if (!iso) return '-';
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'เมื่อกี้';
  if (m < 60) return `${m} นาทีที่แล้ว`;
  if (m < 60 * 48) return `${Math.round(m / 60)} ชม.ที่แล้ว`;
  return `${Math.round(m / 1440)} วันที่แล้ว`;
};
const kb = (b) => (b ? `${(b / 1024).toFixed(0)} KB` : '-');

const TABS = [
  { id: 'overview', label: 'ภาพรวม', icon: Activity },
  { id: 'ai', label: 'โค้ช AI', icon: Bot },
  { id: 'data', label: 'ข้อมูล', icon: Database },
  { id: 'settings', label: 'ตั้งค่าเว็บ', icon: Settings },
  { id: 'guilds', label: 'อันดับกิลด์', icon: Trophy },
  { id: 'jobs', label: 'งานอัตโนมัติ', icon: PlayCircle },
  { id: 'live', label: 'ข้อมูลสด & โค้ด', icon: Radio },
];

function Dot({ ok, warn }) {
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${ok ? 'bg-emerald-400' : warn ? 'bg-amber-400' : 'bg-rose-400'} shadow-[0_0_8px_currentColor]`} />;
}

function Stat({ label, value, sub, tone = 'text-white' }) {
  return (
    <div className={`${card} p-4`}>
      <div className="text-[11px] text-slate-400 font-semibold">{label}</div>
      <div className={`text-2xl font-black mt-1 ${tone}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function Health({ icon: Icon, title, ok, warn, lines = [], action }) {
  return (
    <div className={`${card} p-4 flex items-start gap-3`}>
      <div className={`p-2 rounded-xl border shrink-0 ${ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : warn ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}><Icon className="w-4 h-4" /></div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-white flex items-center gap-2"><Dot ok={ok} warn={warn} /> {title}</div>
        <ul className="text-xs text-slate-400 mt-1 space-y-0.5">{lines.filter(Boolean).map((l, i) => <li key={i} className="truncate">{l}</li>)}</ul>
        {action}
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] cursor-pointer">
      <div><div className="text-sm text-white font-semibold">{label}</div>{hint && <div className="text-[11px] text-slate-500">{hint}</div>}</div>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`w-11 h-6 rounded-full relative transition-colors shrink-0 cursor-pointer ${checked ? 'bg-emerald-500' : 'bg-slate-600'}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </label>
  );
}

export default function AdminView({ onNavigate, onOpenAuth }) {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState('overview');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(null); // { status, message }

  const load = useCallback(async () => {
    setBusy(true); setError(''); setDenied(null);
    try {
      setStatus(await adminFetch('status'));
    } catch (err) {
      if (err.status === 401 || err.status === 403 || err.status === 503) setDenied({ status: err.status, message: err.message });
      else setError(err.message);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { if (!authLoading) load(); }, [authLoading, user?.id, load]);

  if (authLoading) return <div className="py-24 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  if (denied || (!user && !status)) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-center"><Lock className="w-7 h-7" /></div>
        <h1 className="text-2xl font-black text-white">หลังบ้าน SWM</h1>
        <p className="text-sm text-slate-400">{denied?.message || 'ต้องเข้าสู่ระบบด้วยบัญชีผู้ดูแลก่อน'}</p>
        {denied?.status === 403 && (
          <div className="text-left text-xs text-slate-300 bg-white/[0.03] border border-white/10 rounded-xl p-4">
            ผู้ดูแลคือ <code className="text-amber-300">pedictu@gmail.com</code> (เพิ่มคนอื่นได้ด้วย <code>ADMIN_EMAILS</code> ใน Vercel) — เข้าสู่ระบบด้วยอีเมลนั้นแล้วลองใหม่
          </div>
        )}
        <div className="flex items-center justify-center gap-2">
          {!user && <button onClick={() => onOpenAuth?.()} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold cursor-pointer">เข้าสู่ระบบ</button>}
          <button onClick={load} className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200 text-sm font-bold cursor-pointer flex items-center gap-2"><RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} /> ลองใหม่</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-[1500px] mx-auto pb-16 animate-in fade-in duration-300">
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#1a1330] via-[#0b0f1c] to-[#070b12] p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300"><ShieldCheck className="w-6 h-6" /></div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">หลังบ้าน <span className="bg-gradient-to-r from-fuchsia-300 to-amber-200 bg-clip-text text-transparent">SWM Control</span></h1>
              <p className="text-sm text-slate-400 mt-1">ผู้ดูแล {status?.admin?.email} • ตรวจสถานะระบบ AI ข้อมูล ผู้ใช้ ตั้งค่าประกาศ และสั่งงานอัตโนมัติจากที่เดียว</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">อัปเดต {status ? fmtTime(status.now) : '-'}</span>
            <button onClick={load} disabled={busy} className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200 text-xs font-bold cursor-pointer flex items-center gap-1.5"><RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} /> รีเฟรช</button>
          </div>
        </div>
      </div>

      {error && <div role="alert" className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/5 text-xs text-rose-200 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</div>}

      <div role="tablist" className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-[#0a0f19]/80 border border-white/[0.08]">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer ${tab === t.id ? 'bg-fuchsia-600 text-white shadow-lg' : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {!status ? (
        <div className="py-16 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : (
        <>
          {tab === 'overview' && <Overview status={status} onTab={setTab} />}
          {tab === 'ai' && <AiPanel status={status} />}
          {tab === 'data' && <DataPanel status={status} onNavigate={onNavigate} />}
          {tab === 'settings' && <SettingsPanel status={status} onSaved={load} />}
          {tab === 'guilds' && <GuildRankingsPanel />}
          {tab === 'jobs' && <JobsPanel status={status} />}
          {tab === 'live' && <LivePanel />}
        </>
      )}
    </div>
  );
}

function Overview({ status, onTab }) {
  const { ai, supabase, data, deploy, github, settings } = status;
  const s = ai.stats?.last24h;
  const live = aegisLive.getState();
  const playersAge = data.players?.fetchedAt ? (new Date(status.now).getTime() - new Date(data.players.fetchedAt).getTime()) / 3600000 : null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="คำถาม AI (24 ชม.)" value={s ? s.calls : '-'} sub={s ? `ผิดพลาด ${s.errors} • เฉลี่ย ${(s.avgMs / 1000).toFixed(1)} วิ` : ai.stats?.error === 'TABLE_MISSING' ? 'ยังไม่ได้สร้างตาราง ai_logs' : ai.stats?.error || ''} tone="text-amber-300" />
        <Stat label="ผู้ใช้ที่ถาม AI (24 ชม.)" value={s ? s.users : '-'} sub="เฉพาะที่เข้าสู่ระบบ" tone="text-cyan-300" />
        <Stat label="ผู้เล่น RTA ในระบบ" value={data.players?.players?.toLocaleString?.() || '-'} sub={data.players?.fetchedAt ? `ดึงเมื่อ ${ago(data.players.fetchedAt)}` : '-'} tone="text-emerald-300" />
        <Stat label="มอนสเตอร์ / สกิลแปลไทย" value={`${data.monsters?.count || 0} / ${data.skills?.translated || 0}`} sub={`ไม่มีรูป ${data.monsters?.withoutArt || 0} ตัว`} tone="text-fuchsia-300" />
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        <Health icon={Bot} title="โค้ช AI" ok={ai.configured && settings.features?.ai !== false} warn={ai.configured && settings.features?.ai === false}
          lines={[ai.configured ? `โมเดล ${ai.model} @ ${ai.baseHost}` : 'ยังไม่ได้ตั้งค่า AI_BASE_URL / AI_MODEL / AI_API_KEY', settings.features?.ai === false ? 'ปิดใช้งานโดยผู้ดูแล' : 'เปิดใช้งาน', s ? `24 ชม.: ${s.calls} ครั้ง, ผิดพลาด ${s.errors}` : '']}
          action={<button onClick={() => onTab('ai')} className="mt-2 text-[11px] text-amber-300 hover:text-white cursor-pointer">ดูรายละเอียด →</button>} />
        <Health icon={Cloud} title="Supabase (บัญชี / ซิงก์ / หลังบ้าน)" ok={supabase.configured && supabase.serviceRole} warn={supabase.configured && !supabase.serviceRole}
          lines={[supabase.host || 'ยังไม่ได้ตั้งค่า', supabase.serviceRole ? 'service role: พร้อม (บันทึกตั้งค่า/ล็อกได้)' : 'ไม่มี SUPABASE_SERVICE_ROLE_KEY — บันทึกตั้งค่าและล็อก AI ไม่ได้', `ที่เก็บตั้งค่า: ${settings._meta?.storage}`]} />
        <Health icon={Database} title="ชุดข้อมูล RTA" ok={playersAge != null && playersAge < 36} warn={playersAge != null && playersAge < 96}
          lines={[`ผู้เล่น ${data.players?.players || 0} • รีเพลย์ ${data.players?.replaysScanned || 0} • ซีซั่น ${data.players?.season || '-'}`, `ดึงล่าสุด ${fmtTime(data.players?.fetchedAt)} (${ago(data.players?.fetchedAt)})`, `เมต้า Guardian ${data.guardianMeta?.monsters || 0} ตัว • สรุปผู้เล่น AI ${data.playerSummaries?.count || 0}`]}
          action={<button onClick={() => onTab('data')} className="mt-2 text-[11px] text-amber-300 hover:text-white cursor-pointer">ดูทั้งหมด →</button>} />
        <Health icon={Server} title="Deploy" ok={deploy.env === 'production'} warn={deploy.env !== 'production'}
          lines={[`${deploy.env}${deploy.commit ? ` • ${deploy.branch}@${deploy.commit}` : ''}`, deploy.message || 'รันจากเครื่อง (dev)', `Node ${deploy.node} • ${deploy.region || 'local'} • อินสแตนซ์ทำงานมา ${Math.round(deploy.uptimeSec / 60)} นาที`]} />
        <Health icon={GitBranch} title="GitHub Actions (อัปเดตข้อมูลรายคืน)" ok={github.configured} warn={!github.configured}
          lines={[`${github.repo} • ${github.workflow}`, github.configured ? 'สั่งรันและดูสถานะได้จากแท็บงานอัตโนมัติ' : 'ใส่ GITHUB_TOKEN เพื่อสั่งรัน/ดูสถานะจากหน้านี้ (ไม่ใส่ก็ยังรันเองทุกคืน)']}
          action={<button onClick={() => onTab('jobs')} className="mt-2 text-[11px] text-amber-300 hover:text-white cursor-pointer">งานอัตโนมัติ →</button>} />
        <Health icon={Radio} title="AegisLink (เครื่องนี้)" ok={live.status === 'live'} warn={live.status !== 'error'}
          lines={[`สถานะ ${live.status}${live.wizard ? ` • ${live.wizard.name} (${live.units} ตัว)` : ''}`, `แพ็กเก็ตกิลด์ ${Object.keys(live.guild?.packets || {}).length} ชนิด • เหตุการณ์ ${live.events}`]} />
      </div>

      {(settings.announcement?.enabled || settings.maintenance?.enabled) && (
        <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs text-amber-200 flex items-center gap-2">
          <Megaphone className="w-4 h-4" /> {settings.maintenance?.enabled ? 'โหมดปรับปรุงเปิดอยู่ — ผู้ใช้เห็นแบนเนอร์แจ้งเตือน' : `ประกาศบนเว็บ: “${settings.announcement.text}”`}
          <button onClick={() => onTab('settings')} className="ml-auto underline cursor-pointer">แก้ไข</button>
        </div>
      )}
    </div>
  );
}

function AiPanel({ status }) {
  const [logs, setLogs] = useState(null);
  const [ping, setPing] = useState(null);
  const [busy, setBusy] = useState(false);
  const s = status.ai.stats?.last24h;
  const loadLogs = useCallback(async () => {
    try { setLogs(await adminFetch('logs', { query: { limit: 150 } })); } catch (err) { setLogs({ ok: false, error: err.message, rows: [] }); }
  }, []);
  useEffect(() => { loadLogs(); }, [loadLogs]);
  const doPing = async () => {
    setBusy(true);
    try { setPing(await adminFetch('actions', { method: 'POST', body: { action: 'ping-ai' } })); } catch (err) { setPing({ ok: false, error: err.message }); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat label="คำถาม 24 ชม." value={s?.calls ?? '-'} tone="text-amber-300" />
        <Stat label="ผิดพลาด" value={s?.errors ?? '-'} tone={s?.errors ? 'text-rose-300' : 'text-emerald-300'} />
        <Stat label="เวลาตอบเฉลี่ย" value={s ? `${(s.avgMs / 1000).toFixed(1)} วิ` : '-'} tone="text-cyan-300" />
        <Stat label="โทเค็นรวม" value={s?.tokens?.toLocaleString?.() ?? '-'} tone="text-fuchsia-300" />
        <Stat label="แยกตามชนิด" value={s ? Object.entries(s.byKind).map(([k, v]) => `${k} ${v}`).join(' • ') || '-' : '-'} tone="text-white text-base" />
      </div>
      <div className={`${card} p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
        <div className="text-sm">
          <div className="font-bold text-white flex items-center gap-2"><Bot className="w-4 h-4 text-amber-300" /> {status.ai.configured ? `${status.ai.model} @ ${status.ai.baseHost}` : 'ยังไม่ได้ตั้งค่า AI'}</div>
          <div className="text-xs text-slate-400 mt-0.5">ทดสอบยิงคำถามสั้น ๆ ไปที่โมเดลเพื่อเช็กว่าคีย์/ปลายทางยังใช้ได้และตอบเร็วแค่ไหน</div>
          {ping && <div className={`text-xs mt-1 ${ping.ok ? 'text-emerald-300' : 'text-rose-300'}`}>{ping.ok ? `ตอบใน ${(ping.ms / 1000).toFixed(1)} วิ (${ping.model}): “${ping.answer}”` : `ล้มเหลว: ${ping.error}`}</div>}
        </div>
        <button onClick={doPing} disabled={busy || !status.ai.configured} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold cursor-pointer flex items-center gap-1.5 shrink-0">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} ทดสอบโมเดล</button>
      </div>
      <div className={`${card} overflow-hidden`}>
        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <div className="text-sm font-bold text-white flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /> คำถามล่าสุด</div>
          <button onClick={loadLogs} className="text-[11px] text-slate-400 hover:text-white cursor-pointer flex items-center gap-1"><RefreshCw className="w-3 h-3" /> โหลดใหม่</button>
        </div>
        {!logs ? <div className="p-6 text-center text-slate-400 text-sm">กำลังโหลด…</div>
          : !logs.ok ? <div className="p-4 text-xs text-amber-200">{logs.error === 'TABLE_MISSING' ? 'ยังไม่ได้สร้างตาราง ai_logs — รันไฟล์ supabase/admin_schema.sql ใน Supabase SQL Editor แล้วคำถามใหม่จะถูกบันทึกอัตโนมัติ' : logs.error}</div>
          : logs.rows.length === 0 ? <div className="p-6 text-center text-slate-400 text-sm">ยังไม่มีบันทึก</div>
          : (
            <div className="overflow-x-auto">
              {logs.geo === false && <div className="px-4 py-2 text-[11px] text-amber-200 bg-amber-500/5 border-b border-amber-500/20">ตาราง ai_logs ยังไม่มีคอลัมน์ IP/ประเทศ — รัน <code className="text-white">supabase/admin_schema.sql</code> อีกครั้งใน SQL Editor (เพิ่มคอลัมน์ให้อัตโนมัติ) แล้วคำถามใหม่จะบันทึก IP และประเทศ</div>}
              <table className="w-full text-xs">
                <thead className="bg-white/[0.03] text-slate-400"><tr><th className="text-left px-3 py-2">เวลา</th><th className="text-left px-3 py-2">ชนิด</th><th className="text-left px-3 py-2">คำถาม</th><th className="text-left px-3 py-2">ผล</th><th className="text-right px-3 py-2">วินาที</th><th className="text-right px-3 py-2">โทเค็น</th><th className="text-left px-3 py-2">ผู้ใช้</th><th className="text-left px-3 py-2">IP</th><th className="text-left px-3 py-2">ประเทศ</th></tr></thead>
                <tbody>
                  {logs.rows.map((r) => (
                    <tr key={r.id} className="border-t border-white/[0.05] align-top">
                      <td className="px-3 py-2 whitespace-nowrap text-slate-400">{fmtTime(r.created_at)}</td>
                      <td className="px-3 py-2"><span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-200">{r.kind}</span></td>
                      <td className="px-3 py-2 text-slate-200 max-w-[420px]"><div className="line-clamp-2">{r.question || '-'}</div>{r.error && <div className="text-rose-300 mt-0.5">{r.error}</div>}</td>
                      <td className="px-3 py-2">{r.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-300">{(r.ms / 1000).toFixed(1)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-300">{r.tokens ?? '-'}</td>
                      <td className="px-3 py-2 text-slate-400 font-mono">{r.user_id ? r.user_id.slice(0, 8) : 'anon'}</td>
                      <td className="px-3 py-2 text-slate-400 font-mono whitespace-nowrap" title={r.ip_hash ? `hash ${r.ip_hash}` : ''}>{r.ip || (r.ip_hash ? `#${r.ip_hash.slice(0, 6)}` : '-')}</td>
                      <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{r.country ? `${r.country}${r.city ? ` · ${r.city}` : ''}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}

function DataPanel({ status, onNavigate }) {
  const d = status.data;
  const rows = [
    ['ดัชนีผู้เล่น RTA', `${d.players?.players || 0} คน • ${d.players?.replaysScanned || 0} รีเพลย์ • ${d.matchShards} shards`, d.players?.fetchedAt, d.players?.file],
    ['เมต้า Guardian (เลือก/ชนะ/แบน)', `${d.guardianMeta?.monsters || 0} มอนสเตอร์`, d.guardianMeta?.fetchedAt, d.guardianMeta?.file],
    ['เส้นแบ่งแรงค์ RTA', d.cutoffs?.nowTime ? `ณ ${d.cutoffs.nowTime}` : '-', null, d.cutoffs?.file],
    ['แคตตาล็อกมอนสเตอร์', `${d.monsters?.count || 0} ตัว • ไม่มีรูป ${d.monsters?.withoutArt || 0}`, null, d.monsters?.file],
    ['สกิล (แปลไทย)', `${d.skills?.translated || 0} / ${d.skills?.count || 0} ตัว`, null, d.skills?.file],
    ['ทีมตั้งรับ 3MDC', `${d.mdc?.count || 0} ทีม`, null, d.mdc?.file],
    ['สรุปแพตช์โดย AI', `${d.patches?.count || 0} แพตช์ • ${d.patches?.model || '-'}`, d.patches?.updatedAt, d.patches?.file],
    ['สรุปผู้เล่นโดย AI', `${d.playerSummaries?.count || 0} คน`, d.playerSummaries?.updatedAt, d.playerSummaries?.file],
  ];
  return (
    <div className="space-y-4">
      <div className={`${card} overflow-hidden`}>
        <table className="w-full text-xs">
          <thead className="bg-white/[0.03] text-slate-400"><tr><th className="text-left px-4 py-2.5">ชุดข้อมูล</th><th className="text-left px-4 py-2.5">ขนาด/จำนวน</th><th className="text-left px-4 py-2.5">อัปเดตข้อมูล</th><th className="text-left px-4 py-2.5">ไฟล์</th></tr></thead>
          <tbody>
            {rows.map(([name, count, at, file]) => (
              <tr key={name} className="border-t border-white/[0.05]">
                <td className="px-4 py-2.5 font-semibold text-white">{name}</td>
                <td className="px-4 py-2.5 text-slate-200">{count}</td>
                <td className="px-4 py-2.5 text-slate-400">{at ? `${fmtTime(at)} (${ago(at)})` : '-'}</td>
                <td className="px-4 py-2.5 text-slate-500 font-mono">{file ? `${kb(file.bytes)} • ${fmtTime(file.modified)}` : 'ไม่พบไฟล์'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid sm:grid-cols-3 gap-3 text-xs">
        {[['guardian', 'อันดับ & เมต้า Guardian', 'เช็กว่าหน้าแสดงข้อมูลล่าสุดถูกต้อง'], ['catalog', 'แคตตาล็อกมอนสเตอร์', 'หารูปที่หายหรือชื่อผิด'], ['balance', 'แพตช์บาลานซ์', 'ตรวจสรุป AI ของแพตช์ล่าสุด']].map(([view, title, hint]) => (
          <button key={view} onClick={() => onNavigate?.(view)} className={`${card} p-3 text-left hover:border-fuchsia-500/40 cursor-pointer`}>
            <div className="font-bold text-white flex items-center gap-1.5">{title} <ExternalLink className="w-3 h-3 text-slate-500" /></div>
            <div className="text-slate-400 mt-0.5">{hint}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function SettingsPanel({ status, onSaved }) {
  const initial = status.settings;
  const [form, setForm] = useState(() => ({ announcement: { ...initial.announcement }, maintenance: { ...initial.maintenance }, features: { ...initial.features }, ai: { requireLogin: true, dailyLimit: 3, ...(initial.ai || {}) } }));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const storage = initial._meta?.storage;
  const canSave = storage === 'supabase';
  const set = (group, key, value) => setForm((f) => ({ ...f, [group]: { ...f[group], [key]: value } }));
  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      await adminFetch('settings', { method: 'PUT', body: form });
      setMsg({ ok: true, text: 'บันทึกแล้ว — มีผลกับผู้ใช้ภายใน ~1 นาที' });
      onSaved?.();
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-4">
      {!canSave && (
        <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs text-amber-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            {storage === 'missing-table' ? <>ยังไม่ได้สร้างตารางตั้งค่า — เปิด Supabase → SQL Editor แล้วรันไฟล์ <code className="text-white">supabase/admin_schema.sql</code> (ครั้งเดียว) จากนั้นจึงบันทึกได้</>
              : storage === 'no-service-key' ? <>ต้องใส่ <code className="text-white">SUPABASE_SERVICE_ROLE_KEY</code> ใน Vercel เพื่อให้เซิร์ฟเวอร์บันทึกตั้งค่าได้</>
              : <>ที่เก็บตั้งค่า: {storage}</>}
          </div>
        </div>
      )}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className={`${card} p-4 space-y-3`}>
          <div className="text-sm font-bold text-white flex items-center gap-2"><Megaphone className="w-4 h-4 text-amber-300" /> ประกาศบนเว็บ</div>
          <Toggle checked={!!form.announcement.enabled} onChange={(v) => set('announcement', 'enabled', v)} label="แสดงแบนเนอร์ประกาศ" hint="แถบข้อความด้านบนทุกหน้า" />
          <input value={form.announcement.text} onChange={(e) => set('announcement', 'text', e.target.value)} maxLength={200} placeholder="ข้อความประกาศ เช่น อัปเดตแพตช์ใหม่แล้ว!" className="w-full bg-[#0d1422] border border-white/10 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none" />
          <div className="flex gap-2">
            <select value={form.announcement.level} onChange={(e) => set('announcement', 'level', e.target.value)} className="bg-[#0d1422] border border-white/10 rounded-xl px-3 py-2 text-sm text-white">
              <option value="info">ข้อมูล (ฟ้า)</option><option value="success">ข่าวดี (เขียว)</option><option value="warning">เตือน (เหลือง)</option>
            </select>
            <input value={form.announcement.link || ''} onChange={(e) => set('announcement', 'link', e.target.value)} placeholder="ลิงก์ในเว็บ (ไม่บังคับ) เช่น /balance" className="flex-1 bg-[#0d1422] border border-white/10 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none" />
          </div>
        </div>
        <div className={`${card} p-4 space-y-3`}>
          <div className="text-sm font-bold text-white flex items-center gap-2"><Wrench className="w-4 h-4 text-rose-300" /> โหมดปรับปรุง</div>
          <Toggle checked={!!form.maintenance.enabled} onChange={(v) => set('maintenance', 'enabled', v)} label="เปิดโหมดปรับปรุง" hint="ผู้ใช้เห็นแบนเนอร์สีแดงทุกหน้า (ยังใช้เว็บได้)" />
          <input value={form.maintenance.message} onChange={(e) => set('maintenance', 'message', e.target.value)} maxLength={200} className="w-full bg-[#0d1422] border border-white/10 focus:border-rose-400 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
        </div>
        <div className={`${card} p-4 space-y-2 lg:col-span-2`}>
          <div className="text-sm font-bold text-white flex items-center gap-2"><Settings className="w-4 h-4 text-cyan-300" /> เปิด/ปิดฟีเจอร์</div>
          <div className="grid sm:grid-cols-2 gap-2">
            <Toggle checked={form.features.ai !== false} onChange={(v) => set('features', 'ai', v)} label="โค้ช AI" hint="ปิดแล้วทุกคำถามจะได้ข้อความว่าปิดชั่วคราว (ประหยัดค่า API)" />
            <Toggle checked={form.features.liveLink !== false} onChange={(v) => set('features', 'liveLink', v)} label="AegisLink เรียลไทม์" hint="ซ่อนปุ่มเชื่อมต่อ SWEX ในหน้ากล่องของฉัน" />
            <Toggle checked={form.features.cloudSync !== false} onChange={(v) => set('features', 'cloudSync', v)} label="ซิงก์ข้ามอุปกรณ์" hint="ปุ่มซิงก์ข้ามเครื่องบนแถบเมนู" />
            <Toggle checked={form.features.patchNotes !== false} onChange={(v) => set('features', 'patchNotes', v)} label="สรุปแพตช์ AI" hint="แสดงบทสรุปแพตช์ที่สร้างโดย AI" />
          </div>
        </div>
        <div className={`${card} p-4 space-y-3 lg:col-span-2`}>
          <div className="text-sm font-bold text-white flex items-center gap-2"><Bot className="w-4 h-4 text-amber-300" /> สิทธิ์ใช้โค้ช AI</div>
          <div className="grid sm:grid-cols-2 gap-3 items-start">
            <Toggle checked={form.ai.requireLogin !== false} onChange={(v) => set('ai', 'requireLogin', v)} label="ต้องเข้าสู่ระบบก่อนถาม" hint="ปิดแล้วผู้ใช้ทั่วไปถามได้ (โควตายังนับต่อ IP)" />
            <label className="block text-xs text-slate-300">
              <span className="font-bold text-white">โควตาต่อวัน (คำถาม)</span>
              <span className="block text-[11px] text-slate-400 mb-1.5">นับคำตอบที่สำเร็จต่อบัญชีและต่อ IP ตามวันเวลาไทย · 0 = ไม่จำกัด · แอดมินไม่ถูกจำกัด</span>
              <input type="number" min={0} max={1000} value={form.ai.dailyLimit ?? 3} onChange={(e) => set('ai', 'dailyLimit', Math.max(0, Number(e.target.value) || 0))} className="w-32 bg-[#0d1422] border border-white/10 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
            </label>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving || !canSave} className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold cursor-pointer flex items-center gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} บันทึกการตั้งค่า</button>
        {msg && <span className={`text-xs ${msg.ok ? 'text-emerald-300' : 'text-rose-300'}`}>{msg.text}</span>}
        {initial._meta?.updatedAt && <span className="text-[11px] text-slate-500 ml-auto">บันทึกล่าสุด {fmtTime(initial._meta.updatedAt)}</span>}
      </div>
    </div>
  );
}

const KIND_LABEL = { siege: 'Siege', wgb: 'WGB', guild: 'Guild' };

// Every contributor's leaderboard snapshot, and the knobs that decide which one the site shows:
// trusted contributors always win, blocked ones are ignored (see api/_lib/guildRankings.js).
function GuildRankingsPanel() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    try { setData(await adminFetch('guild-rankings')); } catch (err) { setData({ ok: false, error: err.message }); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (op, snap) => {
    const label = { trust: 'เชื่อถือ', untrust: 'เลิกเชื่อถือ', block: 'บล็อก', unblock: 'เลิกบล็อก', delete: 'ลบ snapshot' }[op];
    if ((op === 'block' || op === 'delete') && !window.confirm(`${label} — ${op === 'block' ? 'ทุก snapshot ของผู้ส่งนี้จะหายจากหน้าอันดับ และส่งใหม่ไม่ได้' : 'ลบแถวนี้ออกจากฐานข้อมูล'} ยืนยัน?`)) return;
    setBusy(snap.id + op); setMsg(null);
    try {
      await adminFetch('guild-rankings', { method: 'POST', body: { op, contributor: snap.contributor, id: snap.id } });
      setMsg({ ok: true, text: `${label}แล้ว` });
      await load();
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setBusy('');
    }
  };

  const btn = 'px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer disabled:opacity-50 border';
  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl border border-white/10 bg-white/[0.03] text-xs text-slate-300 leading-relaxed">
        ผู้ส่งแต่ละคนมี snapshot ของตัวเองต่อเซิร์ฟเวอร์+โหมด ไม่มีใครเขียนทับของคนอื่นได้ หน้าอันดับจะแสดง: snapshot ล่าสุดจากผู้ส่งที่<span className="text-emerald-300">เชื่อถือ</span> → ถ้าไม่มี ใช้ตัวที่มีผู้ส่งอีกคนเห็นตรงกัน (top-10 ซ้ำ ≥ 60%) → ถ้าไม่มี ใช้ตัวล่าสุดพร้อมป้าย “ยังไม่ยืนยัน” ผู้ส่งที่<span className="text-rose-300">ถูกบล็อก</span>จะถูกตัดออกทั้งหมด (แอดมินถูกนับว่าเชื่อถือโดยอัตโนมัติเมื่อแชร์ครั้งแรก)
      </div>

      {msg && <div className={`text-xs ${msg.ok ? 'text-emerald-300' : 'text-rose-300'}`}>{msg.text}</div>}

      {!data ? <div className="p-6 text-center text-slate-400 text-sm">กำลังโหลด…</div>
        : !data.ok ? <div className="p-4 text-xs text-amber-200">{data.error === 'TABLE_MISSING' ? 'ยังไม่ได้สร้างตาราง guild_rankings — รัน supabase/admin_schema.sql' : data.error}</div>
        : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat label="snapshot ทั้งหมด" value={data.snapshots.length} tone="text-amber-300" />
              <Stat label="กระดานที่แสดงอยู่" value={data.boards.length} sub={data.boards.filter((b) => !b.verified).length ? `${data.boards.filter((b) => !b.verified).length} ยังไม่ยืนยัน` : 'ยืนยันครบ'} tone="text-cyan-300" />
              <Stat label="ผู้ส่งที่เชื่อถือ" value={data.trusted.length} tone="text-emerald-300" />
              <Stat label="ผู้ส่งที่บล็อก" value={data.blocked.length} tone={data.blocked.length ? 'text-rose-300' : 'text-white'} />
            </div>

            <div className={`${card} overflow-hidden`}>
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <div className="text-sm font-bold text-white flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-300" /> snapshot จากผู้เล่น</div>
                <button onClick={load} className="text-[11px] text-slate-400 hover:text-white cursor-pointer flex items-center gap-1"><RefreshCw className="w-3 h-3" /> โหลดใหม่</button>
              </div>
              {data.snapshots.length === 0 ? <div className="p-6 text-center text-slate-400 text-sm">ยังไม่มีใครแชร์อันดับ — เปิดหน้าอันดับในเกมขณะเชื่อมต่อ AegisLink</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-white/[0.03] text-slate-400"><tr><th className="text-left px-3 py-2">อัปเดต</th><th className="text-left px-3 py-2">เซิร์ฟ / โหมด</th><th className="text-left px-3 py-2">ผู้ส่ง</th><th className="text-left px-3 py-2">กิลด์ top 3</th><th className="text-right px-3 py-2">แถว</th><th className="text-left px-3 py-2">สถานะ</th><th className="text-right px-3 py-2">จัดการ</th></tr></thead>
                    <tbody>
                      {data.snapshots.map((s) => {
                        const shown = data.boards.find((b) => b.server === s.server && b.kind === s.kind && b.updatedAt === s.updatedAt);
                        return (
                          <tr key={s.id} className={`border-t border-white/[0.05] align-top ${s.blocked ? 'opacity-50' : ''}`}>
                            <td className="px-3 py-2 whitespace-nowrap text-slate-400">{fmtTime(s.updatedAt)}<div className="text-slate-600">{ago(s.updatedAt)}</div></td>
                            <td className="px-3 py-2 whitespace-nowrap text-white font-bold">{s.server} • {KIND_LABEL[s.kind] || s.kind}</td>
                            <td className="px-3 py-2"><span className="font-mono text-slate-300">{s.contributor?.slice(0, 8)}</span>{s.note && <div className="text-slate-500 truncate max-w-[180px]">{s.note}</div>}</td>
                            <td className="px-3 py-2 text-slate-300">{s.top.join(', ') || '-'}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-slate-300">{s.rowCount}</td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {s.blocked ? <span className="text-rose-300">บล็อก</span> : s.trusted ? <span className="text-emerald-300">เชื่อถือ</span> : <span className="text-slate-400">ทั่วไป</span>}
                              {shown && <div className={shown.verified ? 'text-emerald-400' : 'text-amber-300'}>{shown.verified ? `แสดงอยู่ ✓ (${shown.sources} แหล่ง)` : 'แสดงอยู่ • ยังไม่ยืนยัน'}</div>}
                            </td>
                            <td className="px-3 py-2 text-right whitespace-nowrap space-x-1">
                              <button onClick={() => act(s.trusted ? 'untrust' : 'trust', s)} disabled={Boolean(busy) || s.blocked} className={`${btn} ${s.trusted ? 'border-white/10 text-slate-300 hover:text-white' : 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10'}`}>{s.trusted ? 'เลิกเชื่อถือ' : 'เชื่อถือ'}</button>
                              <button onClick={() => act(s.blocked ? 'unblock' : 'block', s)} disabled={Boolean(busy)} className={`${btn} ${s.blocked ? 'border-white/10 text-slate-300 hover:text-white' : 'border-rose-500/40 text-rose-300 hover:bg-rose-500/10'}`}><ShieldOff className="w-3 h-3 inline -mt-0.5" /> {s.blocked ? 'เลิกบล็อก' : 'บล็อก'}</button>
                              <button onClick={() => act('delete', s)} disabled={Boolean(busy)} className={`${btn} border-white/10 text-slate-400 hover:text-rose-300`}><Trash2 className="w-3 h-3 inline -mt-0.5" /> ลบ</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
    </div>
  );
}

// --- live data: what the hourly job publishes + redeem-code moderation ------------------------------
function LivePanel() {
  const [live, setLive] = useState(null);
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);
  const [newCode, setNewCode] = useState('');
  const [newRewards, setNewRewards] = useState('');
  const [rewardsById, setRewardsById] = useState({});

  const load = useCallback(async () => {
    try { setLive(await adminFetch('live-data')); } catch (err) { setLive({ ok: false, error: err.message, rows: [] }); }
    try { setPending(await adminFetch('code-submissions', { query: { status: 'pending' } })); } catch (err) { setPending({ ok: false, error: err.message, rows: [] }); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (key, fn) => {
    setBusy(key); setMsg(null);
    try { const r = await fn(); setMsg({ ok: true, text: r?.message || 'เรียบร้อย' }); await load(); }
    catch (err) { setMsg({ ok: false, text: err.message }); }
    finally { setBusy(''); }
  };
  const refreshLive = () => run('refresh', () => adminFetch('actions', { method: 'POST', body: { action: 'refresh-live' } }));
  const resolve = (id, op) => run(`sub-${id}`, () => adminFetch('code-submissions', { method: 'POST', body: { id, op, rewards: rewardsById[id] || '' } }));
  const addCode = async (e) => {
    e.preventDefault();
    const code = newCode.trim().toUpperCase().replace(/\s+/g, '');
    if (!code) return;
    await run('add', async () => {
      const cur = await adminFetch('live-data', { query: { key: 'codes' } }).catch(() => null);
      const codes = Array.isArray(cur?.value?.codes) ? cur.value.codes.filter((c) => String(c.code).toUpperCase() !== code) : [];
      codes.unshift({ id: `code-${code.toLowerCase()}`, code, dateAdded: new Date().toISOString().slice(0, 10), expiry: 'มีผลใช้งานอยู่', status: 'active', rewardsText: newRewards.trim(), rewards: [], redeemUrl: `http://withhive.me/313/${code}` });
      await adminFetch('live-data', { method: 'POST', body: { key: 'codes', value: { codes, updatedAt: new Date().toISOString() } } });
      setNewCode(''); setNewRewards('');
      return { message: `โค้ด ${code} ขึ้นเว็บแล้ว` };
    });
  };
  const removeCode = (code) => run(`rm-${code}`, async () => {
    const cur = await adminFetch('live-data', { query: { key: 'codes' } });
    const codes = (cur?.value?.codes || []).filter((c) => String(c.code).toUpperCase() !== code);
    await adminFetch('live-data', { method: 'POST', body: { key: 'codes', value: { codes, updatedAt: new Date().toISOString() } } });
    return { message: `ลบโค้ด ${code} แล้ว` };
  });
  const [codesDoc, setCodesDoc] = useState(null);
  useEffect(() => { adminFetch('live-data', { query: { key: 'codes' } }).then(setCodesDoc).catch(() => setCodesDoc(null)); }, [live]);

  const tableMissing = live && !live.ok && live.error === 'TABLE_MISSING';
  return (
    <div className="space-y-4">
      {tableMissing && (
        <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs text-amber-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>ยังไม่มีตาราง <code className="text-white">live_data</code> — รัน <code className="text-white">supabase/admin_schema.sql</code> ใน SQL Editor ครั้งเดียว แล้วใส่ secret <code className="text-white">SUPABASE_URL</code> + <code className="text-white">SUPABASE_SERVICE_ROLE_KEY</code> ใน GitHub Actions</div>
        </div>
      )}
      <div className={`${card} p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
        <div className="text-sm">
          <div className="font-bold text-white flex items-center gap-2"><Radio className="w-4 h-4 text-emerald-300" /> ข้อมูลสด (อัปเดตโดยไม่ต้อง deploy)</div>
          <div className="text-xs text-slate-400 mt-0.5">งานรายชั่วโมงเขียน tier list / เมต้า / cutoff ลงที่นี่ หน้าเว็บอ่านจาก <code>/api/live/&lt;key&gt;</code> และแท็บที่เปิดอยู่รับการเปลี่ยนแปลงทันที</div>
          {msg && <div className={`text-xs mt-1 ${msg.ok ? 'text-emerald-300' : 'text-rose-300'}`}>{msg.text}</div>}
        </div>
        <button onClick={refreshLive} disabled={busy === 'refresh'} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 shrink-0">{busy === 'refresh' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} รีเฟรชข้อมูลสดตอนนี้</button>
      </div>

      <div className={`${card} overflow-hidden`}>
        <div className="px-4 py-3 border-b border-white/[0.06] text-sm font-bold text-white flex items-center gap-2"><Database className="w-4 h-4 text-slate-400" /> เอกสารที่อยู่บนเว็บตอนนี้</div>
        {!live ? <div className="p-6 text-center text-slate-400 text-sm">กำลังโหลด…</div>
          : !live.ok ? <div className="p-4 text-xs text-amber-200">{tableMissing ? 'ยังไม่มีตาราง' : live.error}</div>
          : live.rows.length === 0 ? <div className="p-6 text-center text-slate-400 text-sm">ยังไม่มีข้อมูล — กด "รีเฟรชข้อมูลสดตอนนี้" หรือรอรอบชั่วโมง</div>
          : (
            <table className="w-full text-xs">
              <thead className="bg-white/[0.03] text-slate-400"><tr><th className="text-left px-3 py-2">key</th><th className="text-left px-3 py-2">อัปเดตล่าสุด</th><th className="text-left px-3 py-2">โดย</th></tr></thead>
              <tbody>{live.rows.map((r) => (
                <tr key={r.key} className="border-t border-white/[0.05]"><td className="px-3 py-2 font-mono text-slate-200">{r.key}</td><td className="px-3 py-2 text-slate-300">{fmtTime(r.updated_at)} <span className="text-slate-500">({ago(r.updated_at)})</span></td><td className="px-3 py-2 text-slate-400">{r.updated_by || '-'}</td></tr>
              ))}</tbody>
            </table>
          )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className={`${card} p-4 space-y-3`}>
          <div className="text-sm font-bold text-white flex items-center gap-2"><Zap className="w-4 h-4 text-amber-300" /> เพิ่มโค้ดแจกไอเทม (ขึ้นเว็บทันที)</div>
          <form onSubmit={addCode} className="flex flex-col sm:flex-row gap-2">
            <input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="โค้ด เช่น SW2026GIFT" className="flex-1 bg-[#0d1422] border border-white/10 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-white font-mono uppercase placeholder-slate-500 focus:outline-none" />
            <input value={newRewards} onChange={(e) => setNewRewards(e.target.value)} placeholder="ของรางวัล เช่น Energy x100, Scroll x3" className="flex-1 bg-[#0d1422] border border-white/10 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none" />
            <button type="submit" disabled={busy === 'add'} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold cursor-pointer">{busy === 'add' ? '…' : 'เพิ่ม'}</button>
          </form>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {(codesDoc?.value?.codes || []).map((c) => (
              <div key={c.code} className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] text-xs">
                <span className="font-mono font-bold text-emerald-300">{c.code}</span>
                <span className="text-slate-400 truncate flex-1">{c.rewardsText || (c.rewards || []).map((r) => `${r.name} x${r.amount}`).join(', ')}</span>
                <span className="text-slate-500 shrink-0">{c.dateAdded}</span>
                <button onClick={() => removeCode(String(c.code).toUpperCase())} disabled={busy === `rm-${String(c.code).toUpperCase()}`} className="p-1 rounded text-slate-500 hover:text-rose-300 cursor-pointer" title="ลบออกจากเว็บ"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            {codesDoc && !(codesDoc.value?.codes || []).length && <div className="text-xs text-slate-500">ยังไม่มีโค้ดบนเว็บ — รัน <code>node scripts/publish_live_data.mjs codes-seed</code> หรือเพิ่มด้านบน</div>}
          </div>
        </div>
        <div className={`${card} p-4 space-y-3`}>
          <div className="text-sm font-bold text-white flex items-center gap-2"><Users className="w-4 h-4 text-cyan-300" /> โค้ดที่ผู้ใช้ส่งมา รอตรวจ {pending?.rows?.length ? `(${pending.rows.length})` : ''}</div>
          {!pending ? <div className="text-xs text-slate-400">กำลังโหลด…</div>
            : !pending.ok ? <div className="text-xs text-amber-200">{pending.error === 'TABLE_MISSING' ? 'ยังไม่มีตาราง code_submissions (รัน admin_schema.sql)' : pending.error}</div>
            : pending.rows.length === 0 ? <div className="text-xs text-slate-500">ไม่มีรายการรอตรวจ</div>
            : pending.rows.map((s) => (
              <div key={s.id} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs"><span className="font-mono font-bold text-white">{s.code}</span><span className="text-slate-500">{fmtTime(s.created_at)}</span></div>
                {s.note && <div className="text-[11px] text-slate-400">หมายเหตุผู้ส่ง: {s.note}</div>}
                <div className="flex gap-2">
                  <input value={rewardsById[s.id] ?? s.note ?? ''} onChange={(e) => setRewardsById((m) => ({ ...m, [s.id]: e.target.value }))} placeholder="ของรางวัล (แสดงบนเว็บ)" className="flex-1 bg-[#0d1422] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400" />
                  <button onClick={() => resolve(s.id, 'approve')} disabled={busy === `sub-${s.id}`} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold cursor-pointer">อนุมัติ</button>
                  <button onClick={() => resolve(s.id, 'reject')} disabled={busy === `sub-${s.id}`} className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-rose-500/20 text-slate-300 hover:text-rose-200 text-xs font-bold cursor-pointer">ปฏิเสธ</button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function JobsPanel({ status }) {
  const [runs, setRuns] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const gh = status.github;
  const loadRuns = useCallback(async () => {
    if (!gh.configured) return;
    try { setRuns(await adminFetch('runs')); } catch (err) { setRuns({ ok: false, error: err.message }); }
  }, [gh.configured]);
  useEffect(() => { loadRuns(); }, [loadRuns]);
  const dispatch = async () => {
    if (!window.confirm('สั่งรันอัปเดตข้อมูล RTA ตอนนี้? ใช้เวลาราว 15–40 นาที และจะ commit + deploy อัตโนมัติ')) return;
    setBusy(true); setMsg(null);
    try { const r = await adminFetch('actions', { method: 'POST', body: { action: 'refresh-data', pages: 30 } }); setMsg({ ok: true, text: r.message }); setTimeout(loadRuns, 4000); }
    catch (err) { setMsg({ ok: false, text: err.message }); }
    finally { setBusy(false); }
  };
  const tone = (r) => (r.status !== 'completed' ? 'text-amber-300' : r.conclusion === 'success' ? 'text-emerald-300' : 'text-rose-300');
  return (
    <div className="space-y-4">
      <div className={`${card} p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
        <div className="text-sm">
          <div className="font-bold text-white flex items-center gap-2"><GitBranch className="w-4 h-4 text-cyan-300" /> อัปเดตข้อมูล RTA + สรุป AI (ทุกคืน 03:00)</div>
          <div className="text-xs text-slate-400 mt-0.5">GitHub Actions: ดึงผู้เล่น/รีเพลย์/เมต้า → สร้างสรุป AI → commit → Vercel deploy • {gh.repo}</div>
          {msg && <div className={`text-xs mt-1 ${msg.ok ? 'text-emerald-300' : 'text-rose-300'}`}>{msg.text}</div>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a href={`https://github.com/${gh.repo}/actions`} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200 text-xs font-bold flex items-center gap-1.5"><ExternalLink className="w-3.5 h-3.5" /> เปิดใน GitHub</a>
          <button onClick={dispatch} disabled={busy || !gh.configured} className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />} สั่งรันตอนนี้</button>
        </div>
      </div>
      {!gh.configured ? (
        <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs text-amber-200">ใส่ <code className="text-white">GITHUB_TOKEN</code> (fine-grained token ของ repo นี้ สิทธิ์ Actions: Read and write) ใน Vercel เพื่อสั่งรันและดูสถานะจากหน้านี้ — งานยังรันเองทุกคืนอยู่แล้ว</div>
      ) : !runs ? <div className="text-sm text-slate-400">กำลังโหลดประวัติ…</div>
        : !runs.ok ? <div className="text-xs text-rose-300">{runs.error}</div>
        : (
          <div className={`${card} overflow-hidden`}>
            <table className="w-full text-xs">
              <thead className="bg-white/[0.03] text-slate-400"><tr><th className="text-left px-4 py-2.5">เริ่ม</th><th className="text-left px-4 py-2.5">สถานะ</th><th className="text-left px-4 py-2.5">เรียกโดย</th><th className="text-left px-4 py-2.5">รายละเอียด</th></tr></thead>
              <tbody>
                {runs.runs.map((r) => (
                  <tr key={r.id} className="border-t border-white/[0.05]">
                    <td className="px-4 py-2.5 text-slate-300 whitespace-nowrap">{fmtTime(r.createdAt)}</td>
                    <td className={`px-4 py-2.5 font-bold ${tone(r)}`}>{r.status === 'completed' ? (r.conclusion === 'success' ? 'สำเร็จ' : `ล้มเหลว (${r.conclusion})`) : r.status}</td>
                    <td className="px-4 py-2.5 text-slate-400">{r.event === 'schedule' ? 'ตารางเวลา' : r.event === 'workflow_dispatch' ? 'สั่งเอง' : r.event}</td>
                    <td className="px-4 py-2.5"><a href={r.url} target="_blank" rel="noreferrer" className="text-cyan-300 hover:underline">{r.title || 'ดูใน GitHub'}</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      <div className={`${card} p-4 text-xs text-slate-400 space-y-1`}>
        <div className="font-bold text-white flex items-center gap-2"><Users className="w-4 h-4 text-slate-400" /> เช็กลิสต์ดูแลรายสัปดาห์</div>
        <ul className="list-disc pl-5 space-y-0.5">
          <li>ข้อมูล RTA ต้องไม่เก่ากว่า 36 ชม. (ภาพรวม → ชุดข้อมูล เป็นสีเขียว)</li>
          <li>คำถาม AI ผิดพลาดควรต่ำกว่า 5% — ถ้าสูง ลอง “ทดสอบโมเดล” และดูข้อความผิดพลาดในแท็บโค้ช AI</li>
          <li>ตรวจว่า Vercel env (AI_*, SUPABASE_*, ADMIN_EMAILS) ยังครบหลังหมุนคีย์</li>
          <li>เมื่อมีแพตช์ใหม่: สั่งรันงานอัตโนมัติ แล้วเปิดประกาศบนเว็บ</li>
        </ul>
      </div>
    </div>
  );
}
