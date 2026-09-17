import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import SwmLogo from './components/SwmLogo';
import { Home, Shield, Trophy, Search, Menu, Loader2 } from 'lucide-react';
import { buildUrl, parseLocation, normalizeView, titleFor } from './router';

// Every view (and the JSON it imports) is its own chunk, so the first paint
// only downloads the shell + the page that was actually requested.
const VIEWS = {
  dashboard: lazy(() => import('./views/DashboardView')),
  '3mdc': lazy(() => import('./views/MdcView')),
  where2use: lazy(() => import('./views/WhereToUseView')),
  '3mdc-stats': lazy(() => import('./views/MdcStatsView')),
  'game-guides': lazy(() => import('./views/GameGuidesView')),
  'siege-calculator': lazy(() => import('./views/SiegeCalculatorView')),
  'siege-tournament': lazy(() => import('./views/SiegeTournamentView')),
  'player-tracker': lazy(() => import('./views/PlayerTrackerView')),
  'draft-explorer': lazy(() => import('./views/DraftExplorerView')),
  'rta-synergies': lazy(() => import('./views/RtaSynergiesView')),
  'meta-dashboard': lazy(() => import('./views/MetaDashboardView')),
  'tier-list-maker': lazy(() => import('./views/TierListMakerView')),
  trending: lazy(() => import('./views/TrendingAnalyticsView')),
  dungeons: lazy(() => import('./views/DungeonStatsView')),
  balance: lazy(() => import('./views/BalancePatchesView')),
  faq: lazy(() => import('./views/FaqView')),
  codes: lazy(() => import('./views/PromoCodesView')),
  leaderboards: lazy(() => import('./views/LeaderboardsView')),
  catalog: lazy(() => import('./views/MonsterCatalogView')),
  speed: lazy(() => import('./views/SpeedCalculatorView')),
  rune: lazy(() => import('./views/RuneCalculatorView')),
  artifact: lazy(() => import('./views/ArtifactOptimizerView')),
  recruit: lazy(() => import('./views/GuildRecruitView')),
  aegislink: lazy(() => import('./views/PluginCompanionView')),
  rta: lazy(() => import('./views/RtaAnalyticsView')),
};

const CommandPalette = lazy(() => import('./components/CommandPalette'));

function ViewLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-400" role="status" aria-live="polite">
      <Loader2 className="w-7 h-7 animate-spin text-blue-400" />
      <span className="text-sm">กำลังโหลดข้อมูล...</span>
    </div>
  );
}

const RTA_VIEWS = ['rta', 'player-tracker', 'draft-explorer', 'rta-synergies', 'meta-dashboard'];

export default function App() {
  const [route, setRoute] = useState(() => parseLocation());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentView = route.view;
  const viewParams = route.params;

  const handleNavigate = useCallback((view, params = {}) => {
    const next = { view: normalizeView(view), params };
    const url = buildUrl(next.view, next.params);
    if (url !== window.location.pathname + window.location.search) {
      window.history.pushState(null, '', url);
    }
    setRoute(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Browser back / forward
  useEffect(() => {
    const onPopState = () => {
      setRoute(parseLocation());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    document.title = titleFor(currentView);
  }, [currentView]);

  // Global shortcut: Ctrl/Cmd + K toggles quick search
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const View = VIEWS[currentView] || VIEWS.dashboard;
  // Remount when the route changes so views re-seed their state from the new params
  const viewKey = `${currentView}:${JSON.stringify(viewParams)}`;

  const dockItem = (active) =>
    `flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
      active ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
    }`;

  return (
    <div className="min-h-screen bg-[#0a0f18] text-slate-100 flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-blue-600 focus:text-white"
      >
        ข้ามไปเนื้อหาหลัก
      </a>

      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenMenu={() => setMobileMenuOpen(true)}
      />

      <div className="flex-1 flex w-full max-w-[1720px] 2xl:max-w-[1850px] mx-auto">
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        <main id="main-content" className="flex-1 w-full min-w-0 px-3 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
          <ErrorBoundary key={viewKey}>
            <Suspense fallback={<ViewLoading />}>
              <View
                key={viewKey}
                onNavigate={handleNavigate}
                {...viewParams}
                initialSearch={viewParams.search || ''}
              />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      <footer className="w-full border-t border-[#1e293b] bg-[#0c121c] py-8 text-xs text-slate-400">
        <div className="max-w-[1720px] 2xl:max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SwmLogo size="sm" />
            <span className="text-slate-400">|</span>
            <span className="text-slate-400">Summoners War Master • ศูนย์รวมยุทธวิธีกิลด์วอร์ & คลังวิเคราะห์เกมฉบับภาษาไทย</span>
          </div>

          <nav aria-label="ลิงก์ท้ายหน้า" className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-300">
            <a href={buildUrl('dashboard')} onClick={(e) => { e.preventDefault(); handleNavigate('dashboard'); }} className="hover:text-blue-400 transition-colors">หน้าแรก</a>
            <a href={buildUrl('3mdc')} onClick={(e) => { e.preventDefault(); handleNavigate('3mdc'); }} className="hover:text-blue-400 transition-colors">ทีมแก้ทาง 3MDC</a>
            <a href={buildUrl('rta')} onClick={(e) => { e.preventDefault(); handleNavigate('rta'); }} className="hover:text-amber-400 transition-colors">วิเคราะห์ RTA (SWRT)</a>
            <a href={buildUrl('trending')} onClick={(e) => { e.preventDefault(); handleNavigate('trending'); }} className="hover:text-blue-400 transition-colors">สถิติทั่วโลก (Trending)</a>
            <a href={buildUrl('dungeons')} onClick={(e) => { e.preventDefault(); handleNavigate('dungeons'); }} className="hover:text-blue-400 transition-colors">ทีมฟาร์มดันเจี้ยน</a>
            <a href={buildUrl('catalog')} onClick={(e) => { e.preventDefault(); handleNavigate('catalog'); }} className="hover:text-blue-400 transition-colors">สารานุกรมสกิลมอนสเตอร์</a>
            <a href={buildUrl('artifact')} onClick={(e) => { e.preventDefault(); handleNavigate('artifact'); }} className="hover:text-blue-400 transition-colors">อาร์ติแฟกต์ดาเมจเสริม</a>
            <a href={buildUrl('codes')} onClick={(e) => { e.preventDefault(); handleNavigate('codes'); }} className="hover:text-blue-400 transition-colors">โค้ดแจกไอเทม</a>
            <a href={buildUrl('recruit')} onClick={(e) => { e.preventDefault(); handleNavigate('recruit'); }} className="hover:text-blue-400 transition-colors">กิลด์รับสมัคร</a>
          </nav>

          <div className="text-slate-400 text-xs text-center md:text-right font-mono">
            SWM Tactical Platform • Developed for Summoners War Community
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Dock */}
      <nav aria-label="เมนูหลัก (มือถือ)" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090d16]/95 backdrop-blur-lg border-t border-[#1e293b] px-3 py-1.5 flex items-center justify-around shadow-[0_-8px_20px_rgba(0,0,0,0.6)]">
        <button onClick={() => handleNavigate('dashboard')} className={dockItem(currentView === 'dashboard')} aria-current={currentView === 'dashboard' ? 'page' : undefined}>
          <Home className="w-4 h-4" />
          <span>หน้าแรก</span>
        </button>
        <button onClick={() => handleNavigate('3mdc')} className={dockItem(currentView === '3mdc')} aria-current={currentView === '3mdc' ? 'page' : undefined}>
          <Shield className="w-4 h-4" />
          <span>3MDC</span>
        </button>
        <button onClick={() => handleNavigate('rta')} className={dockItem(RTA_VIEWS.includes(currentView))} aria-current={RTA_VIEWS.includes(currentView) ? 'page' : undefined}>
          <Trophy className="w-4 h-4" />
          <span>RTA</span>
        </button>
        <button onClick={() => setIsSearchOpen(true)} className={dockItem(false)}>
          <Search className="w-4 h-4" />
          <span>ค้นหา</span>
        </button>
        <button onClick={() => setMobileMenuOpen(true)} className={dockItem(false)} aria-haspopup="dialog">
          <Menu className="w-4 h-4" />
          <span>เมนู</span>
        </button>
      </nav>

      {isSearchOpen && (
        <Suspense fallback={null}>
          <CommandPalette
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            onNavigate={handleNavigate}
          />
        </Suspense>
      )}
    </div>
  );
}
