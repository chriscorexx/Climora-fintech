import React, { useState } from 'react';
import {
  MSMEProfile,
  RiskAssessment,
  ClimateIndicators,
  CashflowScenario,
} from '../../types';
import { MetricCard } from '../common/MetricCard';
import { RiskGauge } from '../common/RiskGauge';
import { RiskBadge } from '../common/RiskBadge';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { simulateCashflowStress, ScenarioParams } from '../../core/scenarioSimulator';
import {
  ShieldAlert,
  TrendingDown,
  Activity,
  AlertTriangle,
  Droplets,
  Flame,
  CloudRain,
  Building,
  DollarSign,
  Search,
  CheckCircle2,
  Sliders,
  FileText,
  ArrowRight,
} from 'lucide-react';

interface LenderDashboardProps {
  profiles: MSMEProfile[];
  activeProfile: MSMEProfile;
  assessment: RiskAssessment;
  climate: ClimateIndicators;
  onSelectProfile: (profile: MSMEProfile) => void;
  onOpenReportModal: () => void;
}

export const LenderDashboard: React.FC<LenderDashboardProps> = ({
  profiles,
  activeProfile,
  assessment,
  climate,
  onSelectProfile,
  onOpenReportModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'low' | 'moderate' | 'high' | 'severe'>('all');

  // Simulator Parameters State
  const [simParams, setSimParams] = useState<ScenarioParams>({
    hazardType: 'flash_flood',
    durationDays: 7,
    intensityPct: 65,
    facilityInundation: (activeProfile.operations?.plinthHeightMeters ?? 0.3) < 0.5,
    powerGridOutageDays: 3,
  });

  // Calculate live cashflow stress simulation
  const stressScenario: CashflowScenario = simulateCashflowStress(activeProfile, simParams);

  // Portfolio metrics
  const totalExposureInr = profiles.reduce(
    (sum, p) => sum + (p.financials?.requestedLoanAmount || 2000000),
    0
  );
  const highRiskCount = profiles.filter((p) => {
    // Basic heuristic for portfolio count
    return (p.operations?.plinthHeightMeters ?? 0.3) < 0.3 || ((p.financials?.monthlyOperatingExpenses ?? 1) / (p.financials?.monthlyRevenue || 1)) > 0.85;
  }).length;

  // Filtered pipeline table
  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.industry.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Portfolio Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Portfolio MSME Pipeline"
          value={profiles.length}
          subtitle="Active SME loan underwriting applications"
          icon={<Building className="w-4 h-4" />}
        />
        <MetricCard
          label="Underwriting Volume"
          value={`₹${(totalExposureInr / 10000000).toFixed(2)} Cr`}
          subtitle="Total requested facility exposure"
          icon={<DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
        />
        <MetricCard
          label="Active Enterprise Risk"
          value={`${assessment.overallScore}/100`}
          subtitle={`${activeProfile.name} (${assessment.riskCategory.toUpperCase()})`}
          change={{
            value: assessment.riskCategory === 'low' ? '-25 bps Green Disc.' : '+50 bps Climate Prem.',
            isPositive: assessment.riskCategory === 'low',
          }}
          icon={<ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
        />
        <MetricCard
          label="Severe Climate Exposure"
          value={highRiskCount}
          subtitle="MSMEs requiring mandatory resilience covenants"
          variant={highRiskCount > 0 ? 'alert' : 'default'}
          icon={<AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
        />
      </div>

      {/* Main Grid: Left Underwriting Inspector, Right Scenario Simulator & Memo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Risk Score Breakdown & Pipeline */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Enterprise Risk Deep-Dive Card */}
          <div className="rounded-2xl bg-fin-card border border-fin-border p-6 shadow-fin-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-fin-border">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-fin-text tracking-tight">{activeProfile.name}</h2>
                  <RiskBadge category={assessment.riskCategory} score={assessment.overallScore} />
                </div>
                <p className="text-xs text-fin-muted mt-0.5">
                  {activeProfile.industry.replace('_', ' ')} • {activeProfile.location.address || `${activeProfile.location.city}, ${activeProfile.location.state}`}
                </p>
              </div>
              <ProvenanceBadge
                isLive={assessment.provenance.isLive}
                provider={assessment.provenance.provider}
                retrievedAt={climate.provenance.retrievedAt}
              />
            </div>

            {/* Real-Time Live Environmental Telemetry Banner */}
            <div className="mt-4 p-3 rounded-xl bg-fin-inset/90 border border-emerald-500/25 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">
                  Live Telemetry ({climate.location.resolvedAddress})
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-fin-secondary tabular-nums">
                <span>🌡️ {climate.currentConditions.temperatureC}°C</span>
                <span>💧 {climate.currentConditions.relativeHumidityPct}% Hum.</span>
                <span>💨 {climate.currentConditions.windSpeedKmh} km/h</span>
                <span>🌧️ Peak 7d: {climate.extremes.maxDailyPrecipitationMm}mm</span>
                <span>🌊 River Flow: {climate.forecast7Days[0]?.riverDischargeM3s ? `${climate.forecast7Days[0].riverDischargeM3s} m³/s` : 'Monitored'}</span>
              </div>
            </div>

            {/* Gauge & Key Drivers */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center py-6 border-b border-fin-border">
              <div className="sm:col-span-5 flex justify-center">
                <RiskGauge score={assessment.overallScore} category={assessment.riskCategory} size={190} />
              </div>
              <div className="sm:col-span-7 space-y-3">
                <div className="text-xs font-mono uppercase tracking-wider text-fin-muted">
                  Key Climate Risk Explanations
                </div>
                {assessment.explainabilitySummary.map((text, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-fin-text">
                    <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">•</span>
                    <span>{text}</span>
                  </div>
                ))}
                <div className="p-3 rounded-lg bg-fin-inset/80 border border-fin-border text-[11px] text-fin-muted">
                  <span className="text-fin-secondary font-semibold">Underwriting Action: </span>
                  <span className="capitalize text-emerald-700 dark:text-emerald-300 font-medium">
                    {assessment.loanDecisionSupport.recommendedAction.replace(/_/g, ' ')}
                  </span>
                  {' '}• Max Safe Facility: ₹{(assessment.loanDecisionSupport.maxSafeLoanAmountInr / 100000).toFixed(1)} Lakhs
                </div>
              </div>
            </div>

            {/* 5-Dimension Risk Breakdown Cards */}
            <div className="pt-5 space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider text-fin-muted mb-2">
                5-Dimension Multi-Hazard Scoring (Transparent Weights)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Flood Exposure */}
                <div className="p-3.5 rounded-xl bg-fin-inset/60 border border-fin-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <span className="text-xs font-semibold text-fin-text">Flood Exposure</span>
                    </div>
                    <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold tabular-nums">
                      {assessment.dimensionScores.floodExposure.score}/100
                    </span>
                  </div>
                  <div className="text-[10px] text-fin-muted mt-1">
                    Weight: {(assessment.dimensionScores.floodExposure.effectiveWeight * 100).toFixed(0)}% (River + Plinth)
                  </div>
                  <div className="text-[11px] text-fin-secondary mt-1 line-clamp-2">
                    {assessment.dimensionScores.floodExposure.contributingFactors[0]}
                  </div>
                </div>

                {/* Heavy Rainfall */}
                <div className="p-3.5 rounded-xl bg-fin-inset/60 border border-fin-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CloudRain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-semibold text-fin-text">Heavy Rainfall</span>
                    </div>
                    <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold tabular-nums">
                      {assessment.dimensionScores.heavyRainfall.score}/100
                    </span>
                  </div>
                  <div className="text-[10px] text-fin-muted mt-1">
                    Weight: {(assessment.dimensionScores.heavyRainfall.effectiveWeight * 100).toFixed(0)}% (7-Day Forecast)
                  </div>
                  <div className="text-[11px] text-fin-secondary mt-1 line-clamp-2">
                    {assessment.dimensionScores.heavyRainfall.contributingFactors[0]}
                  </div>
                </div>

                {/* Extreme Heat */}
                <div className="p-3.5 rounded-xl bg-fin-inset/60 border border-fin-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-semibold text-fin-text">Extreme Heat</span>
                    </div>
                    <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-bold tabular-nums">
                      {assessment.dimensionScores.extremeHeat.score}/100
                    </span>
                  </div>
                  <div className="text-[10px] text-fin-muted mt-1">
                    Weight: {(assessment.dimensionScores.extremeHeat.effectiveWeight * 100).toFixed(0)}% (Hot Days + Cooling)
                  </div>
                  <div className="text-[11px] text-fin-secondary mt-1 line-clamp-2">
                    {assessment.dimensionScores.extremeHeat.contributingFactors[0]}
                  </div>
                </div>

                {/* Operational Vulnerability */}
                <div className="p-3.5 rounded-xl bg-fin-inset/60 border border-fin-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-semibold text-fin-text">Vulnerability</span>
                    </div>
                    <span className="text-xs font-mono text-purple-600 dark:text-purple-400 font-bold tabular-nums">
                      {assessment.dimensionScores.businessVulnerability.score}/100
                    </span>
                  </div>
                  <div className="text-[10px] text-fin-muted mt-1">
                    Weight: {(assessment.dimensionScores.businessVulnerability.effectiveWeight * 100).toFixed(0)}% (Grid & Water)
                  </div>
                  <div className="text-[11px] text-fin-secondary mt-1 line-clamp-2">
                    {assessment.dimensionScores.businessVulnerability.contributingFactors[0]}
                  </div>
                </div>
              </div>

              {/* Financial Resilience (Span 2) */}
              <div className="p-3.5 rounded-xl bg-fin-inset/60 border border-fin-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-semibold text-fin-text">Financial Resilience (Inverted Risk)</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                    {assessment.dimensionScores.financialResilience.score}/100
                  </span>
                </div>
                <div className="text-[11px] text-fin-secondary mt-1">
                  {assessment.dimensionScores.financialResilience.contributingFactors[0]} •{' '}
                  {assessment.dimensionScores.financialResilience.contributingFactors[1]}
                </div>
              </div>
            </div>
          </div>

          {/* Underwriting Loan Pipeline Table */}
          <div className="rounded-2xl bg-fin-card border border-fin-border p-5 shadow-fin-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-fin-text tracking-tight">MSME Underwriting Pipeline</h3>
                <p className="text-xs text-fin-muted">Select an enterprise to inspect climate risk details</p>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-fin-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search enterprise, city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg bg-fin-inset border border-fin-border text-xs text-fin-text placeholder-fin-muted focus:outline-none focus:border-emerald-500 w-full sm:w-56"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-fin-border text-[11px] font-mono text-fin-muted uppercase">
                    <th className="py-2.5 px-3">Enterprise</th>
                    <th className="py-2.5 px-3">Industry</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3 text-right">Loan Req.</th>
                    <th className="py-2.5 px-3 text-center">Climate Risk</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fin-border/60">
                  {filteredProfiles.map((p) => {
                    const isSelected = p.id === activeProfile.id;
                    const dscr = (p.financials.monthlyRevenue - p.financials.monthlyOperatingExpenses) / (p.financials.existingMonthlyDebtObligations || 1);
                    return (
                      <tr
                        key={p.id}
                        onClick={() => onSelectProfile(p)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-emerald-500/10' : 'hover:bg-fin-inset/40'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="font-semibold text-fin-text">{p.name}</div>
                          <div className="text-[10px] text-fin-muted font-mono">DSCR: {dscr.toFixed(2)}x</div>
                        </td>
                        <td className="py-3 px-3 text-fin-secondary capitalize">{p.industry.replace('_', ' ')}</td>
                        <td className="py-3 px-3 text-fin-muted">{p.location.city}</td>
                        <td className="py-3 px-3 text-right font-mono text-fin-text tabular-nums">
                          ₹{((p.financials.requestedLoanAmount || 2500000) / 100000).toFixed(1)}L
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isSelected ? (
                            <RiskBadge category={assessment.riskCategory} score={assessment.overallScore} size="sm" />
                          ) : (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-fin-inset text-fin-secondary">
                              View Score
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectProfile(p);
                            }}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                              isSelected
                                ? 'bg-emerald-500 text-slate-950 font-semibold'
                                : 'bg-fin-inset text-fin-secondary hover:bg-fin-sunken'
                            }`}
                          >
                            {isSelected ? 'Inspecting' : 'Select'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Climate-to-Cashflow Simulator & Credit Memo */}
        <div className="lg:col-span-5 space-y-6">
          {/* Interactive Cashflow Stress Simulator */}
          <div className="rounded-2xl bg-fin-card border border-fin-border p-6 shadow-fin-card">
            <div className="flex items-center justify-between pb-4 border-b border-fin-border">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-fin-text tracking-tight">Climate-to-Cashflow Stress Test</h3>
              </div>
              <span className="text-[10px] font-mono uppercase bg-fin-inset text-fin-secondary px-2 py-0.5 rounded border border-fin-border">
                DSCR Simulator
              </span>
            </div>

            {/* Simulator Controls */}
            <div className="space-y-4 pt-4">
              {/* Hazard Type Selector */}
              <div>
                <label className="text-xs font-medium text-fin-secondary block mb-1.5">Simulate Climate Hazard Shock</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setSimParams({ ...simParams, hazardType: 'flash_flood' })}
                    className={`py-1.5 px-2 rounded-lg border text-left flex items-center gap-1.5 transition-colors ${
                      simParams.hazardType === 'flash_flood'
                        ? 'border-cyan-500 bg-cyan-500/10 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 font-semibold'
                        : 'border-fin-border bg-fin-inset text-fin-muted'
                    }`}
                  >
                    <Droplets className="w-3.5 h-3.5" />
                    <span>Flash Flood</span>
                  </button>
                  <button
                    onClick={() => setSimParams({ ...simParams, hazardType: 'extreme_heatwave' })}
                    className={`py-1.5 px-2 rounded-lg border text-left flex items-center gap-1.5 transition-colors ${
                      simParams.hazardType === 'extreme_heatwave'
                        ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold'
                        : 'border-fin-border bg-fin-inset text-fin-muted'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Extreme Heat</span>
                  </button>
                  <button
                    onClick={() => setSimParams({ ...simParams, hazardType: 'severe_storm_cyclone' })}
                    className={`py-1.5 px-2 rounded-lg border text-left flex items-center gap-1.5 transition-colors ${
                      simParams.hazardType === 'severe_storm_cyclone'
                        ? 'border-blue-500 bg-blue-500/10 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'border-fin-border bg-fin-inset text-fin-muted'
                    }`}
                  >
                    <CloudRain className="w-3.5 h-3.5" />
                    <span>Cyclone Storm</span>
                  </button>
                  <button
                    onClick={() => setSimParams({ ...simParams, hazardType: 'water_shortage' })}
                    className={`py-1.5 px-2 rounded-lg border text-left flex items-center gap-1.5 transition-colors ${
                      simParams.hazardType === 'water_shortage'
                        ? 'border-purple-500 bg-purple-500/10 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold'
                        : 'border-fin-border bg-fin-inset text-fin-muted'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Water Crisis</span>
                  </button>
                </div>
              </div>

              {/* Slider: Disruption Duration */}
              <div>
                <div className="flex justify-between text-xs text-fin-secondary mb-1">
                  <span>Interruption Duration</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{simParams.durationDays} days</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="21"
                  value={simParams.durationDays}
                  onChange={(e) => setSimParams({ ...simParams, durationDays: Number(e.target.value) })}
                  className="w-full h-1.5 bg-fin-inset rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Slider: Hazard Intensity */}
              <div>
                <div className="flex justify-between text-xs text-fin-secondary mb-1">
                  <span>Disruption Severity</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{simParams.intensityPct}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={simParams.intensityPct}
                  onChange={(e) => setSimParams({ ...simParams, intensityPct: Number(e.target.value) })}
                  className="w-full h-1.5 bg-fin-inset rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              {/* Checkboxes: Compounding Vulnerabilities */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-fin-inset border border-fin-border cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simParams.facilityInundation}
                    onChange={(e) => setSimParams({ ...simParams, facilityInundation: e.target.checked })}
                    className="accent-emerald-500"
                  />
                  <span className="text-fin-secondary">Premises Flooded</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-fin-inset border border-fin-border cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simParams.powerGridOutageDays > 0}
                    onChange={(e) => setSimParams({ ...simParams, powerGridOutageDays: e.target.checked ? 4 : 0 })}
                    className="accent-emerald-500"
                  />
                  <span className="text-fin-secondary">Grid Brownout</span>
                </label>
              </div>
            </div>

            {/* Stressed Cashflow Output Display */}
            <div className="mt-5 p-4 rounded-xl bg-fin-inset/90 border border-fin-border space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-fin-muted">DSCR Stress Comparison:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    stressScenario.insolvencyRisk === 'critical'
                      ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40'
                      : stressScenario.insolvencyRisk === 'strained'
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                  }`}
                >
                  {stressScenario.insolvencyRisk} Solvency
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-950 border border-fin-border">
                  <div className="text-[10px] text-fin-muted uppercase font-mono">Baseline DSCR</div>
                  <div className="font-mono text-lg font-bold text-fin-text tabular-nums">
                    {stressScenario.baselineDSCR.toFixed(2)}x
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Normal Operations</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-950 border border-fin-border">
                  <div className="text-[10px] text-fin-muted uppercase font-mono">Stressed DSCR</div>
                  <div
                    className={`font-mono text-lg font-bold tabular-nums ${
                      stressScenario.stressedDSCR < 1.0 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {stressScenario.stressedDSCR.toFixed(2)}x
                  </div>
                  <div className="text-[10px] text-fin-muted">Post-Disruption</div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs pt-1">
                <div className="flex justify-between text-fin-secondary">
                  <span className="text-fin-muted">Estimated Revenue Deficit:</span>
                  <span className="font-mono font-medium text-rose-600 dark:text-rose-400">
                    -₹{(stressScenario.netCashflowDeficitInr / 100000).toFixed(2)} Lakhs
                  </span>
                </div>
                <div className="flex justify-between text-fin-secondary">
                  <span className="text-fin-muted">Emergency Repair Outflow:</span>
                  <span className="font-mono font-medium text-amber-700 dark:text-amber-300">
                    ₹{(stressScenario.emergencyRepairCostInr / 100000).toFixed(2)} Lakhs
                  </span>
                </div>
                <div className="flex justify-between text-fin-secondary">
                  <span className="text-fin-muted">Depleted Cash Runway:</span>
                  <span className="font-mono font-medium text-fin-text">
                    {stressScenario.stressedCashRunwayMonths.toFixed(1)} months remaining
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Underwriting Decision Memo Summary */}
          <div className="rounded-2xl bg-fin-card border border-fin-border p-6 shadow-fin-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-fin-border">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-fin-text tracking-tight">Credit Underwriting Terms</h3>
              </div>
              <button
                onClick={onOpenReportModal}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 font-medium"
              >
                <span>Full Memo</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-fin-inset border border-fin-border">
                <span className="text-fin-muted">Pricing Adjustment:</span>
                <span className="font-mono font-bold text-fin-text">
                  {assessment.loanDecisionSupport.suggestedInterestAdjustmentBps > 0
                    ? `+${assessment.loanDecisionSupport.suggestedInterestAdjustmentBps} bps Risk Premium`
                    : `${assessment.loanDecisionSupport.suggestedInterestAdjustmentBps} bps Green Concession`}
                </span>
              </div>

              <div>
                <span className="text-fin-muted font-medium block mb-1.5">Mandatory Climate Covenants:</span>
                <div className="space-y-1.5">
                  {assessment.loanDecisionSupport.suggestedClimateCovenants.map((cov, i) => (
                    <div key={i} className="flex items-start gap-2 text-fin-secondary text-[11px] leading-relaxed">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{cov}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={onOpenReportModal}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 mt-2 shadow-sm"
              >
                <FileText className="w-4 h-4" />
                <span>Generate Executive Credit Underwriting Memo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
