import React, { useState, useRef, useEffect } from 'react';
import { 
  Shield, 
  Gift, 
  Trophy, 
  Search, 
  Menu, 
  X, 
  Sparkles,
  Zap,
  Flame,
  ChevronDown,
  Swords,
  BookOpen,
  History,
  TrendingUp,
  Cpu,
  BarChart3,
  Calculator,
  Gauge,
  UserPlus,
  HelpCircle,
  Award,
  Users,
  Crosshair,
  Home,
  Layers,
  Wrench
} from 'lucide-react';
import SwmLogo from './SwmLogo';

export default function Navbar({ 
  currentView, 
  onNavigate, 
  onOpenSearch, 
  mobileMenuOpen, 
  setMobileMenuOpen,
  viewParams = {}
}) {
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setToolsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'หน้าแรก', icon: Home },
    { id: '3mdc', label: '3MDC Siege', icon: Shield },
    { id: 'rta', label: 'RTA Analytics', icon: Trophy },
    { id: 'player-tracker', label: 'ค้นหาผู้เล่น', icon: Search, badge: 'Hot' },
    { id: 'draft-explorer', label: 'จำลองดราฟต์ 5v5', icon: Swords },
  ];

  const toolItems = [
    { id: 'artifact', label: 'ดาเมจเสริมอาร์ติแฟกต์', desc: 'True Damage Optimizer', icon: Sparkles },
    { id: 'speed', label: 'จูนสปีดเทิร์น (Speed Tuner)', desc: 'Tick & Speed Tuning', icon: Gauge },
    { id: 'tier-list-maker', label: 'สร้าง Tier List RTA/Siege', desc: 'Drag & Drop Builder', icon: Award },
    { id: 'dungeons', label: 'ทีมฟาร์มดันเจี้ยน Abyss', desc: 'Golem, Dragon, Necro Hard', icon: Cpu },
    { id: 'catalog', label: 'สารานุกรมมอนสเตอร์ 940+', desc: 'Skill Multipliers & Details', icon: BookOpen },
    { id: 'trending', label: 'สถิติเทรนด์ทั่วโลก', desc: 'Meta Trends & Defense Stats', icon: TrendingUp },
    { id: 'siege-calculator', label: 'คำนวณแต้มกิลด์วอร์ Siege', desc: 'Base Points & Score Calculator', icon: Calculator },
    { id: 'codes', label: 'โค้ดแจกไอเทมประจำเดือน', desc: 'Active Redeem Codes (5)', icon: Gift },
    { id: 'balance', label: 'สรุป Balance Patch ภาษาไทย', desc: 'Patch Notes Breakdown', icon: History },
    { id: 'recruit', label: 'กระดานกิลด์รับสมัคร', desc: 'Guild Recruitment Board', icon: UserPlus },
  ];

  const isToolActive = ['artifact', 'speed', 'tier-list-maker', 'dungeons', 'catalog', 'trending', 'siege-calculator', 'codes', 'balance', 'recruit', 'aegislink', 'faq', 'where2use', '3mdc-stats', 'rta-synergies', 'meta-dashboard', 'siege-tournament', 'leaderboards', 'rune'].includes(currentView);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080c14]/90 backdrop-blur-2xl border-b border-white/[0.08] shadow-2xl">
      <div className="max-w-[1780px] 2xl:max-w-[1880px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[68px] gap-3">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white bg-white/[0.04] border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="เมนูนำทาง"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button 
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            >
              <SwmLogo size="sm" />
              <div className="hidden sm:flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400 font-mono">
                  Tactical Esports Hub
                </span>
              </div>
            </button>
          </div>

          {/* Primary Nav Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id || 
                (item.id === 'rta' && ['rta', 'meta-dashboard', 'rta-synergies'].includes(currentView)) ||
                (item.id === '3mdc' && ['3mdc', 'where2use', '3mdc-stats'].includes(currentView));

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/20 text-white border border-blue-500/40 shadow-sm shadow-blue-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.05] border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 uppercase leading-none">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-6 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent"></span>
                  )}
                </button>
              );
            })}

            {/* Tools Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isToolActive || toolsDropdownOpen
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.05] border border-transparent'
                }`}
              >
                <Wrench className="w-4 h-4 text-slate-400" />
                <span>เครื่องมือทั้งหมด</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${toolsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Tools Dropdown Menu */}
              {toolsDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-[#0a0f19]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 grid gap-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    เครื่องมือยุทธวิธี & ฐานข้อมูล PVE/PVP
                  </div>
                  {toolItems.map((tool) => {
                    const ToolIcon = tool.icon;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => {
                          onNavigate(tool.id);
                          setToolsDropdownOpen(false);
                        }}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.06] text-left transition-colors cursor-pointer group"
                      >
                        <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-colors">
                          <ToolIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">
                            {tool.label}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {tool.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Promo Codes Direct Pill */}
            <button
              onClick={() => onNavigate('codes')}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all cursor-pointer hover:shadow-lg hover:shadow-emerald-500/10"
              title="ดูโค้ดไอเทมแจกฟรีล่าสุด"
            >
              <Gift className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
              <span>โค้ดแจกฟรี (5)</span>
            </button>

            {/* Live Season Tag */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span>S38 LIVE</span>
            </div>

            {/* Quick Search Spotlight Button */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2.5 px-3 sm:px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-medium transition-all shadow-inner cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline text-slate-400">ค้นหาด่วน...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#070b12] text-slate-400 border border-white/10 rounded">
                Ctrl K
              </kbd>
            </button>

            {/* Full Drawer Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              title="เปิดสารบัญระบบทั้งหมด"
            >
              <Menu className="w-4 h-4 text-slate-300" />
              <span className="hidden sm:inline text-xs">สารบัญ</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
}
