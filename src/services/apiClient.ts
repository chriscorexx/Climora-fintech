import {
  MSMEProfile,
  RiskAssessment,
  ClimateIndicators,
  CashflowScenario,
  GovernmentScheme,
} from '../types';
import { getStoredProfiles, saveProfiles } from '../core/storage';
import { fetchClimateIndicators } from '../core/weatherService';
import { assessMSMEClimateRisk } from '../core/riskEngine';
import { matchSchemesForProfile } from '../core/schemeMatcher';
import { simulateCashflowStress, ScenarioParams } from '../core/scenarioSimulator';
import { normalizeProfile } from '../core/profileUtils';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface LoanApplication {
  id: string;
  businessId: string;
  loanAmount: number;
  tenureMonths: number;
  purpose: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'revision_requested';
  createdAt: string;
  updatedAt?: string;
  timeline?: unknown[];
  documents?: unknown[];
}

interface AuthResponse {
  user: { id: string; email: string; name: string; role: string; emailVerified?: boolean };
  accessToken: string;
}

/**
 * Unified API Client for Climora
 * Supports both Live Express Server (port 5000) and seamless offline client-side fallback.
 */
class ClimoraApiClient {
  private isServerHealthy = true;
  private accessToken: string | null = null;

  constructor() {
    try {
      this.accessToken = localStorage.getItem('climora_access_token');
    } catch {
      this.accessToken = null;
    }
    this.checkHealth();
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      localStorage.setItem('climora_access_token', token);
    } else {
      localStorage.removeItem('climora_access_token');
    }
  }

  getAccessToken() {
    return this.accessToken;
  }

  private async authHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    return headers;
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

  // Auth methods
  async register(data: { email: string; name: string; password: string; role: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Registration failed');
    if (json.data?.accessToken) this.setAccessToken(json.data.accessToken);
    return json.data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Login failed');
    if (json.data?.accessToken) this.setAccessToken(json.data.accessToken);
    return json.data;
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: await this.authHeaders(),
        credentials: 'include',
      });
    } finally {
      this.setAccessToken(null);
    }
  }

  async getCurrentUser() {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: await this.authHeaders(),
      credentials: 'include',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to get user');
    return json.data.user;
  }

  async requestPasswordReset(email: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Request failed');
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Reset failed');
  }

  async verifyEmail(token: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Verification failed');
  }

  // Loan methods
  async createLoanApplication(data: { businessId: string; loanAmount: number; tenureMonths: number; purpose: string }): Promise<LoanApplication> {
    const res = await fetch(`${API_BASE_URL}/loans`, {
      method: 'POST',
      headers: await this.authHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to create loan application');
    return json.data.application;
  }

  async getLoanApplications(): Promise<LoanApplication[]> {
    const res = await fetch(`${API_BASE_URL}/loans`, {
      headers: await this.authHeaders(),
      credentials: 'include',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to get loan applications');
    return json.data.applications;
  }

  async getLoanApplication(id: string): Promise<LoanApplication> {
    const res = await fetch(`${API_BASE_URL}/loans/${id}`, {
      headers: await this.authHeaders(),
      credentials: 'include',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to get loan application');
    return json.data.application;
  }

  async updateLoanStatus(id: string, status: string, note?: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/loans/${id}/status`, {
      method: 'PATCH',
      headers: await this.authHeaders(),
      credentials: 'include',
      body: JSON.stringify({ status, note }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to update status');
  }

  async getBusinesses(): Promise<MSMEProfile[]> {
    if (this.isServerHealthy) {
      try {
        const res = await fetch(`${API_BASE_URL}/businesses`, {
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data.businesses) {
            return json.data.businesses.map(normalizeProfile);
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
            return normalizeProfile(json.data.business);
          }
        }
      } catch (err) {
        console.warn('Backend create failed, storing locally:', err);
      }
    }
    const fullProfile = normalizeProfile(profile);
    const current = getStoredProfiles();
    saveProfiles([fullProfile, ...current]);
    return fullProfile;
  }

  async runAssessment(
    business: MSMEProfile,
  ): Promise<{ assessment: RiskAssessment; climate: ClimateIndicators }> {
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
              business.location.city,
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
      business.location.city,
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

  async getMatchedSchemes(
    business: MSMEProfile,
    floodScore: number,
    heatScore: number,
  ): Promise<GovernmentScheme[]> {
    if (this.isServerHealthy) {
      try {
        const res = await fetch(
          `${API_BASE_URL}/businesses/${business.id}/scheme-matches?floodScore=${floodScore}&heatScore=${heatScore}`,
          { signal: AbortSignal.timeout(3000) },
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
