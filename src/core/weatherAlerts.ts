import { ClimateIndicators } from '../types';

export type WeatherAlertSeverity = 'warning' | 'critical';

export interface WeatherAlert {
  id: string;
  severity: WeatherAlertSeverity;
  title: string;
  detail: string;
}

export const RIVER_ANOMALY_CRITICAL_PCT = 50;
export const RIVER_ANOMALY_WARNING_PCT = 25;
export const PRECIPITATION_CRITICAL_MM = 65;
export const PRECIPITATION_WARNING_MM = 25;
export const HOT_DAYS_CRITICAL = 3;
export const HOT_DAYS_WARNING = 2;

export function detectWeatherAlerts(climate: ClimateIndicators | null | undefined): WeatherAlert[] {
  if (!climate || !climate.extremes) return [];
  const alerts: WeatherAlert[] = [];
  const { riverDischargeAnomalyPct, maxDailyPrecipitationMm, consecutiveHotDays } =
    climate.extremes;

  if (riverDischargeAnomalyPct >= RIVER_ANOMALY_CRITICAL_PCT) {
    alerts.push({
      id: 'river_anomaly',
      severity: 'critical',
      title: 'Elevated River Discharge',
      detail: `River discharge is ${riverDischargeAnomalyPct}% above normal — flash-flood exposure for riverside facilities.`,
    });
  } else if (riverDischargeAnomalyPct >= RIVER_ANOMALY_WARNING_PCT) {
    alerts.push({
      id: 'river_anomaly',
      severity: 'warning',
      title: 'Rising River Discharge',
      detail: `River discharge is ${riverDischargeAnomalyPct}% above normal — monitor low-lying premises.`,
    });
  }

  if (maxDailyPrecipitationMm >= PRECIPITATION_CRITICAL_MM) {
    alerts.push({
      id: 'heavy_rainfall',
      severity: 'critical',
      title: 'Extreme Rainfall Threshold Crossed',
      detail: `Peak daily precipitation of ${maxDailyPrecipitationMm}mm exceeds the IMD very-heavy-rainfall band (65mm).`,
    });
  } else if (maxDailyPrecipitationMm >= PRECIPITATION_WARNING_MM) {
    alerts.push({
      id: 'heavy_rainfall',
      severity: 'warning',
      title: 'Heavy Rainfall Watch',
      detail: `Peak daily precipitation of ${maxDailyPrecipitationMm}mm approaching heavy-rainfall thresholds.`,
    });
  }

  if (consecutiveHotDays >= HOT_DAYS_CRITICAL) {
    alerts.push({
      id: 'heat_streak',
      severity: 'critical',
      title: 'Sustained Heatwave Conditions',
      detail: `${consecutiveHotDays} consecutive days at or above 38°C stress cooling loads and labour productivity.`,
    });
  } else if (consecutiveHotDays >= HOT_DAYS_WARNING) {
    alerts.push({
      id: 'heat_streak',
      severity: 'warning',
      title: 'Rising Temperatures',
      detail: `${consecutiveHotDays} consecutive hot days forecast — verify cooling and power backup.`,
    });
  }

  return alerts;
}
