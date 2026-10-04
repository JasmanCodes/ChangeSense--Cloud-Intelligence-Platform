import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock,
  AlertOctagon,
  GitCommit,
  ShieldAlert,
  Server,
  Bot,
  Settings,
  Lock,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import clsx from 'clsx';
import { useOrg, type ServiceKey, CATALOG_SERVICES } from '../../context/OrgContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

interface NavItemConfig {
  name: string;
  path: string;
  icon: React.ElementType;
  requiredService?: ServiceKey;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { currentOrg, isServiceEnabled, openEnableModal } = useOrg();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems: NavItemConfig[] = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Timeline', path: '/timeline', icon: Clock, requiredService: 'change-tracking' },
    { name: 'Incidents', path: '/incidents', icon: AlertOctagon, requiredService: 'incident-detection' },
    { name: 'Changes', path: '/changes', icon: GitCommit, requiredService: 'change-tracking' },
    { name: 'Security', path: '/security', icon: ShieldAlert, requiredService: 'security-drift' },
    { name: 'Services', path: '/services', icon: Server },
    { name: 'AI Assistant', path: '/assistant', icon: Bot, requiredService: 'ai-assistant' },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleDisabledClick = (e: React.MouseEvent, serviceKey: ServiceKey) => {
    e.preventDefault();
    const serviceInfo = CATALOG_SERVICES.find((s) => s.key === serviceKey);
    if (serviceInfo) {
      openEnableModal(serviceInfo);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={clsx(
          'fixed lg:static top-0 bottom-0 left-0 z-40 flex flex-col justify-between transition-all duration-300 border-r border-slate-800 bg-[#0B0F19] text-slate-200 select-none',
          isCollapsed ? 'w-20' : 'w-[260px]',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Top Header & Logo */}
        <div>
          <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
            <NavLink
              to="/home"
              className="flex items-center gap-3 group focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-glow-brand ring-1 ring-indigo-400/30">
                <Zap className="w-5 h-5 fill-white text-white" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="font-bold text-base tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                    Change<span className="text-indigo-400 font-extrabold">Sense</span>
                  </span>
                  <span className="text-[10px] text-slate-400 -mt-0.5 tracking-wider uppercase font-mono">
                    Intelligence Platform
                  </span>
                </div>
              )}
            </NavLink>

            {/* Collapse toggle (desktop only) */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-170px)]">
            {navItems.map((item) => {
              const isLocked =
                item.requiredService && !isServiceEnabled(item.requiredService);
              const Icon = item.icon;

              if (isLocked) {
                return (
                  <button
                    key={item.name}
                    onClick={(e) => handleDisabledClick(e, item.requiredService!)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group opacity-50 hover:opacity-80 hover:bg-slate-900/80 text-slate-400 border border-transparent',
                      isCollapsed && 'justify-center px-2'
                    )}
                    title={`${item.name} (Service not enabled - click to enable)`}
                  >
                    <Icon className="w-5 h-5 text-slate-500 shrink-0" />
                    {!isCollapsed && (
                      <span className="flex-1 text-left line-clamp-1">
                        {item.name}
                      </span>
                    )}
                    {!isCollapsed && (
                      <Lock className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
                    )}
                  </button>
                );
              }

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                      isCollapsed && 'justify-center px-2',
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
                    )
                  }
                  title={item.name}
                >
                  <Icon className="w-5 h-5 shrink-0 group-hover:scale-105 transition-transform" />
                  {!isCollapsed && (
                    <span className="flex-1 line-clamp-1">{item.name}</span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Org & User Profile */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div
            className={clsx(
              'flex items-center gap-3 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80',
              isCollapsed && 'justify-center p-1.5'
            )}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 ring-1 ring-white/10">
              {user?.name ? user.name.slice(0, 2) : 'CS'}
            </div>

            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {user?.name || 'Administrator'}
                </p>
                <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  {currentOrg?.name || 'Demo Org'}
                </p>
              </div>
            )}

            {!isCollapsed && (
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-400 p-1 rounded-md hover:bg-slate-800 transition-colors"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
