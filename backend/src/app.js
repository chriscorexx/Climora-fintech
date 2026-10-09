'use strict';

const express = require('express');
const cors = require('cors');

const config = require('./config/index.js');
const apiRoutes = require('./routes/index.js');
const { notFoundHandler, errorHandler } = require('./middleware/asyncHandler.js');

/**
 * Builds the Express application.
 *
 * Exported separately from `src/server.js` so tests can mount the app without
 * binding a port.
 */
function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    cors({
      origin(origin, callback) {
        // Allow non-browser clients (curl, Electron main process, server-to-server).
        if (!origin) return callback(null, true);
        if (config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
      },
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-Climora-Owner'],
      exposedHeaders: ['Content-Type'],
      maxAge: 600,
    })
  );

  app.use(express.json({ limit: config.limits.maxJsonBody }));
  app.use(express.urlencoded({ extended: false, limit: '64kb' }));

  // Guarantee `req.body` is always an object, including for body-less POSTs.
  app.use((req, res, next) => {
    if (req.body === undefined || req.body === null) req.body = {};
    next();
  });

  app.get('/api', (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        service: 'climora-api',
        version: '1.0.0',
        endpoints: [
          'GET /api/health',
          'GET /api/config',
          'GET|POST /api/businesses',
          'GET|PATCH|PUT|DELETE /api/businesses/:id',
          'GET /api/assessments',
          'GET /api/assessments/:id',
          'GET|POST /api/businesses/:id/assessments',
          'GET /api/climate/geocode?q=',
          'GET /api/climate/businesses/:id',
          'GET|POST /api/businesses/:id/scenarios',
          'GET|DELETE /api/scenarios/:id',
          'GET /api/schemes',
          'GET /api/schemes/:id',
          'GET /api/schemes/saved',
          'GET /api/businesses/:id/scheme-matches',
          'POST|DELETE /api/schemes/:id/save',
          'GET|PUT /api/businesses/:id/loan-readiness',
          'PATCH /api/businesses/:id/loan-readiness/documents/:documentName',
          'GET|POST /api/businesses/:id/improvements',
          'PATCH /api/businesses/:id/improvements/:actionId',
          'GET /api/dashboard',
        ],
        documentation: 'backend/API.md',
      },
    });
  });

  app.use('/api', apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
