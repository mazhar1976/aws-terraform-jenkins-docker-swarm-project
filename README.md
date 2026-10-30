# InventoryHub – Inventory Management System

A small Node.js + PostgreSQL inventory application built as the application layer for an AWS DevOps portfolio project.

## Features

- Inventory dashboard: product count, units in stock, low-stock count and inventory value.
- Create products with SKU, category, quantity, reorder level and unit price.
- REST API for listing products, low-stock products, stock adjustments and deletion.
- `/health` endpoint checks application-to-database connectivity.
- Automated API tests using Node's test runner and Supertest.
- Dockerfile and Docker Compose development environment.

## Run locally with Docker

Requirements: Docker Desktop or Docker Engine with the Compose plugin.

```bash
docker compose up --build
```

Open http://localhost:3000

Stop the application:

```bash
docker compose down
```

Remove the local database volume as well (this permanently deletes local inventory data):

```bash
docker compose down -v
```

## Run without Docker

Requirements: Node.js 20+ and PostgreSQL 14+.

1. Create a PostgreSQL database and user, or use the Compose `db` service.
2. Copy `.env.example` to `.env` and update `DATABASE_URL`.
3. Install packages and start the application:

```bash
npm install
npm start
```

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Application and database health |
| GET | `/api/dashboard` | Inventory summary |
| GET | `/api/products` | List all products |
| GET | `/api/products/low-stock` | Products at/below reorder level |
| POST | `/api/products` | Create a product |
| PATCH | `/api/products/:id/stock` | Increase/decrease stock |
| DELETE | `/api/products/:id` | Delete a product |

Example create request:

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"sku":"SWEAT-001","name":"Navy sweatshirt","category":"Sweatshirts","quantity":25,"reorder_level":10,"unit_price":18.50}'
```

Example stock adjustment:

```bash
curl -X PATCH http://localhost:3000/api/products/1/stock \
  -H "Content-Type: application/json" \
  -d '{"change":-2}'
```

## Run tests

```bash
npm install
npm test
npm run test:coverage
```

Tests use a fake database adapter, so they do not require PostgreSQL.

## Next DevOps stages

1. GitHub repository and webhook integration.
2. Terraform AWS infrastructure (network, IAM, EC2, ECR and CloudWatch).
3. Jenkins pipeline with test, SonarQube and Trivy quality/security gates.
4. Docker Swarm deployment to EC2 nodes.
5. Prometheus, Grafana, CloudWatch alarms and SNS notifications.

## Security notes

- Do not commit `.env`, credentials, private keys or AWS access keys.
- The Compose PostgreSQL password is for local development only; replace it with managed secrets before any shared deployment.
- Restrict SSH and administrative web interfaces to trusted IP addresses.
- Pin production image versions and review dependency and container scan results before deployment.
