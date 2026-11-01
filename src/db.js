
const { Pool } = require('pg');
const fs = require('fs');

let connectionString = process.env.DATABASE_URL;

if (process.env.DB_PASSWORD_FILE) {
  const password = fs.readFileSync(
    process.env.DB_PASSWORD_FILE,
    'utf8'
  ).trim();

  connectionString =
    `postgres://${process.env.DB_USER}:` +
    `${encodeURIComponent(password)}@` +
    `${process.env.DB_HOST}:` +
    `${process.env.DB_PORT || 5432}/` +
    `${process.env.DB_NAME}`;
}

const pool = new Pool({
  connectionString,
  ssl: process.env.PGSSL === 'true'
    ? { rejectUnauthorized: false }
    : undefined
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


