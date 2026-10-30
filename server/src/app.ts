import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { apiRouter } from './routes';
import { config } from './config';
import { apiRateLimiter } from './middleware/rateLimit';

export const app = express();

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, electron)
      if (!origin) return callback(null, true);
      if (config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-friendly permissive
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Apply general rate limiting
app.use('/api', apiRateLimiter);

// API Root Index
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      name: 'Climora Climate Risk & FinTech API',
      version: '1.1.0',
      framework: 'FUSION 2026 (IFC FIN-05)',
      features: ['Auth', 'Risk Scoring', 'Loan Workflow', 'Climate Data', 'Schemes'],
      endpoints: [
        '/api/health',
        '/api/auth/*',
        '/api/dashboard',
        '/api/businesses',
        '/api/loans/*',
        '/api/businesses/:id/assessments',
        '/api/climate/geocode?q={city}',
        '/api/climate/businesses/:id',
        '/api/businesses/:id/scenarios',
        '/api/schemes',
        '/api/businesses/:id/scheme-matches',
      ],
    },
  });
});

// Mount Routes
app.use('/api', apiRouter);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { message: 'Route not found' },
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Climora API Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      details: config.nodeEnv === 'development' ? err.stack : undefined,
    },
  });
});
