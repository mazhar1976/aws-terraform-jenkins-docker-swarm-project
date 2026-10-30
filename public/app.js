const currency = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

async function loadDashboard() {
  const [dashboardResponse, productsResponse] = await Promise.all([
    fetch('/api/dashboard'), fetch('/api/products')
  ]);
  if (!dashboardResponse.ok || !productsResponse.ok) throw new Error('Unable to load inventory data');
  const dashboard = await dashboardResponse.json();
  const products = await productsResponse.json();

  document.querySelector('#totalProducts').textContent = dashboard.total_products;
  document.querySelector('#totalUnits').textContent = dashboard.total_units;
  document.querySelector('#lowStock').textContent = dashboard.low_stock_count;
  document.querySelector('#inventoryValue').textContent = currency.format(Number(dashboard.inventory_value));

  const body = document.querySelector('#productsBody');
  body.replaceChildren();
  if (!products.length) {
    const row = body.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 6;
    cell.textContent = 'No products yet. Add your first product below.';
    return;
  }
  products.forEach(product => {
    const row = body.insertRow();
    [product.sku, product.name, product.category, product.quantity, product.reorder_level, currency.format(Number(product.unit_price))]
      .forEach((value, index) => {
        const cell = row.insertCell();
        cell.textContent = value;
        if (index === 3 && Number(product.quantity) <= Number(product.reorder_level)) cell.className = 'low';
      });
  });
}

document.querySelector('#refreshBtn').addEventListener('click', () => loadDashboard().catch(showError));
document.querySelector('#productForm').addEventListener('submit', async event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const payload = Object.fromEntries(form.entries());
  for (const key of ['quantity', 'reorder_level', 'unit_price']) payload[key] = Number(payload[key]);
  try {
    const response = await fetch('/api/products', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not add product');
    event.currentTarget.reset();
    document.querySelector('#message').textContent = `Product ${result.sku} added successfully.`;
    await loadDashboard();
  } catch (error) { showError(error); }
});

function showError(error) {
  document.querySelector('#message').textContent = error.message;
}
loadDashboard().catch(showError);
