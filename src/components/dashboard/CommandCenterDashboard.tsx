import React, { useMemo, useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  MSMEProfile,
  RiskAssessment,
  ClimateIndicators,
  GovernmentScheme,
  CashflowScenario,
} from '../../types';
import { MetricCard } from '../common/MetricCard';
import { RiskGauge } from '../common/RiskGauge';
import { RiskBadge } from '../common/RiskBadge';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { useTheme } from '../common/ThemeProvider';
import { simulateCashflowStress, ScenarioParams } from '../../core/scenarioSimulator';
import {
  AdaptationProgress,
  ChartPalette,
  ForecastPoint,
  PortfolioRow,
  buildForecastSeries,
  buildPortfolioRows,
  computeAdaptationProgress,
  formatInrCrore,
  formatInrLakhs,
  getPeakExposure,
  resolveChartPalette,
  summarizeDimensions,
} from './commandCenterSelectors';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  Circle,
  CloudRain,
  Droplets,
  Edit3,
  FileText,
  Flame,
  Gauge,
  Printer,
  RefreshCw,
  Search,
  ShieldAlert,
  Sliders,
  Thermometer,
  TrendingDown,
  Wallet,
  Waves,
  Wind,
} from 'lucide-react';

interface CommandCenterDashboardProps {
  profiles: MSMEProfile[];
  activeProfile: MSMEProfile;
  assessment: RiskAssessment;
  climate: ClimateIndicators;
  matchedSchemes: GovernmentScheme[];
  completedActionIds: string[];
  onSelectProfile: (profile: MSMEProfile) => void;
  onOpenReportModal: () => void;
  onOpenEditModal: () => void;
  onRefreshClimate: () => void;
  isRefreshing?: boolean;
}

const HAZARD_OPTIONS: Array<{
  id: ScenarioParams['hazardType'];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: string;
}> = [
  {
    id: 'flash_flood',
    label: 'Flash Flood',
    icon: Droplets,
    active: 'border-neutral-400 bg-neutral-500/10 dark:bg-neutral-400/10 text-neutral-700 dark:text-neutral-300',
  },
  {
    id: 'extreme_heatwave',
    label: 'Extreme Heat',
    icon: Flame,
    active: 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300',
  },
  {
    id: 'severe_storm_cyclone',
    label: 'Cyclone Storm',
    icon: Wind,
    active: 'border-orange-500 bg-orange-500/10 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300',
  },
  {
    id: 'water_shortage',
    label: 'Water Crisis',
    icon: Waves,
    active: 'border-neutral-400 bg-neutral-500/10 dark:bg-neutral-400/10 text-neutral-700 dark:text-neutral-300',
  },
];

const DIMENSION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  floodExposure: Droplets,
  heavyRainfall: CloudRain,
  extremeHeat: Thermometer,
  businessVulnerability: Building2,
  financialResilience: Wallet,
};

const ACCENT_CLASSES: Record<string, string> = {
  neutral: 'text-neutral-600 dark:text-neutral-400',
  amber: 'text-amber-700 dark:text-amber-300',
  emerald: 'text-emerald-600 dark:text-emerald-400',
};

const SOLVENCY_CLASSES: Record<CashflowScenario['insolvencyRisk'], string> = {
  critical: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40',
  strained: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40',
  resilient: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40',
};

export const CommandCenterDashboard: React.FC<CommandCenterDashboardProps> = ({
  profiles,
  activeProfile,
  assessment,
  climate,
  matchedSchemes,
  completedActionIds,
  onSelectProfile,
  onOpenReportModal,
  onOpenEditModal,
  onRefreshClimate,
  isRefreshing = false,
}) => {
  const { resolvedTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [simParams, setSimParams] = useState<ScenarioParams>({
    hazardType: 'flash_flood',
    durationDays: 7,
    intensityPct: 65,
    facilityInundation: (activeProfile.operations?.plinthHeightMeters ?? 0.3) < 0.5,
    powerGridOutageDays: 3,
  });

  const dimensions = useMemo(() => summarizeDimensions(assessment), [assessment]);
  const peakExposure = useMemo(() => getPeakExposure(assessment), [assessment]);
  const forecast = useMemo<ForecastPoint[]>(() => buildForecastSeries(climate, 7), [climate]);
  const adaptation = useMemo<AdaptationProgress>(
    () => computeAdaptationProgress(assessment.mitigationRecommendations, completedActionIds),
    [assessment.mitigationRecommendations, completedActionIds]
  );
  const portfolio = useMemo<PortfolioRow[]>(() => buildPortfolioRows(profiles), [profiles]);
  const eligibleSchemes = useMemo(() => matchedSchemes.filter((s) => s.isEligible), [matchedSchemes]);
  const palette = useMemo<ChartPalette>(() => resolveChartPalette(resolvedTheme), [resolvedTheme]);
  const stressScenario: CashflowScenario = simulateCashflowStress(activeProfile, simParams);

  const totalExposureInr = portfolio.reduce((sum, row) => sum + row.exposureInr, 0);
  const covenantCount = portfolio.filter((row) => row.requiresCovenants).length;

  const filteredPortfolio = portfolio.filter((row) => {
    const p = row.profile;
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.location.city.toLowerCase().includes(term) ||
      p.industry.toLowerCase().includes(term)
    );
  });

  const liquidityMonths =
    (activeProfile.financials?.availableCashReserves ?? 0) /
    (activeProfile.financials?.monthlyOperatingExpenses || 1);

  return (
    <div className="space-y-6">
      {/* Hero: Enterprise Identity, Overall Risk Gauge & Provenance */}
      <div className="rounded-2xl bg-fin-card border border-fin-border p-6 shadow-fin-card">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-5 border-b border-fin-border">
          <div className="flex items-center gap-5">
            <RiskGauge score={assessment.overallScore} category={assessment.riskCategory} size={168} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold text-fin-text tracking-tight">{activeProfile.name}</h1>
                <RiskBadge category={assessment.riskCategory} score={assessment.overallScore} size="lg" />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-fin-muted mt-1.5">
                <span className="uppercase">{activeProfile.industry.replace(/_/g, ' ')}</span>
                <span>•</span>
                <span className="uppercase">{activeProfile.businessSize} enterprise</span>
                <span>•</span>
                <span>
                  {activeProfile.location.address ||
                    `${activeProfile.location.city}, ${activeProfile.location.state}`}
                </span>
                {activeProfile.udyamNumber && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                      {activeProfile.udyamNumber}
                    </span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <ProvenanceBadge
                  isLive={assessment.provenance.isLive}
                  provider={assessment.provenance.provider}
                  retrievedAt={climate.provenance.retrievedAt}
                />
                <span className="text-[10px] font-mono uppercase px-2 py-1 rounded-md bg-fin-inset border border-fin-border text-fin-secondary">
                  {climate.provenance.confidenceLevel} confidence
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onRefreshClimate}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-fin-inset border border-fin-border text-xs font-medium text-fin-text hover:bg-fin-hover transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Climate</span>
            </button>
            <button
              onClick={onOpenEditModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-fin-inset border border-fin-border text-xs font-medium text-fin-text hover:bg-fin-hover transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Export Credit Memo</span>
            </button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 pt-5">
          <MetricCard
            label="Overall Climate Risk"
            value={`${assessment.overallScore}/100`}
            subtitle={`${assessment.riskCategory} risk classification`}
            icon={<Gauge className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          />
          <MetricCard
            label="Financial Resilience"
            value={`${dimensions.find((d) => d.key === 'financialResilience')?.score ?? 0}/100`}
            subtitle={`Liquidity runway ${liquidityMonths.toFixed(1)} months`}
            icon={<TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          />
          <MetricCard
            label="Peak Hazard Exposure"
            value={`${peakExposure.score}/100`}
            subtitle={`Dominant hazard: ${peakExposure.label}`}
            variant={peakExposure.score >= 60 ? 'alert' : 'default'}
            icon={<ShieldAlert className="w-4 h-4 text-amber-700 dark:text-amber-300" />}
          />
          <MetricCard
            label="Climate-Adjusted Rating"
            value={assessment.riskCategory.replace(/_/g, ' ')}
            subtitle={`${formatInrLakhs(assessment.loanDecisionSupport.maxSafeLoanAmountInr)} max safe facility`}
            icon={<FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Telemetry, Forecast, Dimensions */}
        <div className="xl:col-span-7 space-y-6">
          {/* Live Climate Telemetry */}
          <div className="rounded-2xl bg-fin-card border border-fin-border p-6 shadow-fin-card">
            <div className="flex items-center justify-between pb-4 border-b border-fin-border">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-fin-text tracking-tight">Live Climate Telemetry</h2>
              </div>
              <span className="text-[10px] font-mono uppercase text-fin-muted">
                {climate.location.resolvedAddress}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-fin-inset/60 border border-fin-border">
                <div className="text-[10px] font-mono uppercase text-fin-muted">Temperature</div>
                <div className="font-mono text-lg font-bold text-fin-text tabular-nums">
                  {climate.currentConditions.temperatureC}°C
                </div>
                <div className="text-[10px] text-fin-muted">{climate.currentConditions.weatherDescription}</div>
              </div>
              <div className="p-3 rounded-xl bg-fin-inset/60 border border-fin-border">
                <div className="text-[10px] font-mono uppercase text-fin-muted">Humidity</div>
                <div className="font-mono text-lg font-bold text-fin-text tabular-nums">
                  {climate.currentConditions.relativeHumidityPct}%
                </div>
                <div className="text-[10px] text-fin-muted">Relative humidity</div>
              </div>
              <div className="p-3 rounded-xl bg-fin-inset/60 border border-fin-border">
                <div className="text-[10px] font-mono uppercase text-fin-muted">Wind Speed</div>
                <div className="font-mono text-lg font-bold text-fin-text tabular-nums">
                  {climate.currentConditions.windSpeedKmh} km/h
                </div>
                <div className="text-[10px] text-fin-muted">10m gust proxy</div>
              </div>
              <div className="p-3 rounded-xl bg-fin-inset/60 border border-fin-border">
                <div className="text-[10px] font-mono uppercase text-fin-muted">River Anomaly</div>
                <div className="font-mono text-lg font-bold text-fin-text tabular-nums">
                  {climate.extremes.riverDischargeAnomalyPct}%
                </div>
                <div className="text-[10px] text-fin-muted">Above normal discharge</div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-mono text-fin-secondary tabular-nums">
              <span>Hot streak: {climate.extremes.consecutiveHotDays}d</span>
              <span>•</span>
              <span>Peak rain: {climate.extremes.maxDailyPrecipitationMm}mm</span>
              <span>•</span>
              <span>Rain days: {climate.extremes.precipitationDaysCount}</span>
              <span>•</span>
              <span>Flood baseline: {climate.districtBaseline.floodExposureScore}</span>
            </div>
          </div>

          {/* 7-Day Forecast Chart */}
          <div className="rounded-2xl bg-fin-card border border-fin-border p-6 shadow-fin-card">
            <div className="flex items-center justify-between pb-4 border-b border-fin-border">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-fin-text tracking-tight">7-Day Climate Forecast</h2>
              </div>
              <span className="text-[10px] font-mono text-fin-muted">Open-Meteo live feed</span>
            </div>

            <div className="h-64 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecast} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke={palette.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke={palette.axis}
                    tick={{ fill: palette.axis, fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="temp"
                    stroke={palette.axis}
                    tick={{ fill: palette.axis, fontSize: 11 }}
                    tickLine={false}
                    unit="°"
                  />
                  <YAxis
                    yAxisId="rain"
                    orientation="right"
                    stroke={palette.axis}
                    tick={{ fill: palette.axis, fontSize: 11 }}
                    tickLine={false}
                    unit="mm"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: palette.tooltipBg,
                      border: `1px solid ${palette.tooltipBorder}`,
                      borderRadius: 12,
                      fontSize: 12,
                      color: palette.tempLow,
                    }}
                    labelStyle={{ color: palette.axis }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: palette.axis }} />
                  <Bar
                    yAxisId="rain"
                    dataKey="precipitationSumMm"
                    name="Precipitation (mm)"
                    fill={palette.rain}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={26}
                  />
                  <Line
                    yAxisId="temp"
                    type="monotone"
                    dataKey="maxTempC"
                    name="Max temp (°C)"
                    stroke={palette.tempHigh}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    yAxisId="temp"
                    type="monotone"
                    dataKey="minTempC"
                    name="Min temp (°C)"
                    stroke={palette.tempLow}
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    dot={{ r: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-7 gap-2 pt-4">
              {forecast.map((day) => (
                <div
                  key={day.isoDate}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-between min-w-[64px] ${
                    day.hazard === 'rain'
                      ? 'border-neutral-400/40 bg-neutral-500/10 dark:bg-neutral-400/10'
                      : day.hazard === 'heat'
                      ? 'border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15'
                      : 'border-fin-border bg-fin-inset/60'
                  }`}
                >
                  <span className="text-[10px] font-semibold text-fin-muted uppercase">{day.day}</span>
                  <div className="my-1">
                    {day.hazard === 'rain' ? (
                      <CloudRain className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                    ) : day.hazard === 'heat' ? (
                      <Flame className="w-4 h-4 text-amber-700 dark:text-amber-300" />
                    ) : (
                      <Droplets className="w-4 h-4 text-fin-muted" />
                    )}
                  </div>
                  <div className="font-mono text-xs font-bold text-fin-text tabular-nums">{day.maxTempC}°</div>
                  <div className="text-[10px] font-mono text-fin-muted tabular-nums">
                    {day.precipitationSumMm > 0 ? `${day.precipitationSumMm}mm` : `${day.minTempC}°`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5-Dimension Risk Breakdown */}
          <div className="rounded-2xl bg-fin-card border border-fin-border p-6 shadow-fin-card">
            <div className="flex items-center justify-between pb-4 border-b border-fin-border">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-fin-text tracking-tight">5-Dimension Risk Breakdown</h2>
              </div>
              <span className="text-[10px] font-mono uppercase text-fin-muted">Transparent weights</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              {dimensions.map((dimension) => {
                const Icon = DIMENSION_ICONS[dimension.key];
                return (
                  <div key={dimension.key} className="p-3.5 rounded-xl bg-fin-inset/60 border border-fin-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className={`w-4 h-4 ${ACCENT_CLASSES[dimension.accent]}`} />}
                        <span className="text-xs font-semibold text-fin-text">{dimension.label}</span>
                      </div>
                      <span
                        className={`text-xs font-mono font-bold tabular-nums ${ACCENT_CLASSES[dimension.accent]}`}
                      >
                        {dimension.score}/100
                      </span>
                    </div>
                    <div className="text-[10px] text-fin-muted mt-1">
                      Weight {(dimension.effectiveWeight * 100).toFixed(0)}% • {dimension.hint}
                    </div>
                    <div className="text-[11px] text-fin-secondary mt-1 line-clamp-2">{dimension.primaryFactor}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Simulator, Roadmap, Schemes */}
        <div className="xl:col-span-5 space-y-6">
          {/* Climate-to-Cashflow Stress Simulator */}
          <div className="rounded-2xl bg-fin-card border border-fin-border p-6 shadow-fin-card">
            <div className="flex items-center justify-between pb-4 border-b border-fin-border">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-fin-text tracking-tight">Climate-to-Cashflow Stress Test</h2>
              </div>
              <span className="text-[10px] font-mono uppercase bg-fin-inset text-fin-secondary px-2 py-0.5 rounded border border-fin-border">
                DSCR
              </span>
            </div>

            <div className="space-y-4 pt-4">
              <div>
                <label className="text-xs font-medium text-fin-secondary block mb-1.5">Simulate Climate Hazard Shock</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {HAZARD_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isActive = simParams.hazardType === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => setSimParams({ ...simParams, hazardType: option.id })}
                        className={`py-1.5 px-2 rounded-lg border text-left flex items-center gap-1.5 transition-colors ${
                          isActive ? `${option.active} font-semibold` : 'border-fin-border bg-fin-inset text-fin-muted'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-fin-secondary mb-1">
                  <span>Interruption Duration</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {simParams.durationDays} days
                  </span>
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

              <div>
                <div className="flex justify-between text-xs text-fin-secondary mb-1">
                  <span>Disruption Severity</span>
                  <span className="font-mono text-amber-700 dark:text-amber-300 font-bold">
                    {simParams.intensityPct}%
                  </span>
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
                    onChange={(e) =>
                      setSimParams({ ...simParams, powerGridOutageDays: e.target.checked ? 4 : 0 })
                    }
                    className="accent-emerald-500"
                  />
                  <span className="text-fin-secondary">Grid Brownout</span>
                </label>
              </div>
            </div>

            <div className="mt-5 p-4 rounded-xl bg-fin-inset/90 border border-fin-border space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-fin-muted">Scenario: {stressScenario.hazardLabel}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    SOLVENCY_CLASSES[stressScenario.insolvencyRisk]
                  }`}
                >
                  {stressScenario.insolvencyRisk} Solvency
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-2.5 rounded-lg bg-fin-card border border-fin-border">
                  <div className="text-[10px] text-fin-muted uppercase font-mono">Baseline DSCR</div>
                  <div className="font-mono text-lg font-bold text-fin-text tabular-nums">
                    {stressScenario.baselineDSCR.toFixed(2)}x
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Normal Operations</div>
                </div>
                <div className="p-2.5 rounded-lg bg-fin-card border border-fin-border">
                  <div className="text-[10px] text-fin-muted uppercase font-mono">Stressed DSCR</div>
                  <div
                    className={`font-mono text-lg font-bold tabular-nums ${
                      stressScenario.stressedDSCR < 1.0 ? 'text-rose-700 dark:text-rose-300' : 'text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {stressScenario.stressedDSCR.toFixed(2)}x
                  </div>
                  <div className="text-[10px] text-fin-muted">Post-Disruption</div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs pt-1">
                <div className="flex justify-between text-fin-secondary">
                  <span className="text-fin-muted">Revenue Deficit:</span>
                  <span className="font-mono font-medium text-rose-700 dark:text-rose-300">
                    -{formatInrLakhs(stressScenario.netCashflowDeficitInr)}
                  </span>
                </div>
                <div className="flex justify-between text-fin-secondary">
                  <span className="text-fin-muted">Repair Outflow:</span>
                  <span className="font-mono font-medium text-amber-700 dark:text-amber-300">
                    {formatInrLakhs(stressScenario.emergencyRepairCostInr)}
                  </span>
                </div>
                <div className="flex justify-between text-fin-secondary">
                  <span className="text-fin-muted">Cash Runway:</span>
                  <span className="font-mono font-medium text-fin-text">
                    {stressScenario.stressedCashRunwayMonths.toFixed(1)} months remaining
                  </span>
                </div>
                <div className="flex justify-between text-fin-secondary">
                  <span className="text-fin-muted">Recovery Time:</span>
                  <span className="font-mono font-medium text-fin-text">
                    {stressScenario.recoveryTimeMonths} months
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Adaptation Roadmap Checklist */}
          <div className="rounded-2xl bg-fin-card border border-fin-border p-6 shadow-fin-card">
            <div className="flex items-center justify-between pb-4 border-b border-fin-border">
              <div>
                <h2 className="text-sm font-bold text-fin-text tracking-tight">Adaptation Roadmap</h2>
                <p className="text-xs text-fin-muted">Complete actions to reduce climate hazard loss.</p>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                {adaptation.completed}/{adaptation.total} Done
              </span>
            </div>

            <div className="pt-4">
              <div className="h-1.5 w-full rounded-full bg-fin-inset overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${adaptation.pct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-fin-muted mt-1.5">
                <span>{adaptation.pct}% complete</span>
                <span>{adaptation.riskPointsRemaining} risk pts remaining</span>
              </div>
            </div>

            <div className="space-y-3 pt-4 max-h-[420px] overflow-y-auto pr-1">
              {assessment.mitigationRecommendations.map((mitigation) => {
                const isCompleted = completedActionIds.includes(mitigation.id);
                return (
                  <div
                    key={mitigation.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isCompleted
                        ? 'border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15'
                        : 'border-fin-border bg-fin-inset/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-fin-muted">
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-400/20" />
                        ) : (
                          <Circle className="w-5 h-5 text-fin-muted" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h4
                            className={`text-xs font-bold tracking-tight ${
                              isCompleted ? 'line-through text-fin-muted' : 'text-fin-text'
                            }`}
                          >
                            {mitigation.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                              -{mitigation.riskReductionPts} pts
                            </span>
                            <span className="text-[10px] font-mono text-fin-muted">
                              ₹{(mitigation.estimatedCostInr / 1000).toFixed(0)}k
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-fin-muted mt-1 leading-relaxed">{mitigation.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Matched Government Schemes */}
          <div className="rounded-2xl bg-fin-card border border-fin-border p-6 shadow-fin-card">
            <div className="flex items-center justify-between pb-4 border-b border-fin-border">
              <div>
                <h2 className="text-sm font-bold text-fin-text tracking-tight">Matched Government Schemes</h2>
                <p className="text-xs text-fin-muted">Verified central & state resilience incentives</p>
              </div>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-semibold">
                {eligibleSchemes.length} Eligible
              </span>
            </div>

            <div className="space-y-3 pt-4 max-h-[460px] overflow-y-auto pr-1">
              {matchedSchemes.map((scheme) => (
                <div
                  key={scheme.id}
                  className={`p-4 rounded-xl border transition-all ${
                    scheme.isEligible
                      ? 'border-fin-border bg-fin-inset/80'
                      : 'border-fin-border/40 bg-fin-inset/40 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-fin-text">{scheme.name}</h4>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold shrink-0 ${
                        scheme.isEligible
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-fin-inset text-fin-muted'
                      }`}
                    >
                      {scheme.isEligible ? 'Eligible' : 'Check Scope'}
                    </span>
                  </div>
                  <div className="text-[11px] text-fin-muted mt-1">
                    {scheme.sponsoringAuthority} ({scheme.governmentLevel.toUpperCase()})
                  </div>
                  <div className="mt-2 p-2 rounded-lg bg-fin-inset border border-fin-border/80 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                    {scheme.maxBenefitSummary}
                  </div>
                  <div className="mt-3 pt-2 border-t border-fin-border flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono text-fin-muted">Match {scheme.matchingScore}%</span>
                    <a
                      href={scheme.officialSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                    >
                      <span>Apply</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Underwriting Pipeline */}
      <div className="rounded-2xl bg-fin-card border border-fin-border p-5 shadow-fin-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-fin-text tracking-tight">Underwriting Pipeline</h2>
            <p className="text-xs text-fin-muted">
              {profiles.length} enterprises • {formatInrCrore(totalExposureInr)} exposure • {covenantCount} requiring covenants
            </p>
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
                <th className="py-2.5 px-3 text-center">DSCR</th>
                <th className="py-2.5 px-3 text-center">Covenants</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fin-border/60">
              {filteredPortfolio.map((row) => {
                const isSelected = row.profile.id === activeProfile.id;
                return (
                  <tr
                    key={row.profile.id}
                    onClick={() => onSelectProfile(row.profile)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-emerald-500/10' : 'hover:bg-fin-inset/40'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-semibold text-fin-text">{row.profile.name}</div>
                      <div className="text-[10px] text-fin-muted font-mono">{row.profile.businessSize} enterprise</div>
                    </td>
                    <td className="py-3 px-3 text-fin-secondary capitalize">
                      {row.profile.industry.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-3 text-fin-muted">{row.profile.location.city}</td>
                    <td className="py-3 px-3 text-right font-mono text-fin-text tabular-nums">
                      {formatInrLakhs(row.exposureInr)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-fin-text tabular-nums">
                      {row.dscr.toFixed(2)}x
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.requiresCovenants ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          <AlertTriangle className="w-3 h-3" />
                          Required
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          None
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProfile(row.profile);
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          isSelected
                            ? 'bg-emerald-500 text-neutral-950 font-semibold'
                            : 'bg-fin-inset text-fin-secondary hover:bg-fin-sunken'
                        }`}
                      >
                        {isSelected ? 'Active' : 'Select'}
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
  );
};
