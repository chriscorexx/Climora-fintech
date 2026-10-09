import { app } from './app';
import { config } from './config';
import { seedDatabaseIfEmpty } from './db/seed';

// Ensure database and tables are seeded
seedDatabaseIfEmpty();

const server = app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(` Climora FinTech & Climate Risk Backend (TypeScript)   `);
  console.log(` Status: Running at http://localhost:${config.port}/api       `);
  console.log(` Database: SQLite initialized at ${config.databasePath}`);
  console.log(` Framework: FUSION 2026 Hackathon (IFC FIN-05)         `);
  console.log(`=======================================================`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
