import React, { useMemo, useState } from 'react';
import { Swords, Users, Sparkles, CheckCircle2, AlertCircle, ChevronRight, Lock } from 'lucide-react';
import MonsterAvatar from './MonsterAvatar';
import AiChatPanel from './AiChatPanel';
import guardianMeta from '../data/swrtGuardianMeta.json';
import { teamsFromBox } from '../utils/metaTeams';
import { summarizeBoxForAi, keyMonstersForAi } from '../utils/boxSummary';

const card = 'rounded-2xl border border-white/[0.08] bg-[#0a0f19]/80';
const wrTone = (wr) => (wr >= 52 ? 'text-emerald-400' : wr < 48 ? 'text-rose-400' : 'text-slate-200');

/**
 * Real Guardian duo/trio combos the player can field right now, the ones a single monster
 * away, and which monster would unlock the most of them. `owned` comes from ownedIdSet(box).
 */
export default function MetaTeamsFromBox({ box, owned, monsterOf, onNavigate }) {
  const [kind, setKind] = useState('trios');
  const [filter, setFilter] = useState('all'); // all | ready | one
  const [question, setQuestion] = useState('');

  const result = useMemo(() => teamsFromBox(guardianMeta, owned), [owned]);
  const replays = Math.round((guardianMeta.meta?.replaySides || 0) / 2);

  const list = useMemo(() => {
    const teams = kind === 'trios' ? result.trios : result.duos;
    if (filter === 'ready') return teams.filter((t) => t.ready);
    if (filter === 'one') return teams.filter((t) => t.missing.length === 1);
    return teams;
  }, [result, kind, filter]);

  const nameOf = (id) => monsterOf(id)?.name || `#${id}`;
  const askAbout = (team) => {
    const names = team.ids.map(nameOf).join(' + ');
    setQuestion(team.ready
      ? `ทีม ${names} ในกล่องของฉัน ควรเล่นยังไงใน RTA ระดับ Guardian ลำดับดราฟต์ ลีด และตัวที่ 4-5 ที่ควรเสริม`
      : `ฉันมี ${team.ids.filter((id) => !team.missing.includes(id)).map(nameOf).join(' + ')} แต่ยังไม่มี ${team.missing.map(nameOf).join(', ')} มีตัวไหนในกล่องของฉันแทนได้ใกล้เคียงที่สุด`);
    document.getElementById('meta-teams-ai')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!result.trios.length && !result.duos.length) {
    return <div className={`${card} p-8 text-center text-sm text-slate-400`}>ยังไม่มีข้อมูลคอมโบ Guardian — รัน <code className="font-mono text-slate-300">npm run players:fetch</code></div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile icon={Swords} label="ทีม 3 ตัวที่เล่นได้ทันที" value={`${result.readyTrios.length}/${result.trios.length}`} tone="text-emerald-300" onClick={() => { setKind('trios'); setFilter('ready'); }} />
        <Tile icon={Users} label="คู่ 2 ตัวที่เล่นได้ทันที" value={`${result.readyDuos.length}/${result.duos.length}`} tone="text-cyan-300" onClick={() => { setKind('duos'); setFilter('ready'); }} />
        <Tile icon={AlertCircle} label="ทีมที่ขาดอีกแค่ 1 ตัว" value={result.oneAway.length} tone="text-amber-300" onClick={() => setFilter('one')} />
        <Tile icon={Sparkles} label="ตัวที่ปลดล็อกทีมได้มากสุด" value={result.unlocks[0] ? nameOf(result.unlocks[0].id) : '-'} sub={result.unlocks[0] ? `+${result.unlocks[0].total} ทีม` : ''} tone="text-fuchsia-300" small />
      </div>

      {result.unlocks.length > 0 && (
        <div className={`${card} p-4`}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-fuchsia-300" /> ได้ตัวไหนเพิ่ม จะเล่นทีมเมต้าได้อีกกี่ทีม</h3>
            <span className="text-[11px] text-slate-500">นับเฉพาะทีมที่คุณมีสมาชิกครบยกเว้นตัวนั้น</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2">
            {result.unlocks.slice(0, 12).map((u) => {
              const info = monsterOf(u.id);
              return (
                <button key={u.id} onClick={() => onNavigate?.('where2use', { initialMonster: info?.name })} className="p-2.5 rounded-xl bg-fuchsia-500/[0.05] border border-fuchsia-500/20 hover:border-fuchsia-400/60 text-left flex items-center gap-2.5 cursor-pointer">
                  {info ? <MonsterAvatar monster={info} size="xs" showStars={false} /> : <div className="w-8 h-8 rounded-lg bg-slate-800" />}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{info?.name || `#${u.id}`}</div>
                    <div className="text-[11px] text-fuchsia-300 font-mono">+{u.total} ทีม{u.trios ? ` · ${u.trios} trio` : ''}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={`${card} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-1.5 text-xs">
            {[['trios', 'ทีม 3 ตัว'], ['duos', 'คู่ 2 ตัว']].map(([id, label]) => (
              <button key={id} onClick={() => setKind(id)} className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${kind === id ? 'bg-rose-600 text-white' : 'bg-white/[0.04] text-slate-300 hover:text-white'}`}>{label}</button>
            ))}
            <span className="w-px h-4 bg-white/10 mx-1" />
            {[['all', 'ทั้งหมด'], ['ready', 'เล่นได้ทันที'], ['one', 'ขาด 1 ตัว']].map(([id, label]) => (
              <button key={id} onClick={() => setFilter(id)} className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${filter === id ? 'bg-white/[0.12] text-white' : 'text-slate-400 hover:text-white'}`}>{label}</button>
            ))}
          </div>
          <span className="text-[11px] text-slate-500">จากสถิติการแข่งขันระดับ Guardian {replays.toLocaleString()} แมตช์ • เรียงตาม พร้อมเล่น → อัตราชนะ (ถ่วงด้วยจำนวนแมตช์)</span>
        </div>

        {list.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">ไม่มีทีมในกลุ่มนี้</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 divide-y md:divide-y-0 divide-white/[0.04]">
            {list.map((t) => (
              <div key={t.ids.join('-')} className={`p-3 border-b border-white/[0.04] flex items-center gap-3 ${t.ready ? '' : 'opacity-90'}`}>
                <div className="flex items-center gap-1">
                  {t.ids.map((id) => {
                    const info = monsterOf(id);
                    const miss = t.missing.includes(id);
                    return (
                      <div key={id} className={`relative rounded-xl ${miss ? 'opacity-40 grayscale' : ''}`} title={miss ? `ยังไม่มี ${info?.name || id}` : info?.name}>
                        {info ? <MonsterAvatar monster={info} size="sm" showStars={false} /> : <div className="w-10 h-10 rounded-lg bg-slate-800" />}
                        {miss && <Lock className="w-3.5 h-3.5 text-rose-300 absolute -top-1 -right-1 bg-[#0a0f19] rounded-full p-0.5" />}
                      </div>
                    );
                  })}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">{t.ids.map(nameOf).join(' + ')}</div>
                  <div className="text-[11px] font-mono text-slate-400">{t.n} แมตช์ · <span className={wrTone(t.winRate)}>{t.winRate}%</span></div>
                  {t.ready
                    ? <div className="text-[11px] text-emerald-300 flex items-center gap-1 mt-0.5"><CheckCircle2 className="w-3 h-3" /> เล่นได้ทันที</div>
                    : <div className="text-[11px] text-amber-300 mt-0.5 truncate">ขาด {t.missing.map(nameOf).join(', ')}</div>}
                </div>
                <button onClick={() => askAbout(t)} className="shrink-0 text-[11px] font-bold text-amber-300 hover:text-white flex items-center gap-0.5 cursor-pointer" title="ให้โค้ช AI วิเคราะห์ทีมนี้">AI <ChevronRight className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div id="meta-teams-ai">
        <AiChatPanel
          title="ถามโค้ช AI เรื่องทีมเมต้าจากกล่องของฉัน"
          placeholder="เช่น ทีม 3 ตัวไหนที่ฉันเล่นได้และเหมาะกับ Guardian ที่สุด / ควรตกตัวไหนต่อ"
          suggestions={['จากทีมเมต้าที่ฉันเล่นได้ ทีมไหนเหมาะกับสไตล์ตั้งรับ-ลากเกม', 'ฉันควรตกมอนสเตอร์ตัวไหนต่อเพื่อปลดล็อกทีมเมต้ามากที่สุด']}
          initialQuestion={question}
          buildContext={() => ({
            box: summarizeBoxForAi(box, monsterOf),
            monsters: keyMonstersForAi(box, monsterOf),
            metaTeams: {
              ready: result.readyTrios.slice(0, 8).map((t) => ({ team: t.ids.map(nameOf), games: t.n, winRate: t.winRate })),
              oneAway: result.oneAway.slice(0, 6).map((t) => ({ team: t.ids.map(nameOf), missing: t.missing.map(nameOf), games: t.n, winRate: t.winRate })),
            },
          })}
        />
      </div>
    </div>
  );
}

function Tile({ icon: Icon, label, value, sub, tone, onClick, small }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag onClick={onClick} className={`${card} p-4 text-left ${onClick ? 'hover:border-white/20 transition-colors cursor-pointer' : ''}`}>
      <div className="text-xs text-slate-400 flex items-center gap-1.5"><Icon className={`w-3.5 h-3.5 ${tone}`} /> {label}</div>
      <div className={`${small ? 'text-lg' : 'text-2xl'} font-black font-mono mt-1 truncate ${tone}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>}
    </Tag>
  );
}
