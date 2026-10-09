import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './apiClient.js';
import { toBusinessRow } from './mappers.js';

const DataContext = createContext(null);

const HEALTH_INTERVAL_MS = 30000;

/**
 * Holds application-wide backend state: scoring config, the business list,
 * dashboard aggregates, and backend reachability. Screens re-fetch through
 * `refresh()` instead of subscribing to fetches they cannot see.
 */
export function DataProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [currentBusinessId, setCurrentBusinessId] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [health, setHealth] = useState({ online: false, checking: true, lastChecked: null, error: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkHealth = useCallback(async () => {
    try {
      await api.health();
      setHealth({ online: true, checking: false, lastChecked: new Date().toISOString(), error: null });
      return true;
    } catch (err) {
      setHealth({ online: false, checking: false, lastChecked: new Date().toISOString(), error: err.message });
      return false;
    }
  }, []);

  const refreshBusinesses = useCallback(async (params) => {
    const payload = await api.listBusinesses(params);
    const rows = (payload?.businesses || []).map((business) => toBusinessRow(business, config?.sectors));
    setBusinesses(rows);
    return rows;
  }, [config]);

  const selectBusiness = useCallback((businessId) => {
    setCurrentBusinessId(businessId || null);
  }, []);

  // Falls back to the first business so owner screens always have a target
  // without needing an effect to seed state.
  const currentBusiness =
    businesses.find((business) => business.id === currentBusinessId) || businesses[0] || null;

  const refreshDashboard = useCallback(async () => {
    const payload = await api.dashboard();
    setDashboard(payload);
    return payload;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [configPayload, businessPayload, dashboardPayload] = await Promise.all([
        api.config(),
        api.listBusinesses(),
        api.dashboard(),
      ]);
      setConfig(configPayload);
      setBusinesses((businessPayload?.businesses || []).map((b) => toBusinessRow(b, configPayload?.sectors)));
      setDashboard(dashboardPayload);
      setHealth({ online: true, checking: false, lastChecked: new Date().toISOString(), error: null });
    } catch (err) {
      setError(err.message);
      setHealth({ online: false, checking: false, lastChecked: new Date().toISOString(), error: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Independent liveness probe so the UI can show a backend-down banner
  // without tearing down already-loaded data.
  useEffect(() => {
    const timer = setInterval(checkHealth, HEALTH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [checkHealth]);

  const value = useMemo(
    () => ({
      config,
      businesses,
      currentBusiness,
      currentBusinessId,
      selectBusiness,
      dashboard,
      health,
      loading,
      error,
      refresh,
      refreshBusinesses,
      refreshDashboard,
      checkHealth,
      // convenience
      sectors: config?.sectors || null,
      weights: config?.risk?.weights || null,
      categories: config?.risk?.categories || null,
      disclaimer: config?.disclaimer || null,
      industries: config?.business?.industries || null,
    }),
    [config, businesses, currentBusiness, currentBusinessId, selectBusiness, dashboard, health, loading, error, refresh, refreshBusinesses, refreshDashboard, checkHealth]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used inside <DataProvider>');
  return context;
}

/**
 * The business the owner screens operate on. Defaults to the first business in
 * the portfolio (or the explicitly selected one) so the owner workflow has a
 * sensible target without needing an effect to seed state.
 */
export function useCurrentBusiness() {
  const { businesses, currentBusiness, currentBusinessId, selectBusiness, loading } = useData();
  return { business: currentBusiness, businesses, loading, selectBusiness, selectedId: currentBusinessId };
}
