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
  X
} from 'lucide-react';
import { NAVIGATION_CATEGORIES } from '../data/navigation';

const ICON_MAP = {
  UserCheck, Award, Layers, BookOpen, History, ShieldAlert, Sparkles, TrendingUp,
  Cpu, Gem, Shield, Swords, Users, Search, Activity, UserPlus, FileText, Crosshair,
  Star, HelpCircle, BarChart3, Trophy, Map, Calendar, Globe, Gift, Book, Gauge,
  Calculator, Sliders, Flame, Compass
};

export default function Sidebar({ 
  currentView, 
  onNavigate, 
  isOpen, 
  onClose 
}) {
  const [expandedCategories, setExpandedCategories] = useState({
    '3mdc': true,
    'meta-analytics': true,
    'rta': true,
    'tools': true,
    'guild': true,
    'account': true
  });

  const toggleCategory = (catId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const handleItemClick = (itemId) => {
    if (itemId === 'where2use') view = 'where2use';
    else if (itemId === 'siege-calculator' || itemId === 'siege-calc') view = 'siege-calculator';
    else if (itemId === '3mdc-trending') view = 'trending';
    else if (itemId.includes('3mdc')) view = '3mdc';
    else if (itemId.includes('rta')) view = 'rta';
    else if (itemId.includes('trending') || itemId.includes('monster-defense') || itemId.includes('monster-offense')) view = 'trending';
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
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/75 z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Navigation Panel */}
      <aside 
        className={`fixed top-16 sm:top-20 bottom-0 left-0 w-72 bg-[#0e141f] border-r border-[#1f2c3f] z-50 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header Inside Drawer */}
        <div className="flex lg:hidden items-center justify-between p-4 border-b border-[#1f2c3f]">
          <SwmLogo size="sm" />
          <button 
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 text-xs">
          
          {/* Main Home Button */}
          <button
            onClick={() => { onNavigate('dashboard'); if (onClose) onClose(); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left font-bold transition-all cursor-pointer ${
              currentView === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-300 hover:bg-[#152030] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Crosshair className="w-4 h-4" />
              <span>หน้าหลัก (Tactical Dashboard)</span>
            </div>
            <span className="text-[10px] font-mono text-blue-200">HUD</span>
          </button>

          {/* Categorized Menu Tree */}
          {NAVIGATION_CATEGORIES.map((category) => {
            const isExpanded = expandedCategories[category.id];
            return (
              <div key={category.id} className="space-y-1">
                {/* Category Header Accordion */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-slate-400 hover:text-slate-200 uppercase tracking-wider text-[11px] font-extrabold cursor-pointer group"
                >
                  <span>{category.title}</span>
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
                  )}
                </button>

                {/* Category Items List */}
                {isExpanded && (
                  <div className="space-y-0.5 pl-1 border-l-2 border-[#1c2738] ml-2">
                    {category.items.map((item) => {
                      const IconComponent = ICON_MAP[item.icon] || Shield;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item.id)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-slate-300 hover:text-white hover:bg-[#152030] transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <IconComponent className="w-4 h-4 text-slate-400 group-hover:text-blue-400 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </div>

                          {item.badge && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
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

        {/* Sidebar Footer User Telemetry */}
        <div className="p-3 border-t border-[#1f2c3f] bg-[#090e17] text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-cyan-300 font-semibold">SWM Master Engine</span>
          </div>
          <span className="font-mono text-slate-400">v2.5 Thai</span>
        </div>
      </aside>
    </>
  );
}
