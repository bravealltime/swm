import React, { useState, useEffect } from 'react';
import {
  Compass, Radio, Sparkles, Trophy, Volume2, VolumeX, CheckCircle2,
  XCircle, AlertTriangle, RefreshCw, Zap, Flame, Shield, ArrowUpRight,
  Filter, Play, Clock, HelpCircle, Layers } from 'lucide-react';
import * as aegisLive from '../services/aegisLive';
import { evaluateRune } from '../utils/runeEvaluator';
import { isAudioMuted, toggleAudioMute, playLegendAlertSound, playDropSound } from '../utils/soundEffects';
import AccountSuiteHeader from '../components/AccountSuiteHeader';

const DUNGEON_NAMES = {
  1001: 'Giants Keep (ยักษ์)',
  2001: 'Dragons Lair (มังกร)',
  3001: 'Necropolis (เนโคร)',
  4001: 'Spiritual Realm (สปิริตชวล)',
  5001: 'Steel Fortress (โกเลมเหล็ก)',
  6001: 'Punishers Crypt (สุสานพิพากษา)',
};

export default function LiveFarmingMonitorView({ onNavigate }) {
  const [liveState, setLiveState] = useState(() => aegisLive.getState());
  const [runs, setRuns] = useState(() => aegisLive.getState().dungeons || []);
  const [filter, setFilter] = useState('all'); // 'all' | 'keep' | 'legend'
  const [muted, setMuted] = useState(() => isAudioMuted());

  useEffect(() => {
    return aegisLive.subscribe((type, payload, st) => {
      setLiveState({ ...st });
      if (type === 'dungeon' || st.dungeons) {
        setRuns([...(st.dungeons || [])]);
      }
    });
  }, []);

  const handleMuteToggle = () => {
    const next = toggleAudioMute();
    setMuted(next);
  };

  const handleTestChime = () => {
    playLegendAlertSound();
  };

  // Demo run simulation for testing
  const handleSimulateDemoRun = () => {
    const isLegend = Math.random() > 0.5;
    const mockRune = {
      slot_no: Math.floor(Math.random() * 6) + 1,
      class: 6,
      extra: isLegend ? 5 : 4,
      set_id: [3, 13, 15, 5, 10][Math.floor(Math.random() * 5)],
      pri_eff: [[8, 42], [2, 11], [4, 11], [6, 11]][Math.floor(Math.random() * 4)],
      sec_eff: [
        [8, Math.floor(Math.random() * 3) + 4],
        [4, Math.floor(Math.random() * 4) + 5],
        [9, Math.floor(Math.random() * 3) + 4],
        [10, Math.floor(Math.random() * 4) + 4],
      ],
    };

    const evaluated = evaluateRune(mockRune);
    const demoRun = {
      at: Date.now(),
      dungeonId: 2001,
      stageId: 12,
      win: true,
      clearTimeSec: (Math.random() * 20 + 38).toFixed(1),
      rune: mockRune,
      evaluated,
    };

    if (evaluated.isLegend6Star) {
      playLegendAlertSound();
    } else {
      playDropSound();
    }

    setRuns((prev) => [demoRun, ...prev].slice(0, 50));
  };

  const filteredRuns = runs.filter((r) => {
    if (!r.evaluated) return filter === 'all';
    if (filter === 'keep') return r.evaluated.recommendation !== 'SELL_RECOMMENDED';
    if (filter === 'legend') return r.evaluated.isLegend6Star;
    return true;
  });

  const keepCount = runs.filter((r) => r.evaluated && r.evaluated.recommendation !== 'SELL_RECOMMENDED').length;
  const sellCount = runs.filter((r) => r.evaluated && r.evaluated.recommendation === 'SELL_RECOMMENDED').length;
  const legendCount = runs.filter((r) => r.evaluated && r.evaluated.isLegend6Star).length;
  const avgClearTime = runs.length > 0
    ? (runs.reduce((s, r) => s + (Number(r.clearTimeSec) || 0), 0) / runs.length).toFixed(1)
    : '-';

  return (
    <div className="space-y-6 max-w-[1780px] 2xl:max-w-[1880px] mx-auto pb-16 animate-in fade-in duration-300">
      {/* Unified Suite Switcher */}
      <AccountSuiteHeader activeTab="live-farm-monitor" onNavigate={onNavigate} />

      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#0d1f1c] via-[#09151c] to-[#070b12] p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
              <Compass className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Real-time Farming Assistant
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${
                  liveState.status === 'live'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                    : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${liveState.status === 'live' ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                  {liveState.status === 'live' ? 'SWEX สดเชื่อมต่อแล้ว' : 'รอเปิดเกม & SWEX'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-1.5">
                จอตรวจจับการฟาร์มสด <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">& ผู้ช่วยประเมินรูน</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                ลงดันเจี้ยน Abyss หรือ Cairos ในเกม ระบบจะประเมินผลดรอปแบบวินาทีต่อวินาที คำนวณ Max SPD และ Efficiency พร้อมฟันธงทันทีว่าควรเก็บหรือขาย
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={handleMuteToggle}
              className="px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 flex items-center gap-2 cursor-pointer transition-all"
              title={muted ? 'เปิดเสียงแจ้งเตือน' : 'ปิดเสียงแจ้งเตือน'}
            >
              {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              <span>{muted ? 'ปิดเสียงแจ้งเตือน' : 'เปิดเสียงแจ้งเตือน'}</span>
            </button>

            <button
              onClick={handleTestChime}
              className="px-3.5 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-bold text-amber-300 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Sparkles className="w-4 h-4" /> ทดสอบเสียงรูนตำนาน
            </button>

            <button
              onClick={handleSimulateDemoRun}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Play className="w-4 h-4 fill-slate-950" /> ทดลองจำลองรอบฟาร์ม
            </button>
          </div>
        </div>
      </div>

      {/* 2. Quick Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0f18] border border-white/[0.08]">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>รอบฟาร์มที่บันทึก</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-1 font-mono">{runs.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">เวลาเฉลี่ย {avgClearTime} วินาที/รอบ</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0f18] border border-white/[0.08]">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>แนะนำเก็บ (Keep)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 font-mono">{keepCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">รูนผ่านเกณฑ์สปีด/ประสิทธิภาพ</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0f18] border border-white/[0.08]">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>แนะนำขาย (Sell)</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 mt-1 font-mono">{sellCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">ออปชั่นแฟลต 2/4/6 หรือสถิติต่ำ</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0f18] border border-white/[0.08]">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>รูนตำนาน 6★</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-1 font-mono">{legendCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">รูน 6★ Legend ออปชั่นเต็ม</div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'all' ? 'bg-white/10 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            ทั้งหมด ({runs.length})
          </button>
          <button
            onClick={() => setFilter('keep')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'keep' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            เฉพาะที่แนะนำเก็บ ({keepCount})
          </button>
          <button
            onClick={() => setFilter('legend')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'legend' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            รูนตำนาน 6★ ({legendCount})
          </button>
        </div>

        {runs.length > 0 && (
          <button
            onClick={() => setRuns([])}
            className="text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            ล้างประวัติการฟาร์ม
          </button>
        )}
      </div>

      {/* 4. Drops Feed */}
      {filteredRuns.length === 0 ? (
        <div className="p-12 rounded-3xl border border-white/10 bg-[#0a0f18] text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-slate-400 flex items-center justify-center mx-auto">
            <Radio className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">ยังไม่มีรอบการฟาร์มที่บันทึก</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            เปิดเกม Summoners War และเริ่มลงดันเจี้ยน Abyss หรือ Cairos ได้เลย ระบบจะตรวจจับผลดรอปและคำนวณการประเมินให้แบบเรียลไทม์
          </p>
          <button
            onClick={handleSimulateDemoRun}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-all cursor-pointer inline-flex items-center gap-2 mt-2"
          >
            <Play className="w-3.5 h-3.5" /> ทดลองจำลองรอบฟาร์ม 1 รอบ
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRuns.map((run, idx) => {
            const ev = run.evaluated;
            if (!ev) return null;

            return (
              <div
                key={`${run.at}-${idx}`}
                className={`relative overflow-hidden rounded-3xl border p-5 transition-all ${
                  ev.recommendation === 'KEEP_INSTANT'
                    ? 'bg-gradient-to-b from-[#0a1813] to-[#080d14] border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                    : ev.recommendation === 'ROLL_TEST'
                    ? 'bg-gradient-to-b from-[#0e1626] to-[#080d14] border-blue-500/40'
                    : 'bg-gradient-to-b from-[#180a0a] to-[#080d14] border-rose-500/30'
                }`}
              >
                {/* Header: Dungeon name + clear time */}
                <div className="flex items-center justify-between text-xs pb-3 border-b border-white/[0.06]">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {DUNGEON_NAMES[run.dungeonId] || 'Abyss Dungeon'}
                  </span>
                  <span className="font-mono text-slate-400">{run.clearTimeSec ? `${run.clearTimeSec}s` : '-'}</span>
                </div>

                {/* Rune Info & Recommendation Badge */}
                <div className="mt-3.5 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-black text-white">{ev.setNameTh}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/10 text-slate-300">
                        สล็อต {ev.slot}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {ev.stars}★ {ev.qualityName}
                    </div>
                  </div>

                  {/* Recommendation Badge */}
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border shadow-sm ${
                      ev.recommendation === 'KEEP_INSTANT'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : ev.recommendation === 'ROLL_TEST'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {ev.recommendationTh}
                  </span>
                </div>

                {/* Main Stat & Potential SPD */}
                <div className="mt-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">ออปชั่นหลัก:</span>
                    <span className="font-bold text-white">{ev.mainStat.nameTh} +{ev.mainStat.value}</span>
                  </div>

                  {ev.innate && (
                    <div className="flex items-center justify-between text-xs text-amber-200">
                      <span>ออปชั่นแฝง:</span>
                      <span className="font-bold">{ev.innate.nameTh} +{ev.innate.value}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/5">
                    <span className="text-slate-400">ลุ้นสปีดสูงสุด (Max SPD):</span>
                    <span className={`font-mono font-black ${ev.maxPotentialSpd >= 20 ? 'text-amber-300' : 'text-slate-200'}`}>
                      +{ev.maxPotentialSpd} SPD
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">ประสิทธิภาพสูงสุด:</span>
                    <span className="font-mono font-bold text-slate-200">{ev.maxPotentialEff}%</span>
                  </div>
                </div>

                {/* Substats */}
                <div className="mt-3 space-y-1">
                  <div className="text-[11px] text-slate-400 font-medium">สเตตัสรอง (Substats):</div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {ev.subs.map((s, sIdx) => (
                      <div key={sIdx} className="px-2 py-1 rounded-lg bg-white/[0.02] border border-white/5 text-slate-300 flex justify-between">
                        <span>{s.nameTh}:</span>
                        <span className={`font-bold font-mono ${s.type === 8 ? 'text-amber-300' : 'text-white'}`}>
                          +{s.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reason Explanation */}
                <div className="mt-3 pt-2.5 border-t border-white/[0.06] text-[11px] text-slate-300 flex items-start gap-1.5">
                  <span className="shrink-0">💡</span>
                  <span className="leading-snug">{ev.reason}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
