import React, { useState, useMemo, useEffect } from 'react';
import { BookOpen, Search, Swords, X, Filter, Info } from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import SkillTooltip from '../components/SkillTooltip';
import MonsterSkillsCard from '../components/MonsterSkillsCard';
import { MONSTERS } from '../data/monsters';
import { getSkillTags } from '../data/monsterSkills';
import { useMonsterSkills } from '../hooks/useMonsterSkills';
import { monsterSlug } from '../router';

/** Monster for a /monster/<slug> address (also accepts a plain name or catalog id). */
function monsterFromSlug(slug) {
  if (!slug) return null;
  const s = monsterSlug(slug);
  return MONSTERS.find((m) => monsterSlug(m.name) === s) || MONSTERS.find((m) => m.id === slug || String(m.com2usId) === slug) || null;
}

// same wording as the prerendered page (scripts/prerender_monsters.mjs): "ลูเชน (โจ๊กเกอร์ลม)" → "ลูเชน · โจ๊กเกอร์ลม"
const monsterTitle = (m) => {
  const thai = m.thaiName && m.thaiName !== m.name ? String(m.thaiName).replace(/\s*\((.*)\)\s*$/, ' · $1') : '';
  return `${m.name}${thai ? ` (${thai})` : ''} — สกิล สเตตัส และวิธีใช้ | SWM`;
};

const FALLBACK_SKILL_ICON = 'https://do9d4mpqk497d.cloudfront.net/common/images/skills36/skill_icon_0001_0_0.png';

// filter rows: a scrollable single line on phones (bleeding into the card padding), wrapping on wider screens
const chipStrip = 'flex items-center gap-1.5 overflow-x-auto chip-strip -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible';
const chip = 'shrink-0 whitespace-nowrap rounded-lg transition-all cursor-pointer';

// One grid tile. Skill icons fill in once the monster's shard has been fetched (see useMonsterSkills).
function MonsterCard({ monster, onSelect }) {
  const displayName = monster.thaiName || monster.nameTh || monster.name;
  const engName = monster.name || monster.nameEn || '';
  const family = monster.thaiFamily || monster.family || '';
  const role = monster.role || monster.roleTh || '';
  const skillsData = useMonsterSkills(monster);

  return (
    <div
      onClick={() => onSelect(monster)}
      className="bg-[#101724] p-3 rounded-xl border border-[#1d2b3f] hover:border-blue-500 cursor-pointer transition-all flex flex-col items-center text-center justify-between group shadow-md hover:shadow-blue-500/10 hover:-translate-y-0.5 relative"
    >
      {/* Monster Portrait & Name */}
      <div className="w-full flex flex-col items-center">
        <MonsterAvatar monster={monster} size="lg" />
        <h3 className="font-bold text-xs sm:text-sm text-white group-hover:text-blue-400 transition-colors mt-2 truncate max-w-full">
          {displayName}
        </h3>
        <p className="text-xs text-slate-400 truncate max-w-full mt-0.5">
          {engName !== displayName ? engName : family}
        </p>
      </div>

      {/* Interactive Skill Hover Strip */}
      {skillsData && (
        <div
          className="w-full mt-2 pt-2 border-t border-[#182333] flex items-center justify-center gap-1.5 flex-wrap"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Leader Skill Icon */}
          {skillsData.leaderSkill && (
            <SkillTooltip leaderSkill={skillsData.leaderSkill}>
              <div className="relative group/sk cursor-pointer">
                <img
                  src={skillsData.leaderSkill.iconUrl}
                  alt="Leader"
                  className="w-7 h-7 rounded border border-amber-500/60 bg-black/50 p-0.5 group-hover/sk:border-amber-400 group-hover/sk:scale-110 transition-transform"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <span className="absolute -bottom-1 -right-1 text-[9px] font-bold bg-amber-600 text-white px-0.5 rounded leading-none">
                  L
                </span>
              </div>
            </SkillTooltip>
          )}

          {/* Skills (S1, S2, S3/Passive) */}
          {(skillsData.skills || []).map((sk, sidx) => (
            <SkillTooltip key={sk.id || sidx} skill={sk}>
              <div className="relative group/sk cursor-pointer">
                <img
                  src={sk.iconUrl}
                  alt={sk.name}
                  className={`w-7 h-7 rounded bg-black/50 p-0.5 border group-hover/sk:scale-110 transition-transform ${
                    sk.isPassive
                      ? 'border-purple-500/70 group-hover/sk:border-purple-400'
                      : 'border-blue-500/60 group-hover/sk:border-blue-400'
                  }`}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = FALLBACK_SKILL_ICON;
                  }}
                />
                <span className={`absolute -bottom-1 -right-1 text-[9px] font-bold px-0.5 rounded leading-none ${
                  sk.isPassive ? 'bg-purple-600 text-white' : 'bg-[#182333] text-slate-300 border border-slate-700'
                }`}>
                  {sk.slotLabel || `S${sidx + 1}`}
                </span>
              </div>
            </SkillTooltip>
          ))}
        </div>
      )}

      {/* Role label */}
      <div className="w-full mt-2 pt-1.5 border-t border-[#141d2a]">
        <span className="text-[11px] text-slate-400 line-clamp-1">
          {role || (monster.archetype ? `สาย ${monster.archetype}` : 'สายต่อสู้')}
        </span>
      </div>
    </div>
  );
}

export default function MonsterCatalogView({ initialSearch = '', initialMonster = '', onNavigate }) {
  const [initial] = useState(() => monsterFromSlug(initialMonster));
  const [searchQuery, setSearchQuery] = useState(initialSearch || initial?.name || '');
  const [selectedElement, setSelectedElement] = useState('all');
  const [selectedStars, setSelectedStars] = useState('all');
  const [selectedEffect, setSelectedEffect] = useState('all');
  const [selectedMonster, setSelectedMonster] = useState(initial);
  const [visibleCount, setVisibleCount] = useState(48);

  // While the inspector is open the address bar shows /monster/<slug> — the same URL the
  // prerendered pages use — so it can be shared, bookmarked and indexed; closing it goes back to /catalog.
  useEffect(() => {
    if (selectedMonster) {
      const url = `/monster/${monsterSlug(selectedMonster.name)}`;
      if (window.location.pathname !== url) window.history.replaceState(null, '', url);
      document.title = monsterTitle(selectedMonster);
    } else if (window.location.pathname.startsWith('/monster/')) {
      window.history.replaceState(null, '', '/catalog');
      document.title = 'สารานุกรมมอนสเตอร์ | SWM';
    }
  }, [selectedMonster]);

  useEffect(() => {
    if (!selectedMonster) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setSelectedMonster(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedMonster]);

  const elements = [
    { id: 'all', name: 'ทุกธาตุ' },
    { id: 'fire', name: 'ไฟ (Fire)' },
    { id: 'water', name: 'น้ำ (Water)' },
    { id: 'wind', name: 'ลม (Wind)' },
    { id: 'light', name: 'แสง (Light)' },
    { id: 'dark', name: 'มืด (Dark)' },
  ];

  const stars = [
    { id: 'all', name: 'ทุกดาว' },
    { id: '5', name: '5 ดาว (Nat 5)' },
    { id: '4', name: '4 ดาว (Nat 4)' },
    { id: '3', name: '3 ดาว (Nat 3)' },
    { id: '2', name: '2 ดาว' },
    { id: '1', name: '1 ดาว' },
  ];

  const skillEffects = [
    { id: 'all', name: 'ทุกเอฟเฟกต์สกิล' },
    { id: 'Decrease DEF', name: '🛡️ ลดเกราะ (Def Break)' },
    { id: 'Stun', name: '💫 สตั๊น (Stun)' },
    { id: 'isPassive', name: '⚡ สกิลติดตัว (Passive)' },
    { id: 'isAoe', name: '💥 โจมตีหมู่ (AOE)' },
    { id: 'Immunity', name: '✨ บัฟอิมมูน (Immunity)' },
    { id: 'Strip', name: '🌪️ ลบล้างบัฟ (Strip)' },
    { id: 'Ignore DEF', name: '🗡️ เจาะเกราะ (Ignore DEF)' },
    { id: 'Brand', name: '🎯 ตราประทับ (Brand)' },
    { id: 'Provoke', name: '💢 ยั่วยุ (Provoke)' },
    { id: 'Continuous DMG', name: '🩸 ดอท (Continuous DMG)' },
  ];

  const filteredMonsters = useMemo(() => {
    return MONSTERS.filter(m => {
      if (selectedElement !== 'all' && m.element !== selectedElement) return false;
      if (selectedStars !== 'all' && m.stars?.toString() !== selectedStars) return false;

      // Skill Effect Filter — answered from the bundled index, no shard needed
      if (selectedEffect !== 'all') {
        const tags = getSkillTags(m);
        if (!tags) return false;

        if (selectedEffect === 'isPassive') {
          if (!tags.isPassive) return false;
        } else if (selectedEffect === 'isAoe') {
          if (!tags.isAoe) return false;
        } else if (!tags.effects.includes(selectedEffect)) {
          return false;
        }
      }

      if (!searchQuery) return true;

      const q = searchQuery.toLowerCase().trim();
      const nameEn = (m.name || m.nameEn || '').toLowerCase();
      const nameTh = (m.thaiName || m.nameTh || '').toLowerCase();
      const fam = (m.family || '').toLowerCase();
      const arch = (m.archetype || '').toLowerCase();
      const role = (m.role || m.roleTh || '').toLowerCase();

      return (
        nameEn.includes(q) ||
        nameTh.includes(q) ||
        fam.includes(q) ||
        arch.includes(q) ||
        role.includes(q)
      );
    });
  }, [searchQuery, selectedElement, selectedStars, selectedEffect]);

  const displayedMonsters = useMemo(() => {
    return filteredMonsters.slice(0, visibleCount);
  }, [filteredMonsters, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 48);
  };

  const selectedMonsterSkills = useMonsterSkills(selectedMonster);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[#1c2738] pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4" />
          SWM Complete Monster Encyclopedia & Skills Breakdown • ({MONSTERS.length} ตัว)
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          สารานุกรมมอนสเตอร์ & ระบบตรวจสอบสกิล (Monster Skills Inspector)
        </h1>
        {/* hidden on phones: with the filters below it pushed the first monster under the fold */}
        <p className="hidden sm:block text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          ฐานข้อมูลสกิลมอนสเตอร์ครบทุกตัว ทุกธาตุ ชี้เมาส์ (Hover) เพื่อดูคำอธิบายสกิล คูลดาวน์ ตัวคูณความเสียหาย ดีบัฟ และคลิกเพื่อเปิดหน้าต่างวิเคราะห์กลยุทธ์ฉบับเต็ม
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#101724] p-4 sm:p-5 rounded-2xl border border-[#1d2b3f] space-y-4 shadow-xl">
        {/* Search Box */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="w-full bg-[#0c121c] border border-[#1d2b3f] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            placeholder="ค้นหาชื่อมอนสเตอร์ (เช่น Savannah, ซาวันนาห์, Tractor, Juno, Dominic, Teshar, Feng Yan...)"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(48); }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              ✕ ล้างค้นหา
            </button>
          )}
        </div>

        {/* Filter Pills — one wrapping block on desktop; on phones each row is a horizontal chip strip
            so the three groups take three lines instead of ten */}
        <div className="flex flex-col gap-3 pt-1 border-t border-[#182333]">
          {/* Element & Star Buttons */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
            {/* Element Buttons */}
            <div className={chipStrip}>
              <span className="text-xs text-slate-400 font-bold mr-1 shrink-0">ธาตุ:</span>
              {elements.map((elem) => (
                <button
                  key={elem.id}
                  onClick={() => { setSelectedElement(elem.id); setVisibleCount(48); }}
                  className={`${chip} px-3 py-1.5 text-xs font-bold ${
                    selectedElement === elem.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-[#0c121c] border border-[#1d2b3f] text-slate-300 hover:text-white hover:bg-[#152030]'
                  }`}
                >
                  {elem.name}
                </button>
              ))}
            </div>

            {/* Star Buttons */}
            <div className={chipStrip}>
              <span className="text-xs text-slate-400 font-bold mr-1 shrink-0">ดาว:</span>
              {stars.map((star) => (
                <button
                  key={star.id}
                  onClick={() => { setSelectedStars(star.id); setVisibleCount(48); }}
                  className={`${chip} px-3 py-1.5 text-xs font-bold ${
                    selectedStars === star.id
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'bg-[#0c121c] border border-[#1d2b3f] text-slate-300 hover:text-white hover:bg-[#152030]'
                  }`}
                >
                  {star.name}
                </button>
              ))}
            </div>
          </div>

          {/* Skill Effects Filter */}
          <div className={`${chipStrip} pt-2 border-t border-[#182333]/60`}>
            <span className="text-xs text-slate-400 font-bold mr-1 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-blue-400" />
              กลไกสกิล:
            </span>
            {skillEffects.map((eff) => (
              <button
                key={eff.id}
                onClick={() => { setSelectedEffect(eff.id); setVisibleCount(48); }}
                className={`${chip} px-2.5 py-1 text-xs font-semibold ${
                  selectedEffect === eff.id
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 font-bold'
                    : 'bg-[#0c121c] border border-[#1d2b3f] text-slate-300 hover:text-white hover:bg-[#152030]'
                }`}
              >
                {eff.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Counter Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-400 px-1 gap-2">
        <span>
          แสดงผล <strong className="text-white font-mono">{displayedMonsters.length}</strong> ตัว จากที่ค้นพบ{' '}
          <strong className="text-purple-400 font-mono">{filteredMonsters.length}</strong> ตัว (รวมทั้งหมด {MONSTERS.length} ตัว)
        </span>
        <span className="hidden sm:flex text-blue-400 items-center gap-1 bg-blue-950/30 px-2.5 py-1 rounded-lg border border-blue-900/40">
          <Info className="w-3.5 h-3.5" />
          <span>เอาเมาส์ชี้ที่ไอคอนสกิลด้านล่างรูปเพื่อดูรายละเอียด หรือคลิกเพื่อดูหน้าต่างเจาะลึก</span>
        </span>
      </div>

      {/* Monster Grid with Skill Strips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
        {displayedMonsters.map((monster) => (
          <MonsterCard key={monster.id} monster={monster} onSelect={setSelectedMonster} />
        ))}
      </div>

      {/* Load More Button */}
      {visibleCount < filteredMonsters.length && (
        <div className="pt-6 text-center">
          <button
            onClick={handleLoadMore}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
          >
            โหลดมอนสเตอร์เพิ่มเติม (+48 ตัว) • เหลืออีก {filteredMonsters.length - visibleCount} ตัว
          </button>
        </div>
      )}

      {/* Monster Detail Inspector Modal */}
      {selectedMonster && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedMonster(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#0c121c] border border-slate-700/80 rounded-2xl shadow-2xl relative overflow-hidden ring-1 ring-white/10">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#1d2b3f] bg-[#0c121c]/80 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3.5">
                <MonsterAvatar monster={selectedMonster} size="lg" />
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                      selectedMonster.element === 'fire' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      selectedMonster.element === 'water' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                      selectedMonster.element === 'wind' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      selectedMonster.element === 'light' ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30' :
                      'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    }`}>
                      {selectedMonster.element}
                    </span>
                    <span className="text-amber-400 font-bold text-xs">
                      {'★'.repeat(Math.min(6, selectedMonster.stars || 5))}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      ({selectedMonster.archetype || 'Combat'})
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                    {selectedMonster.thaiName || selectedMonster.nameTh || selectedMonster.name}
                  </h2>
                  <div className="text-xs text-slate-400">
                    {selectedMonster.name} ({selectedMonster.thaiFamily || selectedMonster.family})
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedMonster(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-[#101724] border border-[#1d2b3f] hover:border-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              <MonsterSkillsCard 
                monsterData={selectedMonsterSkills || selectedMonster} 
                enableTooltip={false}
              />
            </div>

            {/* Modal Actions Footer */}
            <div className="p-3.5 sm:p-4 border-t border-[#1d2b3f] bg-[#0c121c] flex items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => {
                  const monName = selectedMonster.name;
                  setSelectedMonster(null);
                  if (onNavigate) {
                    onNavigate('3mdc', { search: monName });
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/30"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>ค้นหาสูตรแก้ทาง 3MDC สำหรับ {selectedMonster.name}</span>
              </button>

              <button
                onClick={() => setSelectedMonster(null)}
                className="px-4 py-2.5 rounded-xl bg-[#101724] hover:bg-[#182333] text-slate-300 hover:text-white font-bold text-xs border border-[#1d2b3f] cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
