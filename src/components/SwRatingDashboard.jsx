import React, { useState, useMemo } from 'react';
import {
  Trophy, Shield, Swords, Sparkles, Star, Download,
  Share2, Search, ArrowUpDown, ChevronRight, CheckCircle2,
  Layers, ExternalLink, Zap
} from 'lucide-react';
import { evaluateSwRating, RANK_TIERS } from '../utils/swRatingEngine.js';

export default function SwRatingDashboard({ box, onOpenAiCoach, onNavigate }) {
  const [activeTab, setActiveTab] = useState('account'); // 'account' | 'monsters'
  const [monsterSearch, setMonsterSearch] = useState('');
  const [sortBy, setSortBy] = useState('totalScore'); // 'totalScore' | 'runeScore' | 'artifactScore' | 'spd'
  const [sortAsc, setSortAsc] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to authentic screenshot look

  const ratingData = useMemo(() => {
    if (!box) return null;
    return evaluateSwRating(box);
  }, [box]);

  if (!ratingData) return null;

  const {
    summaryDate,
    jsonImportDate,
    wizard,
    expectedRank,
    nowRank,
    nowPoints,
    estPoints,
    scores,
    artifactRating,
    runeRating,
    monsterSummary,
  } = ratingData;

  const filteredMonsters = useMemo(() => {
    let list = [...monsterSummary];
    if (monsterSearch.trim()) {
      const q = monsterSearch.toLowerCase();
      list = list.filter(
        (m) =>
          (m.name && m.name.toLowerCase().includes(q)) ||
          (m.thaiName && m.thaiName.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      let va = a[sortBy] ?? 0;
      let vb = b[sortBy] ?? 0;
      return sortAsc ? va - vb : vb - va;
    });
    return list;
  }, [monsterSummary, monsterSearch, sortBy, sortAsc]);

  // Star Icon Helper
  const renderStars = (tier, countOverride) => {
    if (!tier) return null;
    const count = countOverride || tier.stars || 1;
    const isRed = tier.type === 'red';
    const isBronze = tier.type === 'bronze';
    const isSilver = tier.type === 'silver';

    const starColor = isRed
      ? 'text-red-500 fill-red-500'
      : isBronze
      ? 'text-amber-600 fill-amber-600'
      : isSilver
      ? 'text-slate-400 fill-slate-400'
      : 'text-amber-400 fill-amber-400';

    return (
      <div className="inline-flex items-center gap-0.5" title={tier.label}>
        {Array.from({ length: count }).map((_, i) => (
          <Star key={i} className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${starColor}`} />
        ))}
      </div>
    );
  };

  // Set Glyph / Icon Helper
  const renderSetBadge = (name) => {
    const glyphs = {
      Swift: '⚡',
      Violent: 'B',
      Despair: '⚡',
      Will: 'Ψ',
      Revenge: '⚔',
      Any: 'Any',
    };
    return (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-800 dark:text-slate-200 shadow-sm shrink-0">
          {glyphs[name] || name.slice(0, 1)}
        </div>
        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
          {name}
        </span>
      </div>
    );
  };

  const bgTheme = isDarkMode ? 'bg-[#0f172a] text-slate-100' : 'bg-white text-slate-800';
  const cardBorder = isDarkMode ? 'border-slate-800' : 'border-slate-200/90';
  const subBg = isDarkMode ? 'bg-slate-900/60' : 'bg-slate-50';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 animate-in fade-in duration-200 font-sans">
      {/* Theme & Mode Bar */}
      <div className="flex items-center justify-between px-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-bold text-orange-600 dark:text-orange-400">SW-Rating Mode:</span>
          <span>ระบบประเมินคะแนนไอดีมาตรฐานสากล (Global Account Evaluation)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer text-[11px] font-semibold text-slate-700 dark:text-slate-200"
          >
            {isDarkMode ? '☀️ โหมดสว่าง (ต้นฉบับ)' : '🌙 โหมดมืด (Esports)'}
          </button>
        </div>
      </div>

      {/* Main SW-Rating Card Container */}
      <div
        className={`rounded-2xl border ${cardBorder} ${bgTheme} shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-2xl overflow-hidden transition-colors duration-150`}
      >
        {/* Top Info Bar */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold">
          <div>
            <span>Summary Date: </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{summaryDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Expected Rank: </span>
            <span className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-bold">
              {Array.from({ length: 3 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 text-cyan-500 fill-cyan-500" />
              ))}
            </span>
          </div>
        </div>

        {/* Profile & KPI Scores Header */}
        <div className="p-5 sm:p-7 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left: User Identity */}
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shadow-inner">
                  {wizard.avatarUrl ? (
                    <img
                      src={wizard.avatarUrl}
                      alt={wizard.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-3xl text-slate-400 font-black">
                      {wizard.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Thailand / Server Flag Badge */}
                <div className="absolute -bottom-1.5 -right-1.5 text-base sm:text-lg bg-white dark:bg-slate-900 rounded-full px-1 shadow border border-slate-200 dark:border-slate-700">
                  🇹🇭
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {wizard.name}
                </h2>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                  <span>Lv.{wizard.level}</span>
                  <span>•</span>
                  <span>Server TH</span>
                </div>
              </div>
            </div>

            {/* Middle: Rank Points */}
            <div className="flex items-center gap-6 sm:gap-10 border-y md:border-y-0 md:border-x border-slate-100 dark:border-slate-800/80 py-3 md:py-0 md:px-8 w-full md:w-auto justify-around md:justify-center">
              {/* Now Rank */}
              <div className="text-center">
                <span className="text-[11px] text-slate-400 block font-medium">Now Rank</span>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <Star className="w-4 h-4 text-red-500 fill-red-500" />
                  <div className="flex items-center gap-1 text-base sm:text-lg font-black text-red-600 dark:text-red-400">
                    <Swords className="w-4 h-4" />
                    <span>{nowPoints}</span>
                  </div>
                </div>
              </div>

              {/* Expected Rank (Est. Points) */}
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {estPoints}
                </div>
                <span className="text-[11px] text-slate-400 block font-medium">Est.Points</span>
              </div>
            </div>

            {/* Right: 3 Big Scores */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 w-full md:w-auto text-center">
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {scores.unitScore}
                </div>
                <span className="text-[11px] text-slate-400 block font-medium">Unit Score</span>
              </div>

              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white border-b-2 border-orange-500 pb-0.5">
                  {scores.runeScore}
                </div>
                <span className="text-[11px] text-slate-400 block font-medium mt-0.5">Rune Score</span>
              </div>

              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {scores.artifactScore}
                </div>
                <span className="text-[11px] text-slate-400 block font-medium">Artifact Score</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-banner: JSON Import Date & AI Button */}
        <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="text-slate-500 dark:text-slate-400 font-medium">
            <span>Json Import Date: </span>
            <span className="font-bold text-slate-700 dark:text-slate-300">{jsonImportDate}</span>
          </div>

          <button
            type="button"
            onClick={onOpenAiCoach}
            className="px-4 py-1.5 rounded-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md shadow-orange-600/20 hover:shadow-orange-600/35 transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Rune/Artifact</span>
          </button>
        </div>

        {/* Tabs: Account Summary / Monster Summary */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-5 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`pb-3 px-4 text-sm font-bold transition-all relative cursor-pointer ${
              activeTab === 'account'
                ? 'text-orange-600 dark:text-orange-400 font-black'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Account Summary
            {activeTab === 'account' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('monsters')}
            className={`pb-3 px-4 text-sm font-bold transition-all relative cursor-pointer ${
              activeTab === 'monsters'
                ? 'text-orange-600 dark:text-orange-400 font-black'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Monster Summary
            {activeTab === 'monsters' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Tab 1: Account Summary Content */}
        {activeTab === 'account' && (
          <div className="p-5 sm:p-7 space-y-7 animate-in fade-in duration-150">
            {/* Section 1: Artifact Rating */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-300 dark:border-slate-700">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Artifact Rating
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <Shield className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {/* Element Artifact */}
                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                      Element Artifact
                    </span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 min-w-[70px] text-right">
                      {artifactRating.elementArtifact.score}
                    </div>
                    <div className="min-w-[60px] text-right">
                      {renderStars(artifactRating.elementArtifact.rank)}
                    </div>
                  </div>
                </div>

                {/* Type Artifact */}
                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                      Type Artifact
                    </span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 min-w-[70px] text-right">
                      {artifactRating.typeArtifact.score}
                    </div>
                    <div className="min-w-[60px] text-right">
                      {renderStars(artifactRating.typeArtifact.rank)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Rune Rating */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-300 dark:border-slate-700">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Rune Rating
                </h3>
                <div className="flex items-center gap-1.5">
                  <div className="inline-flex items-center gap-0.5">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-red-500 fill-red-500" />
                    ))}
                  </div>
                  <Trophy className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Sub-group 1: Top 10 Average */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-orange-600 dark:text-orange-400">
                  Top 10 Average
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {/* Swift */}
                  <div className="py-2 flex items-center justify-between">
                    <div>{renderSetBadge('Swift')}</div>
                    <div className="flex items-center gap-6">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200 min-w-[70px] text-right">
                        {runeRating.top10Average.swift.avg}
                      </div>
                      <div className="min-w-[60px] text-right">
                        {renderStars(runeRating.top10Average.swift.rank)}
                      </div>
                    </div>
                  </div>

                  {/* Violent */}
                  <div className="py-2 flex items-center justify-between">
                    <div>{renderSetBadge('Violent')}</div>
                    <div className="flex items-center gap-6">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200 min-w-[70px] text-right">
                        {runeRating.top10Average.violent.avg}
                      </div>
                      <div className="min-w-[60px] text-right">
                        {renderStars(runeRating.top10Average.violent.rank)}
                      </div>
                    </div>
                  </div>

                  {/* Despair */}
                  <div className="py-2 flex items-center justify-between">
                    <div>{renderSetBadge('Despair')}</div>
                    <div className="flex items-center gap-6">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200 min-w-[70px] text-right">
                        {runeRating.top10Average.despair.avg}
                      </div>
                      <div className="min-w-[60px] text-right">
                        {renderStars(runeRating.top10Average.despair.rank)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-group 2: General Rune Score */}
              <div className="space-y-2 pt-3">
                <div className="text-xs font-bold text-orange-600 dark:text-orange-400">
                  General Rune Score
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {/* Swift */}
                  <div className="py-2 flex items-center justify-between">
                    <div>{renderSetBadge('Swift')}</div>
                    <div className="flex items-center gap-6">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200 min-w-[70px] text-right">
                        {runeRating.generalRuneScore.swift.score}
                      </div>
                      <div className="min-w-[60px] text-right">
                        {renderStars(runeRating.generalRuneScore.swift.rank)}
                      </div>
                    </div>
                  </div>

                  {/* Violent */}
                  <div className="py-2 flex items-center justify-between">
                    <div>{renderSetBadge('Violent')}</div>
                    <div className="flex items-center gap-6">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200 min-w-[70px] text-right">
                        {runeRating.generalRuneScore.violent.score}
                      </div>
                      <div className="min-w-[60px] text-right">
                        {renderStars(runeRating.generalRuneScore.violent.rank)}
                      </div>
                    </div>
                  </div>

                  {/* Despair */}
                  <div className="py-2 flex items-center justify-between">
                    <div>{renderSetBadge('Despair')}</div>
                    <div className="flex items-center gap-6">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200 min-w-[70px] text-right">
                        {runeRating.generalRuneScore.despair.score}
                      </div>
                      <div className="min-w-[60px] text-right">
                        {renderStars(runeRating.generalRuneScore.despair.rank)}
                      </div>
                    </div>
                  </div>

                  {/* Will */}
                  <div className="py-2 flex items-center justify-between">
                    <div>{renderSetBadge('Will')}</div>
                    <div className="flex items-center gap-6">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200 min-w-[70px] text-right">
                        {runeRating.generalRuneScore.will.score}
                      </div>
                      <div className="min-w-[60px] text-right">
                        {renderStars(runeRating.generalRuneScore.will.rank)}
                      </div>
                    </div>
                  </div>

                  {/* Revenge */}
                  <div className="py-2 flex items-center justify-between">
                    <div>{renderSetBadge('Revenge')}</div>
                    <div className="flex items-center gap-6">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200 min-w-[70px] text-right">
                        {runeRating.generalRuneScore.revenge.score}
                      </div>
                      <div className="min-w-[60px] text-right">
                        {renderStars(runeRating.generalRuneScore.revenge.rank)}
                      </div>
                    </div>
                  </div>

                  {/* Any */}
                  <div className="py-2 flex items-center justify-between">
                    <div>{renderSetBadge('Any')}</div>
                    <div className="flex items-center gap-6">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200 min-w-[70px] text-right">
                        {runeRating.generalRuneScore.any.score}
                      </div>
                      <div className="min-w-[60px] text-right">
                        {renderStars(runeRating.generalRuneScore.any.rank)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Monster Summary Content */}
        {activeTab === 'monsters' && (
          <div className="p-5 sm:p-7 space-y-4 animate-in fade-in duration-150">
            {/* Search and Sort Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={monsterSearch}
                  onChange={(e) => setMonsterSearch(e.target.value)}
                  placeholder="ค้นหาชื่อมอนสเตอร์..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 w-full sm:w-auto justify-end">
                <span>เรียงตาม:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold focus:outline-none"
                >
                  <option value="totalScore">คะแนนรวม (Total Score)</option>
                  <option value="runeScore">คะแนนรูน (Rune Score)</option>
                  <option value="artifactScore">คะแนนอาร์ติแฟกต์ (Artifact Score)</option>
                  <option value="spd">ความเร็ว (+SPD)</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSortAsc(!sortAsc)}
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                  title="สลับลำดับ มาก <-> น้อย"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Monster Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                    <th className="py-2.5 px-3">มอนสเตอร์ (Monster)</th>
                    <th className="py-2.5 px-3">เซ็ตที่ใส่</th>
                    <th className="py-2.5 px-3 text-right">Unit</th>
                    <th className="py-2.5 px-3 text-right">Rune</th>
                    <th className="py-2.5 px-3 text-right">Artifact</th>
                    <th className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">Total</th>
                    <th className="py-2.5 px-3 text-center">Rank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredMonsters.slice(0, 40).map((m, idx) => (
                    <tr
                      key={m.masterId || idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={m.avatarUrl}
                            alt={m.name}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 dark:text-white block truncate">
                              {m.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {m.thaiName !== m.name ? m.thaiName : `+${m.plusSpd} SPD`}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                        <span className="font-medium">
                          {m.sets.length ? m.sets.join(' / ') : '-'}
                        </span>
                        <span className="text-[10px] text-cyan-600 dark:text-cyan-400 ml-1 font-bold">
                          +{m.plusSpd}
                        </span>
                      </td>

                      <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-300 font-medium">
                        {m.unitScore}
                      </td>

                      <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-300 font-medium">
                        {m.runeScore}
                      </td>

                      <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-300 font-medium">
                        {m.artifactScore}
                      </td>

                      <td className="py-2 px-3 text-right font-black text-orange-600 dark:text-orange-400 text-sm">
                        {m.totalScore}
                      </td>

                      <td className="py-2 px-3 text-center">
                        {renderStars(m.rank)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredMonsters.length > 40 && (
              <p className="text-[11px] text-center text-slate-400 pt-2">
                แสดง 40 ตัวแรกจากทั้งหมด {filteredMonsters.length} ตัว (ใช้ช่องค้นหาเพื่อดูตัวอื่นๆ)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
