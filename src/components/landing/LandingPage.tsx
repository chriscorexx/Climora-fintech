import React, { useCallback } from 'react';
import {
  Activity,
  ArrowRight,
  BellRing,
  Download,
  FileText,
  MapPinned,
  Monitor,
  Moon,
  Rocket,
  ShieldCheck,
  Sliders,
  Sun,
  Waves,
} from 'lucide-react';
import { useTheme } from '../common/ThemeProvider';
import { THEME_MODES } from '../../core/theme';
import climoraLogo from '../../assets/Climora-logo.jpg';

export const DOWNLOADS_SECTION_ID = 'downloads';
export const GITHUB_RELEASES_URL = 'https://github.com/chriscorexx/Climora-fintech/releases';

export const LANDING_TAGLINE = 'Real-Time Climate Risk & Underwriting for MSMEs';

const MODE_ICONS = { light: Sun, dark: Moon, system: Monitor } as const;
const MODE_LABELS = { light: 'Light', dark: 'Dark', system: 'System' } as const;

const TRUST_ITEMS: string[] = ['Open-Meteo live data', 'IFC FIN-05', '5-Dimension Risk Engine'];

interface LandingFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const LANDING_FEATURES: LandingFeature[] = [
  {
    id: 'risk-scoring',
    title: 'Transparent 5-Dimension Risk Scoring',
    description:
      'Every score is decomposed into flood exposure, extreme heat, rainfall volatility, air quality and enterprise vulnerability, with full weight visibility.',
    icon: Activity,
  },
  {
    id: 'cashflow-stress',
    title: 'Cashflow Stress Simulator',
    description:
      'Apply flash floods, cyclones, heatwaves and grid outages to monthly cashflows and watch baseline versus stressed DSCR, margin and loan capacity move in real time.',
    icon: Sliders,
  },
  {
    id: 'district-baselines',
    title: 'District Hazard Baselines',
    description:
      'Compare an enterprise against district-level hazard and historical climate baselines so decisions are anchored to local conditions, not generic averages.',
    icon: MapPinned,
  },
  {
    id: 'scheme-matching',
    title: 'Matched Government Schemes',
    description:
      'Eligible subsidies and adaptation programmes are matched to each profile with explicit match scores and the reasons behind every match.',
    icon: ShieldCheck,
  },
  {
    id: 'provenance',
    title: 'Live vs Fallback Data Badges',
    description:
      'Provenance badges label every indicator as live or fallback, so lenders can see exactly how fresh each input is before underwriting.',
    icon: BellRing,
  },
  {
    id: 'credit-memo',
    title: 'Credit Memo Export & Print',
    description:
      'Generate print-ready executive credit memos covering risk scores, stress results, covenant suggestions and scheme fits for every case.',
    icon: FileText,
  },
];

interface LandingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const LANDING_STEPS: LandingStep[] = [
  {
    id: 'connect-profile',
    title: 'Connect Enterprise Profile',
    description:
      'Register the MSME with its location, industry, financials and operational resilience data.',
    icon: Rocket,
  },
  {
    id: 'score-live',
    title: 'Live Climate + Risk Scoring',
    description:
      'Pull live Open-Meteo indicators, then compute the 5-dimension climate risk score with visible weights.',
    icon: Waves,
  },
  {
    id: 'underwrite',
    title: 'Underwrite / Adapt',
    description:
      'Stress the cashflow, export the credit memo and act on matched schemes to reduce exposure.',
    icon: ArrowRight,
  },
];

type DownloadIconKind = 'windows' | 'apple' | 'linux';

interface DownloadTarget {
  id: string;
  platform: string;
  fileTypes: string;
  detail: string;
  icon: DownloadIconKind;
}

export const DOWNLOAD_TARGETS: DownloadTarget[] = [
  {
    id: 'windows',
    platform: 'Windows',
    fileTypes: '.exe',
    detail: 'Windows 10 and later, 64-bit desktop build.',
    icon: 'windows',
  },
  {
    id: 'macos',
    platform: 'macOS',
    fileTypes: '.dmg',
    detail: 'macOS 11 and later, Intel and Apple silicon builds.',
    icon: 'apple',
  },
  {
    id: 'linux',
    platform: 'Linux',
    fileTypes: '.AppImage / .deb',
    detail: 'AppImage for any distribution, .deb for Debian and Ubuntu.',
    icon: 'linux',
  },
];

const DownloadIcon: React.FC<{ kind: DownloadIconKind; className?: string }> = ({
  kind,
  className,
}) => {
  const classes = className ?? 'w-5 h-5';
  if (kind === 'windows') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={classes} aria-hidden="true">
        <path d="M3 5.5 10.2 4.6v7.1H3V5.5Zm0 13 7.2.9v-7.2H3v6.3Zm8.4-14.1L21 3v8.7h-9.6V4.4Zm0 15.7L21 21v-8.4h-9.6v7.5Z" />
      </svg>
    );
  }
  if (kind === 'apple') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={classes} aria-hidden="true">
        <path d="M16.4 12.9c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.4-.1-2.3.8-2.9.8-.6 0-1.6-.8-2.6-.8-1.6 0-3.6 1.3-3.6 4.3 0 1.7.6 3.5 1.5 4.7.7 1 1.4 1.9 2.4 1.9 1-.03 1.4-.7 2.6-.7 1.2 0 1.5.7 2.6.7 1 0 1.7-.9 2.3-1.8.4-.7.7-1.4.9-2.2-.1-.02-1.9-.8-1.9-2.1ZM14.2 6.3c.5-.7.9-1.6.8-2.6-.8.04-1.8.6-2.4 1.3-.5.6-1 1.6-.8 2.5.9.1 1.9-.5 2.4-1.2Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={classes} aria-hidden="true">
      <path d="M12.1 13.3c.7-.4 1.2-1 1.5-1.7l2.5-.4c.2.9.7 1.7 1.4 2.2l-1.3 2.3c-.3.5-.9.8-1.5.8h-4.4c-.6 0-1.2-.3-1.5-.8l-1.3-2.3c.7-.5 1.2-1.3 1.4-2.2l2.4.4c.3.7.8 1.4 1.5 1.7Zm-2-6.8a1.7 1.7 0 1 1 3.4 0l-1.7 3-1.7-3Zm9 3.6a.8.8 0 1 1 1.6 0v.8h-1.6v-.8ZM3 10.1a.8.8 0 0 1 1.6 0v.8H3v-.8Z" />
    </svg>
  );
};

interface ThemeModeSwitcherProps {
  compact?: boolean;
}

const ThemeModeSwitcher: React.FC<ThemeModeSwitcherProps> = ({ compact = false }) => {
  const { mode, setMode } = useTheme();
  return (
    <div
      className={`flex items-center ${
        compact ? 'gap-0.5' : 'gap-1'
      } bg-fin-card border border-fin-border p-1 rounded-xl`}
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
  );
};

export function smoothScrollToDownloads(): void {
  if (typeof document === 'undefined') return;
  const target = document.getElementById(DOWNLOADS_SECTION_ID);
  if (!target) return;
  if (typeof target.scrollIntoView === 'function') {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
    window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY);
  }
}

interface LandingPageProps {
  onLaunchApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp }) => {
  const handleDownloadScroll = useCallback(() => {
    smoothScrollToDownloads();
  }, []);

  return (
    <div className="min-h-screen bg-fin-bg text-fin-text font-sans">
      <header className="sticky top-0 z-40 border-b border-fin-border bg-fin-bg/95 backdrop-blur-md px-4 py-3">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-fin-sunken border border-emerald-500/30 overflow-hidden shadow-sm">
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
              <p className="hidden sm:block text-[11px] text-fin-muted tracking-wide">
                {LANDING_TAGLINE}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeModeSwitcher compact />
            <button
              type="button"
              onClick={onLaunchApp}
              aria-label="Launch App"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <Rocket className="w-4 h-4" />
              <span className="hidden sm:inline">Launch App</span>
              <span className="sm:hidden">Launch</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="px-4 py-14 sm:py-20">
          <div className="mx-auto max-w-4xl flex flex-col items-center text-center gap-6">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-fin-sunken border border-emerald-500/30 overflow-hidden shadow-fin-card">
              <img src={climoraLogo} alt="Climora Logo" className="w-full h-full object-cover" />
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-fin-text leading-tight">
                {LANDING_TAGLINE}
              </h1>
              <p className="text-sm sm:text-base text-fin-secondary leading-relaxed max-w-2xl mx-auto">
                Underwrite MSME climate risk with live Open-Meteo data, a transparent five-dimension
                risk engine, cashflow stress testing and matched government schemes — with
                provenance on every input.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onLaunchApp}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                Launch App
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleDownloadScroll}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-fin-card border border-fin-border text-fin-text font-semibold text-sm hover:border-fin-hover transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <Download className="w-4 h-4" />
                Download Desktop
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {TRUST_ITEMS.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-fin-card border border-fin-border text-[11px] font-mono uppercase tracking-wide text-fin-secondary"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-6">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-fin-text">
              Real capabilities, no marketing fluff
            </h2>
            <p className="text-xs text-fin-muted mt-1 mb-6">
              Everything below is already live inside the Climora workspace.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {LANDING_FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.id}
                    className="rounded-2xl bg-fin-card border border-fin-border shadow-fin-card p-5 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30">
                      <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-sm font-bold text-fin-text tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-fin-muted leading-relaxed">{feature.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 py-10">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-fin-text">
              How it works
            </h2>
            <p className="text-xs text-fin-muted mt-1 mb-6">
              From enterprise profile to underwriting decision in three steps.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {LANDING_STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <article
                    key={step.id}
                    className="rounded-2xl bg-fin-card border border-fin-border shadow-fin-card p-5 flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                        {index + 1}
                      </span>
                      <Icon className="w-4 h-4 text-fin-muted" />
                    </div>
                    <h3 className="text-sm font-bold text-fin-text tracking-tight">{step.title}</h3>
                    <p className="text-xs text-fin-muted leading-relaxed">{step.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id={DOWNLOADS_SECTION_ID} className="px-4 py-10 scroll-mt-20">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-fin-text">
              Download the desktop app
            </h2>
            <p className="text-xs text-fin-muted mt-1 mb-6">
              The desktop build runs the same scoring engine as the web workspace. All releases are
              published on GitHub.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {DOWNLOAD_TARGETS.map((target) => (
                <article
                  key={target.id}
                  className="rounded-2xl bg-fin-card border border-fin-border shadow-fin-card p-5 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-fin-inset border border-fin-border text-fin-text">
                    <DownloadIcon kind={target.icon} />
                  </div>
                  <h3 className="text-sm font-bold text-fin-text tracking-tight">
                    {target.platform}
                  </h3>
                  <p className="text-xs text-fin-muted leading-relaxed">{target.detail}</p>
                  <span className="text-[11px] font-mono uppercase tracking-wide text-fin-secondary">
                    {target.fileTypes}
                  </span>
                  <a
                    href={GITHUB_RELEASES_URL}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-fin-inset border border-fin-border text-xs font-semibold text-fin-text hover:border-fin-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Get for {target.platform}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-fin-border px-4 py-5">
        <p className="mx-auto max-w-7xl text-[11px] text-fin-muted text-center font-mono leading-relaxed">
          Climora • FUSION 2026 Hackathon (IFC FIN-05) • Built with TypeScript, React, and
          Open-Meteo CC BY 4.0
        </p>
      </footer>
    </div>
  );
};
