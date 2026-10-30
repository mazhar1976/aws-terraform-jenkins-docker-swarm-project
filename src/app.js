const express = require('express');
const path = require('path');

function createApp(db) {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/health', async (req, res) => {
    try {
      await db.query('SELECT 1');
      res.status(200).json({ status: 'ok', database: 'connected' });
    } catch {
      res.status(503).json({ status: 'error', database: 'unavailable' });
    }
  });

  app.get('/api/products', async (req, res, next) => {
    try {
      const result = await db.query('SELECT * FROM products ORDER BY id DESC');
      res.json(result.rows);
    } catch (err) { next(err); }
  });

  app.get('/api/products/low-stock', async (req, res, next) => {
    try {
      const result = await db.query(
        'SELECT * FROM products WHERE quantity <= reorder_level ORDER BY quantity ASC'
      );
      res.json(result.rows);
    } catch (err) { next(err); }
  });

  app.get('/api/dashboard', async (req, res, next) => {
    try {
      const result = await db.query(`
        SELECT
          COUNT(*)::int AS total_products,
          COALESCE(SUM(quantity), 0)::int AS total_units,
          COUNT(*) FILTER (WHERE quantity <= reorder_level)::int AS low_stock_count,
          COALESCE(SUM(quantity * unit_price), 0)::numeric(14,2) AS inventory_value
        FROM products
      `);
      res.json(result.rows[0]);
    } catch (err) { next(err); }
  });

  app.post('/api/products', async (req, res, next) => {
    const { sku, name, category = 'General', quantity = 0, reorder_level = 10, unit_price = 0 } = req.body;
    if (!sku || !name) {
      return res.status(400).json({ error: 'SKU and product name are required' });
    }
    if (![quantity, reorder_level, unit_price].every(v => Number.isFinite(Number(v)) && Number(v) >= 0)) {
      return res.status(400).json({ error: 'Quantity, reorder level and unit price must be non-negative numbers' });
    }
    try {
      const result = await db.query(
        `INSERT INTO products (sku, name, category, quantity, reorder_level, unit_price)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [sku, name, category, Number(quantity), Number(reorder_level), Number(unit_price)]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'SKU already exists' });
      next(err);
    }
  });

  app.patch('/api/products/:id/stock', async (req, res, next) => {
    const change = Number(req.body.change);
    if (!Number.isInteger(change) || change === 0) {
      return res.status(400).json({ error: 'Stock change must be a non-zero integer' });
    }
    try {
      const result = await db.query(
        `UPDATE products
         SET quantity = quantity + $1, updated_at = NOW()
         WHERE id = $2 AND quantity + $1 >= 0
         RETURNING *`,
        [change, req.params.id]
      );
      if (!result.rowCount) return res.status(404).json({ error: 'Product not found or stock cannot become negative' });
      res.json(result.rows[0]);
    } catch (err) { next(err); }
  });

  app.delete('/api/products/:id', async (req, res, next) => {
    try {
      const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [req.params.id]);
      if (!result.rowCount) return res.status(404).json({ error: 'Product not found' });
      res.status(204).send();
    } catch (err) { next(err); }
  });

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };
