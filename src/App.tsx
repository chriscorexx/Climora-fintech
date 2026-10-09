import React, { useState, useEffect, useMemo } from 'react';
import { MSMEProfile, UserRole, ClimateIndicators, RiskAssessment } from './types';
import {
  getStoredProfiles,
  saveProfiles,
  getActiveProfileId,
  setActiveProfileId,
  getStoredRole,
  saveStoredRole,
  getCompletedActionIds,
  toggleCompletedActionId,
} from './core/storage';
import { fetchClimateIndicators, getFallbackIndicators } from './core/weatherService';
import { assessMSMEClimateRisk } from './core/riskEngine';
import { matchSchemesForProfile } from './core/schemeMatcher';
import { apiClient } from './services/apiClient';
import { TopBar } from './components/navigation/TopBar';
import { CommandCenterDashboard } from './components/dashboard/CommandCenterDashboard';
import { LenderDashboard } from './components/lender/LenderDashboard';
import { MSMEOwnerDashboard } from './components/owner/MSMEOwnerDashboard';
import { ProfileEditModal } from './components/owner/ProfileEditModal';
import { CreditReportModal } from './components/report/CreditReportModal';
import { normalizeProfile } from './core/profileUtils';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const [profiles, setProfiles] = useState<MSMEProfile[]>(() => getStoredProfiles().map(normalizeProfile));
  const [activeProfileId, setActiveId] = useState<string>(() => getActiveProfileId());
  const [role, setRole] = useState<UserRole>(() => getStoredRole());
  const [completedActionIds, setCompletedActionIds] = useState<string[]>(() => getCompletedActionIds());

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewProfileModal, setIsNewProfileModal] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Climate Indicators state
  const [climate, setClimate] = useState<ClimateIndicators | null>(null);
  const [isLoadingClimate, setIsLoadingClimate] = useState(true);

  // Active Profile object
  const activeProfile = useMemo(() => {
    const found = profiles.find((p) => p.id === activeProfileId) || profiles[0];
    return normalizeProfile(found);
  }, [profiles, activeProfileId]);

  // Sync with backend businesses on mount if available
  useEffect(() => {
    apiClient.getBusinesses().then((bizList) => {
      if (bizList && bizList.length > 0) {
        setProfiles(bizList.map(normalizeProfile));
      }
    });
  }, []);

  // Load Climate Indicators whenever activeProfile changes
  useEffect(() => {
    let isCancelled = false;
    async function loadData() {
      setIsLoadingClimate(true);
      try {
        const indicators = await fetchClimateIndicators(
          activeProfile.location.latitude,
          activeProfile.location.longitude,
          activeProfile.location.city
        );
        if (!isCancelled) {
          setClimate(indicators);
          setIsLoadingClimate(false);
        }
      } catch (err) {
        if (!isCancelled) {
          setClimate(
            getFallbackIndicators(
              activeProfile.location.latitude,
              activeProfile.location.longitude,
              activeProfile.location.city
            )
          );
          setIsLoadingClimate(false);
        }
      }
    }
    loadData();
    return () => {
      isCancelled = true;
    };
  }, [activeProfile.id, activeProfile.location.latitude, activeProfile.location.longitude]);

  // Recalculate Risk Assessment
  const assessment: RiskAssessment = useMemo(() => {
    if (!climate) {
      const fallback = getFallbackIndicators(
        activeProfile.location.latitude,
        activeProfile.location.longitude,
        activeProfile.location.city
      );
      return assessMSMEClimateRisk(activeProfile, fallback);
    }
    return assessMSMEClimateRisk(activeProfile, climate);
  }, [activeProfile, climate]);

  // Matched Government Schemes
  const matchedSchemes = useMemo(() => {
    return matchSchemesForProfile(
      activeProfile,
      assessment.dimensionScores.floodExposure.score,
      assessment.dimensionScores.extremeHeat.score
    );
  }, [activeProfile, assessment]);

  // Handlers
  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    saveStoredRole(newRole);
  };

  const handleSelectProfile = (profile: MSMEProfile) => {
    setActiveId(profile.id);
    setActiveProfileId(profile.id);
  };

  const handleSaveProfile = (updated: MSMEProfile) => {
    const safeUpdated = normalizeProfile(updated);
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
    setIsLoadingClimate(true);
    const indicators = await fetchClimateIndicators(
      activeProfile.location.latitude,
      activeProfile.location.longitude,
      activeProfile.location.city
    );
    setClimate(indicators);
    setIsLoadingClimate(false);
  };

  return (
    <div className="min-h-screen bg-fin-bg text-fin-text flex flex-col font-sans">
      {/* Top Sticky Navigation */}
      <TopBar
        role={role}
        onRoleChange={handleRoleChange}
        profiles={profiles}
        activeProfile={activeProfile}
        onSelectProfile={handleSelectProfile}
        onOpenNewProfileModal={() => {
          setIsNewProfileModal(true);
          setIsEditModalOpen(true);
        }}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onRefreshData={handleRefreshClimate}
        isRefreshing={isLoadingClimate}
        activeRiskCategory={assessment.riskCategory}
        activeRiskScore={assessment.overallScore}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {isLoadingClimate && !climate ? (
          <div className="h-96 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
            <p className="text-xs text-fin-muted font-mono">
              Retrieving environmental data for {activeProfile.location.city}...
            </p>
          </div>
        ) : (
          <>
            {role === 'lender' ? (
              <LenderDashboard
                profiles={profiles}
                activeProfile={activeProfile}
                assessment={assessment}
                climate={climate!}
                onSelectProfile={handleSelectProfile}
                onOpenReportModal={() => setIsReportModalOpen(true)}
              />
            ) : role === 'command_center' ? (
              <CommandCenterDashboard
                profiles={profiles}
                activeProfile={activeProfile}
                assessment={assessment}
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
            ) : (
              <MSMEOwnerDashboard
                activeProfile={activeProfile}
                assessment={assessment}
                climate={climate!}
                matchedSchemes={matchedSchemes}
                completedActionIds={completedActionIds}
                onToggleAction={handleToggleAction}
                onOpenEditModal={() => {
                  setIsNewProfileModal(false);
                  setIsEditModalOpen(true);
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-fin-border py-4 px-6 text-center text-xs text-fin-muted font-mono no-print flex items-center justify-center gap-2">
        <img src="/Climora-logo.jpg" alt="Climora" className="w-4 h-4 rounded-full object-cover" />
        <span>Climora • FUSION 2026 Hackathon (IFC FIN-05) • Built with TypeScript, React, and Open-Meteo CC BY 4.0</span>
      </footer>

      {/* Modals */}
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProfile}
        initialProfile={isNewProfileModal ? undefined : activeProfile}
      />

      {climate && (
        <CreditReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          profile={activeProfile}
          assessment={assessment}
          climate={climate}
        />
      )}
    </div>
  );
};
