const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../src/app');

function fakeDb() {
  return {
    query: async (sql, params = []) => {
      if (sql.includes('SELECT 1')) return { rows: [{ '?column?': 1 }] };
      if (sql.includes('INSERT INTO products')) {
        return { rowCount: 1, rows: [{ id: 1, sku: params[0], name: params[1], quantity: params[3] }] };
      }
      if (sql.includes('FROM products WHERE quantity <= reorder_level')) return { rows: [] };
      if (sql.includes('COUNT(*)')) return { rows: [{ total_products: 0, total_units: 0, low_stock_count: 0, inventory_value: '0.00' }] };
      if (sql.includes('SELECT * FROM products')) return { rows: [] };
      if (sql.includes('UPDATE products')) return { rowCount: 0, rows: [] };
      if (sql.includes('DELETE FROM products')) return { rowCount: 0, rows: [] };
      return { rowCount: 0, rows: [] };
    }
  };
}

const app = createApp(fakeDb());

test('GET /health returns healthy status when database responds', async () => {
  const response = await request(app).get('/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
});

test('POST /api/products requires SKU and name', async () => {
  const response = await request(app).post('/api/products').send({ sku: 'SKU-1' });
  assert.equal(response.status, 400);
});

test('POST /api/products creates a product', async () => {
  const response = await request(app).post('/api/products').send({
    sku: 'SKU-1', name: 'Navy sweatshirt', quantity: 25, unit_price: 18.5
  });
  assert.equal(response.status, 201);
  assert.equal(response.body.sku, 'SKU-1');
});

test('PATCH stock rejects zero change', async () => {
  const response = await request(app).patch('/api/products/1/stock').send({ change: 0 });
  assert.equal(response.status, 400);
});
