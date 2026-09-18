import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield, Swords, Clock, Users, Flame, RefreshCw, Plus, CheckCircle2,
  XCircle, AlertTriangle, MessageSquare, Copy, Check, Download, Upload,
  Search, Lock, Unlock, Eye, BarChart3, ChevronRight, Award, Zap
} from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import { loadGuildWarState, saveGuildWarState, subscribeToSync, exportAllDataAsJSON } from '../services/storageService';
import { loadBox, getMonsterCatalogInfo } from '../utils/swexImport';
import allMonstersData from '../data/allMonsters.json';
import * as aegisLive from '../services/aegisLive';
import { applyLiveToWar } from '../utils/siegeLive';

const nameOfMaster = (id) => getMonsterCatalogInfo(id)?.name || `#${id}`;

// Seed initial default 12-base siege state if no state in IndexedDB
function getInitialWarState() {
  const defaultBases = [
    { id: 1, name: 'ป้อม 1 (NW)', guild: 'blue', status: 'active', remaining: 5, max: 5, protectedUntil: 0, defenses: [
      { id: '1-1', monsters: ['Seara', 'Giana', 'Liebli'], status: 'alive', attacker: null, attackedAt: null },
      { id: '1-2', monsters: ['Carcano', 'Vigor', 'Triana'], status: 'alive', attacker: null, attackedAt: null },
      { id: '1-3', monsters: ['Chun-Li', 'Galleon', 'Tiana'], status: 'alive', attacker: null, attackedAt: null },
      { id: '1-4', monsters: ['Dominic', 'Nana', 'Savannah'], status: 'alive', attacker: null, attackedAt: null },
      { id: '1-5', monsters: ['Mo Long', 'Harmonia', 'Perna'], status: 'alive', attacker: null, attackedAt: null },
    ]},
    { id: 2, name: 'ป้อม 2 (N)', guild: 'red', status: 'active', remaining: 4, max: 5, protectedUntil: 0, defenses: [
      { id: '2-1', monsters: ['Carcano', 'Eshir', 'Iris'], status: 'alive', attacker: null, attackedAt: null },
      { id: '2-2', monsters: ['Khmun', 'Bastet', 'Odin'], status: 'defeated', attacker: 'SWM-Blade', attackedAt: Date.now() - 360000 },
      { id: '2-3', monsters: ['Clara', 'Savannah', 'Bellenus'], status: 'alive', attacker: null, attackedAt: null },
      { id: '2-4', monsters: ['Galleon', 'Clara', 'Yen'], status: 'alive', attacker: null, attackedAt: null },
      { id: '2-5', monsters: ['Miles', 'Racuni', 'Chow'], status: 'alive', attacker: null, attackedAt: null },
    ]},
    { id: 3, name: 'ป้อม 3 (NE)', guild: 'yellow', status: 'protected', remaining: 5, max: 5, protectedUntil: Date.now() + 18 * 60 * 1000, defenses: [
      { id: '3-1', monsters: ['Savannah', 'Nana', 'Oliver'], status: 'alive', attacker: null, attackedAt: null },
      { id: '3-2', monsters: ['Khmun', 'Vigor', 'Skogul'], status: 'alive', attacker: null, attackedAt: null },
      { id: '3-3', monsters: ['Martina', 'Shaina', 'Triana'], status: 'alive', attacker: null, attackedAt: null },
      { id: '3-4', monsters: ['Mo Long', 'Woosa', 'Perna'], status: 'alive', attacker: null, attackedAt: null },
      { id: '3-5', monsters: ['Jeanne', 'Leo', 'Anavel'], status: 'alive', attacker: null, attackedAt: null },
    ]},
    { id: 4, name: 'ป้อม 4 (W)', guild: 'blue', status: 'active', remaining: 5, max: 5, protectedUntil: 0, defenses: [
      { id: '4-1', monsters: ['Galleon', 'Tiana', 'Zaiross'], status: 'alive', attacker: null, attackedAt: null },
      { id: '4-2', monsters: ['Seara', 'Orion', 'Perna'], status: 'alive', attacker: null, attackedAt: null },
      { id: '4-3', monsters: ['Carcano', 'Triana', 'Vigor'], status: 'alive', attacker: null, attackedAt: null },
      { id: '4-4', monsters: ['Nana', 'Dominic', 'Riley'], status: 'alive', attacker: null, attackedAt: null },
      { id: '4-5', monsters: ['Khmun', 'Odin', 'Bastet'], status: 'alive', attacker: null, attackedAt: null },
    ]},
    { id: 5, name: 'ป้อม 5 (Center-W)', guild: 'red', status: 'active', remaining: 3, max: 5, protectedUntil: 0, defenses: [
      { id: '5-1', monsters: ['Clara', 'Savannah', 'Kaki'], status: 'alive', attacker: 'SWM-Zeed', attackedAt: Date.now() - 120000 },
      { id: '5-2', monsters: ['Carcano', 'Vigor', 'Triana'], status: 'defeated', attacker: 'Thai-Master', attackedAt: Date.now() - 600000 },
      { id: '5-3', monsters: ['Mo Long', 'Bolenus', 'Harmonia'], status: 'defeated', attacker: 'LucksackPro', attackedAt: Date.now() - 480000 },
      { id: '5-4', monsters: ['Oliver', 'Cheongpung', 'Miles'], status: 'alive', attacker: null, attackedAt: null },
      { id: '5-5', monsters: ['Khmun', 'Skogul', 'Vigor'], status: 'alive', attacker: null, attackedAt: null },
    ]},
    { id: 6, name: 'ป้อม 6 (Center-E)', guild: 'yellow', status: 'active', remaining: 4, max: 5, protectedUntil: 0, defenses: [
      { id: '6-1', monsters: ['Seara', 'Liebli', 'Giana'], status: 'alive', attacker: null, attackedAt: null },
      { id: '6-2', monsters: ['Savannah', 'Nana', 'Dominic'], status: 'alive', attacker: null, attackedAt: null },
      { id: '6-3', monsters: ['Chun-Li', 'Eshir', 'Kaki'], status: 'defeated', attacker: 'SWM-Blade', attackedAt: Date.now() - 720000 },
      { id: '6-4', monsters: ['Galleon', 'Clara', 'Yen'], status: 'alive', attacker: null, attackedAt: null },
      { id: '6-5', monsters: ['Khmun', 'Bastet', 'Odin'], status: 'alive', attacker: null, attackedAt: null },
    ]},
    { id: 7, name: 'ป้อม 7 (E)', guild: 'yellow', status: 'active', remaining: 5, max: 5, protectedUntil: 0, defenses: [
      { id: '7-1', monsters: ['Carcano', 'Vigor', 'Triana'], status: 'alive', attacker: null, attackedAt: null },
      { id: '7-2', monsters: ['Miles', 'Racuni', 'Chow'], status: 'alive', attacker: null, attackedAt: null },
      { id: '7-3', monsters: ['Mo Long', 'Harmonia', 'Perna'], status: 'alive', attacker: null, attackedAt: null },
      { id: '7-4', monsters: ['Dominic', 'Nana', 'Savannah'], status: 'alive', attacker: null, attackedAt: null },
      { id: '7-5', monsters: ['Clara', 'Kaki', 'Savannah'], status: 'alive', attacker: null, attackedAt: null },
    ]},
    { id: 8, name: 'ป้อม 8 (SW)', guild: 'blue', status: 'active', remaining: 5, max: 5, protectedUntil: 0, defenses: [
      { id: '8-1', monsters: ['Oliver', 'Cheongpung', 'Miles'], status: 'alive', attacker: null, attackedAt: null },
      { id: '8-2', monsters: ['Khmun', 'Odin', 'Bastet'], status: 'alive', attacker: null, attackedAt: null },
      { id: '8-3', monsters: ['Seara', 'Giana', 'Liebli'], status: 'alive', attacker: null, attackedAt: null },
      { id: '8-4', monsters: ['Carcano', 'Vigor', 'Triana'], status: 'alive', attacker: null, attackedAt: null },
      { id: '8-5', monsters: ['Mo Long', 'Woosa', 'Perna'], status: 'alive', attacker: null, attackedAt: null },
    ]},
    { id: 9, name: 'ป้อม 9 (S)', guild: 'red', status: 'active', remaining: 5, max: 5, protectedUntil: 0, defenses: [
      { id: '9-1', monsters: ['Galleon', 'Clara', 'Yen'], status: 'alive', attacker: null, attackedAt: null },
      { id: '9-2', monsters: ['Nana', 'Dominic', 'Savannah'], status: 'alive', attacker: null, attackedAt: null },
      { id: '9-3', monsters: ['Khmun', 'Vigor', 'Skogul'], status: 'alive', attacker: null, attackedAt: null },
      { id: '9-4', monsters: ['Miles', 'Racuni', 'Chow'], status: 'alive', attacker: null, attackedAt: null },
      { id: '9-5', monsters: ['Chun-Li', 'Eshir', 'Kaki'], status: 'alive', attacker: null, attackedAt: null },
    ]},
    { id: 10, name: 'ป้อม 10 (SE)', guild: 'yellow', status: 'active', remaining: 5, max: 5, protectedUntil: 0, defenses: [
      { id: '10-1', monsters: ['Seara', 'Orion', 'Perna'], status: 'alive', attacker: null, attackedAt: null },
      { id: '10-2', monsters: ['Carcano', 'Triana', 'Vigor'], status: 'alive', attacker: null, attackedAt: null },
      { id: '10-3', monsters: ['Mo Long', 'Harmonia', 'Perna'], status: 'alive', attacker: null, attackedAt: null },
      { id: '10-4', monsters: ['Khmun', 'Bastet', 'Odin'], status: 'alive', attacker: null, attackedAt: null },
      { id: '10-5', monsters: ['Dominic', 'Nana', 'Riley'], status: 'alive', attacker: null, attackedAt: null },
    ]},
    { id: 11, name: 'ป้อม 11 (Inner-W)', guild: 'blue', status: 'active', remaining: 5, max: 5, protectedUntil: 0, defenses: [
      { id: '11-1', monsters: ['Clara', 'Savannah', 'Kaki'], status: 'alive', attacker: null, attackedAt: null },
      { id: '11-2', monsters: ['Oliver', 'Cheongpung', 'Miles'], status: 'alive', attacker: null, attackedAt: null },
      { id: '11-3', monsters: ['Carcano', 'Vigor', 'Triana'], status: 'alive', attacker: null, attackedAt: null },
      { id: '11-4', monsters: ['Khmun', 'Skogul', 'Vigor'], status: 'alive', attacker: null, attackedAt: null },
      { id: '11-5', monsters: ['Mo Long', 'Woosa', 'Perna'], status: 'alive', attacker: null, attackedAt: null },
    ]},
    { id: 12, name: 'ป้อม 12 (Inner-E)', guild: 'red', status: 'active', remaining: 5, max: 5, protectedUntil: 0, defenses: [
      { id: '12-1', monsters: ['Seara', 'Giana', 'Liebli'], status: 'alive', attacker: null, attackedAt: null },
      { id: '12-2', monsters: ['Galleon', 'Tiana', 'Zaiross'], status: 'alive', attacker: null, attackedAt: null },
      { id: '12-3', monsters: ['Khmun', 'Bastet', 'Odin'], status: 'alive', attacker: null, attackedAt: null },
      { id: '12-4', monsters: ['Miles', 'Racuni', 'Chow'], status: 'alive', attacker: null, attackedAt: null },
      { id: '12-5', monsters: ['Nana', 'Dominic', 'Savannah'], status: 'alive', attacker: null, attackedAt: null },
    ]},
  ];

  const defaultMembers = [
    { id: 'm1', name: 'SWM-Blade (หัวหน้ากิลด์)', swordsLeft: 24, win: 2, loss: 0, role: 'Leader' },
    { id: 'm2', name: 'Thai-Master (รองหัวหน้า)', swordsLeft: 27, win: 1, loss: 0, role: 'Vice' },
    { id: 'm3', name: 'LucksackPro', swordsLeft: 27, win: 1, loss: 0, role: 'Member' },
    { id: 'm4', name: 'SWM-Zeed', swordsLeft: 30, win: 0, loss: 0, role: 'Member' },
    { id: 'm5', name: 'Aegis-Knight', swordsLeft: 30, win: 0, loss: 0, role: 'Member' },
    { id: 'm6', name: 'DemonHunter_TH', swordsLeft: 21, win: 3, loss: 0, role: 'Member' },
    { id: 'm7', name: 'ShadowStriker', swordsLeft: 18, win: 3, loss: 1, role: 'Member' },
    { id: 'm8', name: 'RuneMaster99', swordsLeft: 30, win: 0, loss: 0, role: 'Member' },
    { id: 'm9', name: 'Guardian_X', swordsLeft: 27, win: 1, loss: 0, role: 'Member' },
    { id: 'm10', name: 'Valkyrja', swordsLeft: 30, win: 0, loss: 0, role: 'Member' },
  ];

  const defaultLogs = [
    { id: 'log-1', time: '04:50', text: 'LucksackPro ชนะ ป้อม 5 ทีม Mo Long / Bolenus / Harmonia (+100pt)', type: 'win' },
    { id: 'log-2', time: '04:48', text: 'Thai-Master ชนะ ป้อม 5 ทีม Carcano / Vigor / Triana (+100pt)', type: 'win' },
    { id: 'log-3', time: '04:44', text: 'SWM-Blade ชนะ ป้อม 2 ทีม Khmun / Bastet / Odin (+100pt)', type: 'win' },
    { id: 'log-4', time: '04:40', text: 'ป้อม 3 (NE) กิลด์สีเหลืองเข้าสู่สถานะป้องกัน (Protection) อีก 20 นาที', type: 'info' },
  ];

  return {
    guildName: 'SWM Elite (ไทยแลนด์)',
    server: 'Asia',
    round: 'Siege Battle รอบที่ 1 (จันทร์-อังคาร)',
    bases: defaultBases,
    members: defaultMembers,
    logs: defaultLogs,
    currentScore: { blue: 11450, red: 9820, yellow: 10200 },
    myPlayerName: 'SWM-Blade (หัวหน้ากิลด์)',
  };
}

// Curated 3MDC common counters for swift lookups
const KNOWN_COUNTERS = {
  'Carcano': [
    { leader: 'Galleon', team: ['Galleon', 'Clara', 'Yen'], winRate: '88.4%', note: 'ชิงสปีดคลีนทีม' },
    { leader: 'Khmun', team: ['Khmun', 'Tractor', 'Lulu'], winRate: '92.1%', note: 'ทีมปลอดภัย ล่อธาตุไฟ' },
  ],
  'Seara': [
    { leader: 'Chun-Li', team: ['Chun-Li', 'Eshir', 'Kaki'], winRate: '91.2%', note: 'วันช็อตบอมบ์ก่อนออกเทิร์น' },
    { leader: 'Fran', team: ['Fran', 'Loren', 'Verdehile'], winRate: '84.0%', note: 'ล็อกเทิร์นด้วย Loren' },
  ],
  'Khmun': [
    { leader: 'Tovenant', team: ['Covenant', 'Kahli', 'Chloe'], winRate: '94.5%', note: 'เกราะอมตะ + สไนเปอร์เจาะเกราะ' },
  ],
  'Clara': [
    { leader: 'Susano', team: ['Susano', 'Orion', 'Garo'], winRate: '87.3%', note: 'ชิงสปีดธาตุน้ำหลบไฟ' },
  ],
};

export default function GuildWarRoomView({ onNavigate }) {
  const [war, setWar] = useState(null);
  const [selectedBaseId, setSelectedBaseId] = useState(2); // default selected base
  const [userBox, setUserBox] = useState(() => loadBox());
  const [copiedCode, setCopiedCode] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [filterMember, setFilterMember] = useState('');
  const [logText, setLogText] = useState('');

  // Clock for countdowns
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time guild / siege packets from the AegisLink SWEX plugin
  const [live, setLive] = useState(() => ({ ...aegisLive.getState() }));
  const mergeLive = (guild, st) => {
    if (!guild || !Object.keys(guild.packets || {}).length) return;
    setWar((prev) => {
      if (!prev) return prev;
      const next = applyLiveToWar(prev, guild, nameOfMaster, st?.wizard?.name);
      if (next !== prev) saveGuildWarState(next);
      return next;
    });
  };

  // Load from IndexedDB on mount
  useEffect(() => {
    async function init() {
      const saved = await loadGuildWarState();
      let base;
      if (saved && saved.bases) {
        base = saved;
      } else {
        base = getInitialWarState();
        await saveGuildWarState(base);
      }
      const st = aegisLive.getState();
      setWar(applyLiveToWar(base, st.guild, nameOfMaster, st.wizard?.name));
    }
    init();

    // Subscribe to multi-tab real-time sync
    const unsubscribe = subscribeToSync((event) => {
      if (event.type === 'GUILD_WAR_UPDATED' && event.data) {
        setWar(event.data);
      }
    });
    const unsubLive = aegisLive.subscribe((type, payload, st) => {
      if (type === 'state') setLive({ ...st });
      if (type === 'guild') mergeLive(payload, st);
    });
    return () => { unsubscribe(); unsubLive(); };
  }, []);

  // Save changes to IndexedDB and broadcast
  const updateWar = async (updater) => {
    setWar((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveGuildWarState(next);
      return next;
    });
  };

  const selectedBase = useMemo(() => {
    if (!war?.bases) return null;
    return war.bases.find((b) => b.id === selectedBaseId) || war.bases[0];
  }, [war, selectedBaseId]);

  // Handle Callout / Reservation (จองเป้าหมายเข้าตี)
  const toggleReservation = (defId) => {
    if (!war) return;
    updateWar((prev) => {
      const updatedBases = prev.bases.map((base) => {
        if (base.id !== selectedBaseId) return base;
        return {
          ...base,
          defenses: base.defenses.map((def) => {
            if (def.id !== defId) return def;
            const isMeAttacking = def.attacker === prev.myPlayerName;
            const newAttacker = isMeAttacking ? null : prev.myPlayerName;
            const newAttackedAt = isMeAttacking ? null : Date.now();
            return { ...def, attacker: newAttacker, attackedAt: newAttackedAt };
          }),
        };
      });

      const targetDef = selectedBase.defenses.find((d) => d.id === defId);
      const isCancelling = targetDef?.attacker === prev.myPlayerName;
      const logEntry = {
        id: 'log-' + Date.now(),
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        text: isCancelling
          ? `${prev.myPlayerName} ยกเลิกการจองเป้าหมายที่ ${selectedBase.name}`
          : `🎯 ${prev.myPlayerName} กำลังเข้าตี ${selectedBase.name} (ทีม ${targetDef?.monsters.join('/')})`,
        type: isCancelling ? 'info' : 'callout',
      };

      return {
        ...prev,
        bases: updatedBases,
        logs: [logEntry, ...prev.logs.slice(0, 49)],
      };
    });
  };

  // Handle reporting Win or Loss for a defense slot
  const reportBattleResult = (defId, isWin) => {
    if (!war) return;
    updateWar((prev) => {
      let targetMonsters = [];
      const updatedBases = prev.bases.map((base) => {
        if (base.id !== selectedBaseId) return base;
        const newDefs = base.defenses.map((def) => {
          if (def.id !== defId) return def;
          targetMonsters = def.monsters;
          return {
            ...def,
            status: isWin ? 'defeated' : 'alive',
            attacker: null,
            attackedAt: null,
          };
        });
        const aliveCount = newDefs.filter((d) => d.status === 'alive').length;
        return {
          ...base,
          defenses: newDefs,
          remaining: aliveCount,
          status: aliveCount === 0 ? 'fallen' : base.status,
        };
      });

      // Deduct 1 sword from current player
      const updatedMembers = prev.members.map((m) => {
        if (m.name !== prev.myPlayerName) return m;
        return {
          ...m,
          swordsLeft: Math.max(0, m.swordsLeft - 3), // 3 monsters per attack
          win: isWin ? m.win + 1 : m.win,
          loss: !isWin ? m.loss + 1 : m.loss,
        };
      });

      const logEntry = {
        id: 'log-' + Date.now(),
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        text: isWin
          ? `⚔️ ${prev.myPlayerName} ชนะ ${selectedBase.name} ทีม [${targetMonsters.join(', ')}] (+100pt)`
          : `💀 ${prev.myPlayerName} พ่ายแพ้ ${selectedBase.name} ทีม [${targetMonsters.join(', ')}]`,
        type: isWin ? 'win' : 'loss',
      };

      return {
        ...prev,
        bases: updatedBases,
        members: updatedMembers,
        logs: [logEntry, ...prev.logs.slice(0, 49)],
      };
    });
  };

  // Post manual tactical note / chat
  const handlePostNote = (e) => {
    e.preventDefault();
    if (!logText.trim() || !war) return;
    const logEntry = {
      id: 'log-' + Date.now(),
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      text: `💬 ${war.myPlayerName}: ${logText.trim()}`,
      type: 'chat',
    };
    updateWar((prev) => ({
      ...prev,
      logs: [logEntry, ...prev.logs.slice(0, 49)],
    }));
    setLogText('');
  };

  // Check if player owns monsters in My Box
  const ownedNames = useMemo(() => {
    if (!userBox?.units) return new Set();
    return new Set(userBox.units.map((u) => u.name?.toLowerCase() || ''));
  }, [userBox]);

  if (!war) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-400">
        <RefreshCw className="w-7 h-7 animate-spin text-blue-400 mr-3" />
        <span>กำลังเชื่อมต่อห้องบัญชาการกิลด์แบบเรียลไทม์...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-blue-950/70 via-slate-900/90 to-indigo-950/70 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {war.live ? (
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE จาก SWEX
                </span>
              ) : (
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  ข้อมูลตัวอย่าง
                </span>
              )}
              <span className={`px-2.5 py-0.5 text-xs rounded-full border flex items-center gap-1.5 ${live.status === 'live' ? 'text-cyan-200 bg-cyan-500/10 border-cyan-500/30' : live.status === 'connecting' ? 'text-amber-200 bg-amber-500/10 border-amber-500/30' : live.status === 'error' ? 'text-rose-200 bg-rose-500/10 border-rose-500/30' : 'text-slate-400 bg-white/5 border-white/5'}`}>
                <Zap className="w-3 h-3" />
                {live.status === 'live' ? `AegisLink เชื่อมต่อแล้ว${live.lastEventAt ? ` • ${new Date(live.lastEventAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : ''}` : live.status === 'connecting' ? 'กำลังหาปลั๊กอิน AegisLink…' : live.status === 'error' ? 'ไม่พบปลั๊กอิน AegisLink' : 'ยังไม่ได้เชื่อมต่อ SWEX'}
              </span>
              {live.status === 'off' || live.status === 'error' ? (
                <button onClick={() => { if (live.status === 'error') aegisLive.stop(); aegisLive.start(); }} className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer">เชื่อมต่อ SWEX</button>
              ) : (
                <button onClick={() => aegisLive.stop()} className="px-2.5 py-0.5 text-xs rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 cursor-pointer">ตัดการเชื่อมต่อ</button>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              🛡️ ศูนย์บัญชาการกิลด์: <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">{war.guildName}</span>
            </h1>
            <p className="text-sm text-slate-300 flex items-center gap-2 flex-wrap">
              <span>{war.round}</span>
              <span>•</span>
              <span>คุณเล่นในชื่อ: <strong className="text-emerald-400 font-semibold">{war.myPlayerName}</strong></span>
            </p>
            {war.live ? (
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                <span>แพ็กเก็ตล่าสุดจากเกม:</span>
                {war.live.commands.slice(0, 6).map((c) => (
                  <span key={c.command} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[10px] text-slate-300" title={new Date(c.at).toLocaleString('th-TH')}>{c.command}</span>
                ))}
                <span className="text-slate-500">— เปิดหน้ากิลด์ / Siege ในเกมเพื่อรับข้อมูลใหม่</span>
              </p>
            ) : (
              <p className="text-[11px] text-amber-200/80">ป้อม คะแนน และสมาชิกด้านล่างเป็นข้อมูลตัวอย่าง — ติดตั้งปลั๊กอิน AegisLink ใน SWEX แล้วกด "เชื่อมต่อ SWEX" ระบบจะดึงกิลด์จริงของคุณทันทีที่เปิดหน้า Siege ในเกม (<button onClick={() => onNavigate?.('aegislink')} className="underline hover:text-white cursor-pointer">วิธีติดตั้ง</button>)</p>
            )}
          </div>

          {/* Quick Score Board & Export Backup Button */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-4 bg-black/40 border border-white/10 rounded-2xl p-3 px-5">
              <div className="text-center">
                <div className="text-[10px] uppercase font-bold text-blue-400 truncate max-w-[110px]">{war.guildNames?.blue ? `เรา • ${war.guildNames.blue}` : 'เรา (น้ำเงิน)'}</div>
                <div className="text-xl font-black text-white">{war.currentScore.blue.toLocaleString()}</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-[10px] uppercase font-bold text-rose-400 truncate max-w-[110px]">{war.guildNames?.red || 'แดง'}</div>
                <div className="text-lg font-bold text-slate-300">{war.currentScore.red.toLocaleString()}</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-[10px] uppercase font-bold text-amber-400 truncate max-w-[110px]">{war.guildNames?.yellow || 'เหลือง'}</div>
                <div className="text-lg font-bold text-slate-300">{war.currentScore.yellow.toLocaleString()}</div>
              </div>
            </div>

            <button
              onClick={() => exportAllDataAsJSON()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all shadow-lg active:scale-95"
              title="ดาวน์โหลดไฟล์สำรองข้อมูล JSON ทั้งหมดลงเครื่อง"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>สำรองข้อมูล JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map (Left 7 Cols) + Base Inspector & Counters (Right 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: 12-Base Interactive Map */}
        <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-[#070b14]/90 backdrop-blur-xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white tracking-wide">แผนที่ 12 ป้อมเกาะ Siege</h2>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-blue-400"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> เรายึด</span>
              <span className="flex items-center gap-1 text-rose-400"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> แดง</span>
              <span className="flex items-center gap-1 text-amber-400"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> เหลือง</span>
            </div>
          </div>

          {/* Map Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {war.bases.map((base) => {
              const isSelected = base.id === selectedBaseId;
              const isProtected = base.protectedUntil > now;
              const remainingSec = Math.max(0, Math.floor((base.protectedUntil - now) / 1000));
              const protectMin = Math.floor(remainingSec / 60);
              const protectSec = remainingSec % 60;

              const guildBg =
                base.guild === 'blue'
                  ? 'border-blue-500/40 bg-blue-950/20 text-blue-300 hover:border-blue-400'
                  : base.guild === 'red'
                  ? 'border-rose-500/40 bg-rose-950/20 text-rose-300 hover:border-rose-400'
                  : 'border-amber-500/40 bg-amber-950/20 text-amber-300 hover:border-amber-400';

              const activeBorder = isSelected ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/20 scale-[1.02]' : '';

              return (
                <button
                  key={base.id}
                  onClick={() => setSelectedBaseId(base.id)}
                  className={`relative p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between min-h-[105px] group ${guildBg} ${activeBorder}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors">
                      ป้อม {base.id}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      base.remaining === 0 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-slate-200'
                    }`}>
                      {base.max ? `${base.remaining}/${base.max} ทีม` : 'ยังไม่เห็นทีม'}
                    </span>
                  </div>

                  {/* Protection Status */}
                  {isProtected ? (
                    <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30">
                      <Clock className="w-3 h-3 animate-spin" />
                      <span>{protectMin}:{protectSec < 10 ? '0' : ''}{protectSec}</span>
                    </div>
                  ) : (
                    <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>เปิดตีได้</span>
                    </div>
                  )}

                  {/* Reservation indicator */}
                  {base.defenses.some((d) => d.attacker) && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-yellow-400 font-medium">
                      <Lock className="w-3 h-3" />
                      <span>มีเพื่อนจองแล้ว</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Base Overview Banner */}
          {selectedBase && (
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs text-slate-400">ป้อมที่เลือกดู:</div>
                <div className="text-base font-bold text-white flex items-center gap-2">
                  <span>{selectedBase.name}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    selectedBase.guild === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                    selectedBase.guild === 'red' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    กิลด์: {selectedBase.guild === 'blue' ? 'เรา' : selectedBase.guild === 'red' ? 'แดง' : 'เหลือง'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300">เหลือทีมตั้งรับ:</span>
                <span className="text-sm font-black text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  {selectedBase.max ? `${selectedBase.remaining} / ${selectedBase.max} ทีม` : 'ยังไม่เห็นทีม'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Base Defense Inspector & Instant 3MDC Counters */}
        <div className="lg:col-span-5 rounded-3xl border border-white/10 bg-[#070b14]/90 backdrop-blur-xl p-6 space-y-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">ทีมตั้งรับใน {selectedBase.name}</h3>
              </div>
              <span className="text-xs text-slate-400">กดจองเพื่อเข้าตี</span>
            </div>

            {/* Defense Slots */}
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {selectedBase.defenses.length === 0 && (
                <div className="p-4 rounded-xl border border-dashed border-white/10 text-xs text-slate-400 leading-relaxed">
                  ยังไม่มีข้อมูลทีมตั้งรับของป้อมนี้ — เปิดป้อมนี้ในเกม (ผ่าน SWEX) ปลั๊กอิน AegisLink จะส่งทีมตั้งรับมาให้ทันที
                </div>
              )}
              {selectedBase.defenses.map((def, idx) => {
                const isDefeated = def.status === 'defeated';
                const isAttacking = !!def.attacker;
                const isMe = def.attacker === war.myPlayerName;

                // Recommend counter from 3MDC known list
                const leadMon = def.monsters[0];
                const suggestedCounters = KNOWN_COUNTERS[leadMon] || [];

                return (
                  <div
                    key={def.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isDefeated
                        ? 'border-white/5 bg-white/[0.02] opacity-50'
                        : isAttacking
                        ? 'border-yellow-500/40 bg-yellow-950/15'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                    }`}
                  >
                    {/* Header of Slot */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-400">
                        ทีม #{idx + 1}
                      </span>
                      {isDefeated ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> พ่ายแพ้แล้ว
                        </span>
                      ) : isAttacking ? (
                        <span className="flex items-center gap-1 text-xs text-yellow-300 font-bold bg-yellow-500/20 px-2.5 py-0.5 rounded-full border border-yellow-500/30 animate-pulse">
                          <Lock className="w-3.5 h-3.5" /> กำลังตีโดย: {def.attacker}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                          พร้อมเข้าตี
                        </span>
                      )}
                    </div>

                    {/* Monsters in this Defense */}
                    <div className="flex items-center gap-3">
                      {def.monsters.map((mName, mIdx) => (
                        <div key={mIdx} className="flex flex-col items-center gap-1">
                          <div className="relative">
                            <MonsterAvatar name={mName} size={48} className="rounded-xl border border-white/10 shadow-md" />
                            {mIdx === 0 && (
                              <span className="absolute -top-1 -left-1 bg-amber-500 text-black text-[9px] font-black px-1 rounded-sm shadow">
                                L
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-300 font-medium truncate max-w-[65px] text-center">
                            {mName}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Action Bar: Reserve or Report Win/Loss */}
                    {!isDefeated && (
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap">
                        {/* Reservation button */}
                        <button
                          onClick={() => toggleReservation(def.id)}
                          disabled={isAttacking && !isMe}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            isMe
                              ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                              : isAttacking
                              ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                              : 'bg-indigo-600/80 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                          }`}
                        >
                          {isMe ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          <span>{isMe ? 'ยกเลิกการจอง' : isAttacking ? 'กำลังมีคนตี' : 'จองเป้าหมายนี้'}</span>
                        </button>

                        {/* Win / Loss Quick Result Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => reportBattleResult(def.id, true)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                            title="บันทึกผลว่าตีชนะ (-1 ดาบ)"
                          >
                            <Check className="w-3.5 h-3.5" /> ชนะ
                          </button>
                          <button
                            onClick={() => reportBattleResult(def.id, false)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-600/20 active:scale-95 transition-all"
                            title="บันทึกผลว่าตีแพ้ (-1 ดาบ)"
                          >
                            <XCircle className="w-3.5 h-3.5" /> แพ้
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Instant 3MDC Counter Recommendation */}
                    {suggestedCounters.length > 0 && !isDefeated && (
                      <div className="mt-3 p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                        <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                          <Zap className="w-3 h-3 text-yellow-400" />
                          สูตรแก้ทางยอดนิยม (3MDC):
                        </div>
                        {suggestedCounters.map((ctr, cIdx) => (
                          <div key={cIdx} className="flex items-center justify-between text-xs text-slate-300">
                            <div className="flex items-center gap-1.5 font-medium">
                              <span>{ctr.team.join(' + ')}</span>
                              <span className="text-[10px] text-slate-500">({ctr.note})</span>
                            </div>
                            <span className="text-emerald-400 font-bold text-[11px]">{ctr.winRate}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Member Sword Tracker (Left) + Live Combat Feed (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Member Sword Tracker (7 Cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-[#070b14]/90 backdrop-blur-xl p-6 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-lg font-bold text-white">ตารางติดตามดาบสมาชิก ({war.members.length} คน)</h3>
                <p className="text-xs text-slate-400">อัปเดตแบบเรียลไทม์เมื่อสมาชิกบันทึกผลการตี</p>
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="ค้นหาชื่อสมาชิก..."
                value={filterMember}
                onChange={(e) => setFilterMember(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Member Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3 pl-2">สมาชิก</th>
                  <th className="pb-3 text-center">ดาบที่เหลือ</th>
                  <th className="pb-3 text-center">ผลงาน (W/L)</th>
                  <th className="pb-3 text-right pr-2">การจัดการดาบ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {war.members
                  .filter((m) => !filterMember || m.name.toLowerCase().includes(filterMember.toLowerCase()))
                  .map((mem) => {
                    const isMe = mem.name === war.myPlayerName;
                    const totalMatches = mem.win + mem.loss;
                    const winRate = totalMatches > 0 ? Math.round((mem.win / totalMatches) * 100) : 0;

                    return (
                      <tr key={mem.id} className={`hover:bg-white/[0.02] transition-colors ${isMe ? 'bg-blue-500/10' : ''}`}>
                        <td className="py-3 pl-2 font-medium text-white flex items-center gap-2">
                          <span>{mem.name}</span>
                          {isMe && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold">ฉัน</span>}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`font-bold px-2 py-1 rounded-lg ${
                            mem.swordsLeft === 0
                              ? 'bg-slate-800 text-slate-400'
                              : mem.swordsLeft <= 9
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {mem.swordsLeft} / 30 ดาบ
                          </span>
                        </td>
                        <td className="py-3 text-center font-bold">
                          <span className="text-emerald-400">{mem.win}W</span>
                          <span className="text-slate-500 mx-1">/</span>
                          <span className="text-rose-400">{mem.loss}L</span>
                          {totalMatches > 0 && (
                            <span className="text-[10px] text-slate-400 ml-1.5 font-normal">({winRate}%)</span>
                          )}
                        </td>
                        <td className="py-3 text-right pr-2">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                updateWar((prev) => ({
                                  ...prev,
                                  members: prev.members.map((m) =>
                                    m.id === mem.id ? { ...m, swordsLeft: Math.max(0, m.swordsLeft - 3) } : m
                                  ),
                                }));
                              }}
                              className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 font-bold hover:text-white"
                              title="หักดาบ -1 ดาบ (3 ตัว)"
                            >
                              -3 ดาบ
                            </button>
                            <button
                              onClick={() => {
                                updateWar((prev) => ({
                                  ...prev,
                                  members: prev.members.map((m) =>
                                    m.id === mem.id ? { ...m, swordsLeft: Math.min(30, m.swordsLeft + 3) } : m
                                  ),
                                }));
                              }}
                              className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 font-bold hover:text-white"
                              title="คืนดาบ +1 ดาบ"
                            >
                              +3
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Combat Feed & Strategy Chat (5 Cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-white/10 bg-[#070b14]/90 backdrop-blur-xl p-6 space-y-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-400" />
                <h3 className="text-lg font-bold text-white">บันทึกผลการรบ & ข้อความกิลด์</h3>
              </div>
              <span className="text-xs text-slate-400">สดนาทีต่อนาที</span>
            </div>

            {/* Logs List */}
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {war.logs.map((log) => {
                const isWin = log.type === 'win';
                const isLoss = log.type === 'loss';
                const isCallout = log.type === 'callout';
                const isChat = log.type === 'chat';

                const borderCol = isWin
                  ? 'border-emerald-500/20 bg-emerald-950/10'
                  : isLoss
                  ? 'border-rose-500/20 bg-rose-950/10'
                  : isCallout
                  ? 'border-yellow-500/20 bg-yellow-950/10'
                  : 'border-white/5 bg-white/[0.02]';

                return (
                  <div key={log.id} className={`p-3 rounded-xl border text-xs leading-relaxed ${borderCol}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-slate-500 font-mono">{log.time}</span>
                      <span className={`text-[10px] font-bold uppercase ${
                        isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : isCallout ? 'text-yellow-400' : 'text-blue-400'
                      }`}>
                        {log.type}
                      </span>
                    </div>
                    <div className="text-slate-200 font-medium">{log.text}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat / Note Input */}
          <form onSubmit={handlePostNote} className="mt-4 pt-3 border-t border-white/5 flex gap-2">
            <input
              type="text"
              placeholder="พิมพ์คำสั่งหรือข้อความกลยุทธ์..."
              value={logText}
              onChange={(e) => setLogText(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
            >
              ส่ง
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
