import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import CommandPalette from './components/CommandPalette';
import DashboardView from './views/DashboardView';
import MdcView from './views/MdcView';
import TrendingAnalyticsView from './views/TrendingAnalyticsView';
import DungeonStatsView from './views/DungeonStatsView';
import BalancePatchesView from './views/BalancePatchesView';
import FaqView from './views/FaqView';
import PromoCodesView from './views/PromoCodesView';
import LeaderboardsView from './views/LeaderboardsView';
import MonsterCatalogView from './views/MonsterCatalogView';
import SpeedCalculatorView from './views/SpeedCalculatorView';
import RuneCalculatorView from './views/RuneCalculatorView';
import GuildRecruitView from './views/GuildRecruitView';
import PluginCompanionView from './views/PluginCompanionView';
import ArtifactOptimizerView from './views/ArtifactOptimizerView';
import RtaAnalyticsView from './views/RtaAnalyticsView';
import WhereToUseView from './views/WhereToUseView';
import SiegeCalculatorView from './views/SiegeCalculatorView';
import MdcStatsView from './views/MdcStatsView';
import GameGuidesView from './views/GameGuidesView';
import DraftExplorerView from './views/DraftExplorerView';
import RtaSynergiesView from './views/RtaSynergiesView';
import TierListMakerView from './views/TierListMakerView';
import MetaDashboardView from './views/MetaDashboardView';
import SiegeTournamentView from './views/SiegeTournamentView';
import PlayerTrackerView from './views/PlayerTrackerView';
import SwmLogo from './components/SwmLogo';
import { Home, Shield, Trophy, Search, Menu } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [viewParams, setViewParams] = useState({});
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigate = (view, params = {}) => {
    setCurrentView(view);
    setViewParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onNavigate={handleNavigate} />;
      case '3mdc':
        return <MdcView onNavigate={handleNavigate} {...viewParams} />;
      case 'where2use':
        return <WhereToUseView onNavigate={handleNavigate} {...viewParams} />;
      case '3mdc-stats':
        return <MdcStatsView onNavigate={handleNavigate} {...viewParams} />;
      case 'game-guides':
        return <GameGuidesView onNavigate={handleNavigate} {...viewParams} />;
      case 'siege-calc':
      case 'siege-calculator':
        return <SiegeCalculatorView onNavigate={handleNavigate} {...viewParams} />;
      case 'siege-tournament':
        return <SiegeTournamentView onNavigate={handleNavigate} {...viewParams} />;
      case 'player-tracker':
        return <PlayerTrackerView onNavigate={handleNavigate} {...viewParams} />;
      case 'draft-explorer':
        return <DraftExplorerView onNavigate={handleNavigate} {...viewParams} />;
      case 'rta-synergies':
        return <RtaSynergiesView onNavigate={handleNavigate} {...viewParams} />;
      case 'meta-dashboard':
        return <MetaDashboardView onNavigate={handleNavigate} {...viewParams} />;
      case 'tier-list-maker':
        return <TierListMakerView onNavigate={handleNavigate} {...viewParams} />;
      case 'trending':
        return <TrendingAnalyticsView onNavigate={handleNavigate} {...viewParams} />;
      case 'dungeons':
        return <DungeonStatsView onNavigate={handleNavigate} />;
      case 'balance':
        return <BalancePatchesView onNavigate={handleNavigate} />;
      case 'faq':
        return <FaqView onNavigate={handleNavigate} />;
      case 'codes':
        return <PromoCodesView onNavigate={handleNavigate} />;
      case 'leaderboards':
        return <LeaderboardsView onNavigate={handleNavigate} />;
      case 'catalog':
        return <MonsterCatalogView initialSearch={viewParams.search || ''} />;
      case 'speed':
        return <SpeedCalculatorView />;
      case 'rune':
        return <RuneCalculatorView />;
      case 'artifact':
        return <ArtifactOptimizerView onNavigate={handleNavigate} />;
      case 'recruit':
        return <GuildRecruitView onNavigate={handleNavigate} />;
      case 'aegislink':
        return <PluginCompanionView onNavigate={handleNavigate} />;
      case 'rta':
        return <RtaAnalyticsView onNavigate={handleNavigate} {...viewParams} />;
      default:
        return <DashboardView onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f18] text-slate-100 flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenSearch={() => setIsSearchOpen(true)}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        viewParams={viewParams}
      />

      {/* Main Layout Body - Horizon Full Width */}
      <div className="flex-1 flex w-full max-w-[1720px] 2xl:max-w-[1850px] mx-auto">
        {/* On-Demand Slide-over Sidebar Drawer */}
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        {/* Content View Area - Centered & Spacious Full Width */}
        <main className="flex-1 w-full min-w-0 px-3 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
          {renderView()}
        </main>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-[#1e293b] bg-[#0c121c] py-8 text-xs text-slate-400">
        <div className="max-w-[1720px] 2xl:max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SwmLogo size="sm" />
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">Summoners War Master • ศูนย์รวมยุทธวิธีกิลด์วอร์ & คลังวิเคราะห์เกมฉบับภาษาไทย</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-300">
            <button onClick={() => handleNavigate('dashboard')} className="hover:text-blue-400 transition-colors cursor-pointer">หน้าแรก</button>
            <button onClick={() => handleNavigate('3mdc')} className="hover:text-blue-400 transition-colors cursor-pointer">ทีมแก้ทาง 3MDC</button>
            <button onClick={() => handleNavigate('rta')} className="hover:text-amber-400 transition-colors cursor-pointer">🏆 วิเคราะห์ RTA (SWRT)</button>
            <button onClick={() => handleNavigate('trending')} className="hover:text-blue-400 transition-colors cursor-pointer">สถิติทั่วโลก (Trending)</button>
            <button onClick={() => handleNavigate('dungeons')} className="hover:text-blue-400 transition-colors cursor-pointer">ทีมฟาร์มดันเจี้ยน</button>
            <button onClick={() => handleNavigate('catalog')} className="hover:text-blue-400 transition-colors cursor-pointer">สารานุกรมสกิลมอนสเตอร์</button>
            <button onClick={() => handleNavigate('optimizer')} className="hover:text-blue-400 transition-colors cursor-pointer">อาร์ติแฟกต์ดาเมจเสริม</button>
            <button onClick={() => handleNavigate('codes')} className="hover:text-blue-400 transition-colors cursor-pointer">โค้ดแจกไอเทม</button>
            <button onClick={() => handleNavigate('recruit')} className="hover:text-blue-400 transition-colors cursor-pointer">กิลด์รับสมัคร (120)</button>
          </div>

          <div className="text-slate-500 text-[11px] text-center md:text-right font-mono">
            SWM Tactical Platform • Developed for Summoners War Community
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Dock */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090d16]/95 backdrop-blur-lg border-t border-[#1e293b] px-3 py-1.5 flex items-center justify-around shadow-[0_-8px_20px_rgba(0,0,0,0.6)]">
        <button
          onClick={() => handleNavigate('dashboard')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
            currentView === 'dashboard' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>หน้าแรก</span>
        </button>
        <button
          onClick={() => handleNavigate('3mdc')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
            currentView === '3mdc' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>3MDC</span>
        </button>
        <button
          onClick={() => handleNavigate('rta')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
            ['rta', 'player-tracker', 'draft-explorer', 'rta-synergies', 'meta-dashboard'].includes(currentView) ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>RTA</span>
        </button>
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4" />
          <span>ค้นหา</span>
        </button>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <Menu className="w-4 h-4" />
          <span>เมนู</span>
        </button>
      </nav>

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
