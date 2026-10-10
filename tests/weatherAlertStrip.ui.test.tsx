import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeatherAlertStrip } from '@/components/common/WeatherAlertStrip';
import { getFallbackIndicators } from '@/core/weatherService';

const baseClimate = getFallbackIndicators(18.5204, 73.8567, 'Pune');

describe('WeatherAlertStrip (jsdom UI harness)', () => {
  it('renders nothing when no thresholds are crossed', () => {
    const { container } = render(
      <WeatherAlertStrip
        climate={{
          ...baseClimate,
          extremes: {
            ...baseClimate.extremes,
            riverDischargeAnomalyPct: 10,
            maxDailyPrecipitationMm: 5,
            consecutiveHotDays: 0,
          },
        }}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders semantic alert cards when thresholds are crossed', () => {
    render(
      <WeatherAlertStrip
        climate={{
          ...baseClimate,
          extremes: {
            ...baseClimate.extremes,
            riverDischargeAnomalyPct: 62,
            maxDailyPrecipitationMm: 90,
            consecutiveHotDays: 4,
          },
        }}
        locationLabel="Pune"
      />,
    );

    expect(screen.getByText('Weather Threshold Alerts')).toBeInTheDocument();
    expect(screen.getByText('Elevated River Discharge')).toBeInTheDocument();
    expect(screen.getByText(/Extreme Rainfall Threshold Crossed/)).toBeInTheDocument();
    expect(screen.getByText(/Sustained Heatwave Conditions/)).toBeInTheDocument();
    expect(screen.getByText('Pune')).toBeInTheDocument();
  });
});
