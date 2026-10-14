// Shared PostgreSQL connection pool.
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Missing DATABASE_URL. Add it as a Replit Secret (or in .env locally).');
  process.exit(1);
}

// Local connections don't use TLS; hosted Replit Postgres expects it.
const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);

const pool = new Pool(
  isLocal ? { connectionString } : { connectionString, ssl: { rejectUnauthorized: false } }
);

module.exports = pool;
