import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  RotateCw,
  ChevronDown,
  Layers,
  Calendar,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useFilters } from '../../context/FilterContext';
import type { TimeRange } from '../../context/FilterContext';
import type { Environment } from '../../types';

interface TopBarProps {
  onOpenMobileMenu: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenMobileMenu }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const {
    environment,
    setEnvironment,
    timeRange,
    setTimeRange,
    searchQuery,
    setSearchQuery,
    lastUpdated,
    triggerRefresh,
  } = useFilters();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadNotifications] = useState(3);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    triggerRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Compute breadcrumbs from current pathname
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const pageTitleMap: Record<string, string> = {
    dashboard: 'Overview',
    timeline: 'Timeline',
    incidents: 'Incidents',
    changes: 'Changes',
    security: 'Security & Drift',
    services: 'Discovered Services',
    assistant: 'AI Assistant',
    settings: 'Settings',
    home: 'Service Catalog',
    onboarding: 'Onboarding',
  };

  const breadcrumbs = ['ChangeSense', ...pathSegments.map((s) => pageTitleMap[s] || s)];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 transition-colors">
      {/* Left: Mobile hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-slate-600">/</span>}
              <span
                className={
                  idx === breadcrumbs.length - 1
                    ? 'text-white font-semibold capitalize'
                    : 'text-slate-400 hover:text-slate-300 transition-colors cursor-default'
                }
              >
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search changes, incidents, services, commits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-12 py-1.5 text-xs bg-slate-950/60 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Controls: Env, Time Range, Refresh, Notification, Theme */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Environment Filter */}
        <div className="relative inline-flex items-center">
          <Layers className="w-3.5 h-3.5 text-indigo-400 absolute left-2.5 pointer-events-none" />
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as Environment)}
            className="appearance-none pl-8 pr-7 py-1.5 text-xs font-medium bg-slate-800/80 border border-slate-700/80 text-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer hover:bg-slate-800"
            aria-label="Filter by environment"
          >
            <option value="PROD">Production</option>
            <option value="STAGING">Staging</option>
            <option value="DEV">Development</option>
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 pointer-events-none" />
        </div>

        {/* Time-Range Picker */}
        <div className="relative hidden sm:inline-flex items-center">
          <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="appearance-none pl-8 pr-7 py-1.5 text-xs font-medium bg-slate-800/80 border border-slate-700/80 text-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer hover:bg-slate-800"
            aria-label="Filter by time range"
          >
            <option value="1h">Last 1 hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="custom">Custom Range</option>
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 pointer-events-none" />
        </div>

        {/* Real-time Indicator & Manual Refresh */}
        <button
          onClick={handleManualRefresh}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-800/90 border border-slate-800 rounded-lg transition-colors group"
          title={`Last updated at ${lastUpdated.toLocaleTimeString()} (Auto-refreshes every 30s)`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="hidden xl:inline text-[11px] text-slate-400">Live</span>
          <RotateCw
            className={`w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 transition-transform ${
              isRefreshing ? 'animate-spin text-indigo-400' : ''
            }`}
          />
        </button>

        {/* Notification Bell */}
        <button
          className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Notifications"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-slate-900" />
          )}
        </button>

        {/* Theme Toggle (Dark / Light) */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-400" />
          )}
        </button>
      </div>
    </header>
  );
};
