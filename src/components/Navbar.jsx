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
  User,
  Radio,
  Smartphone,
  Crown,
} from 'lucide-react';
import SwmLogo from './SwmLogo';
import { buildUrl } from '../router';
import { useAuth } from '../contexts/AuthContext';
import { isFreeView } from '../utils/memberPolicy';

// 4 Core primary tabs always visible directly in the top bar
const CORE_NAV_ITEMS = [
  { id: 'dashboard', label: 'หน้าแรก', icon: Home },
  { id: 'catalog', label: 'มอนสเตอร์', icon: BookOpen, badge: '940' },
  { id: 'my-box', label: 'กล่องไอดี', icon: Package },
  { id: 'codes', label: 'โค้ดแจก', icon: Gift, badge: 'ฟรี' },
];

// PVP & Guild Siege grouped dropdown
const PVP_NAV_ITEMS = [
  { id: '3mdc', label: '3MDC Siege (ทีมแก้ทาง)', desc: 'สูตรทีมแก้ทางยึดเกาะ 1,500+ สูตร', icon: Shield, free: true },
  { id: 'rta', label: 'RTA Analytics & สถิติสด', desc: 'Pick / Win / Ban ซีซั่น 38 ระดับโลก', icon: Trophy },
  { id: 'draft-explorer', label: 'จำลองดราฟต์ 5v5', desc: 'ฝึกซ้อม Pick & Counter Draft', icon: Swords },
  { id: 'player-tracker', label: 'ค้นหาสถิติผู้เล่น (Tracker)', desc: 'สถิติ RTA สด & มอนสเตอร์หลัก', icon: Search },
  { id: 'balance', label: 'Balance Patch ภาษาไทย', desc: 'สรุปปรับสมดุลมอนสเตอร์ล่าสุด', icon: History, free: true },
  { id: 'arena', label: 'ทีมบุก & ตั้งรับ Arena (AO/AD)', desc: 'สูตรบุกเร็ว 15 วิ & ถ่วงเวลา Rush Hour', icon: Swords },
  { id: 'guardian', label: 'อันดับ Guardian คนไทย & เมต้าจริง', desc: 'จากสถิติการแข่งขัน Guardian จริง', icon: Award },
];

// Tools grouped dropdown
const TOOL_NAV_ITEMS = [
  { id: 'speed', label: 'จูนสปีดเทิร์น (Speed Tuner)', desc: 'Tick & Speed Tuning ป้องกันแซง', icon: Gauge },
  { id: 'artifact', label: 'ดาเมจเสริมอาร์ติแฟกต์', desc: 'True Damage Optimizer', icon: Sparkles },
  { id: 'live-farm-monitor', label: '📡 จอตรวจจับการฟาร์มสด', desc: 'เช็คดรอปรูน Abyss สด พร้อม Keep/Sell', icon: Radio },
  { id: 'ai-account-audit', label: '🤖 AI วินิจฉัยสุขภาพไอดี', desc: 'ตรวจสปีด Swift/Violent & จัดเกรด', icon: Sparkles },
  { id: 'dungeons', label: 'ทีมฟาร์มดันเจี้ยน Abyss', desc: 'Golem, Dragon, Necro Hard', icon: Cpu },
  { id: 'tier-list-maker', label: 'สร้าง Tier List RTA/Siege', desc: 'Drag & Drop Builder', icon: Award },
  { id: 'quiz', label: 'ทายมอนจากสกิล (เกมรายวัน)', desc: 'มินิเกมทายมอนสเตอร์สะสมแต้ม', icon: Sparkles, free: true },
  { id: 'siege-calculator', label: 'คำนวณแต้มกิลด์วอร์ Siege', desc: 'Base Points & Score Calculator', icon: Calculator },
  { id: 'trending', label: 'สถิติเทรนด์ทั่วโลก', desc: 'Meta Trends & Defense Stats', icon: TrendingUp },
  { id: 'recruit', label: 'กระดานกิลด์รับสมัคร', desc: 'Guild Recruitment Board', icon: UserPlus },
];

const PVP_IDS = new Set(PVP_NAV_ITEMS.map((i) => i.id));
const TOOL_IDS = new Set(TOOL_NAV_ITEMS.map((i) => i.id));

export default function Navbar({ currentView, onNavigate, onOpenSearch, onOpenMenu, onOpenSync, onOpenAuth }) {
  const { user, isAdmin, isMember, openPaywall, adminMode, setAdminMode } = useAuth();
  const [activeDropdown, setActiveDropdown] = useState(null); // 'pvp' | 'tools' | null
  const navRef = useRef(null);

  const visibleCoreItems = CORE_NAV_ITEMS.filter((i) => isMember || isFreeView(i.id));
  const visiblePvpItems = PVP_NAV_ITEMS.filter((i) => isMember || isFreeView(i.id));
  const visibleToolItems = TOOL_NAV_ITEMS.filter((i) => isMember || isFreeView(i.id));

  const isPvpActive = PVP_IDS.has(currentView) || ['rta-synergies', 'meta-dashboard', 'rta-replays', 'where2use', '3mdc-stats', 'siege-battles'].includes(currentView);
  const isToolActive = TOOL_IDS.has(currentView);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    if (!activeDropdown) return;
    const onPointerDown = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setActiveDropdown(null);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setActiveDropdown(null);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [activeDropdown]);

  const go = (e, view) => {
    e.preventDefault();
    onNavigate(view);
    setActiveDropdown(null);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080c14]/92 backdrop-blur-2xl border-b border-white/[0.08] shadow-2xl">
      <div className="max-w-[1780px] 2xl:max-w-[1880px] mx-auto px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">

          {/* Left: Brand */}
          <a
            href="/"
            onClick={(e) => go(e, 'dashboard')}
            className="flex items-center shrink-0 rounded-lg hover:opacity-90 transition-opacity"
            aria-label="SWM หน้าแรก"
          >
            <SwmLogo size="sm" />
          </a>

          {/* Center: Clean Pro Navigation (4 Core Hubs + 2 Smart Dropdowns) */}
          <nav aria-label="เมนูหลัก" ref={navRef} className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            {/* 4 Core Tabs */}
            {visibleCoreItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <a
                  key={item.id}
                  href={buildUrl(item.id)}
                  onClick={(e) => go(e, item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  title={item.label}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-blue-600/20 text-white border border-blue-500/40 shadow-sm shadow-blue-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}
                </a>
              );
            })}

            {/* PVP & Guild Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'pvp' ? null : 'pvp')}
                aria-haspopup="menu"
                aria-expanded={activeDropdown === 'pvp'}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  isPvpActive || activeDropdown === 'pvp'
                    ? 'bg-blue-600/20 text-white border border-blue-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent'
                }`}
              >
                <Swords className={`w-4 h-4 shrink-0 ${isPvpActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>กิลด์ & RTA</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${activeDropdown === 'pvp' ? 'rotate-180' : ''}`} />
              </button>

              {activeDropdown === 'pvp' && (
                <div
                  role="menu"
                  className="absolute top-full left-0 mt-2 w-72 bg-[#090e18]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 grid gap-1"
                >
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    ศึกยึดเกาะ & เวิลด์อารีน่า
                  </div>
                  {visiblePvpItems.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <a
                        key={item.id}
                        role="menuitem"
                        href={buildUrl(item.id)}
                        onClick={(e) => go(e, item.id)}
                        className={`flex items-start gap-2.5 px-3 py-2 rounded-xl text-left transition-colors group ${
                          isActive ? 'bg-blue-600/20 border border-blue-500/30' : 'hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-colors shrink-0 mt-0.5">
                          <ItemIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                            {item.label}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {item.desc}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tools Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'tools' ? null : 'tools')}
                aria-haspopup="menu"
                aria-expanded={activeDropdown === 'tools'}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  isToolActive || activeDropdown === 'tools'
                    ? 'bg-blue-600/20 text-white border border-blue-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent'
                }`}
              >
                <Wrench className={`w-4 h-4 shrink-0 ${isToolActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>เครื่องมือ</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${activeDropdown === 'tools' ? 'rotate-180' : ''}`} />
              </button>

              {activeDropdown === 'tools' && (
                <div
                  role="menu"
                  className="absolute top-full left-0 mt-2 w-72 bg-[#090e18]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 grid gap-1 max-h-[75vh] overflow-y-auto"
                >
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    เครื่องมือช่วยเล่น & วิเคราะห์
                  </div>
                  {visibleToolItems.map((tool) => {
                    const ToolIcon = tool.icon;
                    const isActive = currentView === tool.id;
                    return (
                      <a
                        key={tool.id}
                        role="menuitem"
                        href={buildUrl(tool.id)}
                        onClick={(e) => go(e, tool.id)}
                        className={`flex items-start gap-2.5 px-3 py-2 rounded-xl text-left transition-colors group ${
                          isActive ? 'bg-blue-600/20 border border-blue-500/30' : 'hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-colors shrink-0 mt-0.5">
                          <ToolIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                            {tool.label}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {tool.desc}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right Actions: Clean, Minimal & Never Cluttered */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Search */}
            <button
              type="button"
              onClick={onOpenSearch}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              title="ค้นหาด่วน (Ctrl+K)"
              aria-label="ค้นหาด่วน"
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span className="hidden xl:inline text-slate-400 text-xs">ค้นหา...</span>
              <kbd className="hidden 2xl:inline-block px-1.5 py-0.2 text-[10px] font-mono font-bold bg-[#070b12] text-slate-400 border border-white/10 rounded">
                Ctrl K
              </kbd>
            </button>

            {/* Admin Switch (Minimal icon-only, only visible if Admin) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  const next = !adminMode;
                  setAdminMode(next);
                  if (next) onNavigate('admin');
                  else if (currentView === 'admin') onNavigate('dashboard');
                }}
                role="switch"
                aria-checked={adminMode}
                className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  adminMode
                    ? 'bg-fuchsia-600/25 border-fuchsia-400/60 text-fuchsia-300 shadow-md shadow-fuchsia-500/20'
                    : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-white'
                }`}
                title={adminMode ? 'โหมดแอดมิน (คลิกเพื่อกลับหน้าปกติ)' : 'สลับไปโหมดแอดมิน (หลังบ้าน)'}
                aria-label="สลับโหมดแอดมิน"
              >
                <Shield className={`w-4 h-4 ${adminMode ? 'text-fuchsia-300 animate-pulse' : 'text-slate-400'}`} />
              </button>
            )}

            {/* VIP Status / Upgrade Button — ALWAYS CLICKABLE */}
            <button
              type="button"
              onClick={openPaywall}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md hover:scale-[1.03] ${
                isMember
                  ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/25 to-amber-500/20 border border-amber-400/50 text-amber-300 hover:border-amber-300 shadow-amber-500/10'
                  : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/25'
              }`}
              title={isMember ? 'บัญชี VIP Member (คลิกเพื่อดูสิทธิ์ / จัดการแพ็กเกจ)' : 'อัปเกรดเป็นสมาชิก VIP ปลดล็อกทุกระบบ'}
              aria-label="จัดการสิทธิ์ VIP"
            >
              <Crown className={`w-3.5 h-3.5 ${isMember ? 'text-amber-400 fill-amber-400' : 'fill-slate-950'}`} />
              <span>VIP</span>
              {isMember && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
            </button>

            {/* User Profile / Auth */}
            {user ? (
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/70 border border-cyan-400/50 text-white text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-[1.02]"
                title={`เข้าสู่ระบบด้วย ${user.email} (คลิกเพื่อดูโปรไฟล์หรือออกจากระบบ)`}
                aria-label="โปรไฟล์ผู้ใช้"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-sm">
                  {user.email ? user.email.slice(0, 1) : 'U'}
                </div>
                <span className="max-w-[75px] sm:max-w-[100px] truncate text-cyan-200 text-xs">
                  {user.user_metadata?.display_name || user.email?.split('@')[0]}
                </span>
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-gradient-to-r from-blue-600/30 to-cyan-600/30 hover:from-blue-600/40 hover:to-cyan-600/40 border border-cyan-500/40 text-cyan-200 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-cyan-500/10 hover:scale-[1.02]"
                title="เข้าสู่ระบบคลาวด์เพื่อซิงค์ข้อมูลทั่วโลก"
                aria-label="เข้าสู่ระบบ"
              >
                <User className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline text-xs">เข้าสู่ระบบ</span>
              </button>
            )}

            {/* Drawer Sidebar Menu Toggle */}
            <button
              type="button"
              onClick={onOpenMenu}
              aria-haspopup="dialog"
              className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              title="เปิดสารบัญระบบทั้งหมด"
              aria-label="เปิดสารบัญระบบทั้งหมด"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
