import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  Gift,
  Trophy,
  Search,
  Menu,
  Sparkles,
  ChevronDown,
  Swords,
  BookOpen,
  History,
  TrendingUp,
  Cpu,
  Calculator,
  Gauge,
  UserPlus,
  Award,
  Home,
  Wrench,
  Package,
  Cloud,
} from 'lucide-react';
import SwmLogo from './SwmLogo';
import { buildUrl } from '../router';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'หน้าแรก', icon: Home },
  { id: '3mdc', label: '3MDC Siege', icon: Shield, group: ['3mdc', 'where2use', '3mdc-stats'] },
  { id: 'rta', label: 'RTA Analytics', icon: Trophy, group: ['rta', 'meta-dashboard', 'rta-synergies', 'guardian'] },
  { id: 'player-tracker', label: 'ค้นหาผู้เล่น', icon: Search },
  { id: 'draft-explorer', label: 'จำลองดราฟต์ 5v5', icon: Swords },
];

const TOOL_ITEMS = [
  { id: 'guardian', label: 'อันดับ Guardian คนไทย & เมต้าจริง', desc: 'จากรีเพลย์ Guardian สาธารณะ SWRT', icon: Trophy },
  { id: 'my-box', label: 'กล่องมอนสเตอร์ของฉัน', desc: 'นำเข้า SWEX → ทีมที่สร้างได้', icon: Package },
  { id: 'artifact', label: 'ดาเมจเสริมอาร์ติแฟกต์', desc: 'True Damage Optimizer', icon: Sparkles },
  { id: 'speed', label: 'จูนสปีดเทิร์น (Speed Tuner)', desc: 'Tick & Speed Tuning', icon: Gauge },
  { id: 'tier-list-maker', label: 'สร้าง Tier List RTA/Siege', desc: 'Drag & Drop Builder', icon: Award },
  { id: 'dungeons', label: 'ทีมฟาร์มดันเจี้ยน Abyss', desc: 'Golem, Dragon, Necro Hard', icon: Cpu },
  { id: 'catalog', label: 'สารานุกรมมอนสเตอร์', desc: 'Skill Multipliers & Details', icon: BookOpen },
  { id: 'trending', label: 'สถิติเทรนด์ทั่วโลก', desc: 'Meta Trends & Defense Stats', icon: TrendingUp },
  { id: 'siege-calculator', label: 'คำนวณแต้มกิลด์วอร์ Siege', desc: 'Base Points & Score Calculator', icon: Calculator },
  { id: 'codes', label: 'โค้ดแจกไอเทมประจำเดือน', desc: 'Active Redeem Codes', icon: Gift },
  { id: 'balance', label: 'สรุป Balance Patch ภาษาไทย', desc: 'Patch Notes Breakdown', icon: History },
  { id: 'recruit', label: 'กระดานกิลด์รับสมัคร', desc: 'Guild Recruitment Board', icon: UserPlus },
];

const PRIMARY_IDS = new Set(NAV_ITEMS.flatMap((i) => i.group || [i.id]));

export default function Navbar({ currentView, onNavigate, onOpenSearch, onOpenMenu, onOpenSync }) {
  const [toolsOpen, setToolsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close the tools dropdown on outside click or Escape
  useEffect(() => {
    if (!toolsOpen) return;
    const onPointerDown = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setToolsOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setToolsOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [toolsOpen]);

  const go = (e, view) => {
    e.preventDefault();
    onNavigate(view);
    setToolsOpen(false);
  };

  const isToolActive = !PRIMARY_IDS.has(currentView);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080c14]/90 backdrop-blur-2xl border-b border-white/[0.08] shadow-2xl">
      <div className="max-w-[1780px] 2xl:max-w-[1880px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">

          {/* Brand */}
          <a
            href="/"
            onClick={(e) => go(e, 'dashboard')}
            className="flex items-center shrink-0 rounded-lg"
            aria-label="SWM หน้าแรก"
          >
            <SwmLogo size="sm" />
          </a>

          {/* Primary navigation (desktop) */}
          <nav aria-label="เมนูหลัก" className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = (item.group || [item.id]).includes(currentView);
              return (
                <a
                  key={item.id}
                  href={buildUrl(item.id)}
                  onClick={(e) => go(e, item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-blue-600/20 text-white border border-blue-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.05] border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </a>
              );
            })}

            {/* Tools dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setToolsOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={toolsOpen}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  isToolActive || toolsOpen
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.05] border border-transparent'
                }`}
              >
                <Wrench className="w-4 h-4 text-slate-400" />
                <span>เครื่องมือ</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${toolsOpen ? 'rotate-180' : ''}`} />
              </button>

              {toolsOpen && (
                <div
                  role="menu"
                  className="absolute top-full left-0 mt-2 w-80 bg-[#0a0f19]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 grid gap-1"
                >
                  <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    เครื่องมือ & ฐานข้อมูล PVE/PVP
                  </div>
                  {TOOL_ITEMS.map((tool) => {
                    const ToolIcon = tool.icon;
                    const isActive = currentView === tool.id;
                    return (
                      <a
                        key={tool.id}
                        role="menuitem"
                        href={buildUrl(tool.id)}
                        onClick={(e) => go(e, tool.id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors group ${
                          isActive ? 'bg-blue-600/15' : 'hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-colors">
                          <ToolIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{tool.label}</div>
                          <div className="text-xs text-slate-400">{tool.desc}</div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSync}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:text-white text-xs font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-cyan-500/5 hover:scale-[1.02]"
              title="ซิงค์ข้อมูลไอดีข้ามอุปกรณ์ (มือถือ/แท็บเล็ต/PC)"
              aria-label="ซิงค์ข้อมูลไอดีข้ามอุปกรณ์"
            >
              <Cloud className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="hidden sm:inline">ซิงค์ข้ามเครื่อง</span>
            </button>

            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              aria-label="ค้นหาด่วน (Ctrl+K)"
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline text-slate-400">ค้นหาด่วน...</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-xs font-mono font-bold bg-[#070b12] text-slate-400 border border-white/10 rounded">
                Ctrl K
              </kbd>
            </button>

            <button
              onClick={onOpenMenu}
              aria-haspopup="dialog"
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              aria-label="เปิดสารบัญระบบทั้งหมด"
            >
              <Menu className="w-4 h-4" />
              <span className="hidden sm:inline">สารบัญ</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
