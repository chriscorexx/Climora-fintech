import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { LandingPage, smoothScrollToDownloads } from '@/components/landing/LandingPage';
import { ThemeProvider } from '@/components/common/ThemeProvider';
import { App } from '@/App';

function renderLanding(onLaunchApp = () => {}) {
  return render(
    <ThemeProvider>
      <LandingPage onLaunchApp={onLaunchApp} />
    </ThemeProvider>,
  );
}

describe('LandingPage (jsdom UI harness)', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders the hero, tagline and trust row', () => {
    renderLanding();
    expect(
      screen.getByRole('heading', { name: 'Real-Time Climate Risk & Underwriting for MSMEs' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Open-Meteo live data')).toBeInTheDocument();
    expect(screen.getAllByText('IFC FIN-05').length).toBeGreaterThan(0);
    expect(screen.getByText('5-Dimension Risk Engine')).toBeInTheDocument();
    expect(screen.getByText('CLIMORA')).toBeInTheDocument();
  });

  it('fires onLaunchApp from the hero and top bar CTAs', () => {
    const onLaunchApp = vi.fn();
    renderLanding(onLaunchApp);
    const launchButtons = screen.getAllByRole('button', { name: 'Launch App' });
    expect(launchButtons.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(launchButtons[1]);
    expect(onLaunchApp).toHaveBeenCalledTimes(1);
  });

  it('renders exactly six feature cards and three how-it-works steps', () => {
    renderLanding();
    expect(screen.getByText('Transparent 5-Dimension Risk Scoring')).toBeInTheDocument();
    expect(screen.getByText('Cashflow Stress Simulator')).toBeInTheDocument();
    expect(screen.getByText('District Hazard Baselines')).toBeInTheDocument();
    expect(screen.getByText('Matched Government Schemes')).toBeInTheDocument();
    expect(screen.getByText('Live vs Fallback Data Badges')).toBeInTheDocument();
    expect(screen.getByText('Credit Memo Export & Print')).toBeInTheDocument();

    expect(screen.getByText('Connect Enterprise Profile')).toBeInTheDocument();
    expect(screen.getByText('Live Climate + Risk Scoring')).toBeInTheDocument();
    expect(screen.getByText('Underwrite / Adapt')).toBeInTheDocument();
  });

  it('renders three desktop download cards linking to the GitHub releases page', () => {
    renderLanding();
    const links = screen.getAllByRole('link', { name: /^Get for / });
    expect(links).toHaveLength(3);
    links.forEach((link) => {
      expect(link).toHaveAttribute(
        'href',
        'https://github.com/chriscorexx/Climora-fintech/releases',
      );
      expect(link).toHaveAttribute('target', '_blank');
    });
    expect(screen.getByText('.exe')).toBeInTheDocument();
    expect(screen.getByText('.dmg')).toBeInTheDocument();
    expect(screen.getByText('.AppImage / .deb')).toBeInTheDocument();
  });

  it('renders the three-way theme switcher control from TopBar', () => {
    renderLanding();
    const group = screen.getByRole('group', { name: 'Appearance mode' });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Light appearance mode' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dark appearance mode' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /System appearance mode/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Light appearance mode' }));
    expect(screen.getByRole('button', { name: 'Light appearance mode' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('renders the hackathon attribution footer', () => {
    renderLanding();
    expect(
      screen.getByText(
        /Climora • FUSION 2026 Hackathon \(IFC FIN-05\) • Built with TypeScript, React, and Open-Meteo CC BY 4\.0/,
      ),
    ).toBeInTheDocument();
  });

  it('smooth-scrolls to the downloads section when Download Desktop is clicked', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    renderLanding();
    fireEvent.click(screen.getByRole('button', { name: 'Download Desktop' }));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(document.getElementById('downloads')).not.toBeNull();
  });

  it('smoothScrollToDownloads is a no-op when the section is absent', () => {
    expect(() => smoothScrollToDownloads()).not.toThrow();
  });

  it('never shows the landing page inside the Electron desktop app', async () => {
    const scope = window as unknown as { climora?: unknown };
    const originalClimora = scope.climora;
    scope.climora = { platform: 'win32', version: '1.0.0' };
    try {
      render(
        <ThemeProvider>
          <App />
        </ThemeProvider>,
      );
      expect(await screen.findByText('Sign in to Climora')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Launch App' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Back to home' })).not.toBeInTheDocument();
    } finally {
      if (originalClimora === undefined) {
        delete scope.climora;
      } else {
        scope.climora = originalClimora;
      }
    }
  });
});
