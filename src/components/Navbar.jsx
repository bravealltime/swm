import React from 'react';
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
  Compass
} from 'lucide-react';
import SwmLogo from './SwmLogo';

export default function Navbar({ 
  currentView, 
  onNavigate, 
  onOpenSearch, 
  mobileMenuOpen, 
  setMobileMenuOpen 
}) {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#080d16]/90 backdrop-blur-md border-b border-[#182335]">
      <div className="max-w-[1850px] mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-16 gap-3">
          
          {/* Left: Brand & Mobile Drawer Toggle */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white bg-[#0f1726] border border-[#1b2738] focus:outline-none cursor-pointer"
              aria-label="เปิดเมนูนำทาง"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-rose-400" /> : <Menu className="w-5 h-5" />}
            </button>

            <div 
              onClick={() => onNavigate('dashboard')} 
              className="cursor-pointer select-none flex items-center gap-2"
            >
              <SwmLogo size="sm" />
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                v3.0 Clean
              </span>
            </div>
          </div>

          {/* Center: Universal Command Search Input Trigger */}
          <div className="flex-1 max-w-xl mx-auto px-1 sm:px-4">
            <button
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#0e1624] border border-[#1d2b3f] hover:border-blue-500/60 text-slate-400 hover:text-slate-200 transition-all cursor-pointer shadow-inner group"
            >
              <div className="flex items-center gap-2.5 truncate">
                <Search className="w-4 h-4 text-blue-400 shrink-0 group-hover:text-blue-300" />
                <span className="text-xs sm:text-sm font-medium truncate">
                  ค้นหาทีมแก้ทาง 3MDC, มอนสเตอร์, ดันเจี้ยน, โค้ด...
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1 font-mono text-[10px] text-slate-400 bg-[#080d16] px-2 py-0.5 rounded border border-[#1b2636] shrink-0">
                <span>Ctrl</span>
                <span>K</span>
              </div>
            </button>
          </div>

          {/* Right: Quick Action Shortcuts */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick RTA S38 */}
            <button
              onClick={() => onNavigate('rta')}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'rta'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'bg-[#0f1726] border border-[#1b2738] text-slate-300 hover:text-white hover:bg-[#162132]'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>RTA S38</span>
            </button>

            {/* Quick 3MDC */}
            <button
              onClick={() => onNavigate('3mdc')}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === '3mdc'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-[#0f1726] border border-[#1b2738] text-slate-300 hover:text-white hover:bg-[#162132]'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>3MDC</span>
            </button>

            {/* Active Codes Pill */}
            <button
              onClick={() => onNavigate('codes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'codes'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              }`}
            >
              <Gift className="w-3.5 h-3.5 text-emerald-400" />
              <span>5 โค้ด</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
