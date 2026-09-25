import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  X,
  CheckCircle2,
  ChevronRight,
  Zap,
  Trophy,
  Shield,
  ArrowUpRight,
  Flame,
  Layers,
  HelpCircle,
  MessageSquare,
  Send,
  RefreshCw,
  Star,
  Info,
  Hammer,
  Gem,
  Swords,
  TrendingUp,
  Award
} from 'lucide-react';
import RuneIcon from './RuneIcon';
import ArtifactIcon from './ArtifactIcon';
import { loadBox } from '../utils/boxStorage';
import { RUNE_SETS } from '../utils/swexImport';
import {
  generateRuneAiInsights,
  askDeepAiRuneAdvice,
  generateSessionAiSummary
} from '../services/aiRuneAdvisor';
import { askAdvisor } from '../services/aiClient';

export default function AiRuneModal({
  isOpen,
  onClose,
  mode = 'rune', // 'rune' | 'session'
  rune = null,
  runs = []
}) {
  const [box, setBox] = useState(() => loadBox());
  const [activeTab, setActiveTab] = useState('insights'); // 'insights' | 'chat'
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [deepAiResult, setDeepAiResult] = useState(null);
  const chatBottomRef = useRef(null);

  // Initialize or reset when opened
  useEffect(() => {
    if (isOpen) {
      const currentBox = loadBox();
      setBox(currentBox);
      setActiveTab('insights');
      setUserInput('');
      setDeepAiResult(null);

      if (mode === 'rune' && rune) {
        const ev = rune.evaluated || rune;
        const insights = generateRuneAiInsights(ev, currentBox);
        const welcomeText = `สวัสดีครับซัมมอนเนอร์! ผมคือ AI วิเคราะห์รูนอัตโนมัติ สำหรับ **${ev.setNameTh || ev.setName} สล็อต ${ev.slot}** ชิ้นนี้ คำแนะนำเบื้องต้นคือ **${ev.recommendationTh}** (ลุ้นสปีดสูงสุด +${ev.maxPotentialSpd} SPD)\n\nคุณสามารถคลิกปุ่มด้านล่างหรือพิมพ์คำถามเพื่อเจาะลึกเฉพาะทางได้เลยครับ`;
        setChatMessages([
          { role: 'assistant', text: welcomeText, time: new Date().toLocaleTimeString() }
        ]);
      } else if (mode === 'session') {
        const summary = generateSessionAiSummary(runs, currentBox);
        const sessionWelcome = `📊 สรุปผลการฟาร์มรอบนี้ทั้งหมด **${summary.totalRuns} รอบ**: อัตราการเก็บรูนอยู่ที่ **${summary.keepRate}%** (เก็บได้ ${summary.keepCount} ชิ้น, ขาย ${summary.sellCount} ชิ้น)\nเวลาเฉลี่ย **${summary.avgClearTime} วินาที/รอบ** สอบถามคำแนะนำเรื่องการบริหารจัดการรูนหรือปรับทีมฟาร์มต่อได้เลยครับ`;
        setChatMessages([
          { role: 'assistant', text: sessionWelcome, time: new Date().toLocaleTimeString() }
        ]);
      }
    }
  }, [isOpen, mode, rune, runs]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  if (!isOpen) return null;

  const ev = rune ? (rune.evaluated || rune) : null;
  const localInsights = (mode === 'rune' && ev) ? generateRuneAiInsights(ev, box) : null;
  const sessionSummary = (mode === 'session') ? generateSessionAiSummary(runs, box) : null;

  // Prepare rune object for RuneIcon
  let runeObj = null;
  if (ev) {
    const runeSetId = Number(rune?.rune?.set_id) || (ev.setName ? Number(Object.keys(RUNE_SETS).find((k) => RUNE_SETS[k]?.toLowerCase() === ev.setName.toLowerCase())) : 1) || 1;
    runeObj = {
      set: runeSetId,
      slot: Number(ev.slot) || Number(rune?.rune?.slot_no) || 1,
      q: Number(ev.originalQuality) || Number(rune?.rune?.extra) || 5,
      stars: Number(ev.stars) || Number(rune?.rune?.class) || 6,
      lvl: Number(ev.upgradeLevel) || Number(rune?.rune?.upgrade_curr) || 0,
      ancient: Boolean(rune?.rune?.ancient),
    };
  }

  // Handle Requesting Deep Gemini AI
  const handleDeepAiScan = async () => {
    if (!ev || isAiLoading) return;
    setIsAiLoading(true);
    setActiveTab('insights');

    try {
      const result = await askDeepAiRuneAdvice(rune, box);
      setDeepAiResult(result);
      if (result.aiAnswer) {
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `🤖 **บทวิเคราะห์ระดับ Guardian โดย Gemini Pro:**\n\n${result.aiAnswer}`,
            time: new Date().toLocaleTimeString()
          }
        ]);
      }
    } catch (err) {
      console.error('Deep AI Error:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Handle User Sending Chat Message
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || userInput).trim();
    if (!text || isAiLoading) return;

    const userMsg = { role: 'user', text, time: new Date().toLocaleTimeString() };
    setChatMessages((prev) => [...prev, userMsg]);
    setUserInput('');
    setIsAiLoading(true);

    try {
      let promptContext = '';
      if (mode === 'rune' && ev) {
        promptContext = `ข้อมูลรูน: ${ev.setNameTh} ช่อง ${ev.slot} (+${ev.maxPotentialSpd} Max SPD, ประสิทธิภาพสูงสุด ${ev.maxPotentialEff}%) ออปหลัก ${ev.mainStat?.nameTh}+${ev.mainStat?.value}, ซับสเตตัส: ${(ev.subs || []).map(s => s.nameTh + '+' + s.value).join(', ')}`;
      } else {
        promptContext = `สรุปผลการฟาร์ม ${sessionSummary?.totalRuns} รอบ, อัตราเก็บ ${sessionSummary?.keepRate}%, รูนตำนาน ${sessionSummary?.legendCount} ชิ้น`;
      }

      const res = await askAdvisor({
        kind: 'chat',
        question: `บริบท: ${promptContext}\nคำถามผู้ใช้: ${text}`,
        context: { source: 'live_farm_chat', rune: ev }
      });

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res.answer || 'ขออภัยครับ ไม่สามารถสร้างคำตอบได้ในขณะนี้',
          time: new Date().toLocaleTimeString()
        }
      ]);
    } catch (err) {
      // Local smart response fallback
      let fallbackText = '';
      if (text.includes('ตีบวก') || text.includes('โรล')) {
        fallbackText = `💡 **คำแนะนำการตีบวกจากระบบ Guardian Engine:**\nแนะนำให้ตี +3 และ +6 เพื่อเช็คสเตตัสแรก หากเป็นรูนที่มี Sub SPD และติด SPD ต่อเนื่อง ให้ดันถึง +9 หรือ +12 ทันที แต่ถ้าหลุดไปลงสเตตัสแฟลต 2 ครั้งติด ให้หยุดเพื่อประหยัดมานา`;
      } else if (text.includes('ใส่ให้ใคร') || text.includes('มอนสเตอร์') || text.includes('ตัวไหน')) {
        const topUnits = localInsights?.matchedMonsters?.filter(m => m.owned).map(m => m.name).join(', ') || 'มอนสเตอร์สายดาเมจ/ความเร็ว';
        fallbackText = `💡 **มอนสเตอร์ในไอดีของคุณที่แนะนำ:**\nจากชุดรูน ${ev?.setNameTh || 'นี้'} รูนชิ้นนี้เหมาะกับ **${topUnits}** มากที่สุด โดยเน้นการจัดคอมโบสปีดสเตตัสร่วมกับเซ็ต Will หรือ Revenge`;
      } else {
        fallbackText = `💡 รูนชิ้นนี้ (${ev?.setNameTh || 'รูน'} ช่อง ${ev?.slot || 1}) มีความคุ้มค่าระดับ **${ev?.recommendationTh || 'แนะนำพิจารณา'}** หากสเตตัสเข้าพวกกับสายบรูเซอร์หรือสปีดจูนเนอร์ แนะนำเก็บไว้เป็นตัวเลือกในไอดีครับ`;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: fallbackText,
          time: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const quickPrompts = mode === 'rune' ? [
    'ถ้าโรลไม่ลงสปีดเลย ควรขายหรือเก็บไว้?',
    'ควรใส่ให้ตัวไหนในไอดีของฉันดีที่สุด?',
    'สเต็ปการตีบวก +3 ถึง +12 ควรเช็คอะไรบ้าง?',
    'หิน Grind และ Gem ควรแปลงสเตตัสไหนออก?'
  ] : [
    'รอบนี้ดรอปรูนคุ้มค่าพลังงานไหม?',
    'ควรเน้นฟาร์มดันเจี้ยนไหนต่อดี?',
    'ช่วยแนะแนวทางการประหยัดมานาในการตีรูน'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-[#090e17] border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-500/10 text-white overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08] bg-gradient-to-r from-[#0c1626] to-[#0a101d] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-white">
                  {mode === 'rune' ? 'AI วิเคราะห์รูนเชิงลึก' : 'AI สรุปผล & โค้ชการฟาร์ม'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                  Guardian Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {mode === 'rune'
                  ? 'แมตช์มอนสเตอร์ในไอดีของคุณ พร้อมวางแผนตีบวก +3/+6/+9/+12 และการเจียระไน'
                  : 'วิเคราะห์อัตราดรอป ประสิทธิภาพรอบฟาร์ม และกลยุทธ์การบริหารรูน'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-[#070b12] border-b border-white/[0.06] text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'insights'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{mode === 'rune' ? 'บทวิเคราะห์ & มอนสเตอร์แนะนำ' : 'สรุปผล & สถิติภาพรวม'}</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>พูดคุยปรึกษา AI ({chatMessages.length})</span>
          </button>

          {mode === 'rune' && (
            <button
              onClick={handleDeepAiScan}
              disabled={isAiLoading}
              className="ml-auto px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow transition-all disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
              <span>{isAiLoading ? 'กำลังวิเคราะห์...' : 'ขอคำแนะนำ Gemini Pro'}</span>
            </button>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 scrollbar-thin">
          
          {/* TAB 1: INSIGHTS & ROADMAP */}
          {activeTab === 'insights' && (
            <>
              {/* Rune Showcase Banner */}
              {mode === 'rune' && ev && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0d1c28] via-[#091522] to-[#080d17] border border-white/[0.08] shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {runeObj && (
                      <div className="shrink-0 ring-2 ring-white/15 rounded-2xl p-1 bg-black/40">
                        <RuneIcon rune={runeObj} size={76} showLevel={false} />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xl font-black text-white">{ev.setNameTh}</h3>
                        <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          ช่อง {ev.slot}
                        </span>
                        <span className="text-amber-400 text-xs tracking-widest">
                          {'★'.repeat(Math.min(6, ev.stars || 6))}
                        </span>
                        <span className="text-xs font-medium text-slate-400">({ev.qualityName})</span>
                      </div>

                      <div className="mt-1.5 text-xs text-slate-300 flex items-center gap-2 flex-wrap">
                        <span>ออปชั่นหลัก: <strong className="text-white">{ev.mainStat?.nameTh} +{ev.mainStat?.value}</strong></span>
                        {ev.innate && (
                          <span className="text-amber-300">
                            • แฝง: <strong>{ev.innate.nameTh} +{ev.innate.value}</strong>
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-xs">
                        <span className="text-slate-400">
                          Max Potential SPD: <strong className="text-amber-400 font-mono text-sm">+{ev.maxPotentialSpd}</strong>
                        </span>
                        <span className="text-slate-400">
                          Max Potential Eff: <strong className="text-cyan-300 font-mono">{ev.maxPotentialEff}%</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0 self-stretch sm:self-center justify-center">
                    <span className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-center border shadow-md ${
                      ev.recommendation === 'KEEP_INSTANT'
                        ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50'
                        : ev.recommendation === 'ROLL_TEST'
                        ? 'bg-blue-500/25 text-blue-300 border-blue-500/50'
                        : 'bg-rose-500/25 text-rose-300 border-rose-500/50'
                    }`}>
                      {ev.recommendationTh}
                    </span>
                    <span className="text-[11px] text-slate-400 text-center sm:text-right max-w-[200px] leading-tight">
                      {ev.reason}
                    </span>
                  </div>
                </div>
              )}

              {/* SECTION: Recommended Monsters in User's Box */}
              {mode === 'rune' && localInsights && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <Swords className="w-4 h-4 text-cyan-400" />
                      <span>มอนสเตอร์ที่เหมาะสม (ค้นหาจากไอดีของคุณ {box?.units?.length ? `${box.units.length} ตัว` : ''})</span>
                    </h4>
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      มีในไอดี {localInsights.ownedCount} ตัว
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {localInsights.matchedMonsters.map((cand, cIdx) => (
                      <div
                        key={cIdx}
                        className={`p-3 rounded-2xl border transition-all ${
                          cand.owned
                            ? 'bg-emerald-500/[0.07] border-emerald-500/30 text-white shadow-sm'
                            : 'bg-white/[0.02] border-white/5 text-slate-400 opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{cand.thaiName || cand.name}</span>
                            {cand.owned ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> มีในไอดี
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-slate-400 border border-white/10">
                                ยังไม่มี
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-cyan-400 font-mono">{cand.role}</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1.5 leading-snug">
                          {cand.desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{localInsights.tacticalTip}</span>
                  </div>
                </div>
              )}

              {/* SECTION: Upgrade Roadmap (+3, +6, +9, +12) */}
              {mode === 'rune' && localInsights && (
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <span>แผนการตีบวกทีละขั้น (Upgrade Roadmap & Checkpoint)</span>
                  </h4>

                  <div className="space-y-2">
                    {localInsights.upgradePlan.map((step, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3"
                      >
                        <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono font-black text-xs flex items-center justify-center shrink-0">
                          {sIdx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white">{step.step}</span>
                            <span className="text-amber-400 font-mono font-semibold">{step.target}</span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            {step.action}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION: Grind & Gem Optimization */}
              {mode === 'rune' && localInsights && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black text-amber-300">
                      <Hammer className="w-4 h-4" />
                      <span>คำแนะนำเจียระไน (Grindstone)</span>
                    </div>
                    {localInsights.grindAdvice.length > 0 ? (
                      localInsights.grindAdvice.map((g, gIdx) => (
                        <div key={gIdx} className="text-xs text-slate-300 flex items-start gap-1.5">
                          <span className="text-amber-400">•</span>
                          <span>{g}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-400">รูนชิ้นนี้ไม่มีออปชันเปอร์เซ็นต์ที่เจียระไนได้</div>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black text-cyan-300">
                      <Gem className="w-4 h-4" />
                      <span>คำแนะนำแปลงออป (Enchant Gem)</span>
                    </div>
                    {localInsights.gemAdvice.length > 0 ? (
                      localInsights.gemAdvice.map((g, gIdx) => (
                        <div key={gIdx} className="text-xs text-slate-300 flex items-start gap-1.5">
                          <span className="text-cyan-400">•</span>
                          <span>{g}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-400">ออปชันลงตัวดีแล้ว ไม่จำเป็นต้องแปลงออป</div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION: Session Summary (Mode: Session) */}
              {mode === 'session' && sessionSummary && (
                <div className="space-y-5">
                  {/* Session Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                      <div className="text-xs text-slate-400 font-medium">รอบทั้งหมด</div>
                      <div className="text-2xl font-black text-white mt-1 font-mono">{sessionSummary.totalRuns}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">เฉลี่ย {sessionSummary.avgClearTime}s</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/20 text-center">
                      <div className="text-xs text-emerald-400 font-medium">อัตราการเก็บ</div>
                      <div className="text-2xl font-black text-emerald-300 mt-1 font-mono">{sessionSummary.keepRate}%</div>
                      <div className="text-[11px] text-slate-300 mt-0.5">เก็บ {sessionSummary.keepCount} ชิ้น</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-rose-500/[0.08] border border-rose-500/20 text-center">
                      <div className="text-xs text-rose-400 font-medium">ขายทิ้ง (ประหยัดมานา)</div>
                      <div className="text-2xl font-black text-rose-300 mt-1 font-mono">{sessionSummary.sellCount}</div>
                      <div className="text-[11px] text-slate-300 mt-0.5">ชิ้นที่ต่ำกว่าเกณฑ์</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-500/[0.08] border border-amber-500/20 text-center">
                      <div className="text-xs text-amber-400 font-medium">รูน 6★ Legend</div>
                      <div className="text-2xl font-black text-amber-300 mt-1 font-mono">{sessionSummary.legendCount}</div>
                      <div className="text-[11px] text-slate-300 mt-0.5">ระดับตำนานสีส้ม</div>
                    </div>
                  </div>

                  {/* Top 3 Best Runes of the Session */}
                  {sessionSummary.bestRunes.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span>รูนยอดเยี่ยมที่สุดประจำรอบฟาร์มนี้ (Top 3 Holy Grail)</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {sessionSummary.bestRunes.map((run, rIdx) => {
                          const evR = run.evaluated;
                          const rSetId = Number(run.rune?.set_id) || 1;
                          const rObj = {
                            set: rSetId,
                            slot: Number(evR.slot) || 1,
                            q: Number(evR.originalQuality) || 5,
                            stars: 6,
                            lvl: 0,
                          };
                          return (
                            <div key={rIdx} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                              <div className="flex items-center gap-2.5">
                                <RuneIcon rune={rObj} size={48} showLevel={false} />
                                <div>
                                  <div className="text-xs font-bold text-white">{evR.setNameTh} ช่อง {evR.slot}</div>
                                  <div className="text-[11px] text-amber-300 font-mono">Max +{evR.maxPotentialSpd} SPD</div>
                                </div>
                              </div>
                              <div className="text-[11px] text-slate-300 pt-1.5 border-t border-white/5 leading-snug">
                                {evR.mainStat.nameTh} +{evR.mainStat.value} • {evR.maxPotentialEff}% Eff
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* AI Coaching Tips */}
                  <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black text-cyan-300">
                      <Sparkles className="w-4 h-4" />
                      <span>บทวิเคราะห์และคำแนะนำจากโค้ช AI</span>
                    </div>
                    {sessionSummary.coachingTips.map((tip, tIdx) => (
                      <div key={tIdx} className="text-xs text-cyan-100 flex items-start gap-2">
                        <span className="text-cyan-400">•</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: INTERACTIVE AI CHAT */}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              {/* Message List */}
              <div className="space-y-3 min-h-[220px]">
                {chatMessages.map((msg, mIdx) => (
                  <div
                    key={mIdx}
                    className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shrink-0 text-xs">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-cyan-500 text-slate-950 font-medium'
                          : 'bg-white/[0.04] border border-white/5 text-slate-200'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                      <div className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-slate-800' : 'text-slate-500'}`}>
                        {msg.time}
                      </div>
                    </div>
                  </div>
                ))}

                {isAiLoading && (
                  <div className="flex items-center gap-2 text-xs text-cyan-400 p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 w-fit">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>AI กำลังประมวลผลข้อมูลและเมต้าเกม...</span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                <div className="text-[11px] text-slate-400 font-medium">คำถามยอดฮิตที่แนะนำ:</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {quickPrompts.map((q, qIdx) => (
                    <button
                      key={qIdx}
                      onClick={() => handleSendMessage(q)}
                      disabled={isAiLoading}
                      className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-[11px] text-slate-300 hover:text-white transition cursor-pointer text-left disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  placeholder="พิมพ์คำถามเกี่ยวกับรูนชิ้นนี้ หรือปรึกษาตัวใส่..."
                  disabled={isAiLoading}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-white/[0.05] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!userInput.trim() || isAiLoading}
                  className="px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ส่งคำถาม</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-[#070b12] flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>เชื่อมต่อกล่องมอนสเตอร์: <strong>{box?.wizard?.name || 'PedictU'}</strong> ({box?.units?.length || 0} มอนสเตอร์)</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
}
