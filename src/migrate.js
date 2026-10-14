// Applies db/schema.sql to the database. Run: npm run migrate
const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function migrate() {
  const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // No parameters here, so pg uses the simple protocol: multiple statements are fine.
  await pool.query(schema);
  console.log('Migration complete — schema is up to date.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
