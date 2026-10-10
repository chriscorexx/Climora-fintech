import React from 'react';
import { AlertTriangle, AlertOctagon } from 'lucide-react';
import { ClimateIndicators } from '../../types';
import { WeatherAlert, detectWeatherAlerts } from '../../core/weatherAlerts';

interface WeatherAlertStripProps {
  climate: ClimateIndicators | null | undefined;
  alerts?: WeatherAlert[];
  locationLabel?: string;
}

export const WeatherAlertStrip: React.FC<WeatherAlertStripProps> = ({
  climate,
  alerts,
  locationLabel,
}) => {
  const resolved = alerts ?? detectWeatherAlerts(climate);
  if (resolved.length === 0) return null;

  return (
    <div
      className="rounded-2xl border border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/15 p-4 shadow-fin-card"
      role="status"
      aria-live="polite"
      aria-label="Weather threshold alerts"
    >
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-300" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
          Weather Threshold Alerts
        </h3>
        {locationLabel && (
          <span className="text-[10px] font-mono text-fin-muted ml-auto">{locationLabel}</span>
        )}
      </div>
      <div className="space-y-2">
        {resolved.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start gap-2 rounded-xl border p-2.5 text-[11px] ${
              alert.severity === 'critical'
                ? 'border-rose-500/40 bg-rose-500/10 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300'
                : 'border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300'
            }`}
          >
            {alert.severity === 'critical' ? (
              <AlertOctagon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-semibold">{alert.title}</div>
              <div className="text-fin-secondary leading-relaxed">{alert.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
