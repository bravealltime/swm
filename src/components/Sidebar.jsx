import React, { useState } from 'react';
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

  const handleItemClick = (itemId) => {
    let view = 'dashboard';
    if (itemId === 'where2use') view = 'where2use';
    else if (itemId === '3mdc-stats') view = '3mdc-stats';
    else if (itemId === 'game-guides') view = 'game-guides';
    else if (itemId === 'siege-calculator' || itemId === 'siege-calc') view = 'siege-calculator';
    else if (itemId === 'siege-tournament') view = 'siege-tournament';
    else if (itemId === 'player-tracker' || itemId.includes('player')) view = 'player-tracker';
    else if (itemId === 'draft-explorer') view = 'draft-explorer';
    else if (itemId === 'rta-synergies') view = 'rta-synergies';
    else if (itemId === 'meta-dashboard') view = 'meta-dashboard';
    else if (itemId === 'tier-list-maker') view = 'tier-list-maker';
    else if (itemId === 'defense-trending') view = 'trending';
    else if (itemId === 'monster-defense-trending' || itemId === 'monster-offense-trending') view = 'trending';
    else if (itemId.includes('3mdc')) view = '3mdc';
    else if (itemId.includes('rta')) view = 'rta';
    else if (itemId.includes('dungeon')) view = 'dungeons';
    else if (itemId.includes('balance')) view = 'balance';
    else if (itemId.includes('faq')) view = 'faq';
    else if (itemId.includes('code')) view = 'codes';
    else if (itemId.includes('siege') || itemId.includes('wgb')) view = 'leaderboards';
    else if (itemId.includes('catalog')) view = 'catalog';
    else if (itemId.includes('speed')) view = 'speed';
    else if (itemId.includes('rune')) view = 'rune';
    else if (itemId.includes('artifact')) view = 'artifact';
    else if (itemId.includes('recruiting')) view = 'recruit';
    else if (itemId.includes('swex') || itemId.includes('aegis') || itemId.includes('account')) {
      view = 'aegislink';
    }
    else view = 'dashboard';

    onNavigate(view, { subItem: itemId });
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
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-[#131c2d] border border-[#24354f] hover:border-slate-500 transition-colors cursor-pointer"
            title="ปิดเมนู"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 text-xs select-none custom-scrollbar">
          
          {/* Main Dashboard Home Button */}
          <button
            onClick={() => { onNavigate('dashboard'); if (onClose) onClose(); }}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
              currentView === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-black'
                : 'text-slate-300 hover:text-white hover:bg-[#111927]'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="text-sm">หน้าแรก (Dashboard)</span>
          </button>

          {/* 4 Clean Pillars */}
          {NAVIGATION_CATEGORIES.map((cat) => {
            const isExpanded = expandedCategories[cat.id];

            return (
              <div key={cat.id} className="space-y-1">
                {/* Category Header with Toggle */}
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  <span className="truncate">{cat.title}</span>
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
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
                        (item.id === '3mdc-stats' && currentView === '3mdc-stats') ||
                        (item.id === 'game-guides' && currentView === 'game-guides') ||
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
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-medium transition-all cursor-pointer ${
                            isActive
                              ? 'bg-blue-600/15 text-blue-400 font-bold border-l-2 border-blue-500'
                              : 'text-slate-300 hover:text-white hover:bg-[#111927]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                            <span className="truncate text-xs">{item.label}</span>
                          </div>

                          {item.badge && (
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold shrink-0 ${
                              isActive 
                                ? 'bg-blue-500/20 text-blue-300' 
                                : 'bg-[#152030] text-slate-400 border border-[#202f45]'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#172233] bg-[#070b12] text-[10px] text-slate-500 flex items-center justify-between font-mono">
          <span>SUMMONERS WAR MASTER</span>
          <span className="text-emerald-400">● LIVE</span>
        </div>
      </aside>
    </>
  );
}
