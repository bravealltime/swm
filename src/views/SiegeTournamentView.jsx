import React, { useState } from 'react';
import { 
  Trophy, 
  Swords, 
  Shield, 
  Crown, 
  ArrowRight, 
  Flame, 
  Globe, 
  Award, 
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import { MONSTERS } from '../data/monsters';
import SIEGE_TOURNAMENT from '../data/siegeTournament.json';

export default function SiegeTournamentView({ onNavigate }) {
  const [activeServer, setActiveServer] = useState('Global');

  const serverData = SIEGE_TOURNAMENT.servers[activeServer] || SIEGE_TOURNAMENT.servers['Global'];

  const getMonsterObj = (name) => {
    return MONSTERS.find(m => m.name.toLowerCase() === name.toLowerCase()) || {
      name,
      avatarUrl: 'https://do9d4mpqk497d.cloudfront.net/common/images/monsters36/unit_icon_0001_0_0.png',
      element: 'wind'
    };
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-br from-[#101a2d] via-[#0d1422] to-[#090e18] border border-[#1b2a40] rounded-2xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Official Com2uS Siege Tournament • Season 17 Championship</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ทัวร์นาเมนต์ Siege ชิงแชมป์โลก (Siege Tournament)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              ตารางสายการแข่งขันชิงแชมป์กิลด์วอร์ระดับโลก ติดตามคะแนน ผลการรบของแต่ละคู่ และสูตรทีมตั้งรับยอดเยี่ยม (MVP Defenses) ที่คว้าชัยชนะในทัวร์นาเมนต์
            </p>
          </div>

          {/* Server tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#080d16] border border-[#1b283d] self-start md:self-auto">
            {['Global', 'Asia', 'Europe'].map((srv) => (
              <button
                key={srv}
                onClick={() => setActiveServer(srv)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeServer === srv
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {srv === 'Global' ? 'Global 🌐' : srv === 'Asia' ? 'Asia 🌏' : 'Europe 🇪🇺'}
              </button>
            ))}
          </div>
        </div>

        {/* Podium Highlight */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#182638]">
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🥇</span>
              <div>
                <div className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">แชมป์ประจำเซิร์ฟเวอร์</div>
                <div className="text-base font-black text-white">{serverData.champion}</div>
              </div>
            </div>
            <Crown className="w-5 h-5 text-amber-400" />
          </div>

          <div className="p-3.5 rounded-xl bg-[#080d16] border border-[#1b283d] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🥈</span>
              <div>
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">รองแชมป์อันดับ 1</div>
                <div className="text-sm font-bold text-slate-200">{serverData.runnerUp}</div>
              </div>
            </div>
            <Award className="w-4 h-4 text-slate-400" />
          </div>

          <div className="p-3.5 rounded-xl bg-[#080d16] border border-[#1b283d] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🥉</span>
              <div>
                <div className="text-[11px] text-amber-600 font-bold uppercase tracking-wider">รองแชมป์อันดับ 2</div>
                <div className="text-sm font-bold text-slate-200">{serverData.thirdPlace}</div>
              </div>
            </div>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
        </div>
      </div>

      {/* 2. Tournament Bracket Tree */}
      <div className="bg-[#0c1320] border border-[#1b2b42] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#182638]">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              สายการแข่งขันรอบน็อคเอาต์ (Tournament Bracket Tree)
            </h2>
          </div>
          <span className="text-xs text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            ● ผลการแข่งสิ้นสุดแล้ว
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {serverData.bracket.map((stage, sIdx) => (
            <div key={sIdx} className="space-y-3">
              <div className="px-3 py-1.5 rounded-lg bg-[#080d16] border border-[#182638] text-center text-xs font-bold text-amber-400 uppercase tracking-wider">
                {stage.round === 'Quarterfinals' ? 'รอบ 8 ทีมสุดท้าย' : stage.round === 'Semifinals' ? 'รอบ 4 ทีม (รองชนะเลิศ)' : 'รอบชิงชนะเลิศ (Grand Final) 🏆'}
              </div>

              <div className="space-y-2.5">
                {stage.matches.map((match, mIdx) => (
                  <div 
                    key={mIdx}
                    className="p-3 rounded-xl bg-[#080d16] border border-[#182638] hover:border-amber-500/40 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold ${match.winner === match.team1 ? 'text-amber-400 font-black' : 'text-slate-400'}`}>
                        {match.team1} {match.winner === match.team1 && '👑'}
                      </span>
                      <span className="font-mono text-slate-300 font-bold">{match.score1}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-[#141e2c]">
                      <span className={`font-bold ${match.winner === match.team2 ? 'text-amber-400 font-black' : 'text-slate-400'}`}>
                        {match.team2} {match.winner === match.team2 && '👑'}
                      </span>
                      <span className="font-mono text-slate-300 font-bold">{match.score2}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. MVP Tournament Defenses */}
      {serverData.mvpDefenses && serverData.mvpDefenses.length > 0 && (
        <div className="bg-[#0c1320] border border-[#1b2b42] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#182638]">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base sm:text-lg font-bold text-white">
                ทีมตั้งรับยอดเยี่ยมในทัวร์นาเมนต์ (MVP Defenses)
              </h2>
            </div>
            <button
              onClick={() => onNavigate('3mdc')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              ดูสูตรแก้ทางใน 3MDC <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {serverData.mvpDefenses.map((def, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-xl bg-[#080d16] border border-[#182638] hover:border-cyan-500/40 transition-all space-y-3 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate">{def.title}</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    {def.record}
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-[#0c1422] p-2 rounded-lg border border-[#162232]">
                  {def.monsters.map((name, mIdx) => (
                    <MonsterAvatar key={mIdx} monster={getMonsterObj(name)} size="sm" showStars={false} />
                  ))}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {def.notes}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
