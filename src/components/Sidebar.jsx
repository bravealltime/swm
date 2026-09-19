import React, { useState, useEffect, useRef } from 'react';
import SwmLogo from './SwmLogo';
import {
  ChevronDown,
  ChevronRight,
  UserCheck,
  Award,
  Layers,
  BookOpen,
  History,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Cpu,
  Gem,
  Shield,
  Swords,
  Users,
  Search,
  Activity,
  UserPlus,
  FileText,
  Crosshair,
  Star,
  HelpCircle,
  BarChart3,
  Trophy,
  Map,
  Calendar,
  Globe,
  Gift,
  Book,
  Gauge,
  Calculator,
  Sliders,
  Flame,
  Compass,
  Home,
  X
} from 'lucide-react';
import { NAVIGATION_CATEGORIES } from '../data/navigation';
import { buildUrl } from '../router';
import { useAuth } from '../contexts/AuthContext';

const ICON_MAP = {
  UserCheck, Award, Layers, BookOpen, History, ShieldAlert, Sparkles, TrendingUp,
  Cpu, Gem, Shield, Swords, Users, Search, Activity, UserPlus, FileText, Crosshair,
  Star, HelpCircle, BarChart3, Trophy, Map, Calendar, Globe, Gift, Book, Gauge,
  Calculator, Sliders, Flame, Compass, Home
};

export default function Sidebar({
  currentView,
  onNavigate,
  isOpen,
  onClose
}) {
  const [expandedCategories, setExpandedCategories] = useState({
    'guild-siege': true,
    'rta-rankings': true,
    'tools-dungeons': true,
    'community-account': true
  });

  const toggleCategory = (catId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const closeBtnRef = useRef(null);
  const { adminMode } = useAuth();

  // Escape closes, background stops scrolling, focus lands on the close button
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  const resolveView = (itemId) => {
    if (itemId === 'admin') return 'admin';
    if (itemId === 'quiz') return 'quiz';
    if (itemId === 'arena') return 'arena';
    if (itemId === 'guardian-ladder' || itemId === 'guardian-meta') return 'guardian';
    if (itemId === 'ai-farm-optimizer' || itemId.includes('ai-farm')) return 'ai-farm-optimizer';
    if (itemId === 'my-box') return 'my-box';
    if (itemId === 'summon-simulator') return 'summon-simulator';
    if (itemId === 'siege-planner') return 'siege-planner';
    if (itemId === 'where2use') return 'where2use';
    if (itemId === '3mdc-stats') return '3mdc-stats';
    if (itemId === 'game-guides') return 'game-guides';
    if (itemId === 'siege-calculator' || itemId === 'siege-calc') return 'siege-calculator';
    if (itemId === 'siege-tournament') return 'siege-tournament';
    if (itemId === 'player-tracker' || itemId.includes('player')) return 'player-tracker';
    if (itemId === 'draft-explorer') return 'draft-explorer';
    if (itemId === 'rta-synergies') return 'rta-synergies';
    if (itemId === 'meta-dashboard') return 'meta-dashboard';
    if (itemId === 'tier-list-maker') return 'tier-list-maker';
    if (itemId === 'defense-trending') return 'trending';
    if (itemId === 'monster-defense-trending' || itemId === 'monster-offense-trending') return 'trending';
    if (itemId.includes('3mdc')) return '3mdc';
    if (itemId.includes('rta')) return 'rta';
    if (itemId.includes('dungeon')) return 'dungeons';
    if (itemId.includes('balance')) return 'balance';
    if (itemId.includes('faq')) return 'faq';
    if (itemId.includes('code')) return 'codes';
    if (itemId.includes('siege') || itemId.includes('wgb')) return 'leaderboards';
    if (itemId.includes('catalog')) return 'catalog';
    if (itemId.includes('speed')) return 'speed';
    if (itemId.includes('rune')) return 'rune';
    if (itemId.includes('artifact')) return 'artifact';
    if (itemId.includes('recruiting')) return 'recruit';
    if (itemId.includes('swex') || itemId.includes('aegis') || itemId.includes('account')) return 'aegislink';
    return 'dashboard';
  };

  const handleItemClick = (e, itemId) => {
    e.preventDefault();
    onNavigate(resolveView(itemId), { subItem: itemId });
    if (onClose) onClose();
  };

  return (
    <>
      {/* Slide-over Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 transition-opacity animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* Sidebar Navigation Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="สารบัญระบบทั้งหมด"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`fixed top-0 bottom-0 left-0 w-80 max-w-[85vw] bg-[#0a0f18]/98 backdrop-blur-xl border-r border-[#1e293b] z-50 flex flex-col transition-transform duration-300 ease-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1e293b] bg-[#0c1322]/80">
          <div className="flex items-center gap-2.5">
            <SwmLogo size="sm" />
            <span className="text-xs font-bold text-slate-300 tracking-wide uppercase">สารบัญระบบทั้งหมด</span>
          </div>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-[#131c2d] border border-[#24354f] hover:border-slate-500 transition-colors cursor-pointer"
            aria-label="ปิดเมนู"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 text-xs select-none custom-scrollbar">

          {/* Main Dashboard Home Button */}
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); if (onClose) onClose(); }}
            aria-current={currentView === 'dashboard' ? 'page' : undefined}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold transition-all ${
              currentView === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-black'
                : 'text-slate-300 hover:text-white hover:bg-[#111927]'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="text-sm">หน้าแรก (Dashboard)</span>
          </a>

          {/* 4 Clean Pillars */}
          {NAVIGATION_CATEGORIES.map((cat) => {
            const isExpanded = expandedCategories[cat.id];

            return (
              <div key={cat.id} className="space-y-1">
                {/* Category Header with Toggle */}
                <button
                  onClick={() => toggleCategory(cat.id)}
                  aria-expanded={isExpanded}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  <span className="truncate">{cat.title}</span>
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                </button>

                {/* Category Items List */}
                {isExpanded && (
                  <div className="space-y-0.5 pl-1">
                    {cat.items.map((item) => {
                      const IconComponent = ICON_MAP[item.icon] || Shield;

                      // Check active state
                      const isActive =
                        (item.id === '3mdc-search' && currentView === '3mdc') ||
                        (item.id === 'where2use' && currentView === 'where2use') ||
                        (item.id === 'summon-simulator' && currentView === 'summon-simulator') ||
                        (item.id === 'siege-planner' && currentView === 'siege-planner') ||
                        (item.id === '3mdc-stats' && currentView === '3mdc-stats') ||
                        (item.id === 'game-guides' && currentView === 'game-guides') ||
                        ((item.id === 'guardian-ladder' || item.id === 'guardian-meta') && currentView === 'guardian') ||
                        (item.id === 'my-box' && currentView === 'my-box') ||
                        (item.id === 'siege-calculator' && currentView === 'siege-calculator') ||
                        ((item.id === 'defense-trending' || item.id === 'monster-defense-trending' || item.id === 'monster-offense-trending') && currentView === 'trending') ||
                        (item.id.includes('rta') && currentView === 'rta') ||
                        (item.id === 'siege-leaderboards' && currentView === 'leaderboards') ||
                        (item.id === 'artifact-optimizer' && currentView === 'artifact') ||
                        (item.id === 'speed-calculator' && currentView === 'speed') ||
                        (item.id === 'dungeon-stats' && currentView === 'dungeons') ||
                        (item.id === 'monster-catalog' && currentView === 'catalog') ||
                        (item.id === 'game-codes' && currentView === 'codes') ||
                        (item.id === 'balance-patch' && currentView === 'balance') ||
                        (item.id === 'rune-calculator' && currentView === 'rune') ||
                        (item.id === 'guild-recruiting' && currentView === 'recruit') ||
                        (item.id === 'aegislink' && currentView === 'aegislink') ||
                        (item.id === 'faq-guides' && currentView === 'faq');

                      return (
                        <a
                          key={item.id}
                          href={buildUrl(resolveView(item.id), { subItem: item.id })}
                          onClick={(e) => handleItemClick(e, item.id)}
                          aria-current={isActive ? 'page' : undefined}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left font-medium transition-all ${
                            isActive
                              ? 'bg-blue-600/15 text-blue-400 font-bold border-l-2 border-blue-500'
                              : 'text-slate-300 hover:text-white hover:bg-[#111927]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                            <span className="text-xs leading-snug">{item.label}</span>
                          </div>

                          {item.badge && (
                            <span className={`px-1.5 py-0.2 rounded text-[11px] font-mono font-bold shrink-0 ${
                              isActive
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-[#152030] text-slate-400 border border-[#202f45]'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {adminMode && (
            <a
              href={buildUrl('admin')}
              onClick={(e) => handleItemClick(e, 'admin')}
              className={`mt-2 flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer border ${
                currentView === 'admin' ? 'bg-fuchsia-600/20 text-fuchsia-200 border-fuchsia-500/40' : 'text-fuchsia-300 hover:text-white border-fuchsia-500/20 hover:bg-fuchsia-500/10'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>หลังบ้าน SWM (ผู้ดูแล)</span>
            </a>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#172233] bg-[#070b12] text-[11px] text-slate-400 flex items-center justify-between font-mono">
          <span>SUMMONERS WAR MASTER</span>
          <span className="text-emerald-400">● LIVE</span>
        </div>
      </aside>
    </>
  );
}
