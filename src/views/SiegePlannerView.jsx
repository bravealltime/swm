import React, { useState, useEffect, useMemo } from 'react';
import { 
  Swords, 
  Shield, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  ArrowRight, 
  Share2, 
  RefreshCw, 
  Search, 
  X,
  Crown,
  Info
} from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import { MONSTERS } from '../data/monsters';
import { loadBox, baseAwakenedId } from '../utils/swexImport';
import { loadUserBoxFromDB } from '../services/storageService';

const STORAGE_KEY = 'swm_siege_10_decks_v1';

// Meta offensive archetype presets
const PRESET_DECKS = [
  { name: '1. Fast Cleave', slots: ['Galleon', 'Clara', 'Leah'], notes: 'สปีดนำ ล้างเกราะ แล้ว Leah กวาด' },
  { name: '2. Bruiser Bolverk', slots: ['Bolverk', 'Mo Long', 'Amelia'], notes: 'บัฟฟ์เกราะ ยิงเลือด Mo Long + Bolverk ดูดเลือด' },
  { name: '3. Wind Bruiser', slots: ['Feng Yan', 'Aavel', 'Leo'], notes: 'Leo ล็อคสปีด ให้หมีแพนด้าลมเก็บตัวทีละตัว' },
  { name: '4. Copper Sniper', slots: ['Copper', 'Bulldozer', 'Imesety'], notes: 'Imesety เร่งเกจ+บัฟฟ์เกราะ ให้ Copper สอย 60k+' },
  { name: '5. Fast Bomb / CC', slots: ['Seara', 'Liebli', 'Bastet'], notes: 'Bastet บูสต์เกจ วางระเบิดจุดระเบิดทันที' },
  { name: '6. Sustain Bruiser', slots: ['Khmun', 'Vigor', 'Savannah'], notes: 'ทีมหมากัด เจาะเกราะ เร่งสปีด ยิงทะลุ' },
  { name: '7. Carcano Counter', slots: ['Carcano', 'Eshir', 'Triana'], notes: 'Eshir เร่งเกจ Carcano ล็อกเป้า Triana คุมชีวิต' },
  { name: '8. Tank & Heal Block', slots: ['Tesa', 'Theomars', 'Chasun'], notes: 'Tesa ปิดพาสซีฟ Theo ยิงแรง ไม่ตาย 1 เทิร์น' },
  { name: '9. Fire Snipe', slots: ['Kahli', 'Chloe', 'Covenant'], notes: 'Chloe กางอมตะ Kahli ยิงทะลุเกราะ Covenant สอยตัวอันตราย' },
  { name: '10. Water Safety', slots: ['Chow', 'Ariel', 'Rina'], notes: 'ทีมถึกน้ำล้วน รับตีนธาตุไฟ ยืนทนจนชนะ' }
];

export default function SiegePlannerView() {
  const [userBox, setUserBox] = useState(() => loadBox());
  const [copied, setCopied] = useState(false);
  
  // 10 Teams state: array of 10 objects { id, name, slots: [mon1, mon2, mon3], leaderIdx: 0, notes: '' }
  const [decks, setDecks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `ทีมบุกที่ ${i + 1}`,
      slots: [null, null, null],
      leaderIdx: 0,
      notes: ''
    }));
  });

  // Picker modal state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeTeamIdx, setActiveTeamIdx] = useState(null);
  const [activeSlotIdx, setActiveSlotIdx] = useState(null);
  const [pickerTab, setPickerTab] = useState('box'); // 'box' or 'catalog'
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerElement, setPickerElement] = useState('all');

  // Load from DB if local is empty
  useEffect(() => {
    if (!userBox) {
      loadUserBoxFromDB().then(dbBox => {
        if (dbBox) setUserBox(dbBox);
      });
    }
  }, [userBox]);

  // Persist decks
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
    } catch (e) {
      console.error(e);
    }
  }, [decks]);

  // Build lookup of owned monsters
  const ownedUnits = useMemo(() => {
    if (!userBox?.unit_list) return [];
    return userBox.unit_list.map(u => {
      const bId = baseAwakenedId(u.unit_master_id);
      const catalogMon = MONSTERS.find(m => m.id === bId || m.id === u.unit_master_id) || {};
      const spdBonus = u.runes?.reduce((acc, r) => {
        let s = 0;
        if (r.pri_eff && r.pri_eff[0] === 8) s += r.pri_eff[1];
        if (r.prefix_eff && r.prefix_eff[0] === 8) s += r.prefix_eff[1];
        r.sec_eff?.forEach(sec => { if (sec[0] === 8) s += (sec[1] + (sec[3] || 0)); });
        return acc + s;
      }, 0) || 0;

      return {
        unitId: u.unit_id,
        masterId: u.unit_master_id,
        baseId: bId,
        name: catalogMon.name || u.unit_id,
        element: catalogMon.element || 'neutral',
        stars: catalogMon.stars || 5,
        speedBonus: spdBonus,
        baseSpeed: catalogMon.base_speed || 100,
        totalSpeed: (catalogMon.base_speed || 100) + spdBonus,
        image: catalogMon.image || `https://swarfarm.com/static/herders/images/monsters/${bId}.png`
      };
    });
  }, [userBox]);

  // Count usage of each monster name across all 10 decks
  const monsterUsageCounts = useMemo(() => {
    const counts = {};
    decks.forEach(team => {
      team.slots.forEach(slot => {
        if (slot?.name) {
          counts[slot.name] = (counts[slot.name] || 0) + 1;
        }
      });
    });
    return counts;
  }, [decks]);

  // Check how many copies the player owns of each monster name
  const ownedCopiesCount = useMemo(() => {
    const counts = {};
    ownedUnits.forEach(u => {
      counts[u.name] = (counts[u.name] || 0) + 1;
    });
    return counts;
  }, [ownedUnits]);

  // Total slots filled
  const filledCount = useMemo(() => {
    return decks.reduce((acc, t) => acc + t.slots.filter(Boolean).length, 0);
  }, [decks]);

  // Total duplicates warning
  const duplicateAlerts = useMemo(() => {
    const alerts = [];
    Object.entries(monsterUsageCounts).forEach(([name, usedCount]) => {
      const owned = ownedCopiesCount[name] || 0;
      if (usedCount > 1 && usedCount > owned) {
        alerts.push({ name, usedCount, owned });
      }
    });
    return alerts;
  }, [monsterUsageCounts, ownedCopiesCount]);

  // Open picker
  const handleOpenPicker = (teamIdx, slotIdx) => {
    setActiveTeamIdx(teamIdx);
    setActiveSlotIdx(slotIdx);
    setPickerSearch('');
    setPickerTab(ownedUnits.length > 0 ? 'box' : 'catalog');
    setPickerOpen(true);
  };

  // Select monster
  const handleSelectMonster = (mon) => {
    if (activeTeamIdx === null || activeSlotIdx === null) return;
    
    // Check if monster has box data
    const matchedOwned = ownedUnits.find(u => u.name?.toLowerCase() === mon.name?.toLowerCase());

    const updated = [...decks];
    updated[activeTeamIdx].slots[activeSlotIdx] = {
      name: mon.name,
      element: mon.element || 'fire',
      stars: mon.stars || 5,
      image: mon.image,
      speedBonus: matchedOwned?.speedBonus || 0,
      baseSpeed: mon.base_speed || mon.baseSpeed || 100,
      totalSpeed: matchedOwned ? matchedOwned.totalSpeed : (mon.base_speed || 100),
      isOwned: !!matchedOwned
    };

    setDecks(updated);
    setPickerOpen(false);
  };

  // Remove monster from slot
  const handleRemoveSlot = (teamIdx, slotIdx) => {
    const updated = [...decks];
    updated[teamIdx].slots[slotIdx] = null;
    setDecks(updated);
  };

  // Clear all decks
  const handleClearAll = () => {
    if (window.confirm('คุณต้องการล้างทีมบุกทั้ง 10 ทีมใช่หรือไม่?')) {
      const cleared = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `ทีมบุกที่ ${i + 1}`,
        slots: [null, null, null],
        leaderIdx: 0,
        notes: ''
      }));
      setDecks(cleared);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Load Meta Presets
  const handleLoadPresets = () => {
    if (window.confirm('ต้องการนำเข้าพรีเซ็ต 10 ทีมเมต้ายอดนิยมใช่หรือไม่? (จะเขียนทับทีมเดิม)')) {
      const newDecks = PRESET_DECKS.map((preset, i) => {
        const slots = preset.slots.map(monName => {
          const cat = MONSTERS.find(m => m.name?.toLowerCase() === monName.toLowerCase());
          const owned = ownedUnits.find(u => u.name?.toLowerCase() === monName.toLowerCase());
          return {
            name: monName,
            element: cat?.element || 'fire',
            stars: cat?.stars || 5,
            image: cat?.image || `https://swarfarm.com/static/herders/images/monsters/${cat?.id || 100}.png`,
            speedBonus: owned?.speedBonus || 0,
            baseSpeed: cat?.base_speed || 100,
            totalSpeed: owned ? owned.totalSpeed : (cat?.base_speed || 100),
            isOwned: !!owned
          };
        });

        return {
          id: i + 1,
          name: preset.name,
          slots,
          leaderIdx: 0,
          notes: preset.notes
        };
      });

      setDecks(newDecks);
    }
  };

  // Copy lineup to clipboard
  const handleCopyLineup = () => {
    const lines = ['⚔️ [SWM] ตาราง 10 ทีมบุก Siege Battle:'];
    decks.forEach((t, i) => {
      const names = t.slots.map(s => s ? s.name : '(ว่าง)').join(' + ');
      lines.push(`ทีม ${i + 1} [${names}]${t.notes ? ' - ' + t.notes : ''}`);
    });
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Filtered monsters for picker
  const filteredPickerList = useMemo(() => {
    const list = pickerTab === 'box' ? ownedUnits : MONSTERS;
    return list.filter(m => {
      if (pickerElement !== 'all' && m.element !== pickerElement) return false;
      if (pickerSearch) {
        const q = pickerSearch.toLowerCase();
        return m.name?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [pickerTab, ownedUnits, pickerElement, pickerSearch]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-900/30 via-slate-900/60 to-slate-950 p-6 rounded-2xl border border-amber-500/20 backdrop-blur-md shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 text-amber-400">
              <Swords className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                จัด 10 ทีมบุก Siege
                <span className="px-2 py-0.5 text-xs font-bold uppercase rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  10-Offense Deck Builder
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                วางแผน 10 ทีมบุก (30 ตัวละคร) ตรวจสอบตัวซ้ำ คำนวณสปีดเทิร์น และซิงค์กับไอดีของฉัน
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyLineup}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shadow-sm cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-blue-400" />}
            {copied ? 'คัดลอกแล้ว!' : 'คัดลอกรายชื่อ 10 ทีม'}
          </button>

          <button
            onClick={handleLoadPresets}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-lg shadow-amber-500/10 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            โหลด 10 ทีมเมต้า
          </button>

          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-800 transition cursor-pointer"
            title="ล้างทีมทั้งหมด"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Bar: Filled Count & Duplicate Alert */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">จำนวนมอนสเตอร์ที่จัดแล้ว</span>
            <div className="text-xl font-bold text-white mt-0.5">
              {filledCount} <span className="text-xs font-normal text-slate-500">/ 30 ตัว</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold font-mono">
            {Math.round((filledCount / 30) * 100)}%
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">มอนสเตอร์ที่มีในไอดี (SWEX)</span>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">
              {decks.reduce((acc, t) => acc + t.slots.filter(s => s?.isOwned).length, 0)} <span className="text-xs font-normal text-slate-500">ตัว</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className={`rounded-xl p-4 flex items-center justify-between border ${
          duplicateAlerts.length > 0 
            ? 'bg-red-950/30 border-red-500/30 text-red-300' 
            : 'bg-slate-900/60 border-slate-800 text-slate-300'
        }`}>
          <div>
            <span className="text-xs text-slate-400">การหยิบมอนสเตอร์ซ้ำ</span>
            <div className="text-sm font-bold mt-0.5">
              {duplicateAlerts.length > 0 ? (
                <span className="text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  ซ้ำเกินจำนวนที่มี {duplicateAlerts.length} ตัว!
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> ไม่มีการใช้ตัวซ้ำ
                </span>
              )}
            </div>
          </div>
          {duplicateAlerts.length > 0 && (
            <div className="text-xs font-bold px-2 py-1 bg-red-500/20 rounded-md text-red-300 border border-red-500/30">
              {duplicateAlerts.map(a => a.name).join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* 10 Deck Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {decks.map((team, teamIdx) => {
          // Sort slots by speed to determine turn order
          const sortedSpeedOrder = team.slots
            .map((slot, idx) => ({ slot, idx, spd: slot ? (slot.totalSpeed || 100) : 0 }))
            .filter(item => item.slot !== null)
            .sort((a, b) => b.spd - a.spd);

          const getTurnBadge = (slotIdx) => {
            const orderIdx = sortedSpeedOrder.findIndex(item => item.idx === slotIdx);
            if (orderIdx === -1) return null;
            const colors = ['bg-amber-500 text-slate-950', 'bg-blue-500 text-white', 'bg-purple-500 text-white'];
            return (
              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${colors[orderIdx] || 'bg-slate-600'}`}>
                เทิร์น {orderIdx + 1}
              </span>
            );
          };

          return (
            <div 
              key={team.id}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition shadow-lg flex flex-col justify-between"
            >
              <div>
                {/* Team Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/20">
                      #{team.id}
                    </div>
                    <input 
                      type="text"
                      value={team.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDecks(prev => {
                          const cp = [...prev];
                          cp[teamIdx].name = val;
                          return cp;
                        });
                      }}
                      className="bg-transparent text-sm font-bold text-white border-none focus:outline-none hover:bg-slate-800/40 rounded px-1.5 py-0.5"
                    />
                  </div>

                  {/* Turn Order Flow Bar */}
                  {sortedSpeedOrder.length >= 2 && (
                    <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>ลำดับ:</span>
                      {sortedSpeedOrder.map((item, idx) => (
                        <React.Fragment key={item.idx}>
                          <span className="font-bold text-white">{item.slot.name}</span>
                          {idx < sortedSpeedOrder.length - 1 && <ArrowRight className="w-2.5 h-2.5 text-slate-600" />}
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3 Monster Slots */}
                <div className="grid grid-cols-3 gap-3">
                  {team.slots.map((slot, slotIdx) => {
                    const isDup = slot?.name && (monsterUsageCounts[slot.name] > (ownedCopiesCount[slot.name] || 0));
                    const isLeader = team.leaderIdx === slotIdx;

                    if (!slot) {
                      return (
                        <button
                          key={slotIdx}
                          onClick={() => handleOpenPicker(teamIdx, slotIdx)}
                          className="h-32 border-2 border-dashed border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/5 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-amber-400 transition cursor-pointer"
                        >
                          <Plus className="w-6 h-6" />
                          <span className="text-xs font-semibold">เพิ่มช่อง #{slotIdx + 1}</span>
                        </button>
                      );
                    }

                    return (
                      <div 
                        key={slotIdx}
                        className={`relative group p-2.5 rounded-xl border flex flex-col items-center text-center transition ${
                          isDup 
                            ? 'bg-red-950/20 border-red-500/40' 
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Remove Slot Button */}
                        <button
                          onClick={() => handleRemoveSlot(teamIdx, slotIdx)}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 rounded-md bg-red-500/20 text-red-300 hover:bg-red-500/40 transition"
                          title="นำออก"
                        >
                          <X className="w-3 h-3" />
                        </button>

                        {/* Leader Button */}
                        <button
                          onClick={() => {
                            setDecks(prev => {
                              const cp = [...prev];
                              cp[teamIdx].leaderIdx = slotIdx;
                              return cp;
                            });
                          }}
                          className={`absolute top-1 left-1 p-1 rounded-md transition ${
                            isLeader 
                              ? 'bg-amber-500 text-slate-950 font-black' 
                              : 'text-slate-600 hover:text-amber-400'
                          }`}
                          title={isLeader ? 'ลีดเดอร์' : 'ตั้งเป็นลีดเดอร์'}
                        >
                          <Crown className="w-3 h-3" />
                        </button>

                        {/* Monster Image */}
                        <div 
                          onClick={() => handleOpenPicker(teamIdx, slotIdx)}
                          className="cursor-pointer my-1"
                        >
                          <MonsterAvatar 
                            monster={{ name: slot.name, element: slot.element, stars: slot.stars, image: slot.image }} 
                            size="md" 
                          />
                        </div>

                        {/* Name */}
                        <span className="text-xs font-bold text-white truncate max-w-full mt-1">
                          {slot.name}
                        </span>

                        {/* Turn Badge */}
                        <div className="mt-1.5 flex items-center gap-1">
                          {getTurnBadge(slotIdx)}
                          <span className="text-[11px] font-mono text-amber-400/90 font-semibold">
                            ⚡{slot.totalSpeed}
                          </span>
                        </div>

                        {/* Owned Status */}
                        <div className="mt-1.5">
                          {slot.isOwned ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                              <CheckCircle2 className="w-2.5 h-2.5" /> ในไอดี (+{slot.speedBonus})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                              ยังไม่มีในกล่อง
                            </span>
                          )}
                        </div>

                        {/* Duplicate warning */}
                        {isDup && (
                          <span className="text-[9px] font-bold text-red-400 mt-1 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                            หยิบซ้ำ!
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes Input */}
              <div className="mt-3 pt-3 border-t border-slate-800/60">
                <input 
                  type="text"
                  placeholder="บันทึกกลยุทธ์ (เช่น ล้างเกราะก่อน, สปีดแซง 310+)..."
                  value={team.notes || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDecks(prev => {
                      const cp = [...prev];
                      cp[teamIdx].notes = val;
                      return cp;
                    });
                  }}
                  className="w-full bg-slate-950/60 text-xs text-slate-300 placeholder-slate-600 rounded-lg px-3 py-1.5 border border-slate-800 focus:outline-none focus:border-slate-600"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Monster Picker Modal */}
      {pickerOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  เลือกมอนสเตอร์ (ทีม #{decks[activeTeamIdx]?.id} - ช่อง #{activeSlotIdx + 1})
                </h3>
              </div>
              <button 
                onClick={() => setPickerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs & Search */}
            <div className="p-4 border-b border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between gap-2">
                {/* Tab Switcher */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setPickerTab('box')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      pickerTab === 'box' 
                        ? 'bg-amber-500 text-slate-950 shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    กล่องของฉัน ({ownedUnits.length})
                  </button>
                  <button
                    onClick={() => setPickerTab('catalog')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      pickerTab === 'catalog' 
                        ? 'bg-amber-500 text-slate-950 shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    มอนสเตอร์ทั้งหมด ({MONSTERS.length})
                  </button>
                </div>

                {/* Element Filter */}
                <div className="flex items-center gap-1">
                  {['all', 'fire', 'water', 'wind', 'light', 'dark'].map(elem => (
                    <button
                      key={elem}
                      onClick={() => setPickerElement(elem)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold capitalize transition ${
                        pickerElement === elem 
                          ? 'bg-slate-700 text-white border border-slate-600' 
                          : 'text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {elem}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="ค้นหาชื่อมอนสเตอร์ (เช่น Galleon, Leah, Bolverk)..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Monster List Grid */}
            <div className="p-4 overflow-y-auto max-h-[50vh] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {filteredPickerList.map((m, idx) => {
                const used = monsterUsageCounts[m.name] || 0;
                const owned = ownedCopiesCount[m.name] || 0;
                const isOverused = used > 0 && used >= (owned || 1);

                return (
                  <button
                    key={m.unitId || m.id || idx}
                    onClick={() => handleSelectMonster(m)}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                      isOverused 
                        ? 'bg-slate-950/40 border-slate-800/60 opacity-50 hover:opacity-100 hover:border-amber-500/50' 
                        : 'bg-slate-950 border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/5'
                    }`}
                  >
                    <MonsterAvatar 
                      monster={{ name: m.name, element: m.element, stars: m.stars, image: m.image }} 
                      size="sm" 
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">{m.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {m.totalSpeed ? `⚡${m.totalSpeed}` : `Base ${m.base_speed || 100}`}
                      </div>
                      {used > 0 && (
                        <div className="text-[9px] text-amber-400 font-medium">
                          ใช้ไป {used} ทีม
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
