import React from 'react';
import { 
  Shield, 
  Gift, 
  Trophy, 
  Layers, 
  Gauge, 
  Search, 
  Menu, 
  X, 
  ExternalLink,
  Zap,
  Activity
} from 'lucide-react';
import SwmLogo from './SwmLogo';

export default function Navbar({ 
  currentView, 
  onNavigate, 
  onOpenSearch, 
  mobileMenuOpen, 
  setMobileMenuOpen 
}) {
  const navItems = [
    { id: 'dashboard', label: 'หน้าแรก', icon: Activity },
    { id: '3mdc', label: 'ทีมแก้ทาง 3MDC', icon: Shield, badge: 'แนะนำ' },
    { id: 'codes', label: 'โค้ดแจกไอเทม', icon: Gift, badge: '5 โค้ด' },
    { id: 'leaderboards', label: 'อันดับกิลด์ Siege', icon: Trophy },
    { id: 'catalog', label: 'สารานุกรมมอนสเตอร์', icon: Layers },
    { id: 'speed', label: 'คำนวณสปีดทิก', icon: Gauge },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080d16] border-b border-[#1b2636]">
      {/* Top Telemetry Strip */}
      <div className="hidden md:flex items-center justify-between px-4 sm:px-6 lg:px-8 py-1.5 bg-[#050910] border-b border-[#131b27] text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            SWM TACTICAL CORE ONLINE
          </span>
          <span className="text-slate-600">|</span>
          <span>SUMMONERS WAR MASTER v2.5</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">SERVER DATA: SYNCED</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-emerald-400 font-bold">🎁 โค้ดที่ใช้ได้วันนี้: 5 โค้ด</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">ระบบภาษาไทย 100%</span>
        </div>
      </div>

      {/* Main Command Bar */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#152030] focus:outline-none cursor-pointer"
              aria-label="เปิดเมนูนำทาง"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div 
              onClick={() => onNavigate('dashboard')} 
              className="cursor-pointer select-none"
            >
              <SwmLogo size="md" />
            </div>
          </div>

          {/* Central Segmented Command Tabs */}
          <nav className="hidden lg:flex items-center p-1 rounded-xl bg-[#0e1522] border border-[#1b2636] space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-[#162030]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-bold ${
                      isActive 
                        ? 'bg-blue-800 text-blue-100' 
                        : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action: Quick Search Bar */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111927] border border-[#1f2c3e] hover:border-blue-500 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs"
            >
              <Search className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">ค้นหา...</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] bg-[#090f19] text-slate-400 rounded border border-[#1f2c3e] font-mono">
                Ctrl K
              </kbd>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
