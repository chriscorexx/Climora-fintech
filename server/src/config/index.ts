import path from 'path';

export const config = {
  port: Number(process.env.PORT) || 5000,
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173').split(','),
  nodeEnv: process.env.NODE_ENV || 'development',
  databasePath: process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data/climora.db'),
  scoring: {
    weights: {
      flood: 0.30,
      rainfall: 0.25,
      heat: 0.20,
      business: 0.15,
      financial: 0.10,
    },
    categories: [
      { key: 'low', label: 'Low', min: 0, max: 24 },
      { key: 'moderate', label: 'Moderate', min: 25, max: 49 },
      { key: 'high', label: 'High', min: 50, max: 74 },
      { key: 'severe', label: 'Severe', min: 75, max: 100 },
    ],
    disclaimer:
      'Climora produces an illustrative prototype climate-risk score for IFC FIN-05 decision support. Scores are heuristic indicators, not official credit ratings or probability-of-default predictions.',
  },
};
