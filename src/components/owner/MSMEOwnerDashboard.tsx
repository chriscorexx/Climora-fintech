import React from 'react';
import {
  MSMEProfile,
  RiskAssessment,
  ClimateIndicators,
  GovernmentScheme,
} from '../../types';
import { MetricCard } from '../common/MetricCard';
import { RiskBadge } from '../common/RiskBadge';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import {
  ShieldCheck,
  Building2,
  Droplets,
  Flame,
  CloudRain,
  ExternalLink,
  CheckCircle,
  Circle,
  Award,
  ArrowUpRight,
  Edit3,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface MSMEOwnerDashboardProps {
  activeProfile: MSMEProfile;
  assessment: RiskAssessment;
  climate: ClimateIndicators;
  matchedSchemes: GovernmentScheme[];
  completedActionIds: string[];
  onToggleAction: (actionId: string) => void;
  onOpenEditModal: () => void;
}

export const MSMEOwnerDashboard: React.FC<MSMEOwnerDashboardProps> = ({
  activeProfile,
  assessment,
  climate,
  matchedSchemes,
  completedActionIds,
  onToggleAction,
  onOpenEditModal,
}) => {
  const eligibleSchemes = matchedSchemes.filter((s) => s.isEligible);
  const completedCount = assessment.mitigationRecommendations.filter((m) =>
    completedActionIds.includes(m.id)
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner: Enterprise Overview & Health Status */}
      <div className="rounded-2xl bg-fin-card border border-fin-border p-6 shadow-fin-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-fin-border">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-extrabold text-white tracking-tight">{activeProfile.name}</h1>
              <RiskBadge category={assessment.riskCategory} score={assessment.overallScore} size="lg" />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
              <span>{activeProfile.industry.replace('_', ' ').toUpperCase()}</span>
              <span>•</span>
              <span>{activeProfile.businessSize.toUpperCase()} ENTERPRISE</span>
              <span>•</span>
              <span>{activeProfile.location.city}, {activeProfile.location.state}</span>
              {activeProfile.udyamNumber && (
                <>
                  <span>•</span>
                  <span className="font-mono text-emerald-400">{activeProfile.udyamNumber}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ProvenanceBadge
              isLive={climate.provenance.isLive}
              provider={climate.provenance.provider}
              retrievedAt={climate.provenance.retrievedAt}
            />
            <button
              onClick={onOpenEditModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Edit Profile & Facilities</span>
            </button>
          </div>
        </div>

        {/* 4 Financial & Climate Health Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          <MetricCard
            label="Monthly Revenue"
            value={`₹${(activeProfile.financials.monthlyRevenue / 100000).toFixed(1)}L`}
            subtitle={`Opex: ₹${(activeProfile.financials.monthlyOperatingExpenses / 100000).toFixed(1)}L/mo`}
            icon={<Building2 className="w-4 h-4 text-emerald-400" />}
          />
          <MetricCard
            label="Liquidity Cushion"
            value={`${(
              activeProfile.financials.availableCashReserves /
              activeProfile.financials.monthlyOperatingExpenses
            ).toFixed(1)} mo`}
            subtitle={`₹${(activeProfile.financials.availableCashReserves / 100000).toFixed(1)}L in reserves`}
            icon={<ShieldCheck className="w-4 h-4 text-cyan-400" />}
          />
          <MetricCard
            label="Resilience Progress"
            value={`${completedCount}/${assessment.mitigationRecommendations.length}`}
            subtitle="Completed climate mitigation measures"
            icon={<Award className="w-4 h-4 text-amber-400" />}
          />
          <MetricCard
            label="Matched Subsidies"
            value={eligibleSchemes.length}
            subtitle="Central & State MSME schemes"
            icon={<ExternalLink className="w-4 h-4 text-purple-400" />}
          />
        </div>
      </div>

      {/* Main 2-Column Section: Left 7-Day Live Forecast & Adaptation Roadmap, Right Matched Subsidies */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Environmental Live Monitor & Resilience Roadmap */}
        <div className="lg:col-span-7 space-y-6">
          {/* 7-Day Environmental Forecast Bar */}
          <div className="rounded-2xl bg-fin-card border border-fin-border p-6 shadow-fin-card">
            <div className="flex items-center justify-between pb-4 border-b border-fin-border">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  7-Day Environmental Forecast ({climate.location.resolvedAddress})
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Open-Meteo live feed</span>
            </div>

            {/* Live Atmospheric Telemetry */}
            <div className="my-3 p-3 rounded-xl bg-slate-900/90 border border-emerald-500/25 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-mono text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">
                  Current Atmospheric Reading
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-300 tabular-nums">
                <span>🌡️ {climate.currentConditions.temperatureC}°C ({climate.currentConditions.weatherDescription})</span>
                <span>💧 {climate.currentConditions.relativeHumidityPct}% Hum.</span>
                <span>💨 {climate.currentConditions.windSpeedKmh} km/h Wind</span>
                <span>🌧️ {climate.currentConditions.precipitationMm}mm Rain</span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 pt-2 overflow-x-auto text-center">
              {climate.forecast7Days.slice(0, 7).map((day, idx) => {
                const dayName = new Date(day.date).toLocaleDateString([], { weekday: 'short' });
                const isRain = day.precipitationSumMm > 5;
                const isHot = day.maxTempC >= 38;

                return (
                  <div
                    key={idx}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-between min-w-[70px] ${
                      isRain
                        ? 'border-cyan-500/30 bg-cyan-950/20'
                        : isHot
                        ? 'border-amber-500/30 bg-amber-950/20'
                        : 'border-slate-800 bg-slate-900/60'
                    }`}
                  >
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">{dayName}</span>
                    <div className="my-1.5">
                      {isRain ? (
                        <CloudRain className="w-4 h-4 text-cyan-400" />
                      ) : isHot ? (
                        <Flame className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Droplets className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="font-mono text-xs font-bold text-white tabular-nums">
                      {day.maxTempC}°
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 tabular-nums">
                      {day.precipitationSumMm > 0 ? `${day.precipitationSumMm}mm` : `${day.minTempC}°`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Practical Climate Adaptation Roadmap Checklist */}
          <div className="rounded-2xl bg-fin-card border border-fin-border p-6 shadow-fin-card">
            <div className="flex items-center justify-between pb-4 border-b border-fin-border">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Practical Resilience Roadmap & Loss Prevention
                </h3>
                <p className="text-xs text-slate-400">
                  Implement these actions to reduce climate hazard damage and lower borrowing interest rates.
                </p>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                Actionable
              </span>
            </div>

            <div className="space-y-3 pt-4">
              {assessment.mitigationRecommendations.map((mit) => {
                const isCompleted = completedActionIds.includes(mit.id);
                return (
                  <div
                    key={mit.id}
                    onClick={() => onToggleAction(mit.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isCompleted
                        ? 'border-emerald-500/40 bg-emerald-950/20'
                        : 'border-fin-border bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors">
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-500" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h4
                            className={`text-xs font-bold tracking-tight ${
                              isCompleted ? 'line-through text-slate-400' : 'text-slate-100'
                            }`}
                          >
                            {mit.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-emerald-400 font-bold">
                              -{mit.riskReductionPts} Risk Pts
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              Est. ₹{(mit.estimatedCostInr / 1000).toFixed(0)}k
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{mit.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): 16 Matched Government Subsidies & Schemes */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl bg-fin-card border border-fin-border p-6 shadow-fin-card">
            <div className="flex items-center justify-between pb-4 border-b border-fin-border">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Matched Government Subsidies & Grants
                </h3>
                <p className="text-xs text-slate-400">
                  Verified central & state resilience incentives matching your profile
                </p>
              </div>
              <span className="text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-semibold">
                {eligibleSchemes.length} Eligible
              </span>
            </div>

            <div className="space-y-3 pt-4 max-h-[620px] overflow-y-auto pr-1">
              {matchedSchemes.map((scheme) => (
                <div
                  key={scheme.id}
                  className={`p-4 rounded-xl border transition-all ${
                    scheme.isEligible
                      ? 'border-fin-border bg-slate-900/80 hover:border-slate-700'
                      : 'border-slate-800/40 bg-slate-950/40 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-100">{scheme.name}</h4>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold shrink-0 ${
                        scheme.isEligible
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {scheme.isEligible ? 'Eligible' : 'Check Scope'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 mt-1">
                    {scheme.sponsoringAuthority} ({scheme.governmentLevel.toUpperCase()})
                  </div>

                  <div className="mt-2 p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-emerald-300 font-medium">
                    {scheme.maxBenefitSummary}
                  </div>

                  <div className="mt-2 space-y-1">
                    {scheme.matchReasons.slice(0, 2).map((reason, i) => (
                      <div key={i} className="text-[10px] text-slate-400 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-500">Official Portal</span>
                    <a
                      href={scheme.officialSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <span>Apply & Guidelines</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
