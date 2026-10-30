const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Enable SSL explicitly for managed databases when required.
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined
});

async function initialiseDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      sku VARCHAR(64) UNIQUE NOT NULL,
      name VARCHAR(160) NOT NULL,
      category VARCHAR(100) NOT NULL DEFAULT 'General',
      quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
      reorder_level INTEGER NOT NULL DEFAULT 10 CHECK (reorder_level >= 0),
      unit_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

module.exports = { pool, initialiseDatabase };
