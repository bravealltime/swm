import React, { useState } from 'react';
import { 
  Sparkles, 
  Swords, 
  Shield, 
  Zap, 
  Clock, 
  Layers, 
  ChevronRight, 
  Target, 
  HelpCircle,
  Activity,
  Heart,
  Gauge
} from 'lucide-react';
import SkillTooltip from './SkillTooltip';

export default function MonsterSkillsCard({ monsterData }) {
  const [activeTab, setActiveTab] = useState('skills'); // 'skills' | 'stats' | 'guide'

  if (!monsterData) {
    return (
      <div className="p-4 rounded-xl bg-[#0c121c] border border-[#1d2b3f] text-center text-slate-400 text-xs">
        ไม่พบข้อมูลสกิลของมอนสเตอร์นี้
      </div>
    );
  }

  const { leaderSkill, skills = [], baseStats = {} } = monsterData;

  return (
    <div className="space-y-4">
      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 border-b border-[#1c2738] pb-2">
        <button
          onClick={() => setActiveTab('skills')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'skills'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-[#0c121c] text-slate-400 hover:text-white border border-[#1d2b3f]'
          }`}
        >
          <Swords className="w-3.5 h-3.5" />
          <span>สกิลและการทำงาน ({skills.length + (leaderSkill ? 1 : 0)})</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'stats'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'bg-[#0c121c] text-slate-400 hover:text-white border border-[#1d2b3f]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>ค่าสถานะพื้นฐาน (Base Stats)</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'guide'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'bg-[#0c121c] text-slate-400 hover:text-white border border-[#1d2b3f]'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>รูน & วิธีใช้ในกิลด์วอร์</span>
        </button>
      </div>

      {/* Tab: Skills */}
      {activeTab === 'skills' && (
        <div className="space-y-3">
          {/* Leader Skill */}
          {leaderSkill && (
            <SkillTooltip leaderSkill={leaderSkill}>
              <div className="p-3 rounded-xl bg-[#0c121c] border border-amber-500/30 hover:border-amber-500/60 transition-all flex items-start gap-3 cursor-pointer group shadow-sm">
                <img 
                  src={leaderSkill.iconUrl} 
                  alt="Leader" 
                  className="w-10 h-10 rounded-lg bg-black/40 border border-amber-500/50 p-0.5 shrink-0 group-hover:scale-105 transition-transform"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-extrabold uppercase tracking-wider">
                      Leader Skill
                    </span>
                    <span className="text-xs font-bold text-white">
                      เพิ่ม {leaderSkill.attribute} +{leaderSkill.amount}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {leaderSkill.textTh}
                  </p>
                </div>
              </div>
            </SkillTooltip>
          )}

          {/* Active / Passive Skills List */}
          {skills.map((skill, idx) => (
            <div 
              key={skill.id || idx}
              className="p-3.5 rounded-xl bg-[#0c121c] border border-[#1d2b3f] hover:border-blue-500/50 transition-all space-y-2.5 shadow-sm"
            >
              {/* Top Row: Icon, Slot badge, Cooldown, Name */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Skill icon with hover tooltip */}
                  <SkillTooltip skill={skill}>
                    <div className="relative cursor-pointer group">
                      <img 
                        src={skill.iconUrl} 
                        alt={skill.name} 
                        className="w-11 h-11 rounded-lg bg-black/50 border border-blue-500/40 p-0.5 group-hover:border-blue-400 group-hover:scale-105 transition-all shadow-md"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://do9d4mpqk497d.cloudfront.net/common/images/skills36/skill_icon_0001_0_0.png';
                        }}
                      />
                      <span className="absolute -bottom-1.5 right-0 text-[9px] font-mono font-bold bg-[#0d1522] border border-[#1d2b3f] text-slate-300 px-1 rounded shadow">
                        {skill.isPassive ? 'Pass' : `1/${skill.maxLevel || 3}`}
                      </span>
                    </div>
                  </SkillTooltip>

                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        skill.isPassive 
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' 
                          : skill.slot === 1 
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : skill.slot === 2
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {skill.slotLabel}
                      </span>

                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        skill.isPassive 
                          ? 'bg-purple-950/40 text-purple-300 border border-purple-800/40'
                          : skill.cooldown 
                          ? 'bg-sky-950/40 text-sky-300 border border-sky-800/40'
                          : 'bg-slate-800/50 text-slate-400 border border-slate-700/40'
                      }`}>
                        {skill.cooldownText}
                      </span>

                      {skill.isAoe && (
                        <span className="text-[10px] bg-indigo-950/40 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800/40 font-bold">
                          โจมตีหมู่ (AOE)
                        </span>
                      )}

                      {skill.hits > 1 && (
                        <span className="text-[10px] bg-yellow-950/40 text-yellow-300 px-2 py-0.5 rounded border border-yellow-800/40 font-mono font-bold">
                          {skill.hits} ฮิต
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white mt-1">
                      {skill.name}
                    </h4>
                  </div>
                </div>
              </div>

              {/* Description in Thai */}
              <p className="text-xs text-slate-200 leading-relaxed font-sans bg-[#101724] p-2.5 rounded-lg border border-[#162232]">
                {skill.descriptionTh || skill.description}
              </p>

              {/* Damage Multiplier & Scaling Formula */}
              {(skill.multiplier || (skill.scalesWith && skill.scalesWith.length > 0)) && (
                <div className="flex flex-wrap items-center gap-2 text-xs bg-[#090e17] px-3 py-1.5 rounded-lg border border-[#192537]">
                  {skill.multiplier && (
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-slate-400 text-[11px]">สูตรดาเมจตัวคูณ:</span>
                      <span className="text-amber-400 font-bold">{skill.multiplier}</span>
                    </div>
                  )}
                  {skill.scalesWith && skill.scalesWith.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[11px]">สเกลตาม:</span>
                      <span className="text-emerald-400 font-bold font-mono">
                        {skill.scalesWith.join(' + ')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Debuffs & Buffs Badges */}
              {skill.effects && skill.effects.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {skill.effects.map((eff, i) => (
                    <span 
                      key={i}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${eff.badgeClass || 'bg-slate-800 text-slate-300 border-slate-700'}`}
                    >
                      {eff.nameTh || eff.name} {eff.chance ? `(${eff.chance}%)` : ''}
                    </span>
                  ))}
                </div>
              )}

              {/* Tactics & Mechanics Note */}
              {skill.tactics && (
                <div className="text-[11px] text-blue-300/90 bg-blue-950/20 border border-blue-900/30 px-3 py-1.5 rounded-lg leading-relaxed">
                  {skill.tactics}
                </div>
              )}

              {/* Skill-ups */}
              {skill.skillups && skill.skillups.length > 0 && (
                <div className="pt-2 border-t border-[#162232]">
                  <div className="text-[10px] text-slate-400 font-bold mb-1 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-slate-500" />
                    อัปเกรดเลเวลสกิล (Skill Ups สูงสุด Lv.{skill.maxLevel || (skill.skillups.length + 1)}):
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-[10px]">
                    {skill.skillups.map((u, ui) => (
                      <div key={ui} className="bg-[#090e17] px-2 py-1 rounded border border-[#162232] text-slate-300 font-mono flex items-center justify-between">
                        <span className="text-slate-500">Lv.{ui + 2}</span>
                        <span className="text-slate-200">{u}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Base Stats */}
      {activeTab === 'stats' && (
        <div className="space-y-4 bg-[#0c121c] p-4 rounded-xl border border-[#1d2b3f]">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-purple-400" />
            ค่าสถานะที่เลเวล 40 ตื่นรู้เต็มที่ (Awakened 6★ Lv.40)
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#101724] p-3 rounded-xl border border-[#1d2b3f] space-y-1">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-400" /> พลังชีวิต (HP)
              </span>
              <div className="text-lg font-black text-rose-400 font-mono">
                {baseStats.hp?.toLocaleString() || '-'}
              </div>
            </div>

            <div className="bg-[#101724] p-3 rounded-xl border border-[#1d2b3f] space-y-1">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Swords className="w-3.5 h-3.5 text-amber-400" /> พลังโจมตี (ATK)
              </span>
              <div className="text-lg font-black text-amber-400 font-mono">
                {baseStats.atk?.toLocaleString() || '-'}
              </div>
            </div>

            <div className="bg-[#101724] p-3 rounded-xl border border-[#1d2b3f] space-y-1">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-blue-400" /> พลังป้องกัน (DEF)
              </span>
              <div className="text-lg font-black text-blue-400 font-mono">
                {baseStats.def?.toLocaleString() || '-'}
              </div>
            </div>

            <div className="bg-[#101724] p-3 rounded-xl border border-[#1d2b3f] space-y-1">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-emerald-400" /> ความเร็ว (SPD)
              </span>
              <div className="text-lg font-black text-emerald-400 font-mono">
                {baseStats.spd || '-'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div className="bg-[#101724] p-2.5 rounded-xl border border-[#1d2b3f]">
              <span className="text-slate-400 text-[11px]">อัตราคริ (CRI Rate)</span>
              <div className="text-sm font-bold text-yellow-400 font-mono">
                {baseStats.critRate || 15}%
              </div>
            </div>

            <div className="bg-[#101724] p-2.5 rounded-xl border border-[#1d2b3f]">
              <span className="text-slate-400 text-[11px]">แดเมจคริ (CRI Dmg)</span>
              <div className="text-sm font-bold text-amber-400 font-mono">
                {baseStats.critDmg || 50}%
              </div>
            </div>

            <div className="bg-[#101724] p-2.5 rounded-xl border border-[#1d2b3f]">
              <span className="text-slate-400 text-[11px]">ความต้านทาน (RES)</span>
              <div className="text-sm font-bold text-sky-400 font-mono">
                {baseStats.res || 15}%
              </div>
            </div>

            <div className="bg-[#101724] p-2.5 rounded-xl border border-[#1d2b3f]">
              <span className="text-slate-400 text-[11px]">ความแม่นยำ (ACC)</span>
              <div className="text-sm font-bold text-indigo-400 font-mono">
                {baseStats.acc || 0}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Guide & Runes */}
      {activeTab === 'guide' && (
        <div className="space-y-3 text-xs">
          {/* Role */}
          <div className="p-3.5 rounded-xl bg-[#0c121c] border border-[#1d2b3f] space-y-1.5">
            <div className="text-blue-400 font-bold flex items-center gap-1.5">
              <Swords className="w-4 h-4" />
              <span>บทบาทหน้าที่หลักในทีม (Role & Tactics):</span>
            </div>
            <div className="text-slate-200 leading-relaxed font-sans">
              {monsterData.role || 'ตัวทำเกมและโจมตีตามหน้าที่ของสาย'}
            </div>
          </div>

          {/* Suggested Runes */}
          <div className="p-3.5 rounded-xl bg-[#0c121c] border border-[#1d2b3f] space-y-1.5">
            <div className="text-emerald-400 font-bold flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              <span>เซ็ตรูนยอดนิยม (Recommended Rune Builds):</span>
            </div>
            <div className="text-slate-200 font-mono bg-[#101724] p-2 rounded-lg border border-[#1a2638]">
              {monsterData.suggestedRunes || 'Violent/Will (SPD/HP%/HP%) หรือ Despair/Will'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
