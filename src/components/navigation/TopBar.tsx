import React, { useEffect, useRef, useState } from 'react';
import { MSMEProfile, RiskCategory } from '../../types';
import {
  Building2,
  ChevronDown,
  LayoutDashboard,
  Lock,
  LogOut,
  Plus,
  Printer,
  RefreshCw,
  Sun,
  Moon,
  Monitor,
  Unlock,
} from 'lucide-react';
import { RiskBadge } from '../common/RiskBadge';
import { useTheme } from '../common/ThemeProvider';
import { THEME_MODES } from '../../core/theme';
import { AuthUser } from '../../core/auth';
import climoraLogo from '../../assets/Climora-logo.jpg';

interface TopBarProps {
  session: AuthUser;
  profiles: MSMEProfile[];
  activeProfile: MSMEProfile | null;
  onSelectProfile: (profile: MSMEProfile) => void;
  onOpenNewProfileModal: () => void;
  onOpenReportModal: () => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
  activeRiskCategory: RiskCategory;
  activeRiskScore: number;
  onLogout: () => void;
  onToggleCommandCenter: () => void;
  commandCenterUnlocked: boolean;
  commandCenterActive: boolean;
}

const MODE_ICONS = { light: Sun, dark: Moon, system: Monitor } as const;
const MODE_LABELS = { light: 'Light', dark: 'Dark', system: 'System' } as const;

const ROLE_LABELS: Record<AuthUser['role'], string> = {
  lender: 'Lender Workspace',
  msme_owner: 'MSME Owner Workspace',
};

function useDismissableMenu(): {
  open: boolean;
  toggle: () => void;
  close: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
} {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return {
    open,
    toggle: () => setOpen((prev) => !prev),
    close: () => setOpen(false),
    containerRef,
  };
}

export const TopBar: React.FC<TopBarProps> = ({
  session,
  profiles,
  activeProfile,
  onSelectProfile,
  onOpenNewProfileModal,
  onOpenReportModal,
  onRefreshData,
  isRefreshing,
  activeRiskCategory,
  activeRiskScore,
  onLogout,
  onToggleCommandCenter,
  commandCenterUnlocked,
  commandCenterActive,
}) => {
  const { mode, setMode } = useTheme();
  const userMenu = useDismissableMenu();
  const profileMenu = useDismissableMenu();

  const userInitial = session.name.trim().charAt(0).toUpperCase() || 'U';

  return (
    <header className="no-print sticky top-0 z-40 border-b border-fin-border bg-fin-bg/95 backdrop-blur-md px-4 lg:px-8 py-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-fin-sunken border border-emerald-500/30 overflow-hidden shadow-sm">
            <img src={climoraLogo} alt="Climora Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-fin-text font-sans">
                CLIMORA
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                IFC FIN-05
              </span>
            </div>
            <p className="text-[11px] text-fin-muted tracking-wide">
              Real-Time Climate Risk & Underwriting for MSMEs
            </p>
          </div>
        </div>

        {/* Right: Workspace label, Appearance Mode, Enterprise Selector & Actions */}
        <div className="flex flex-wrap items-center gap-3 self-end md:self-auto">
          {/* Current Workspace Label */}
          <span className="hidden xl:inline text-[10px] font-mono uppercase tracking-wider text-fin-muted px-2 py-1 rounded-lg bg-fin-inset border border-fin-border">
            {commandCenterActive ? 'Command Center' : ROLE_LABELS[session.role]}
          </span>

          {/* Appearance Mode Switcher */}
          <div
            className="flex items-center bg-fin-card border border-fin-border p-1 rounded-xl"
            role="group"
            aria-label="Appearance mode"
          >
            {THEME_MODES.map((m) => {
              const Icon = MODE_ICONS[m];
              const label = MODE_LABELS[m];
              const isActive = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  title={
                    m === 'system' ? 'System — follow your device theme' : `${label} appearance`
                  }
                  aria-label={
                    m === 'system'
                      ? 'System appearance mode (follows device)'
                      : `${label} appearance mode`
                  }
                  aria-pressed={isActive}
                  className={`p-1.5 rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isActive
                      ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                      : 'text-fin-muted hover:text-fin-text'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>

          {/* Active Profile Dropdown */}
          <div className="relative" ref={profileMenu.containerRef}>
            <button
              type="button"
              onClick={profileMenu.toggle}
              aria-haspopup="menu"
              aria-expanded={profileMenu.open}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-fin-card border border-fin-border cursor-pointer hover:border-fin-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-fin-text max-w-[140px] truncate">
                    {activeProfile ? activeProfile.name : 'No enterprise selected'}
                  </span>
                  {activeProfile && (
                    <RiskBadge category={activeRiskCategory} score={activeRiskScore} size="sm" />
                  )}
                </div>
                <div className="text-[10px] text-fin-muted font-mono">
                  {activeProfile
                    ? `${activeProfile.location.city}, ${activeProfile.location.state}`
                    : 'Register an enterprise profile'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-fin-muted" />
            </button>

            {profileMenu.open && (
              <div
                role="menu"
                aria-label="Select benchmark enterprise"
                className="absolute right-0 mt-1 w-72 rounded-xl bg-fin-card border border-fin-border shadow-2xl py-2 z-50"
              >
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-fin-muted border-b border-fin-border mb-1">
                  Select Benchmark Enterprise
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      role="menuitem"
                      onClick={() => {
                        onSelectProfile(p);
                        profileMenu.close();
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-fin-hover transition-colors flex items-center justify-between ${
                        p.id === activeProfile?.id
                          ? 'bg-fin-hover/70 border-l-2 border-emerald-500'
                          : ''
                      }`}
                    >
                      <div>
                        <div className="font-medium text-fin-text">{p.name}</div>
                        <div className="text-[11px] text-fin-muted">
                          {p.industry.replace('_', ' ')} • {p.location.city}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-fin-muted">
                        ₹{(p.financials.monthlyRevenue / 100000).toFixed(1)}L/mo
                      </span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-fin-border mt-1 pt-1 px-2">
                  <button
                    role="menuitem"
                    onClick={() => {
                      onOpenNewProfileModal();
                      profileMenu.close();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Register New MSME Profile</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Refresh Live Weather */}
          <button
            onClick={onRefreshData}
            disabled={isRefreshing || !activeProfile}
            title="Refresh Live Environmental Ingestion"
            aria-label="Refresh live environmental ingestion"
            className="p-2 rounded-xl bg-fin-card border border-fin-border text-fin-muted hover:text-fin-text hover:border-fin-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-60"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`}
            />
          </button>

          {/* Export Credit Memo */}
          <button
            onClick={onOpenReportModal}
            disabled={!activeProfile}
            title="Export Executive Credit Memo"
            aria-label="Export executive credit memo"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-fin-inset border border-fin-border text-xs font-medium text-fin-text hover:bg-fin-hover hover:text-fin-text transition-all shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-60"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Export Credit Memo</span>
          </button>

          {/* User Menu */}
          <div className="relative" ref={userMenu.containerRef}>
            <button
              type="button"
              onClick={userMenu.toggle}
              aria-haspopup="menu"
              aria-expanded={userMenu.open}
              aria-label={`User menu for ${session.name}`}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl bg-fin-card border border-fin-border hover:border-fin-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                {userInitial}
              </span>
              <span className="hidden sm:block text-xs font-semibold text-fin-text max-w-[120px] truncate">
                {session.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-fin-muted" />
            </button>

            {userMenu.open && (
              <div
                role="menu"
                aria-label="User menu"
                className="absolute right-0 mt-1 w-64 rounded-xl bg-fin-card border border-fin-border shadow-2xl py-2 z-50"
              >
                <div className="px-3 py-2 border-b border-fin-border mb-1">
                  <div className="text-xs font-bold text-fin-text truncate">{session.name}</div>
                  <div className="text-[11px] text-fin-muted truncate">{session.email}</div>
                  <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    <Building2 className="w-3 h-3" />
                    {ROLE_LABELS[session.role]}
                  </div>
                </div>

                <button
                  role="menuitem"
                  onClick={() => {
                    onToggleCommandCenter();
                    userMenu.close();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-fin-text hover:bg-fin-hover transition-colors flex items-center gap-2"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="flex-1">
                    {commandCenterActive
                      ? 'Exit Command Center'
                      : commandCenterUnlocked
                        ? 'Command Center'
                        : 'Command Center (locked)'}
                  </span>
                  {commandCenterActive ? (
                    <Unlock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Lock className="w-3 h-3 text-fin-muted" />
                  )}
                </button>

                <div className="border-t border-fin-border mt-1 pt-1">
                  <button
                    role="menuitem"
                    onClick={() => {
                      onLogout();
                      userMenu.close();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-700 dark:text-rose-300 hover:bg-rose-500/10 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
