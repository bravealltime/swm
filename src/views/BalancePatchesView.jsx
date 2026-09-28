import React, { useState, useMemo, useCallback } from 'react';
import patchesArchive from '../data/balancePatches.json';
import patchDetailsData from '../data/balancePatchDetails.json';
import patchAi from '../data/balancePatchAi.json';
import { MONSTERS } from '../data/monsters';
import { parsePatchCard, getChangeTypeThai } from '../utils/patchTranslator';
import { exportBalancePatchInfographic } from '../utils/cardExporter';
import { Sparkles, Globe, Languages, Camera, Share2, Check, ArrowRight, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';

// Element metadata
const ELEMENT_CONFIG = {
  Fire: { label: 'ไฟ', color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)', border: '#ea580c', icon: '🔥' },
  Water: { label: 'น้ำ', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.12)', border: '#0284c7', icon: '💧' },
  Wind: { label: 'ลม', color: '#eab308', bg: 'rgba(234, 179, 8, 0.12)', border: '#ca8a04', icon: '🍃' },
  Light: { label: 'แสง', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)', border: '#d97706', icon: '☀️' },
  Dark: { label: 'มืด', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.12)', border: '#9333ea', icon: '🌙' },
};

const IMPACT_CONFIG = {
  buff: { label: 'บัฟ / เพิ่มพลัง', badge: 'BUFF', bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  nerf: { label: 'เนิร์ฟ / ลดทอน', badge: 'NERF', bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  adjustment: { label: 'ปรับสมดุลกลไก', badge: 'REBALANCE', bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
};

export default function BalancePatchesView({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('inspector'); // 'inspector' | 'archive'
  // Available detailed patches
  const availablePatchIds = useMemo(() => Object.keys(patchDetailsData).sort((a, b) => Number(b) - Number(a)), []);
  const [selectedPatchId, setSelectedPatchId] = useState(() => {
    const sorted = Object.keys(patchDetailsData).sort((a, b) => Number(b) - Number(a));
    return sorted[0] || '93';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImpact, setSelectedImpact] = useState('all'); // 'all' | 'buff' | 'nerf' | 'adjustment'
  const [selectedElement, setSelectedElement] = useState('all');
  const [selectedSlot, setSelectedSlot] = useState('all');
  const [langMode, setLangMode] = useState('thai'); // 'thai' | 'en'
  const [isExporting, setIsExporting] = useState(false);

  // Archive search
  const [archiveSearch, setArchiveSearch] = useState('');

  // Current patch adjustments
  const currentPatchAdjustments = useMemo(() => {
    return patchDetailsData[selectedPatchId] || [];
  }, [selectedPatchId]);

  // Patch metadata
  const currentPatchMeta = useMemo(() => {
    return patchesArchive.find(p => p.link && p.link.includes(`balancePatchID=${selectedPatchId}`)) || {
      date: 'July 26, 2026',
      monstersCount: currentPatchAdjustments.length,
      skillCount: currentPatchAdjustments.length,
      daysSincePrevious: '58'
    };
  }, [selectedPatchId, currentPatchAdjustments]);

  // Stats calculation for active patch
  const patchStats = useMemo(() => {
    const list = currentPatchAdjustments;
    const buffs = list.filter(c => c.impact === 'buff').length;
    const nerfs = list.filter(c => c.impact === 'nerf').length;
    const rebalance = list.filter(c => c.impact === 'adjustment').length;
    const uniqueMonsters = new Set(list.map(c => c.monsterName)).size;
    return { total: list.length, buffs, nerfs, rebalance, uniqueMonsters };
  }, [currentPatchAdjustments]);

  // Filtered adjustments
  const filteredAdjustments = useMemo(() => {
    return currentPatchAdjustments.filter(item => {
      // Search
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchName = item.monsterName.toLowerCase().includes(q);
        const matchSkill = item.skillName.toLowerCase().includes(q);
        const matchText = (item.preview || '').toLowerCase().includes(q);
        const matchType = (item.changeTypeTh || '').toLowerCase().includes(q);
        if (!matchName && !matchSkill && !matchText && !matchType) return false;
      }

      // Impact
      if (selectedImpact !== 'all' && item.impact !== selectedImpact) {
        return false;
      }

      // Element
      if (selectedElement !== 'all' && item.element.toLowerCase() !== selectedElement.toLowerCase()) {
        return false;
      }

      // Slot
      if (selectedSlot !== 'all') {
        const badge = (item.skillBadge || '').toUpperCase();
        if (selectedSlot === 'Passive' && !badge.includes('PASSIVE') && !item.skillName.toLowerCase().includes('passive')) return false;
        if (selectedSlot === 'Leader' && !badge.includes('LEADER') && !item.skillName.toLowerCase().includes('leader')) return false;
        if (['S1', 'S2', 'S3'].includes(selectedSlot) && badge !== selectedSlot) return false;
      }

      return true;
    });
  }, [currentPatchAdjustments, searchTerm, selectedImpact, selectedElement, selectedSlot]);

  // Archive filtered
  const filteredArchive = useMemo(() => {
    return patchesArchive.filter(p =>
      p.date.toLowerCase().includes(archiveSearch.toLowerCase()) ||
      p.monstersCount.includes(archiveSearch)
    );
  }, [archiveSearch]);

  // Resolve monster avatar, element, and metadata for winner/loser cards
  const resolveMonsterCardData = useCallback((rawName, adjustments = [], aiData = {}) => {
    const cleanName = rawName.replace(/\s*\([^)]*\)/, '').trim();
    const parenElem = (rawName.match(/\(([^)]+)\)/) || [])[1]?.trim().toLowerCase();

    // Match in patch adjustments
    const patchItem = adjustments.find(a => 
      a.monsterName.toLowerCase() === cleanName.toLowerCase() ||
      a.monsterName.toLowerCase().includes(cleanName.toLowerCase()) ||
      cleanName.toLowerCase().includes(a.monsterName.toLowerCase())
    );

    // Match in MONSTERS catalog
    const catalogItem = MONSTERS.find(m => {
      const mn = m.name.toLowerCase();
      const cn = cleanName.toLowerCase();
      const match = mn === cn || mn.includes(cn) || cn.includes(mn);
      if (!match) return false;
      if (parenElem) return m.element.toLowerCase() === parenElem;
      return true;
    }) || MONSTERS.find(m => m.name.toLowerCase() === cleanName.toLowerCase());

    const element = (parenElem || catalogItem?.element || patchItem?.element || 'water').toLowerCase();
    const avatarUrl = catalogItem?.avatarUrl || patchItem?.monsterImg || '';
    const thaiName = catalogItem?.thaiName || cleanName;
    const note = aiData.perMonster?.[cleanName] || patchItem?.preview || '';

    return {
      rawName,
      cleanName,
      thaiName,
      element,
      avatarUrl,
      note,
      hasMonster: Boolean(catalogItem || patchItem?.monsterImg),
      skillName: patchItem?.skillName || '',
      changeTypeTh: patchItem?.changeTypeTh || patchItem?.changeType || '',
    };
  }, []);

  // Generate 6 highlight cards for infographic export
  const getPatchHighlights = useCallback((patchId, aiData, adjustments) => {
    if (patchId === '93') {
      return [
        {
          name: 'Theomars (Water)',
          element: 'water',
          avatarUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0032_0_2.png',
          tag: '🔥 BUFF ใหญ่แห่งปี',
          tagColor: '#38bdf8',
          keyBuff: 'Triple Crush คูลดาวน์ -1 เทิร์น (เหลือ 2 เทิร์น)',
          desc: 'บัฟใหญ่ที่สุดในรอบหลายปี! Theo วนเจาะเกราะได้เทิร์นเว้นเทิร์น และเบิร์สดาเมจต่อเนื่องใน Siege และ Guild War น่ากลัวยิ่งขึ้น',
          impactText: '⚡ S-Tier • บัฟตัวเมต้าคลาสสิก',
        },
        {
          name: 'Daphnis (Fire)',
          element: 'fire',
          avatarUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0040_1_3.png',
          tag: '⚡ SPEED LEAD 24%',
          tagColor: '#fb7185',
          keyBuff: 'ลีดเดอร์สกิล: ความเร็ว (SPD) ในกิลด์ 24%',
          desc: 'กลายเป็นตัวสปีดลีด 24% สำหรับ Siege และ Guild War ทันที มีทั้งดาเมจ สตริป และสปีดลีดครบเครื่องในตัวเดียว',
          impactText: '⚡ S-Tier • ตัวเปิดไฟต์ยอดนิยม',
        },
        {
          name: 'Praha (Water)',
          element: 'water',
          avatarUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0022_0_1.png',
          tag: '💚 ฮีลแรงขึ้น 35%',
          tagColor: '#34d399',
          keyBuff: 'Daydream ฮีลเพิ่มเป็น 35% ของ MAX HP',
          desc: 'สกิล 3 Daydream ฮีลแรงขึ้นเป็น 35% เพิ่มความถึกทนให้ทีมรับและทีม Bruiser ใน RTA/Siege ยืนชนไฟต์ยาวสบาย',
          impactText: '⚡ S-Tier • เสริมแกร่งทีมรับ',
        },
        {
          name: 'Barbara (Water)',
          element: 'water',
          avatarUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0054_0_0.png',
          tag: '🛡️ เจาะเกราะ +25%',
          tagColor: '#38bdf8',
          keyBuff: 'เจาะเกราะแรงขึ้น 25% ต่อบัฟศัตรู',
          desc: 'เจาะเกราะแรงขึ้นมากต่อบัฟของศัตรู สามารถเบิร์สละลายทีมที่กางบัฟหนาได้เร็วและเด็ดขาดยิ่งขึ้นใน RTA',
          impactText: '⚡ S-Tier • ตัวสวนเมต้าบัฟ',
        },
        {
          name: 'Harmonia (Fire)',
          element: 'fire',
          avatarUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0043_1_2.png',
          tag: '💤 หลับหมู่ 2 เทิร์น',
          tagColor: '#c084fc',
          keyBuff: 'สกิล 2 หลับหมู่ยาวนาน 2 เทิร์นเต็ม',
          desc: 'สกิล 2 ทำให้หลับหมู่ 2 เทิร์นเต็ม หากศัตรูไม่มี Will หรือตัวปลดดีบัฟ จะเสียจังหวะอย่างรุนแรง พลิกเกมรับได้ทันที',
          impactText: '⚡ S-Tier • ควบคุมจังหวะไฟต์',
        },
        {
          name: 'Amelia (Water)',
          element: 'water',
          avatarUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0043_0_4.png',
          tag: '✨ ฮีลฉุกเฉิน +15%',
          tagColor: '#38bdf8',
          keyBuff: 'ร่างมนุษย์ฮีล 15% ให้ตัวที่เลือดน้อย',
          desc: 'ร่างมนุษย์ช่วยเซฟเพื่อนเลือดน้อยได้ดีขึ้น เพิ่มการฮีล 15% ให้ตัวที่เสี่ยงตาย ยืนชนทีมคอนโทรลได้เหนียวแน่น',
          impactText: '⚡ A+ Tier • ซัพพอร์ตยอดเยี่ยม',
        },
      ];
    }

    const list = [];
    const winners = aiData?.winners || [];
    for (const w of winners) {
      const card = resolveMonsterCardData(w, adjustments, aiData);
      list.push({
        name: card.cleanName,
        element: card.element,
        avatarUrl: card.avatarUrl,
        tag: 'BUFF 🔥',
        keyBuff: card.skillName ? `${card.skillName}: ${card.changeTypeTh}` : 'ปรับปรุงสมดุล',
        desc: card.note || 'ได้รับการปรับปรุงสมดุลและทักษะ',
        impactText: '⚡ ได้รับผลประโยชน์ในแพตช์นี้',
      });
      if (list.length >= 6) break;
    }

    if (list.length < 6) {
      for (const a of adjustments) {
        if (list.some(x => x.name.toLowerCase() === a.monsterName.toLowerCase())) continue;
        const cat = MONSTERS.find(m => m.name.toLowerCase() === a.monsterName.toLowerCase());
        list.push({
          name: a.monsterName,
          element: (a.element || 'water').toLowerCase(),
          avatarUrl: cat?.avatarUrl || a.monsterImg || '',
          tag: a.impact === 'buff' ? 'BUFF 🔥' : 'REBALANCE ⚡',
          keyBuff: `${a.skillName}: ${a.changeTypeTh || a.changeType}`,
          desc: a.preview || a.officialText,
          impactText: a.impact === 'buff' ? '🟢 บัฟเสริมความสามารถ' : '🔄 ปรับเปลี่ยนกลไก',
        });
        if (list.length >= 6) break;
      }
    }

    return list;
  }, [resolveMonsterCardData]);

  // Handle Infographic export
  const handleExportInfographic = async () => {
    try {
      setIsExporting(true);
      const aiData = patchAi.patches?.[selectedPatchId] || {};
      const highlights = getPatchHighlights(selectedPatchId, aiData, currentPatchAdjustments);

      await exportBalancePatchInfographic({
        patchId: selectedPatchId,
        date: currentPatchMeta.date || '28 กันยายน 2026',
        overview: aiData.overview || '',
        highlights,
        totalAdjustments: patchStats.total || currentPatchAdjustments.length,
        buffCount: patchStats.buffs || 0,
        nerfCount: patchStats.nerfs || 0,
        preview: true,
      });
    } catch (err) {
      console.error('Failed to export balance patch infographic:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1c2738] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
              Live Balance System • Com2uS Official Updates
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            บันทึกการปรับสมดุลมอนสเตอร์ (Balance Patches)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            เจาะลึกการปรับปรุงทักษะมอนสเตอร์ของ Summoners War แบบเรียลไทม์ พร้อมการวิเคราะห์บัฟ (Buff), เนิร์ฟ (Nerf), ตัวเลขก่อน-หลังปรับ และประวัติย้อนหลังครบ 92 แพตช์
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-[#111927] border border-[#233147] p-1 rounded-xl self-start lg:self-center">
          <button
            onClick={() => setActiveTab('inspector')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'inspector'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>⚡</span>
            <span>เจาะลึกแพตช์ (Inspector)</span>
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'archive'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📜</span>
            <span>ประวัติย้อนหลัง 92 แพตช์</span>
          </button>
        </div>
      </div>

      {activeTab === 'inspector' ? (
        <>
          {/* AI overview of the selected patch (grounded in the official text) */}
          {patchAi.patches?.[selectedPatchId]?.overview && (() => {
            const ai = patchAi.patches[selectedPatchId];
            return (
              <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.07] via-[#10192a]/95 to-[#0b101d] p-4 sm:p-5 space-y-4 shadow-xl shadow-black/40">
                {/* Header with Title and Export Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-white">
                          สรุปบทวิเคราะห์แพตช์ #{selectedPatchId} ภาษาไทย
                        </h3>
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          AI วิเคราะห์จากประกาศ Com2uS
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        ไฮไลท์มอนสเตอร์ที่ได้เปรียบ-เสียเปรียบ พร้อมการปรับตัวในเมต้าปัจจุบัน
                      </p>
                    </div>
                  </div>

                  {/* Export Infographic Button */}
                  <button
                    onClick={handleExportInfographic}
                    disabled={isExporting}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
                    title="สร้างรูปภาพ Infographic สรุปแพตช์ขนาด 1200x820 สำหรับแชร์ลงกลุ่ม Facebook หรือ LINE"
                  >
                    {isExporting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                        <span>กำลังเรนเดอร์รูปภาพ...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 text-slate-950" />
                        <span>📸 ทำสรุปเป็นรูปเข้าใจง่าย (Infographic)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* AI Meta Overview Text */}
                <div className="p-3.5 rounded-xl bg-amber-500/[0.04] border border-amber-500/15">
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                    {ai.overview}
                  </p>
                </div>

                {/* Winners & Losers Section */}
                <div className="space-y-4">
                  {/* Winners (ได้ประโยชน์) */}
                  {ai.winners && ai.winners.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                          <TrendingUp className="w-4 h-4" />
                          <span>มอนสเตอร์ที่ได้ประโยชน์ / บัฟสำคัญ ({ai.winners.length} ตัว)</span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          (คลิกที่การ์ดมอนสเตอร์เพื่อเจาะลึกสกิลด้านล่าง)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {ai.winners.map((n) => {
                          const m = resolveMonsterCardData(n, currentPatchAdjustments, ai);
                          const elemCfg = ELEMENT_CONFIG[m.element.charAt(0).toUpperCase() + m.element.slice(1)] || ELEMENT_CONFIG.Water;
                          return (
                            <div
                              key={n}
                              onClick={() => {
                                setSearchTerm(m.cleanName);
                                const tableEl = document.getElementById('patch-adjustments-section');
                                if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="group relative flex items-center gap-3 p-2.5 rounded-xl bg-[#0f172a]/90 border border-emerald-500/25 hover:border-emerald-400/70 hover:bg-[#142038] transition-all cursor-pointer shadow-sm hover:shadow-md hover:shadow-emerald-500/10"
                              title={`คลิกเพื่อดูรายละเอียดการปรับปรุงของ ${m.cleanName}\n${m.note || m.rawName}`}
                            >
                              {/* Avatar with element ring */}
                              <div className="relative shrink-0">
                                <div
                                  className="w-11 h-11 rounded-full overflow-hidden border-2 bg-slate-900 shadow-inner"
                                  style={{ borderColor: elemCfg.color }}
                                >
                                  {m.avatarUrl ? (
                                    <img
                                      src={m.avatarUrl}
                                      alt={m.cleanName}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                      loading="lazy"
                                      onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center font-bold text-xs" style={{ color: elemCfg.color }}>
                                      {m.cleanName.slice(0, 2)}
                                    </div>
                                  )}
                                </div>
                                <span
                                  className="absolute -bottom-1 -right-1 text-[10px] px-1 py-0.2 rounded-full font-bold shadow leading-none"
                                  style={{ backgroundColor: elemCfg.border, color: '#fff' }}
                                >
                                  {elemCfg.icon}
                                </span>
                              </div>

                              {/* Info */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-bold text-white text-xs truncate group-hover:text-emerald-300 transition-colors">
                                    {m.cleanName}
                                  </span>
                                  <span
                                    className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold"
                                    style={{ color: elemCfg.color, backgroundColor: elemCfg.bg }}
                                  >
                                    {elemCfg.label}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5" title={m.note || m.rawName}>
                                  {m.note || (m.skillName ? `${m.skillName}: ${m.changeTypeTh}` : 'ได้รับการบัฟความสามารถ')}
                                </p>
                              </div>

                              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Losers (ถูกเนิร์ฟ / ปัจจัยที่ต้องระวัง) */}
                  {ai.losers && ai.losers.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                        <TrendingDown className="w-4 h-4" />
                        <span>ถูกเนิร์ฟ / ปัจจัยเมต้าที่ต้องระวัง ({ai.losers.length} รายการ)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {ai.losers.map((n) => {
                          const m = resolveMonsterCardData(n, currentPatchAdjustments, ai);
                          const isMonster = m.hasMonster;
                          const elemCfg = ELEMENT_CONFIG[m.element.charAt(0).toUpperCase() + m.element.slice(1)] || ELEMENT_CONFIG.Dark;

                          if (isMonster) {
                            return (
                              <div
                                key={n}
                                onClick={() => {
                                  setSearchTerm(m.cleanName);
                                  const tableEl = document.getElementById('patch-adjustments-section');
                                  if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="group relative flex items-center gap-3 p-2.5 rounded-xl bg-[#0f172a]/90 border border-rose-500/25 hover:border-rose-400/70 hover:bg-[#201524] transition-all cursor-pointer shadow-sm"
                                title={`คลิกเพื่อดูรายละเอียดการเนิร์ฟของ ${m.cleanName}\n${m.note || m.rawName}`}
                              >
                                <div className="relative shrink-0">
                                  <div
                                    className="w-11 h-11 rounded-full overflow-hidden border-2 bg-slate-900"
                                    style={{ borderColor: '#f43f5e' }}
                                  >
                                    {m.avatarUrl ? (
                                      <img
                                        src={m.avatarUrl}
                                        alt={m.cleanName}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        loading="lazy"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center font-bold text-xs text-rose-400">
                                        {m.cleanName.slice(0, 2)}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-bold text-white text-xs truncate group-hover:text-rose-300 transition-colors">
                                      {m.cleanName}
                                    </span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold bg-rose-500/15 text-rose-400">
                                      NERF
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5" title={m.note || m.rawName}>
                                    {m.note || m.rawName}
                                  </p>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                              </div>
                            );
                          }

                          // Meta Note Warning Pill
                          return (
                            <div
                              key={n}
                              className="flex items-start gap-2.5 p-2.5 rounded-xl bg-rose-500/[0.06] border border-rose-500/25 text-xs text-rose-200"
                            >
                              <span className="text-sm shrink-0">⚠️</span>
                              <span className="line-clamp-2 leading-relaxed text-[11px] sm:text-xs">{n}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-500/15 text-[11px] text-slate-500">
                  <span>สร้างโดย AI เมื่อ {ai.at?.slice(0, 10)} • อ้างอิงจากประกาศทางการ Com2uS</span>
                  <span className="text-amber-400/80">กด 'ทำสรุปเป็นรูป' ด้านบนเพื่อบันทึกการ์ด Infographic สำหรับแชร์</span>
                </div>
              </div>
            );
          })()}

          {/* Patch Selector Bar */}
          <div className="bg-[#111927] border border-[#1e2a3c] p-3 sm:p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span className="text-slate-300">เลือกฉบับแพตช์:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {availablePatchIds.map(pid => {
                const patchItem = patchesArchive.find(p => p.link && p.link.includes(`balancePatchID=${pid}`));
                const isSelected = selectedPatchId === pid;
                return (
                  <button
                    key={pid}
                    onClick={() => {
                      setSelectedPatchId(pid);
                      setSearchTerm('');
                      setSelectedImpact('all');
                      setSelectedElement('all');
                      setSelectedSlot('all');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                        : 'bg-[#162232] text-slate-300 border-[#22334a] hover:border-slate-500 hover:text-white'
                    }`}
                  >
                    <span>Patch #{pid}</span>
                    <span className="text-[11px] opacity-75">
                      {patchItem ? `(${patchItem.date.split(',')[0]})` : ''}
                    </span>
                    {pid === '92' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Patch Overview Metrics Header */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-[#111927] border border-[#1e2a3c] p-3.5 rounded-xl">
              <div className="text-xs text-slate-400">วันที่ประกาศแพตช์</div>
              <div className="text-sm sm:text-base font-bold text-white mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                <span>{currentPatchMeta.date}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                {currentPatchMeta.daysSincePrevious ? `ห่างจากแพตช์ก่อนหน้า ${currentPatchMeta.daysSincePrevious} วัน` : 'แพตช์แรก'}
              </div>
            </div>

            <div className="bg-[#111927] border border-[#1e2a3c] p-3.5 rounded-xl">
              <div className="text-xs text-slate-400">มอนสเตอร์ที่ปรับปรุง</div>
              <div className="text-xl sm:text-2xl font-mono font-bold text-amber-400 mt-1">
                {patchStats.uniqueMonsters} <span className="text-xs font-normal text-slate-400">ตัว</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                รวมทั้งหมด {patchStats.total} สกิล
              </div>
            </div>

            <div className="bg-[#111927] border border-emerald-900/30 p-3.5 rounded-xl">
              <div className="text-xs text-emerald-400 flex items-center gap-1">
                <span>🟢</span> <span>บัฟ / เพิ่มพลัง</span>
              </div>
              <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-400 mt-1">
                {patchStats.buffs} <span className="text-xs font-normal text-slate-400">สกิล</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">เพิ่มดาเมจ/ลดคูลดาวน์</div>
            </div>

            <div className="bg-[#111927] border border-rose-900/30 p-3.5 rounded-xl">
              <div className="text-xs text-rose-400 flex items-center gap-1">
                <span>🔴</span> <span>เนิร์ฟ / ลดทอน</span>
              </div>
              <div className="text-xl sm:text-2xl font-mono font-bold text-rose-400 mt-1">
                {patchStats.nerfs} <span className="text-xs font-normal text-slate-400">สกิล</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">ลดเกจ/ลดผลสกิล</div>
            </div>

            <div className="bg-[#111927] border border-indigo-900/30 p-3.5 rounded-xl col-span-2 sm:col-span-1">
              <div className="text-xs text-indigo-300 flex items-center gap-1">
                <span>🟣</span> <span>ปรับกลไกสกิล</span>
              </div>
              <div className="text-xl sm:text-2xl font-mono font-bold text-indigo-300 mt-1">
                {patchStats.rebalance} <span className="text-xs font-normal text-slate-400">สกิล</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">เปลี่ยนเงื่อนไข/เอฟเฟกต์</div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div id="patch-adjustments-section" className="bg-[#111927] border border-[#1e2a3c] p-4 rounded-xl space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="ค้นหาชื่อมอนสเตอร์ หรือชื่อสกิล เช่น Tetsuya, Qilin, Snipe, Passive..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#162232] border border-[#233348] rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-2 text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Impact filter tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: `ทั้งหมด (${currentPatchAdjustments.length})` },
                  { id: 'buff', label: `🟢 บัฟ (${patchStats.buffs})` },
                  { id: 'nerf', label: `🔴 เนิร์ฟ (${patchStats.nerfs})` },
                  { id: 'adjustment', label: `🟣 ปรับกลไก (${patchStats.rebalance})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedImpact(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedImpact === tab.id
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-[#162232] text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Language Mode Switcher */}
              <div className="flex items-center gap-1 bg-[#101826] p-1 rounded-xl border border-[#1d2c42]">
                <button
                  onClick={() => setLangMode('thai')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    langMode === 'thai'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Languages className="w-3.5 h-3.5" />
                  <span>🇹🇭 แปลไทยเข้าใจง่าย</span>
                </button>
                <button
                  onClick={() => setLangMode('en')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    langMode === 'en'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>🌐 ภาษาอังกฤษทางการ</span>
                </button>
              </div>
            </div>

            {/* Sub Filters: Element & Slot */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1a2536] text-xs">
              {/* Elements */}
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-slate-400 mr-1">ธาตุ:</span>
                <button
                  onClick={() => setSelectedElement('all')}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    selectedElement === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ทุกธาตุ
                </button>
                {Object.entries(ELEMENT_CONFIG).map(([elem, meta]) => (
                  <button
                    key={elem}
                    onClick={() => setSelectedElement(selectedElement === elem ? 'all' : elem)}
                    className={`px-2 py-1 rounded text-xs transition-all flex items-center gap-1 ${
                      selectedElement === elem
                        ? 'font-bold border'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: selectedElement === elem ? meta.bg : 'transparent',
                      borderColor: meta.border,
                      color: meta.color
                    }}
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                  </button>
                ))}
              </div>

              {/* Slot */}
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-slate-400 mr-1">สกิล:</span>
                {['all', 'S1', 'S2', 'S3', 'Passive', 'Leader'].map(slot => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(selectedSlot === slot ? 'all' : slot)}
                    className={`px-2 py-1 rounded text-xs transition-colors font-mono ${
                      selectedSlot === slot ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {slot === 'all' ? 'ทุกช่อง' : slot}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results count info */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <div>
              พบการปรับปรุง <span className="text-white font-bold font-mono">{filteredAdjustments.length}</span> รายการ
              {searchTerm && <span> สำหรับคำค้น "<span className="text-indigo-400">{searchTerm}</span>"</span>}
            </div>
            {(searchTerm || selectedImpact !== 'all' || selectedElement !== 'all' || selectedSlot !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedImpact('all');
                  setSelectedElement('all');
                  setSelectedSlot('all');
                }}
                className="text-indigo-400 hover:underline"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>

          {/* Adjustments Cards Grid */}
          {filteredAdjustments.length === 0 ? (
            <div className="bg-[#111927] border border-[#1e2a3c] rounded-xl p-12 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <div className="text-white font-semibold text-base">ไม่พบข้อมูลการปรับสมดุลตามเงื่อนไข</div>
              <div className="text-slate-400 text-xs mt-1">ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองเพื่อดูข้อมูลทั้งหมด</div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedImpact('all');
                  setSelectedElement('all');
                  setSelectedSlot('all');
                }}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                รีเซ็ตตัวกรองทั้งหมด
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
              {filteredAdjustments.map((card) => {
                const elemMeta = ELEMENT_CONFIG[card.element] || {
                  label: card.element,
                  color: '#94a3b8',
                  bg: 'rgba(148, 163, 184, 0.1)',
                  border: '#64748b',
                  icon: '✨'
                };
                const impactMeta = IMPACT_CONFIG[card.impact] || IMPACT_CONFIG.adjustment;
                const thaiChangeType = getChangeTypeThai(card.changeType);
                const monsterObj = MONSTERS.find(m => 
                  m.name.toLowerCase() === card.monsterName.toLowerCase() ||
                  (card.monsterName.toLowerCase().includes(m.name.toLowerCase()) && m.name.length > 3)
                );
                const parsed = parsePatchCard(card.preview, card.officialText);

                return (
                  <div
                    key={card.id}
                    className="bg-[#111927] border border-[#1e2a3c] hover:border-[#2a3d58] rounded-xl p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-black/40 group"
                  >
                    <div>
                      {/* Top Header Row: Monster Portrait & Change Badges */}
                      <div className="flex items-start justify-between gap-3 border-b border-[#182333] pb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Monster Image */}
                          <div
                            className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 shadow-sm"
                            style={{ borderColor: elemMeta.border }}
                          >
                            <img
                              src={card.monsterImg || 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0001_0_0.png'}
                              alt={card.monsterName}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters/unit_icon_0001_0_0.png';
                              }}
                            />
                            {/* Element pip badge */}
                            <span
                              className="absolute bottom-0 right-0 text-[11px] px-1 py-0.5 rounded-tl font-bold leading-none"
                              style={{ backgroundColor: elemMeta.color, color: '#000' }}
                            >
                              {elemMeta.icon}
                            </span>
                          </div>

                          {/* Monster Name & Element */}
                          <div className="min-w-0">
                            <h3 className="text-white font-bold text-sm truncate leading-tight group-hover:text-blue-400 transition-colors">
                              {card.monsterName}
                              {monsterObj?.thaiName && monsterObj.thaiName !== card.monsterName && (
                                <span className="text-xs text-slate-400 font-normal ml-1.5">
                                  ({monsterObj.thaiName})
                                </span>
                              )}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-1 text-xs">
                              <span
                                className="px-1.5 py-0.5 rounded text-[11px] font-semibold"
                                style={{ backgroundColor: elemMeta.bg, color: elemMeta.color }}
                              >
                                {elemMeta.label}
                              </span>
                              <span className="text-slate-400 font-mono text-[11px]">
                                {card.element}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Impact & Change Type Badges */}
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-wide border uppercase ${impactMeta.bg}`}>
                            {impactMeta.badge}
                          </span>
                          <span className="px-2 py-0.5 bg-[#162232] text-cyan-300 border border-[#233147] rounded text-[11px] font-medium">
                            {thaiChangeType}
                          </span>
                        </div>
                      </div>

                      {/* Skill Section */}
                      <div className="flex items-center gap-2.5 mt-3 bg-[#0d1421] p-2 rounded-lg border border-[#192435]">
                        <div className="relative w-8 h-8 rounded flex-shrink-0 overflow-hidden bg-[#162232] border border-[#26374f]">
                          {card.skillImg ? (
                            <img
                              src={card.skillImg}
                              alt={card.skillName}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-mono">
                              SK
                            </div>
                          )}
                          {card.skillBadge && (
                            <span className="absolute bottom-0 right-0 bg-blue-600 text-white text-[9px] font-mono font-bold px-0.5 leading-none rounded-tl">
                              {card.skillBadge}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">
                            สกิลที่ถูกปรับ (Skill)
                          </div>
                          <div className="text-xs font-semibold text-indigo-300 truncate">
                            {card.skillName || 'Passive / Leader'}
                          </div>
                        </div>
                      </div>

                      {/* Value Changes Box (Before ➔ After) */}
                      {card.valueChanges && card.valueChanges.length > 0 && (
                        <div className="mt-2.5 bg-[#152233] border border-[#22354e] rounded-lg p-2 flex flex-wrap items-center gap-2">
                          <span className="text-xs text-slate-400 font-medium">ตัวเลขที่เปลี่ยน:</span>
                          {card.valueChanges.map((vc, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 font-mono text-xs">
                              <span className="px-2 py-0.5 bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded font-semibold line-through">
                                {vc.oldValue}
                              </span>
                              <span className="text-slate-400 font-bold">➔</span>
                              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-bold">
                                {vc.newValue}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Detailed Description Block */}
                      {langMode === 'thai' ? (
                        parsed.isSplit ? (
                          <div className="mt-3 space-y-2">
                            {/* Before box */}
                            <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/30 text-xs">
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                <span>เดิม (ก่อนปรับปรุง):</span>
                              </div>
                              <div className="text-slate-300 font-sans leading-relaxed">
                                {parsed.before}
                              </div>
                            </div>

                            {/* After box */}
                            <div className="p-2.5 rounded-lg bg-emerald-950/25 border border-emerald-500/40 text-xs shadow-sm">
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                <span>ใหม่ (หลังปรับปรุง):</span>
                              </div>
                              <div className="text-emerald-200 font-sans font-medium leading-relaxed">
                                {parsed.after}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 p-3 rounded-lg bg-[#0b1019] border border-[#162030] text-xs leading-relaxed font-sans space-y-1">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                              <Sparkles className="w-3 h-3 text-indigo-400" />
                              <span>สรุปการปรับปรุง (ภาษาไทย):</span>
                            </div>
                            <div className="text-slate-200 leading-relaxed font-medium">
                              {parsed.fullTranslated}
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="mt-3 text-xs text-slate-300 leading-relaxed bg-[#0b1019] p-3 rounded-lg border border-[#162030] whitespace-pre-line font-mono">
                          <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1 font-bold">
                            COM2US OFFICIAL TEXT:
                          </div>
                          {card.officialText || card.preview}
                        </div>
                      )}
                      {patchAi.patches?.[selectedPatchId]?.perMonster?.[card.monsterName] && (
                        <div className="mt-2 text-xs text-amber-100/90 flex items-start gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
                          <span>{patchAi.patches[selectedPatchId].perMonster[card.monsterName]}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action bar */}
                    <div className="mt-3 pt-2.5 border-t border-[#182333] flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono text-slate-400">
                        Patch #{card.patchId}
                      </span>
                      {onNavigate && (
                        <button
                          onClick={() => onNavigate('catalog', { search: card.monsterName.replace(/^(Fire|Water|Wind|Light|Dark)\s+/i, '') })}
                          className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-medium transition-colors"
                        >
                          <span>ดูข้อมูลมอนสเตอร์</span>
                          <span>→</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Archive View: All 92 Patches */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111927] border border-[#1e2a3c] p-4 rounded-xl">
            <div>
              <h2 className="text-base font-bold text-white">ตารางประวัติแพตช์ปรับสมดุลทั้งหมด (92 แพตช์)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                คลิกดูรายละเอียดเพื่อเปิดการวิเคราะห์ของแพตช์นั้น หรือเปิดดูประกาศอย่างเป็นทางการจาก Com2uS
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="ค้นหาตามวันที่ เช่น 2026, July, May..."
                value={archiveSearch}
                onChange={(e) => setArchiveSearch(e.target.value)}
                className="w-full bg-[#162232] border border-[#233348] rounded-lg px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="bg-[#111927] border border-[#1f2c3f] rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#162232] text-slate-300 font-semibold border-b border-[#1f2c3f]">
                  <tr>
                    <th className="py-3.5 px-4 font-mono">#</th>
                    <th className="py-3.5 px-4">วันที่ประกาศ (Patch Date)</th>
                    <th className="py-3.5 px-4 text-center">มอนสเตอร์ที่ปรับ (Monsters)</th>
                    <th className="py-3.5 px-4 text-center">สกิลที่ปรับ (Skills)</th>
                    <th className="py-3.5 px-4 text-center">ระยะห่าง (Days)</th>
                    <th className="py-3.5 px-4 text-right">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182333] text-slate-300">
                  {filteredArchive.map((item, idx) => {
                    const patchNum = patchesArchive.length - idx;
                    const hasDetail = patchDetailsData[String(patchNum)];

                    return (
                      <tr key={idx} className="hover:bg-[#152030]/60 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-400 font-semibold">
                          #{patchNum}
                        </td>
                        <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${hasDetail ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
                          <span>{item.date}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-amber-400">
                          {item.monstersCount} ตัว
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-cyan-400">
                          {item.skillCount} สกิล
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-400">
                          {item.daysSincePrevious ? `${item.daysSincePrevious} วัน` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          {hasDetail ? (
                            <button
                              onClick={() => {
                                setSelectedPatchId(String(patchNum));
                                setActiveTab('inspector');
                              }}
                              className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded text-xs transition-colors inline-block font-semibold border border-emerald-500/40"
                            >
                              ⚡ เจาะลึกแพตช์นี้
                            </button>
                          ) : (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-[#162232] hover:bg-[#203046] text-slate-300 rounded text-xs transition-colors inline-block font-medium border border-[#26374f]"
                            >
                              เว็บต้นทาง ↗
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
