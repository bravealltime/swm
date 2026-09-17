import React, { useState, useEffect } from 'react';
import { Search, X, Gift, Shield, Gauge, BookOpen, ArrowRight, Trophy } from 'lucide-react';
import { MONSTERS } from '../data/monsters';
import { PROMO_CODES } from '../data/promoCodes';

export default function CommandPalette({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredMonsters = MONSTERS.filter(m => {
    const q = query.toLowerCase();
    const nTh = (m.thaiName || m.nameTh || '').toLowerCase();
    const nEn = (m.name || m.nameEn || '').toLowerCase();
    const fam = (m.family || '').toLowerCase();
    return nTh.includes(q) || nEn.includes(q) || fam.includes(q);
  }).slice(0, 4);

  const filteredCodes = PROMO_CODES.filter(c => 
    c.code.toLowerCase().includes(query.toLowerCase()) ||
    c.rewards.some(r => r.name.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 3);

  const quickTools = [
    { id: 'where2use', name: 'ใช้มอนสเตอร์ตัวนี้ที่ไหนดี? (Where to Use)', desc: 'ตรวจสอบการใช้งานในทีมรับ, ทีมบุก, ดันเจี้ยน และ RTA', icon: Shield, view: 'where2use' },
    { id: '3mdc-stats', name: 'ศูนย์สถิติและรายงาน 3MDC (Statistics Hub)', desc: 'รวมรายงานเมต้า, สถิติวินเรท, และ Battle Log Performance', icon: Trophy, view: '3mdc-stats' },
    { id: 'game-guides', name: 'สารบัญคู่มือกลยุทธ์เกม (Game Guides)', desc: 'คู่มือ 10 ดันเจี้ยน Abyss Hard และแผน Siege', icon: BookOpen, view: 'game-guides' },
    { id: 'siege-calc', name: 'เครื่องคำนวณคะแนน Siege (Siege Calculator)', desc: 'คำนวณแต้มต่อนาทีและเวลาชนะ 20,000 แต้ม', icon: Gauge, view: 'siege-calculator' },
    { id: 'rta', name: 'วิเคราะห์ RTA & สถิติ SWRT S38', desc: 'Tier List เมต้า, Pick/Win/Ban 300 ตัว, รีเพลย์แข่งสด', icon: Trophy, view: 'rta' },
    { id: '3mdc', name: 'ค้นหาตัวแก้ทาง 3MDC', desc: 'ค้นหาทีมเจาะหอ 4★ / 5★ พร้อม % วินเรท', icon: Shield, view: '3mdc' },
    { id: 'codes', name: 'โค้ดแจกไอเทมล่าสุด', desc: 'คัดลอกโค้ดและกดรับของผ่าน Hive ID', icon: Gift, view: 'codes' },
    { id: 'speed', name: 'เครื่องคำนวณ Speed Tick & จูนสปีด', desc: 'คำนวณช่วงความเร็วและป้องกันโดนแทรกเทิร์น', icon: Gauge, view: 'speed' },
    { id: 'catalog', name: 'สารานุกรมมอนสเตอร์', desc: 'ดูข้อมูลสกิล ธาตุ รูนแนะนำของทุกตัว', icon: BookOpen, view: 'catalog' },
  ].filter(t => t.name.includes(query) || t.desc.includes(query));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-[#101724] border border-[#1d2b3f] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#1d2b3f] gap-3 bg-[#0c121c]">
          <Search className="w-5 h-5 text-blue-400 shrink-0" />
          <input
            type="text"
            className="w-full bg-transparent border-none text-slate-100 placeholder-slate-500 focus:outline-none text-base"
            placeholder="ค้นหามอนสเตอร์, โค้ดเกม, เครื่องมือ, หรือทีมแก้ทาง..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs text-slate-400 bg-[#162130] border border-[#233145] rounded font-mono">
            ESC
          </kbd>
        </div>

        {/* Search Results */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {/* Quick Tools */}
          {quickTools.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
                เครื่องมือหลัก (Tools)
              </div>
              <div className="space-y-1">
                {quickTools.map(tool => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => {
                        onNavigate(tool.view);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#162130] transition-colors text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-200 group-hover:text-blue-400">
                            {tool.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {tool.desc}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Monster Results */}
          {filteredMonsters.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
                มอนสเตอร์ (Monsters)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredMonsters.map(monster => (
                  <div
                    key={monster.id}
                    onClick={() => {
                      onNavigate('catalog', { search: monster.nameEn });
                      onClose();
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0c121c] hover:bg-[#162130] border border-[#1f2c3f] cursor-pointer transition-colors"
                  >
                    <img 
                      src={monster.image} 
                      alt={monster.nameEn}
                      className="w-10 h-10 rounded-lg object-cover border border-[#233145]"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-200 truncate">
                        {monster.nameTh}
                      </div>
                      <div className="text-xs text-slate-400 capitalize">
                        {monster.element} • {monster.family}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Promo Codes */}
          {filteredCodes.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
                โค้ดแจกไอเทม (Codes)
              </div>
              <div className="space-y-1.5">
                {filteredCodes.map(code => (
                  <div
                    key={code.id}
                    onClick={() => {
                      onNavigate('codes');
                      onClose();
                    }}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#0c121c] hover:bg-[#162130] border border-[#1f2c3f] cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Gift className="w-4 h-4 text-emerald-400" />
                      <span className="font-mono text-sm font-bold text-emerald-400">
                        {code.code}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {code.rewards.map(r => r.name.split(' ')[0]).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#0a0e17] border-t border-[#1d2b3f] flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>ESC TO CLOSE</span>
          <span className="text-cyan-400 font-bold">SWM MASTER COMMAND</span>
        </div>
      </div>
    </div>
  );
}
