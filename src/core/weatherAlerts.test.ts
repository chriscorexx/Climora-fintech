import { describe, it, expect } from 'vitest';
import { detectWeatherAlerts } from './weatherAlerts';
import { ClimateIndicators } from '../types';
import { getFallbackIndicators } from './weatherService';

function buildClimate(overrides: Partial<ClimateIndicators['extremes']>): ClimateIndicators {
  const base = getFallbackIndicators(18.5204, 73.8567, 'Pune');
  return { ...base, extremes: { ...base.extremes, ...overrides } };
}

describe('Weather threshold alerts', () => {
  it('returns no alerts for calm conditions', () => {
    expect(detectWeatherAlerts(null)).toEqual([]);
    expect(detectWeatherAlerts(undefined)).toEqual([]);
    expect(
      detectWeatherAlerts(
        buildClimate({
          riverDischargeAnomalyPct: 10,
          maxDailyPrecipitationMm: 5,
          consecutiveHotDays: 0,
        }),
      ),
    ).toEqual([]);
  });

  it('raises a critical alert when river discharge anomaly crosses the flood threshold', () => {
    const alerts = detectWeatherAlerts(
      buildClimate({
        riverDischargeAnomalyPct: 55,
        maxDailyPrecipitationMm: 5,
        consecutiveHotDays: 0,
      }),
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0].id).toBe('river_anomaly');
    expect(alerts[0].severity).toBe('critical');
  });

  it('warns on elevated river discharge below the critical threshold', () => {
    const alerts = detectWeatherAlerts(
      buildClimate({
        riverDischargeAnomalyPct: 30,
        maxDailyPrecipitationMm: 5,
        consecutiveHotDays: 0,
      }),
    );
    expect(alerts[0].severity).toBe('warning');
  });

  it('raises a critical alert for extreme daily precipitation', () => {
    const alerts = detectWeatherAlerts(
      buildClimate({
        riverDischargeAnomalyPct: 5,
        maxDailyPrecipitationMm: 80,
        consecutiveHotDays: 0,
      }),
    );
    expect(alerts.map((a) => a.id)).toEqual(['heavy_rainfall']);
    expect(alerts[0].severity).toBe('critical');
  });

  it('raises a critical alert for sustained heat streaks', () => {
    const alerts = detectWeatherAlerts(
      buildClimate({
        riverDischargeAnomalyPct: 5,
        maxDailyPrecipitationMm: 5,
        consecutiveHotDays: 4,
      }),
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0].id).toBe('heat_streak');
    expect(alerts[0].severity).toBe('critical');
  });

  it('combines multiple simultaneous hazard alerts', () => {
    const alerts = detectWeatherAlerts(
      buildClimate({
        riverDischargeAnomalyPct: 70,
        maxDailyPrecipitationMm: 120,
        consecutiveHotDays: 5,
      }),
    );
    expect(alerts.map((a) => a.id)).toEqual(['river_anomaly', 'heavy_rainfall', 'heat_streak']);
    expect(alerts.every((a) => a.severity === 'critical')).toBe(true);
  });
});
