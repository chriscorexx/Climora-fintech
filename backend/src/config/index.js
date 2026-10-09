'use strict';

require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  isTest: (process.env.NODE_ENV || 'development') === 'test',

  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  database: {
    path: process.env.DATABASE_PATH || './data/climora.db',
    seedDemoData: String(process.env.SEED_DEMO_DATA || 'true').toLowerCase() === 'true',
  },

  climate: {
    baseUrl: process.env.OPEN_METEO_BASE_URL || 'https://api.open-meteo.com',
    floodBaseUrl: process.env.OPEN_METEO_FLOOD_BASE_URL || 'https://flood-api.open-meteo.com',
    geocodingBaseUrl: process.env.OPEN_METEO_GEOCODING_BASE_URL || 'https://geocoding-api.open-meteo.com',
    timeoutMs: Number(process.env.CLIMATE_TIMEOUT_MS || 8000),
    cacheTtlMinutes: Number(process.env.CLIMATE_CACHE_TTL_MINUTES || 360),
    allowDemoFallback: String(process.env.CLIMATE_ALLOW_DEMO_FALLBACK || 'true').toLowerCase() === 'true',
    historyDays: 365,
    forecastDays: 7,
  },

  // Centralised scoring configuration. Mirrors the weights documented in
  // RISK_SCORING.md and in the frontend risk engine (src/data/riskEngine.js).
  risk: {
    weights: {
      flood: 0.3,
      rainfall: 0.25,
      heat: 0.2,
      business: 0.15,
      financial: 0.1,
    },
    categories: [
      { key: 'low', label: 'Low', min: 0, max: 24 },
      { key: 'moderate', label: 'Moderate', min: 25, max: 49 },
      { key: 'high', label: 'High', min: 50, max: 74 },
      { key: 'veryHigh', label: 'Very High', min: 75, max: 100 },
    ],
    // Below this many available dimensions an assessment is flagged incomplete.
    minimumDimensionsForCompleteAssessment: 2,
    sectors: {
      retail: { label: 'Retail', baseVulnerability: 12 },
      manufacturing: { label: 'Manufacturing', baseVulnerability: 18 },
      agriculture: { label: 'Agriculture', baseVulnerability: 25 },
      food_processing: { label: 'Food Processing', baseVulnerability: 20 },
      hospitality: { label: 'Hospitality', baseVulnerability: 15 },
      construction: { label: 'Construction', baseVulnerability: 22 },
      services: { label: 'Professional Services', baseVulnerability: 8 },
      logistics: { label: 'Logistics/Warehousing', baseVulnerability: 16 },
    },
    defaultSectorVulnerability: 15,
  },

  // Transparent, documented cashflow-scenario assumptions.
  scenario: {
    defaultRevenueDisruptionPct: 0.5,
    defaultAmortisationYears: 5,
    backupMitigationPct: 0.4,
    emergencyReserveCoverPct: 0.5,
    reserveCoverMonths: 6,
  },

  business: {
    industries: [
      'retail',
      'manufacturing',
      'agriculture',
      'food_processing',
      'hospitality',
      'construction',
      'services',
      'logistics',
      'other',
    ],
    sizes: ['micro', 'small', 'medium'],
    stages: ['startup', 'growth', 'established'],
    indianStates: [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
      'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
      'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
      'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
      'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry',
    ],
  },

  limits: {
    maxJsonBody: '256kb',
  },
};

module.exports = config;
