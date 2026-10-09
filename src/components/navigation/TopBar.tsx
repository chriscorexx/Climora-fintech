import React from 'react';
import { MSMEProfile, UserRole, RiskCategory } from '../../types';
import { Building2, ChevronDown, Plus, Printer, RefreshCw, Layers, Sun, Moon, Monitor } from 'lucide-react';
import { RiskBadge } from '../common/RiskBadge';
import { useTheme } from '../common/ThemeProvider';
import { THEME_MODES } from '../../core/theme';
import climoraLogo from '../../assets/Climora-logo.jpg';

interface TopBarProps {
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  profiles: MSMEProfile[];
  activeProfile: MSMEProfile;
  onSelectProfile: (profile: MSMEProfile) => void;
  onOpenNewProfileModal: () => void;
  onOpenReportModal: () => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
  activeRiskCategory: RiskCategory;
  activeRiskScore: number;
}

const MODE_ICONS = { light: Sun, dark: Moon, system: Monitor } as const;
const MODE_LABELS = { light: 'Light', dark: 'Dark', system: 'System' } as const;

export const TopBar: React.FC<TopBarProps> = ({
  role,
  onRoleChange,
  profiles,
  activeProfile,
  onSelectProfile,
  onOpenNewProfileModal,
  onOpenReportModal,
  onRefreshData,
  isRefreshing,
  activeRiskCategory,
  activeRiskScore,
}) => {
  const { mode, setMode } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-fin-border bg-fin-bg/95 backdrop-blur-md px-4 lg:px-8 py-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-black border border-emerald-500/30 overflow-hidden shadow-sm">
            <img
              src={climoraLogo}
              alt="Climora Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-fin-text font-sans">CLIMORA</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                IFC FIN-05
              </span>
            </div>
            <p className="text-[11px] text-fin-muted tracking-wide">
              Real-Time Climate Risk & Underwriting for MSMEs
            </p>
          </div>
        </div>

        {/* Center: Role Switcher */}
        <div className="flex items-center bg-fin-card border border-fin-border p-1 rounded-xl self-start md:self-auto">
          <button
            onClick={() => onRoleChange('lender')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              role === 'lender'
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                : 'text-fin-muted hover:text-fin-text'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Lender Workspace</span>
          </button>
          <button
            onClick={() => onRoleChange('msme_owner')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              role === 'msme_owner'
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                : 'text-fin-muted hover:text-fin-text'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>MSME Owner Workspace</span>
          </button>
        </div>

        {/* Right: Appearance Mode, Active Enterprise Selector & Actions */}
        <div className="flex items-center gap-3 self-end md:self-auto">
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
                  title={m === 'system' ? 'System — follow your device theme' : `${label} appearance`}
                  aria-label={m === 'system' ? 'System appearance mode (follows device)' : `${label} appearance mode`}
                  aria-pressed={isActive}
                  className={`p-1.5 rounded-lg transition-all ${
                    isActive ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-fin-muted hover:text-fin-text'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>

          {/* Active Profile Dropdown */}
          <div className="relative group">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-fin-card border border-fin-border cursor-pointer hover:border-fin-hover transition-colors">
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-fin-text max-w-[140px] truncate">
                    {activeProfile.name}
                  </span>
                  <RiskBadge category={activeRiskCategory} score={activeRiskScore} size="sm" />
                </div>
                <div className="text-[10px] text-fin-muted font-mono">
                  {activeProfile.location.city}, {activeProfile.location.state}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-fin-muted" />
            </div>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-1 w-72 rounded-xl bg-fin-card border border-fin-border shadow-2xl py-2 hidden group-hover:block hover:block z-50">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-fin-muted border-b border-fin-border mb-1">
                Select Benchmark Enterprise
              </div>
              <div className="max-h-60 overflow-y-auto">
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onSelectProfile(p)}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-fin-hover transition-colors flex items-center justify-between ${
                      p.id === activeProfile.id ? 'bg-fin-hover/70 border-l-2 border-emerald-500' : ''
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
                  onClick={onOpenNewProfileModal}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register New MSME Profile</span>
                </button>
              </div>
            </div>
          </div>

          {/* Refresh Live Weather */}
          <button
            onClick={onRefreshData}
            disabled={isRefreshing}
            title="Refresh Live Environmental Ingestion"
            className="p-2 rounded-xl bg-fin-card border border-fin-border text-fin-muted hover:text-fin-text hover:border-fin-hover transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`} />
          </button>

          {/* Export Credit Memo */}
          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-fin-inset border border-fin-border text-xs font-medium text-fin-text hover:bg-fin-hover hover:text-fin-text transition-all shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Export Credit Memo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
