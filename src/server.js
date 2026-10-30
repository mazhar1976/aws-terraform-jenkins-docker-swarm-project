const { createApp } = require('./app');
const { pool, initialiseDatabase } = require('./db');

const port = Number(process.env.PORT || 3000);

async function start() {
  await initialiseDatabase();
  const app = createApp(pool);
  const server = app.listen(port, () => console.log(`InventoryHub listening on port ${port}`));

  const shutdown = () => server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch(err => {
  console.error('Failed to start InventoryHub:', err);
  process.exit(1);
});
