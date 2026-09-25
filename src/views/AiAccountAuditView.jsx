import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles, Shield, Zap, Flame, Trophy, Award, CheckCircle2,
  XCircle, ArrowRight, RefreshCw, BarChart3, ChevronRight,
  TrendingUp, Compass, HeartPulse, AlertTriangle, Layers,
  ExternalLink, Bot, Check, Info, Radio
} from 'lucide-react';
import { loadBox, saveBox } from '../utils/boxStorage';
import { auditAccount } from '../utils/accountAudit';
import { loadDemoBox } from '../utils/swexImport';
import * as aegisLive from '../services/aegisLive';

export default function AiAccountAuditView({ onNavigate, onOpenAuth }) {
  const [box, setBox] = useState(() => loadBox());
  const [isAuditing, setIsAuditing] = useState(false);
  const [metaFilter, setMetaFilter] = useState('all'); // 'all' | 'owned' | 'missing'
  const [checkedActions, setCheckedActions] = useState({});
  const [aiAdvice, setAiAdvice] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  // Reload box if storage updates
  useEffect(() => {
    const handleBoxUpdate = () => {
      setBox(loadBox());
    };
    window.addEventListener('swm:box-updated', handleBoxUpdate);
    return () => window.removeEventListener('swm:box-updated', handleBoxUpdate);
  }, []);

  const auditResult = useMemo(() => {
    if (!box) return null;
    return auditAccount(box);
  }, [box]);

  // Sync with AegisLink
  const handleAegisSync = async () => {
    setSyncStatus('กำลังเชื่อมต่อ AegisLink...');
    try {
      const snap = await aegisLive.fetchLiveSnapshot();
      if (snap?.wizardInfo) {
        const { parseSwexExport } = await import('../utils/swexImport');
        const parsed = parseSwexExport(snap);
        if (parsed && parsed.units?.length) {
          saveBox(parsed);
          setBox(parsed);
          setSyncStatus(`ซิงค์ข้อมูลล่าสุดสำเร็จ (${parsed.units.length} ตัว)`);
          setTimeout(() => setSyncStatus(null), 4000);
          return;
        }
      }
      setSyncStatus('ไม่พบข้อมูลจาก AegisLink กรุณาตรวจสอบว่าเปิด SWEX และปลั๊กอินอยู่');
      setTimeout(() => setSyncStatus(null), 5000);
    } catch (err) {
      setSyncStatus('เกิดข้อผิดพลาดในการเชื่อมต่อ AegisLink');
      setTimeout(() => setSyncStatus(null), 4000);
    }
  };

  const handleLoadDemo = () => {
    const demo = loadDemoBox();
    setBox(demo);
  };

  const handleActionToggle = (idx) => {
    setCheckedActions((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // Generate deeper AI Advice
  const handleAskAiCoach = async () => {
    if (!auditResult) return;
    setIsAiLoading(true);
    setAiAdvice(null);

    try {
      // Call SWM AI advice endpoint
      const prompt = `ช่วยวิเคราะห์ไอดี Summoners War ดังต่อไปนี้:
ผู้เล่น: ${auditResult.wizard?.name || 'Summoner'}
เกรดประเมิน: ${auditResult.rankGradeTh} (คะแนน ${auditResult.score}/100)
ความเร็ว Swift เร็วสุด: +${auditResult.maxSwiftBonus} SPD
เซ็ต Violent สปีด +140: ${auditResult.violentTiers.p140} ตัว
ประสิทธิภาพรูนเฉลี่ยท็อป 30: ${auditResult.avgTop30Eff}%
ครอบครองมอนสเตอร์เมต้า: ${auditResult.metaCoveragePct}% (ขาด ${auditResult.missingMeta.slice(0, 3).map((m) => m.name).join(', ') || 'ไม่มี'})
ช่วยสรุปจุดแข็ง 2 ข้อ จุดที่ต้องรีบปรับปรุง 2 ข้อ และแนวทางการฟาร์มดันเจี้ยนในสัปดาห์นี้อย่างเจาะจง สไตล์โค้ชการ์เดียน`;

      const res = await fetch('/api/ai/advise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, stream: false }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiAdvice(data.answer || data.text || 'การวิเคราะห์เสร็จสมบูรณ์');
      } else {
        // Fallback rule-based Guardian AI response
        setAiAdvice(
          `🎯 **คำแนะนำจาก Guardian AI Coach สำหรับคุณ ${auditResult.wizard?.name || ''}:**\n\n` +
          `1. **จุดแข็งสูงสุด (Strengths):** เซ็ตสปีด Swift ของคุณ (+${auditResult.maxSwiftBonus} SPD) อยู่ในเทียร์ท็อป 1% สามารถเปิดเทิร์น 1 ข่มขู่คู่ต่อสู้ใน RTA และ Siege ได้อย่างสบาย อีกทั้งตัวเมต้าครอบคลุมถึง ${auditResult.metaCoveragePct}%\n\n` +
          `2. **จุดที่ต้องพัฒนา (Next Steps):** ควรเพิ่มปริมาณเซ็ต Violent สปีด +140+ ขึ้นไปสำหรับตัวซัพพอร์ตและ Bruiser (เช่น แฮกัง, วูซ่า, โดมินิค) และทำการ Gem/Grind รูนสล็อต 1, 3, 5 ให้สุดค่า\n\n` +
          `3. **คำแนะนำดันเจี้ยน:** มุ่งเน้น **${auditResult.farmingPriorities[0]?.dungeon}** และจัดเวลาลงดันเจี้ยน Abyss อย่างน้อยวันละ 30-50 รอบเพื่อหารูน 6★ Legend สล็อต 4/6 มาเสริมความแกร่ง!`
        );
      }
    } catch (e) {
      setAiAdvice(
        `🎯 **คำแนะนำจาก Guardian AI Coach สำหรับคุณ ${auditResult.wizard?.name || ''}:**\n\n` +
        `1. **จุดแข็งสูงสุด:** ความเร็วรูน Swift +${auditResult.maxSwiftBonus} SPD ถือว่าสูงมาก พร้อมสำหรับแรงค์ ${auditResult.rankGrade}\n\n` +
        `2. **คำแนะนำการฟาร์ม:** แนะนำเน้นฟาร์ม **${auditResult.farmingPriorities[0]?.dungeon}** เพื่อเสริมเซ็ต ${auditResult.farmingPriorities[0]?.sets} ให้มีตัวทำเกมมากขึ้น`
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!box || !auditResult) {
    return (
      <div className="max-w-[1200px] mx-auto py-12 px-4 animate-in fade-in duration-300">
        <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#121c2c] to-[#0a101b] p-8 sm:p-12 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-6">
            <HeartPulse className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
            🤖 ระบบ AI วินิจฉัย & ตรวจสุขภาพไอดี (Account Audit)
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto mb-8 text-sm leading-relaxed">
            ยังไม่พบข้อมูลไอดีของคุณในระบบ นำเข้าไฟล์ JSON จาก SWEX หรือใช้การเชื่อมต่อสดผ่าน AegisLink เพื่อประเมินระดับแรงค์ RTA, คุณภาพรูน Swift/Violent และจัดลำดับการฟาร์ม
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleAegisSync}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Radio className="w-4 h-4" />
              ดึงข้อมูลสด 1-Click (AegisLink)
            </button>
            <button
              onClick={handleLoadDemo}
              className="px-6 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-white font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              ทดลองดูตัวอย่าง (Demo Box)
            </button>
            <button
              onClick={() => onNavigate('my-box')}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              ไปที่หน้านำเข้า My Box
            </button>
          </div>
          {syncStatus && (
            <p className="mt-4 text-xs font-semibold text-emerald-400 animate-pulse">
              {syncStatus}
            </p>
          )}
        </div>
      </div>
    );
  }

  const filteredMeta = auditResult.ownedMeta.concat(auditResult.missingMeta).filter((m) => {
    if (metaFilter === 'owned') return m.isOwned;
    if (metaFilter === 'missing') return !m.isOwned;
    return true;
  });

  return (
    <div className="space-y-6 max-w-[1780px] 2xl:max-w-[1880px] mx-auto pb-16 animate-in fade-in duration-300">
      {/* 1. Header Overview & Rank Badge */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#121c2e] via-[#0d1624] to-[#080d16] p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-xl shadow-amber-500/20 shrink-0">
              <div className="w-full h-full bg-[#0a101b] rounded-2xl flex items-center justify-center text-amber-400">
                <Trophy className="w-7 h-7" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {auditResult.wizard?.name || 'Summoner'}
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {auditResult.rankGrade}
                </span>
                <span className="text-xs text-slate-400">
                  Lv.{auditResult.wizard?.level || 100} • Server: Global/Asia
                </span>
              </div>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                {auditResult.rankDescription}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={handleAegisSync}
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              ซิงค์สด AegisLink
            </button>
            <button
              onClick={handleAskAiCoach}
              disabled={isAiLoading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <Bot className="w-4 h-4" />
              {isAiLoading ? 'AI กำลังประมวลผล...' : 'ขอคำแนะนำ AI Coach'}
            </button>
          </div>
        </div>

        {syncStatus && (
          <div className="mt-4 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {syncStatus}
          </div>
        )}

        {/* Account Quick Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-white/[0.06]">
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">คะแนนรวมไอดี</span>
            <div className="text-xl font-black text-amber-400 mt-0.5 flex items-baseline gap-1">
              {auditResult.score}
              <span className="text-xs text-slate-400 font-normal">/ 100</span>
            </div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">สปีด Swift สูงสุด</span>
            <div className="text-xl font-black text-cyan-400 mt-0.5">
              +{auditResult.maxSwiftBonus} <span className="text-xs text-slate-400 font-normal">SPD</span>
            </div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">ความเร็วตัวเร็วสุด</span>
            <div className="text-xl font-black text-emerald-400 mt-0.5">
              {auditResult.maxOverallSpd} <span className="text-xs text-slate-400 font-normal">SPD</span>
            </div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">รูนท็อป 30 เฉลี่ย</span>
            <div className="text-xl font-black text-purple-400 mt-0.5">
              {auditResult.avgTop30Eff}%
            </div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">ครอบครองตัวเมต้า</span>
            <div className="text-xl font-black text-blue-400 mt-0.5">
              {auditResult.metaCoveragePct}%
            </div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block font-medium">มอนสเตอร์ 6★</span>
            <div className="text-xl font-black text-white mt-0.5">
              {auditResult.sixStarUnits} <span className="text-xs text-slate-400 font-normal">ตัว</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Coach Detailed Feedback Banner (if requested) */}
      {aiAdvice && (
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-[#181308] to-[#0c0d14] p-6 shadow-xl animate-in fade-in duration-300">
          <div className="flex items-center gap-3 text-amber-400 font-black text-sm mb-3">
            <Bot className="w-5 h-5" />
            บทวิเคราะห์และข้อเสนอแนะเชิงลึกจาก Guardian AI Advisor
          </div>
          <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line space-y-2">
            {aiAdvice}
          </div>
        </div>
      )}

      {/* 2. Speed Benchmarks & Turn 1 Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-[#0c121d] border border-white/[0.06] rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">ความเร็ว & การเปิดเทิร์น 1 (Swift Benchmarks)</h2>
            </div>
            <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
              สูงสุด +{auditResult.maxSwiftBonus} SPD
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-5">
            สถิติมอนสเตอร์ที่ใส่เซ็ต Swift แยกตามระดับความเร็วโบนัส เพื่อใช้วัดความได้เปรียบในการชิงเทิร์นแรกของ RTA และ Siege
          </p>

          {/* Swift Tier Counts */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-[#121927] border border-amber-500/20 rounded-xl p-3.5 text-center">
              <span className="text-xs text-amber-300 font-bold block">+220 SPD ขอบแดง G3</span>
              <span className="text-2xl font-black text-white mt-1 block">{auditResult.swiftTiers.p220}</span>
              <span className="text-[10px] text-slate-400">ระดับหัวแถวประเทศ</span>
            </div>
            <div className="bg-[#121927] border border-yellow-500/20 rounded-xl p-3.5 text-center">
              <span className="text-xs text-yellow-300 font-bold block">+210 SPD ระดับ G1-G2</span>
              <span className="text-2xl font-black text-white mt-1 block">{auditResult.swiftTiers.p210}</span>
              <span className="text-[10px] text-slate-400">การันตีสปีดนำใน RTA</span>
            </div>
            <div className="bg-[#121927] border border-blue-500/20 rounded-xl p-3.5 text-center">
              <span className="text-xs text-blue-300 font-bold block">+200 SPD ระดับ C3-G1</span>
              <span className="text-2xl font-black text-white mt-1 block">{auditResult.swiftTiers.p200}</span>
              <span className="text-[10px] text-slate-400">สปีดมาตรฐานแข่งขอบทอง</span>
            </div>
            <div className="bg-[#121927] border border-white/[0.06] rounded-xl p-3.5 text-center">
              <span className="text-xs text-slate-300 font-bold block">+190 SPD</span>
              <span className="text-2xl font-black text-white mt-1 block">{auditResult.swiftTiers.p190}</span>
              <span className="text-[10px] text-slate-400">เซ็ตเปิดเทิร์นรอง</span>
            </div>
            <div className="bg-[#121927] border border-white/[0.06] rounded-xl p-3.5 text-center">
              <span className="text-xs text-slate-300 font-bold block">+180 SPD</span>
              <span className="text-2xl font-black text-white mt-1 block">{auditResult.swiftTiers.p180}</span>
              <span className="text-[10px] text-slate-400">ตัวแก้ทางกิลด์วอร์</span>
            </div>
            <div className="bg-[#121927] border border-white/[0.06] rounded-xl p-3.5 text-center">
              <span className="text-xs text-slate-300 font-bold block">+160 SPD</span>
              <span className="text-2xl font-black text-white mt-1 block">{auditResult.swiftTiers.p160}</span>
              <span className="text-[10px] text-slate-400">ตัวฟาร์มดันเจี้ยน</span>
            </div>
          </div>

          {/* Fastest Swift Units List */}
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
            มอนสเตอร์ Swift ที่เร็วที่สุดในไอดี (Top 4)
          </h3>
          <div className="space-y-2">
            {auditResult.fastestSwift.slice(0, 4).map((u, i) => (
              <div
                key={u.id || i}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.05] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 font-black text-xs flex items-center justify-center border border-amber-500/20">
                    #{i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{u.name}</div>
                    <div className="text-[11px] text-slate-400">
                      Base {u.baseSpd} SPD • รวม {u.spd} SPD
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-amber-400">+{u.bonusSpd} SPD</div>
                  <div className="text-[10px] text-slate-400">
                    {u.sets ? u.sets.join(' / ') : 'Swift'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Violent Quality & Rune Efficiency */}
        <div className="lg:col-span-5 bg-[#0c121d] border border-white/[0.06] rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Flame className="w-5 h-5 text-rose-400" />
                <h2 className="text-lg font-bold text-white">คุณภาพรูน Violent & ประสิทธิภาพ</h2>
              </div>
              <span className="text-xs font-semibold text-rose-400 bg-rose-400/10 px-2.5 py-1 rounded-full border border-rose-400/20">
                {auditResult.violentTiers.totalVio} ตัวใส่ Violent
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-5">
              เซ็ต Violent เป็นหัวใจหลักของการสู้ยาวใน RTA, Arena AD และ Siege Defense
            </p>

            {/* Violent Breakdown */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#121927] border border-white/[0.05]">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-xs text-slate-200 font-bold">Violent +150 SPD ขึ้นไป</span>
                </div>
                <span className="text-sm font-black text-rose-400">{auditResult.violentTiers.p150} ตัว</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#121927] border border-white/[0.05]">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs text-slate-200 font-bold">Violent +140 SPD (เกณฑ์ G1)</span>
                </div>
                <span className="text-sm font-black text-amber-400">{auditResult.violentTiers.p140} ตัว</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#121927] border border-white/[0.05]">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-xs text-slate-200 font-bold">Violent +130 SPD (เกณฑ์ C3)</span>
                </div>
                <span className="text-sm font-black text-blue-400">{auditResult.violentTiers.p130} ตัว</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#121927] border border-white/[0.05]">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                  <span className="text-xs text-slate-200 font-bold">Violent +120 SPD</span>
                </div>
                <span className="text-sm font-black text-slate-300">{auditResult.violentTiers.p120} ตัว</span>
              </div>
            </div>

            {/* Top Violent Units */}
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              มอนสเตอร์ Violent ที่เร็วที่สุดในไอดี
            </h3>
            <div className="space-y-2">
              {auditResult.fastestViolent.slice(0, 3).map((u, i) => (
                <div
                  key={u.id || i}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                >
                  <div className="text-xs font-bold text-white">{u.name}</div>
                  <div className="text-xs font-black text-rose-400">+{u.bonusSpd} SPD</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <span className="text-slate-400">ประสิทธิภาพรูนเฉลี่ยท็อป 30 ตัว:</span>
            <span className="font-black text-purple-400 text-sm">{auditResult.avgTop30Eff}% (S-Tier)</span>
          </div>
        </div>
      </div>

      {/* 4. Recommended Farming Priority */}
      <div className="bg-[#0c121d] border border-white/[0.06] rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">ลำดับความสำคัญในการฟาร์มดันเจี้ยน (AI Priority)</h2>
          </div>
          <button
            onClick={() => onNavigate('live-farm-monitor')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            เปิดระบบตรวจจับฟาร์มสด
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-6">
          คำนวณจากจุดที่ไอดีของคุณขาดหายไปมากที่สุด เพื่อให้การใช้พลังงานได้ผลตอบแทนคุ้มค่าที่สุด
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {auditResult.farmingPriorities.map((fp, i) => {
            const isVeryHigh = fp.priority === 'VERY_HIGH';
            const isHigh = fp.priority === 'HIGH';
            return (
              <div
                key={i}
                className={`rounded-2xl p-5 border relative overflow-hidden flex flex-col justify-between ${
                  isVeryHigh
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : isHigh
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : 'bg-white/[0.02] border-white/[0.06]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase ${
                        isVeryHigh
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : isHigh
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-700/30 text-slate-400 border border-slate-600/30'
                      }`}
                    >
                      {isVeryHigh ? 'เร่งด่วนสูงสุด' : isHigh ? 'สำคัญมาก' : 'แนะนำทั่วไป'}
                    </span>
                    <span className="text-xs font-mono text-slate-400">#อันดับ {i + 1}</span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1.5">{fp.dungeon}</h3>
                  <div className="text-xs font-semibold text-amber-400/90 mb-3">{fp.sets}</div>
                  <p className="text-xs text-slate-300 leading-relaxed">{fp.reason}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/[0.06]">
                  <button
                    onClick={() => onNavigate('dungeons')}
                    className="w-full py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    ดูทีมฟาร์ม Abyss แนะนำ
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Core Meta Monsters Checklist (Top 30 Guardian) */}
      <div className="bg-[#0c121d] border border-white/[0.06] rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-lg font-bold text-white">
                การครอบครองมอนสเตอร์เมต้า Guardian ({auditResult.ownedMeta.length}/30 ตัว)
              </h2>
              <span className="text-xs text-slate-400">
                ตรวจสอบมอนสเตอร์หลัก 30 ตัวที่ถูกหยิบใช้มากที่สุดในศึกชิงแชมป์ RTA และ Siege
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-[#121927] p-1 rounded-xl border border-white/[0.06] self-start sm:self-auto">
            <button
              onClick={() => setMetaFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                metaFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ทั้งหมด (30)
            </button>
            <button
              onClick={() => setMetaFilter('owned')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                metaFilter === 'owned' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              มีแล้ว ({auditResult.ownedMeta.length})
            </button>
            <button
              onClick={() => setMetaFilter('missing')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                metaFilter === 'missing' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ยังขาด ({auditResult.missingMeta.length})
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/[0.04] rounded-full h-2.5 mb-6 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${auditResult.metaCoveragePct}%` }}
          />
        </div>

        {/* Meta Monsters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {filteredMeta.map((m) => {
            return (
              <div
                key={m.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  m.isOwned
                    ? 'bg-[#101726] border-emerald-500/20'
                    : 'bg-white/[0.02] border-white/[0.05] opacity-65 hover:opacity-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        m.element === 'water'
                          ? 'bg-blue-400'
                          : m.element === 'fire'
                          ? 'bg-rose-400'
                          : m.element === 'wind'
                          ? 'bg-amber-400'
                          : m.element === 'light'
                          ? 'bg-yellow-300'
                          : 'bg-purple-400'
                      }`}
                    />
                    <span className="text-sm font-bold text-white">{m.name}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      m.tier === 'SSS'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-blue-500/20 text-blue-300'
                    }`}
                  >
                    {m.tier}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 mb-2 truncate">
                  {m.thaiName}
                </div>

                <div className="text-[11px] text-slate-300 mb-3 bg-white/[0.03] p-1.5 rounded-lg">
                  {m.role}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-[11px]">
                  {m.isOwned ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> มีในไอดี
                    </span>
                  ) : (
                    <span className="text-rose-400 font-medium flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> ยังไม่มี
                    </span>
                  )}
                  {m.ownedUnit && (
                    <span className="text-slate-400 font-mono">
                      +{((m.ownedUnit.spd || 0) - (m.ownedUnit.baseSpd || 0))} SPD
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Action Plan Checklist */}
      <div className="bg-[#0c121d] border border-white/[0.06] rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-2.5 mb-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">แผนการพัฒนาไอดีเร่งด่วน (Action Plan)</h2>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          สิ่งที่ควรทำเพื่อดันระดับแรงค์จากสถานะปัจจุบันของคุณสู่ระดับถัดไป
        </p>

        <div className="space-y-3">
          {auditResult.actionPlan.map((action, idx) => {
            const isDone = action.done || !!checkedActions[idx];
            return (
              <div
                key={idx}
                onClick={() => handleActionToggle(idx)}
                className={`p-4 rounded-xl border flex items-start gap-3.5 cursor-pointer transition-all ${
                  isDone
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                    isDone
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                      : 'border-white/20 bg-white/[0.04]'
                  }`}
                >
                  {isDone && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
                <div className="flex-1">
                  <div
                    className={`text-sm font-bold ${
                      isDone ? 'text-emerald-300 line-through' : 'text-white'
                    }`}
                  >
                    {action.title}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {action.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
