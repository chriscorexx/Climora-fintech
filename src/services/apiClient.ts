import { MSMEProfile, RiskAssessment, ClimateIndicators, CashflowScenario, GovernmentScheme } from '../types';
import { getStoredProfiles, saveProfiles } from '../core/storage';
import { fetchClimateIndicators } from '../core/weatherService';
import { assessMSMEClimateRisk } from '../core/riskEngine';
import { matchSchemesForProfile } from '../core/schemeMatcher';
import { simulateCashflowStress, ScenarioParams } from '../core/scenarioSimulator';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Unified API Client for Climora
 * Supports both Live Express Server (port 5000) and seamless offline client-side fallback.
 */
class ClimoraApiClient {
  private isServerHealthy = true;

  constructor() {
    this.checkHealth();
  }

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
      this.isServerHealthy = res.ok;
      return res.ok;
    } catch {
      this.isServerHealthy = false;
      return false;
    }
  }

  async getBusinesses(): Promise<MSMEProfile[]> {
    if (this.isServerHealthy) {
      try {
        const res = await fetch(`${API_BASE_URL}/businesses`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data.businesses) {
            return json.data.businesses;
          }
        }
      } catch (err) {
        console.warn('API call failed, falling back to local client store:', err);
      }
    }
    return getStoredProfiles();
  }

  async createBusiness(profile: Partial<MSMEProfile>): Promise<MSMEProfile> {
    if (this.isServerHealthy) {
      try {
        const res = await fetch(`${API_BASE_URL}/businesses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile),
          signal: AbortSignal.timeout(4000),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data.business) {
            return json.data.business;
          }
        }
      } catch (err) {
        console.warn('Backend create failed, storing locally:', err);
      }
    }
    const fullProfile = profile as MSMEProfile;
    const current = getStoredProfiles();
    saveProfiles([fullProfile, ...current]);
    return fullProfile;
  }

  async runAssessment(business: MSMEProfile): Promise<{ assessment: RiskAssessment; climate: ClimateIndicators }> {
    if (this.isServerHealthy) {
      try {
        const res = await fetch(`${API_BASE_URL}/businesses/${business.id}/assessments`, {
          method: 'POST',
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data.assessment) {
            const climateData = await fetchClimateIndicators(
              business.location.latitude,
              business.location.longitude,
              business.location.city
            );
            return { assessment: json.data.assessment, climate: climateData };
          }
        }
      } catch (err) {
        console.warn('Backend assessment failed, running client-side engine:', err);
      }
    }

    // Client-side execution
    const climate = await fetchClimateIndicators(
      business.location.latitude,
      business.location.longitude,
      business.location.city
    );
    const assessment = assessMSMEClimateRisk(business, climate);
    return { assessment, climate };
  }

  async runScenario(business: MSMEProfile, params: ScenarioParams): Promise<CashflowScenario> {
    if (this.isServerHealthy) {
      try {
        const res = await fetch(`${API_BASE_URL}/businesses/${business.id}/scenarios`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data.scenario) {
            return json.data.scenario;
          }
        }
      } catch (err) {
        console.warn('Backend scenario failed, using local simulation:', err);
      }
    }
    return simulateCashflowStress(business, params);
  }

  async getMatchedSchemes(business: MSMEProfile, floodScore: number, heatScore: number): Promise<GovernmentScheme[]> {
    if (this.isServerHealthy) {
      try {
        const res = await fetch(
          `${API_BASE_URL}/businesses/${business.id}/scheme-matches?floodScore=${floodScore}&heatScore=${heatScore}`,
          { signal: AbortSignal.timeout(3000) }
        );
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data.schemes) {
            return json.data.schemes;
          }
        }
      } catch (err) {
        console.warn('Backend scheme matching failed, matching locally:', err);
      }
    }
    return matchSchemesForProfile(business, floodScore, heatScore);
  }
}

export const apiClient = new ClimoraApiClient();
