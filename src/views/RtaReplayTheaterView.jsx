import React, { useState, useMemo } from 'react';
import { Play, Trophy, Swords, Search, Crown, Ban, ChevronRight, Sparkles, Filter, CheckCircle2 } from 'lucide-react';
import replaysData from '../data/swrtRecentReplays.json';
import MonsterAvatar from '../components/MonsterAvatar';

function flagFromCountry(code) {
  if (!code || code.length !== 2) return '🌐';
  const a = code.toUpperCase().charCodeAt(0) - 65 + 0x1f1e6;
  const b = code.toUpperCase().charCodeAt(1) - 65 + 0x1f1e6;
  return String.fromCodePoint(a, b);
}

export default function RtaReplayTheaterView({ onNavigate }) {
  const [searchMonster, setSearchMonster] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [winnerFilter, setWinnerFilter] = useState('all'); // 'all' | 'firstPick' | 'secondPick'

  const replays = replaysData || [];

  const uniqueCountries = useMemo(() => {
    const list = new Set();
    replays.forEach((r) => {
      if (r.player1?.country) list.add(r.player1.country);
      if (r.player2?.country) list.add(r.player2.country);
    });
    return [...list].sort();
  }, [replays]);

  const filteredReplays = useMemo(() => {
    return replays.filter((r) => {
      const q = searchMonster.toLowerCase().trim();
      if (q) {
        const p1Has = r.player1.monsters.some((m) => (m.name || '').toLowerCase().includes(q) || (m.thaiName || '').toLowerCase().includes(q));
        const p2Has = r.player2.monsters.some((m) => (m.name || '').toLowerCase().includes(q) || (m.thaiName || '').toLowerCase().includes(q));
        if (!p1Has && !p2Has) return false;
      }

      if (selectedCountry !== 'all') {
        if (r.player1.country !== selectedCountry && r.player2.country !== selectedCountry) return false;
      }

      if (winnerFilter === 'firstPick') {
        const isP1First = r.firstPickPlayerId === r.player1.playerId;
        const p1Won = r.winner === 1;
        if ((isP1First && !p1Won) || (!isP1First && p1Won)) return false;
      } else if (winnerFilter === 'secondPick') {
        const isP1First = r.firstPickPlayerId === r.player1.playerId;
        const p1Won = r.winner === 1;
        if ((isP1First && p1Won) || (!isP1First && !p1Won)) return false;
      }

      return true;
    });
  }, [replays, searchMonster, selectedCountry, winnerFilter]);

  return (
    <div className="space-y-6 max-w-[1780px] 2xl:max-w-[1880px] mx-auto pb-16 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#0c1424] via-[#0d172e] to-[#070b12] p-6 sm:p-8 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono font-bold uppercase">
            <Play className="w-3.5 h-3.5" />
            <span>SWRT Live • Guardian 3 & Legend Replay Theater</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            โรงภาพยนตร์รีเพลย์ RTA สด (Pro Replay Theater)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            เจาะลึกการแข่งขันจริงของผู้เล่นระดับ Guardian 3 และ Legend จากทั่วโลก ดูขั้นตอนการดราฟต์มอนสเตอร์ 5v5, ตัวที่โดนแบน, ลีดเดอร์ และเหตุผลเชิงแท็กติกที่ทำให้ชนะ
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3.5 flex items-center gap-4 text-xs font-mono shadow-xl">
            <div>
              <div className="text-slate-400 text-[11px]">รีเพลย์ล่าสุดในระบบ</div>
              <div className="text-rose-400 font-bold text-base">{replays.length} แมตช์ G3/Legend</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <div className="text-slate-400 text-[11px]">เซิร์ฟเวอร์ที่รองรับ</div>
              <div className="text-amber-400 font-bold text-base">Global, Asia, EU, KR</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-[#0c1220] border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xl">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchMonster}
              onChange={(e) => setSearchMonster(e.target.value)}
              placeholder="ค้นหาชื่อมอนสเตอร์ในรีเพลย์..."
              className="w-full bg-[#070b14] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
            />
          </div>

          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="bg-[#070b14] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-400"
          >
            <option value="all">ทุกประเทศ/ภูมิภาค ({uniqueCountries.length})</option>
            {uniqueCountries.map((c) => (
              <option key={c} value={c}>{flagFromCountry(c)} {c}</option>
            ))}
          </select>

          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'ผลการแข่งทั้งหมด' },
              { id: 'firstPick', label: '🥇 First Pick ชนะ' },
              { id: 'secondPick', label: '🥈 Second Pick ชนะ' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setWinnerFilter(btn.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  winnerFilter === btn.id
                    ? 'bg-rose-600 text-white font-black shadow-md shadow-rose-900/40'
                    : 'bg-white/[0.04] text-slate-300 hover:text-white'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono shrink-0">
          แสดง <span className="text-rose-400 font-bold">{filteredReplays.length}</span> จาก {replays.length} แมตช์
        </div>
      </div>

      {/* Replays Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {filteredReplays.map((r) => {
          const isP1Winner = r.winner === 1;
          const isP1FirstPick = r.firstPickPlayerId === r.player1.playerId;

          return (
            <div
              key={r.id}
              className="p-5 sm:p-6 rounded-3xl bg-[#0c1220] border border-white/[0.08] hover:border-rose-500/30 transition-all space-y-4 shadow-xl"
            >
              {/* Match Header */}
              <div className="flex items-center justify-between gap-3 flex-wrap border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <span>ID: #{r.id}</span>
                  <span>•</span>
                  <span>{r.date}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10 text-slate-300 text-[11px] font-mono font-bold">
                    {isP1FirstPick ? `${r.player1.name} ได้ First Pick` : `${r.player2.name} ได้ First Pick`}
                  </span>
                </div>
              </div>

              {/* 5v5 Draft Board */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Player 1 Box */}
                <div
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isP1Winner
                      ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-950/25 via-[#070b14] to-[#070b14]'
                      : 'border-white/[0.06] bg-[#070b14]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base">{flagFromCountry(r.player1.country)}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                          <span>{r.player1.name}</span>
                          {isP1Winner && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              🏆 ชนะ
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Rank #{r.player1.rank} • {r.player1.score} pts
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 text-center">
                    {r.player1.monsters.map((m, mIdx) => (
                      <div key={mIdx} className="flex flex-col items-center relative group">
                        <div className="relative">
                          <MonsterAvatar monster={m} size="sm" showStars={false} />
                          {m.isLeader && (
                            <div className="absolute -top-1.5 -left-1 bg-amber-500 text-slate-950 p-0.5 rounded-full shadow" title="ลีดเดอร์">
                              <Crown className="w-2.5 h-2.5" />
                            </div>
                          )}
                          {m.isBanned && (
                            <div className="absolute inset-0 bg-rose-950/80 rounded-xl flex items-center justify-center border border-rose-500">
                              <Ban className="w-4 h-4 text-rose-300" />
                            </div>
                          )}
                        </div>
                        <span className={`text-[10px] truncate max-w-full mt-1 ${m.isBanned ? 'line-through text-rose-400' : 'text-slate-300'}`}>
                          {m.thaiName || m.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Player 2 Box */}
                <div
                  className={`p-3.5 rounded-2xl border transition-all ${
                    !isP1Winner
                      ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-950/25 via-[#070b14] to-[#070b14]'
                      : 'border-white/[0.06] bg-[#070b14]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base">{flagFromCountry(r.player2.country)}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                          <span>{r.player2.name}</span>
                          {!isP1Winner && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              🏆 ชนะ
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Rank #{r.player2.rank} • {r.player2.score} pts
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 text-center">
                    {r.player2.monsters.map((m, mIdx) => (
                      <div key={mIdx} className="flex flex-col items-center relative group">
                        <div className="relative">
                          <MonsterAvatar monster={m} size="sm" showStars={false} />
                          {m.isLeader && (
                            <div className="absolute -top-1.5 -left-1 bg-amber-500 text-slate-950 p-0.5 rounded-full shadow" title="ลีดเดอร์">
                              <Crown className="w-2.5 h-2.5" />
                            </div>
                          )}
                          {m.isBanned && (
                            <div className="absolute inset-0 bg-rose-950/80 rounded-xl flex items-center justify-center border border-rose-500">
                              <Ban className="w-4 h-4 text-rose-300" />
                            </div>
                          )}
                        </div>
                        <span className={`text-[10px] truncate max-w-full mt-1 ${m.isBanned ? 'line-through text-rose-400' : 'text-slate-300'}`}>
                          {m.thaiName || m.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Match Highlights & Explorer Action */}
              <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-white/[0.06] text-xs">
                <div className="text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    ผู้ชนะ: <strong className="text-white">{isP1Winner ? r.player1.name : r.player2.name}</strong> ({isP1FirstPick === isP1Winner ? 'ได้เปรียบ First Pick' : 'Second Pick เคาน์เตอร์ชนะ'})
                  </span>
                </div>

                <button
                  onClick={() => onNavigate && onNavigate('draft-explorer')}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 font-bold flex items-center gap-1 cursor-pointer transition-all text-xs"
                >
                  <span>ซ้อมดราฟต์ใน 5v5</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredReplays.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-rose-400 mx-auto" />
            <div className="text-sm font-bold text-white">ไม่พบรีเพลย์ที่ตรงกับเงื่อนไข</div>
            <p className="text-xs text-slate-500">ลองล้างคำค้นหาหรือเปลี่ยนประเทศผู้เล่น</p>
          </div>
        )}
      </div>
    </div>
  );
}
