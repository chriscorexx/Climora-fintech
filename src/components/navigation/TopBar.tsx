import React from 'react';
import { MSMEProfile, UserRole, RiskCategory } from '../../types';
import { ShieldAlert, Building2, ChevronDown, Plus, Printer, RefreshCw, Layers } from 'lucide-react';
import { RiskBadge } from '../common/RiskBadge';

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
  return (
    <header className="sticky top-0 z-40 border-b border-fin-border bg-fin-bg/95 backdrop-blur-md px-4 lg:px-8 py-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">CLIMORA</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
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
                : 'text-slate-400 hover:text-slate-200'
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
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>MSME Owner Workspace</span>
          </button>
        </div>

        {/* Right: Active Enterprise Selector & Actions */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Active Profile Dropdown */}
          <div className="relative group">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-fin-card border border-fin-border cursor-pointer hover:border-slate-600 transition-colors">
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-200 max-w-[140px] truncate">
                    {activeProfile.name}
                  </span>
                  <RiskBadge category={activeRiskCategory} score={activeRiskScore} size="sm" />
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {activeProfile.location.city}, {activeProfile.location.state}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-1 w-72 rounded-xl bg-fin-card border border-fin-border shadow-2xl py-2 hidden group-hover:block hover:block z-50">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-fin-border mb-1">
                Select Benchmark Enterprise
              </div>
              <div className="max-h-60 overflow-y-auto">
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onSelectProfile(p)}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-fin-hover transition-colors flex items-center justify-between ${
                      p.id === activeProfile.id ? 'bg-fin-hover/70 border-l-2 border-emerald-400' : ''
                    }`}
                  >
                    <div>
                      <div className="font-medium text-slate-200">{p.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {p.industry.replace('_', ' ')} • {p.location.city}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      ₹{(p.financials.monthlyRevenue / 100000).toFixed(1)}L/mo
                    </span>
                  </button>
                ))}
              </div>
              <div className="border-t border-fin-border mt-1 pt-1 px-2">
                <button
                  onClick={onOpenNewProfileModal}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
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
            className="p-2 rounded-xl bg-fin-card border border-fin-border text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Export Credit Memo */}
          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Export Credit Memo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
