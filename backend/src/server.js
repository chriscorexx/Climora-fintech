'use strict';

const { createApp } = require('./app.js');
const config = require('./config/index.js');
const { initDatabase, closeDatabase } = require('./db/index.js');
const seed = require('./db/seed.js');

const db = initDatabase(config.database.path);

// Schema initialisation is idempotent and never deletes existing rows.
// Demo data is only inserted when the tables are empty.
if (config.database.seedDemoData) {
  try {
    const result = seed.seed();
    console.log(
      `[climora] database ready at ${config.database.path} ` +
        `(schemes: ${result.schemes}, demo businesses: ${result.businesses}${result.skipped ? ', seed skipped' : ''})`
    );
  } catch (error) {
    console.error('[climora] seeding failed:', error.message);
  }
} else {
  console.log(`[climora] database ready at ${config.database.path} (demo seeding disabled)`);
}

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`Climora API running at http://localhost:${config.port}`);
  console.log(`[climora] environment: ${config.env}`);
});

function shutdown(signal) {
  console.log(`\n[climora] ${signal} received, shutting down.`);
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
  // Force exit if connections keep the process alive.
  setTimeout(() => process.exit(0), 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('[climora] unhandled rejection:', reason);
});

module.exports = { app, server, db };
