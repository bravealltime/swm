import React, { useState, useMemo } from 'react';
import { Trophy, Search, Radio, RefreshCw, Info, Users, Star } from 'lucide-react';
import { useGuildRankings } from '../hooks/useGuildRankings';
import { SERVERS } from '../utils/guildRankings';

// Guild leaderboards have no public data source, so every row here comes from a real in-game
// ranking screen relayed by the AegisLink plugin and shared through /api/guild-rankings.
const MODES = [
  { id: 'siege', name: '🏰 ศึกยึดเกาะ (Siege Battle)', desc: 'อันดับกิลด์จากหน้าอันดับ Siege ในเกม' },
  { id: 'wgb', name: '⚔️ ศึกกิลด์ข้ามเซิร์ฟ (World Guild Battle)', desc: 'อันดับจากหน้าอันดับ WGB ในเกม' },
];

const fmt = (ms) => new Date(ms).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });

export default function LeaderboardsView({ onNavigate }) {
  const [mode, setMode] = useState('siege');
  const [server, setServer] = useState('asia');
  const [query, setQuery] = useState('');
  const rankings = useGuildRankings();
  const board = rankings.board(server, mode);

  const rows = useMemo(() => {
    const list = board?.rows || [];
    const q = query.trim().toLowerCase();
    return q ? list.filter((g) => g.name.toLowerCase().includes(q)) : list;
  }, [board, query]);

  const coverage = SERVERS.map((s) => ({ ...s, has: Boolean(rankings.board(s.id, mode)) }));

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      <div className="border-b border-[#1c2738] pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
          <Trophy className="w-4 h-4" /> Guild leaderboards • ข้อมูลจริงจากหน้าอันดับในเกม
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">ตารางจัดอันดับกิลด์ (Siege & World Guild Battle)</h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          อันดับกิลด์ไม่มี API สาธารณะ เว็บนี้จึงไม่แต่งตัวเลขเอง — ทุกแถวมาจากหน้าอันดับในเกมที่ผู้เล่นซึ่งเชื่อมต่อ AegisLink เปิดดู แล้วแชร์ให้ทุกคน
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 p-1.5 rounded-2xl bg-[#101724] border border-[#1d2b3f]">
        {MODES.map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)} className={`p-3 rounded-xl text-left transition-all cursor-pointer ${mode === m.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-300 hover:text-white hover:bg-[#152030]'}`}>
            <div className="text-xs sm:text-sm font-black">{m.name}</div>
            <div className={`text-[11px] mt-0.5 ${mode === m.id ? 'text-blue-100' : 'text-slate-400'}`}>{m.desc}</div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-[#101724] border border-[#1d2b3f]">
        {coverage.map((s) => (
          <button key={s.id} onClick={() => setServer(s.id)} className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer ${server === s.id ? 'bg-amber-500 text-slate-950 font-black shadow-sm' : 'text-slate-300 hover:text-white hover:bg-[#16202f]'}`}>
            <span className={`w-2 h-2 rounded-full ${s.has ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            <span>{s.label}</span>
          </button>
        ))}
        <button onClick={rankings.refresh} className="ml-auto px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer"><RefreshCw className="w-3.5 h-3.5" /> โหลดใหม่</button>
      </div>

      {board ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> อัปเดต {fmt(board.at)} • {board.source === 'live' ? 'จากเกมบนเครื่องนี้ (AegisLink)' : `แชร์โดยผู้เล่น${board.note ? ` • ${board.note}` : ''}`} • {board.rows.length} กิลด์</span>
            {board.source === 'live' && (board.shared ? <span className="text-emerald-300">✓ แชร์ให้ทุกคนแล้ว</span> : <span className="text-amber-300">{board.error || 'กำลังแชร์…'}</span>)}
            {board.source === 'shared' && (board.verified
              ? <span className="text-emerald-300" title="ตรงกับผู้ส่งที่เชื่อถือได้ หรือผู้ส่งอีกคนเห็นเหมือนกัน">✓ ยืนยันแล้ว{board.sources > 1 ? ` (${board.sources} แหล่ง)` : ''}</span>
              : <span className="text-amber-300" title="มีผู้ส่งคนเดียว ยังไม่มีใครยืนยันซ้ำ">ยังไม่ยืนยัน • 1 แหล่ง</span>)}
          </div>

          <div className="bg-[#101724] p-3 rounded-xl border border-[#1d2b3f] flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
            <input type="text" className="w-full bg-transparent border-none text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none" placeholder="ค้นหาชื่อกิลด์…" value={query} onChange={(e) => setQuery(e.target.value)} />
            {query && <button onClick={() => setQuery('')} className="text-xs text-slate-400 hover:text-white mr-1 cursor-pointer">✕</button>}
          </div>

          <div className="bg-[#101724] border border-[#1d2b3f] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1d2b3f] bg-[#0c121c] text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 text-center w-20">อันดับ</th>
                    <th className="py-3.5 px-4">ชื่อกิลด์</th>
                    <th className="py-3.5 px-4 text-center">เรตติ้ง</th>
                    <th className="py-3.5 px-4 text-center">สมาชิก</th>
                    <th className="py-3.5 px-4 text-center">เลเวลกิลด์</th>
                    <th className="py-3.5 px-4 text-right">คะแนน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1d2b3f] text-xs sm:text-sm">
                  {rows.map((g) => (
                    <tr key={`${g.rank}-${g.name}`} className="hover:bg-[#152030] transition-colors">
                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        {g.rank === 1 ? <span className="inline-block px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/40">👑 #1</span>
                          : g.rank === 2 ? <span className="inline-block px-2.5 py-0.5 rounded bg-slate-300/20 text-slate-200 font-extrabold border border-slate-400/40">🥈 #2</span>
                          : g.rank === 3 ? <span className="inline-block px-2.5 py-0.5 rounded bg-amber-700/20 text-amber-400 font-extrabold border border-amber-700/40">🥉 #3</span>
                          : <span className="text-slate-400">#{g.rank}</span>}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-white">{g.name}</td>
                      <td className="py-3.5 px-4 text-center text-slate-300 font-mono">{g.rating ?? '—'}</td>
                      <td className="py-3.5 px-4 text-center text-slate-300 font-mono">{g.members != null ? <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-500" />{g.members}</span> : '—'}</td>
                      <td className="py-3.5 px-4 text-center text-slate-300 font-mono">{g.level != null ? <span className="inline-flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400" />{g.level}</span> : '—'}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-amber-400">{g.points ? g.points.toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-slate-500 text-sm">ไม่พบกิลด์ที่ค้นหา</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="p-8 rounded-2xl border border-dashed border-white/10 bg-[#101724] text-center space-y-3">
          <Radio className="w-8 h-8 text-cyan-400 mx-auto" />
          <div className="text-white font-bold">
            {rankings.loading ? 'กำลังโหลด…' : `ยังไม่มีอันดับ ${mode === 'siege' ? 'Siege' : 'WGB'} ของเซิร์ฟเวอร์ ${SERVERS.find((s) => s.id === server)?.label}`}
          </div>
          {!rankings.loading && (
            <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
              เปิดหน้าอันดับ {mode === 'siege' ? 'Siege' : 'World Guild Battle'} ในเกมขณะเชื่อมต่อ AegisLink 1 ครั้ง อันดับจริงจะขึ้นที่นี่ทันที และถ้าเข้าสู่ระบบไว้ ระบบจะแชร์ให้ผู้เล่นทุกคนเห็นอัตโนมัติ
              {rankings.error === 'TABLE_MISSING' && <span className="block mt-1 text-amber-300">ผู้ดูแล: ยังไม่ได้สร้างตาราง guild_rankings (supabase/admin_schema.sql)</span>}
            </p>
          )}
          <button onClick={() => onNavigate?.('aegislink')} className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer">วิธีเชื่อมต่อ AegisLink</button>
        </div>
      )}
    </div>
  );
}
