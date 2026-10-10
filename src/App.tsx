import React, { useCallback, useEffect, useMemo, useState, Suspense, lazy } from 'react';
import { MSMEProfile, ClimateIndicators, RiskAssessment } from './types';
import {
  getStoredProfiles,
  saveProfiles,
  getActiveProfileId,
  setActiveProfileId,
  getCompletedActionIds,
  toggleCompletedActionId,
} from './core/storage';
import { fetchClimateIndicators, getFallbackIndicators } from './core/weatherService';
import { assessMSMEClimateRisk } from './core/riskEngine';
import { matchSchemesForProfile } from './core/schemeMatcher';
import { apiClient } from './services/apiClient';
import { normalizeProfile } from './core/profileUtils';
import { mergeProfiles } from './core/portfolio';
import { getVisibleProfiles, applyProfileOwner } from './core/profileOwnership';
import { AuthUser, getSession, logout } from './core/auth';
import { isElectronApp } from './core/platform';
import { isCommandCenterUnlocked, setCommandCenterUnlocked } from './core/commandCenter';
import { recordProfileScore } from './core/scoreHistory';
import { TopBar } from './components/navigation/TopBar';
import { LandingPage } from './components/landing/LandingPage';
import { PasswordGate } from './components/auth/PasswordGate';
import { DashboardSkeleton } from './components/common/DashboardSkeleton';
import { NoProfilesState } from './components/common/NoProfilesState';
import climoraLogo from './assets/Climora-logo.jpg';

const LenderDashboard = lazy(() =>
  import('./components/lender/LenderDashboard').then((m) => ({ default: m.LenderDashboard })),
);
const MSMEOwnerDashboard = lazy(() =>
  import('./components/owner/MSMEOwnerDashboard').then((m) => ({ default: m.MSMEOwnerDashboard })),
);
const CommandCenterDashboard = lazy(() =>
  import('./components/dashboard/CommandCenterDashboard').then((m) => ({
    default: m.CommandCenterDashboard,
  })),
);
const ProfileEditModal = lazy(() =>
  import('./components/owner/ProfileEditModal').then((m) => ({ default: m.ProfileEditModal })),
);
const CreditReportModal = lazy(() =>
  import('./components/report/CreditReportModal').then((m) => ({ default: m.CreditReportModal })),
);
const LoginPage = lazy(() =>
  import('./components/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('./components/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);

type AuthView = 'landing' | 'login' | 'register';

const IS_DESKTOP_APP = isElectronApp();

export const App: React.FC = () => {
  const [session, setSession] = useState<AuthUser | null>(() => getSession());
  const [authView, setAuthView] = useState<AuthView>(() => (IS_DESKTOP_APP ? 'login' : 'landing'));

  const [profiles, setProfiles] = useState<MSMEProfile[]>(() =>
    getStoredProfiles().map(normalizeProfile),
  );
  const [activeProfileId, setActiveId] = useState<string>(() => getActiveProfileId());
  const [completedActionIds, setCompletedActionIds] = useState<string[]>(() =>
    getCompletedActionIds(),
  );

  // Command Center access state
  const [commandCenterView, setCommandCenterView] = useState(false);
  const [commandCenterUnlocked, setCommandCenterUnlockedState] = useState<boolean>(() =>
    isCommandCenterUnlocked(),
  );
  const [showPasswordGate, setShowPasswordGate] = useState(false);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewProfileModal, setIsNewProfileModal] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Climate Indicators state
  const [climate, setClimate] = useState<ClimateIndicators | null>(null);
  const [isLoadingClimate, setIsLoadingClimate] = useState(true);

  // Role-scoped profile visibility (lenders see all, owners see only their own)
  const visibleProfiles = useMemo(() => getVisibleProfiles(profiles, session), [profiles, session]);

  const activeProfile = useMemo(() => {
    const found = visibleProfiles.find((p) => p.id === activeProfileId);
    const target = found || visibleProfiles[0];
    return target ? normalizeProfile(target) : null;
  }, [visibleProfiles, activeProfileId]);

  // Sync with backend businesses on mount if available (preserving locally owned profiles)
  useEffect(() => {
    let isCancelled = false;
    apiClient.getBusinesses().then((bizList) => {
      if (isCancelled) return;
      if (bizList && bizList.length > 0) {
        setProfiles((current) => mergeProfiles(bizList.map(normalizeProfile), current));
      }
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  // Load Climate Indicators whenever activeProfile changes
  useEffect(() => {
    if (!activeProfile) {
      setClimate(null);
      setIsLoadingClimate(false);
      return;
    }
    let isCancelled = false;
    async function loadData() {
      setIsLoadingClimate(true);
      try {
        const indicators = await fetchClimateIndicators(
          activeProfile!.location.latitude,
          activeProfile!.location.longitude,
          activeProfile!.location.city,
        );
        if (!isCancelled) {
          setClimate(indicators);
          setIsLoadingClimate(false);
        }
      } catch (err) {
        if (!isCancelled) {
          setClimate(
            getFallbackIndicators(
              activeProfile!.location.latitude,
              activeProfile!.location.longitude,
              activeProfile!.location.city,
            ),
          );
          setIsLoadingClimate(false);
        }
      }
    }
    loadData();
    return () => {
      isCancelled = true;
    };
  }, [activeProfile]);

  // Recalculate Risk Assessment
  const assessment: RiskAssessment | null = useMemo(() => {
    if (!activeProfile) return null;
    if (!climate) {
      const fallback = getFallbackIndicators(
        activeProfile.location.latitude,
        activeProfile.location.longitude,
        activeProfile.location.city,
      );
      return assessMSMEClimateRisk(activeProfile, fallback);
    }
    return assessMSMEClimateRisk(activeProfile, climate);
  }, [activeProfile, climate]);

  // Matched Government Schemes
  const matchedSchemes = useMemo(() => {
    if (!activeProfile || !assessment) return [];
    return matchSchemesForProfile(
      activeProfile,
      assessment.dimensionScores.floodExposure.score,
      assessment.dimensionScores.extremeHeat.score,
    );
  }, [activeProfile, assessment]);

  // Persist assessment score history (capped) for trend charting
  const historyProfileId = activeProfile?.id;
  const historyScore = assessment?.overallScore;
  useEffect(() => {
    if (!historyProfileId || historyScore === undefined) return;
    recordProfileScore(historyProfileId, historyScore);
  }, [historyProfileId, historyScore]);

  // Handlers
  const handleAuthenticated = useCallback((user: AuthUser) => {
    setSession(user);
    setAuthView('login');
    setCommandCenterView(false);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setSession(null);
    setAuthView(IS_DESKTOP_APP ? 'login' : 'landing');
    setCommandCenterView(false);
    setShowPasswordGate(false);
  }, []);

  const handleToggleCommandCenter = useCallback(() => {
    if (commandCenterView) {
      setCommandCenterView(false);
      return;
    }
    if (commandCenterUnlocked) {
      setCommandCenterView(true);
      return;
    }
    setShowPasswordGate(true);
  }, [commandCenterView, commandCenterUnlocked]);

  const handleCommandCenterUnlocked = useCallback(() => {
    setCommandCenterUnlocked(true);
    setCommandCenterUnlockedState(true);
    setShowPasswordGate(false);
    setCommandCenterView(true);
  }, []);

  const handleSelectProfile = (profile: MSMEProfile) => {
    setActiveId(profile.id);
    setActiveProfileId(profile.id);
  };

  const handleSaveProfile = (updated: MSMEProfile) => {
    let safeUpdated = normalizeProfile(updated);
    if (session) {
      safeUpdated = applyProfileOwner(safeUpdated, session);
    }
    const existingIndex = profiles.findIndex((p) => p.id === safeUpdated.id);
    let newProfiles: MSMEProfile[];
    if (existingIndex >= 0) {
      newProfiles = [...profiles];
      newProfiles[existingIndex] = safeUpdated;
    } else {
      newProfiles = [safeUpdated, ...profiles];
    }
    setProfiles(newProfiles);
    saveProfiles(newProfiles);
    apiClient.createBusiness(safeUpdated).catch(() => {});
    setActiveId(safeUpdated.id);
    setActiveProfileId(safeUpdated.id);
  };

  const handleToggleAction = (actionId: string) => {
    const updated = toggleCompletedActionId(actionId);
    setCompletedActionIds(updated);
  };

  const handleRefreshClimate = async () => {
    if (!activeProfile) return;
    setIsLoadingClimate(true);
    const indicators = await fetchClimateIndicators(
      activeProfile.location.latitude,
      activeProfile.location.longitude,
      activeProfile.location.city,
    );
    setClimate(indicators);
    setIsLoadingClimate(false);
  };

  const handleOpenNewProfileModal = () => {
    setIsNewProfileModal(true);
    setIsEditModalOpen(true);
  };

  // Unauthenticated: landing (browser only) or auth pages
  if (!session) {
    const isDesktop = isElectronApp();
    const showLanding = authView === 'landing' && !isDesktop;
    const goToLanding = () => setAuthView('landing');
    return (
      <div className="min-h-screen bg-fin-bg text-fin-text font-sans">
        <Suspense fallback={<DashboardSkeleton />}>
          {showLanding ? (
            <LandingPage onLaunchApp={() => setAuthView('login')} />
          ) : authView === 'register' ? (
            <RegisterPage
              onAuthenticated={handleAuthenticated}
              onNavigateToLogin={() => setAuthView('login')}
              onBackToHome={isDesktop ? undefined : goToLanding}
            />
          ) : (
            <LoginPage
              onAuthenticated={handleAuthenticated}
              onNavigateToRegister={() => setAuthView('register')}
              onBackToHome={isDesktop ? undefined : goToLanding}
            />
          )}
        </Suspense>
      </div>
    );
  }

  const renderWorkspace = () => {
    if (!activeProfile) {
      return (
        <NoProfilesState
          isOwner={session.role === 'msme_owner'}
          onCreateProfile={handleOpenNewProfileModal}
        />
      );
    }

    if (commandCenterView) {
      return (
        <CommandCenterDashboard
          profiles={visibleProfiles}
          activeProfile={activeProfile}
          assessment={assessment!}
          climate={climate!}
          matchedSchemes={matchedSchemes}
          completedActionIds={completedActionIds}
          onSelectProfile={handleSelectProfile}
          onOpenReportModal={() => setIsReportModalOpen(true)}
          onOpenEditModal={() => {
            setIsNewProfileModal(false);
            setIsEditModalOpen(true);
          }}
          onRefreshClimate={handleRefreshClimate}
          isRefreshing={isLoadingClimate}
        />
      );
    }

    if (isLoadingClimate && !climate) {
      return <DashboardSkeleton />;
    }

    if (session.role === 'lender') {
      return (
        <LenderDashboard
          profiles={visibleProfiles}
          activeProfile={activeProfile}
          assessment={assessment!}
          climate={climate!}
          onSelectProfile={handleSelectProfile}
          onOpenReportModal={() => setIsReportModalOpen(true)}
        />
      );
    }

    return (
      <MSMEOwnerDashboard
        activeProfile={activeProfile}
        assessment={assessment!}
        climate={climate!}
        matchedSchemes={matchedSchemes}
        completedActionIds={completedActionIds}
        onToggleAction={handleToggleAction}
        onOpenEditModal={() => {
          setIsNewProfileModal(false);
          setIsEditModalOpen(true);
        }}
      />
    );
  };

  return (
    <div className="min-h-screen bg-fin-bg text-fin-text flex flex-col font-sans">
      {/* Top Sticky Navigation */}
      <TopBar
        session={session}
        profiles={visibleProfiles}
        activeProfile={activeProfile}
        onSelectProfile={handleSelectProfile}
        onOpenNewProfileModal={handleOpenNewProfileModal}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onRefreshData={handleRefreshClimate}
        isRefreshing={isLoadingClimate}
        activeRiskCategory={assessment ? assessment.riskCategory : 'low'}
        activeRiskScore={assessment ? assessment.overallScore : 0}
        onLogout={handleLogout}
        onToggleCommandCenter={handleToggleCommandCenter}
        commandCenterUnlocked={commandCenterUnlocked}
        commandCenterActive={commandCenterView}
      />

      {/* Main Workspace Body */}
      <main className="no-print flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div
          key={commandCenterView ? 'command-center' : session.role}
          className="animate-fade-in-up"
        >
          <Suspense fallback={<DashboardSkeleton />}>{renderWorkspace()}</Suspense>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-fin-border py-4 px-6 text-center text-xs text-fin-muted font-mono no-print flex items-center justify-center gap-2">
        <img src={climoraLogo} alt="Climora" className="w-4 h-4 rounded-full object-cover" />
        <span>
          Climora • FUSION 2026 Hackathon (IFC FIN-05) • Built with TypeScript, React, and
          Open-Meteo CC BY 4.0
        </span>
      </footer>

      {/* Command Center Password Gate */}
      {showPasswordGate && (
        <PasswordGate
          onSuccess={handleCommandCenterUnlocked}
          onClose={() => setShowPasswordGate(false)}
        />
      )}

      {/* Modals */}
      <Suspense fallback={null}>
        <ProfileEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveProfile}
          initialProfile={isNewProfileModal ? undefined : (activeProfile ?? undefined)}
        />

        {climate && activeProfile && (
          <CreditReportModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            profile={activeProfile}
            assessment={assessment!}
          />
        )}
      </Suspense>
    </div>
  );
};
