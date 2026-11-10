# SheFlow Grafana k6 Load Testing Guide (100 -> 1,000 Concurrent Virtual Users)

**Target Workload:** 1,000 Concurrent Virtual Users (VUs)  
**Target Application:** SheFlow Spring Boot 3 Backend (`http://localhost:8080`)

---

## 1. k6 Installation Instructions

### Option A: Windows (winget or choco)
```powershell
# Using Windows Package Manager (winget)
winget install k6 --source winget

# Or using Chocolatey
choco install k6
```

### Option B: Direct Binary Download
Download the official portable executable from [k6 GitHub Releases](https://github.com/grafana/k6/releases) and extract `k6.exe` to a folder in your `PATH`.

### Option C: Running via Docker
```powershell
docker run --rm -i --network="host" grafana/k6 run - < k6/test_1000_users.js
```

---

## 2. Realistic E-Commerce Load Profile Stages

A realistic simulation does not immediately spike to 1,000 virtual users. It ramps up systematically:

```javascript
export const options = {
  stages: [
    { duration: '30s', target: 100 },   // Warm-up & 100 concurrent users
    { duration: '1m',  target: 250 },   // Ramp up to 250 users
    { duration: '1m',  target: 500 },   // Ramp up to 500 users
    { duration: '2m',  target: 1000 },  // Sustained peak load of 1,000 users
    { duration: '30s', target: 0 },     // Ramp-down & cool-off
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // 95% of requests under 500ms
    'http_req_failed': ['rate<0.01'],                  // Error rate < 1%
  },
};
```

---

## 3. Workload Distribution

A realistic distribution of actions across the 1,000 simulated users:
- **60% Browsing & Search Traffic:** Calling `GET /api/v1/products?page=0&size=10` and `GET /api/v1/products/search?q=pads`.
- **20% User Authentication & Profile:** Calling `POST /api/v1/auth/login` and `GET /api/v1/users/me`.
- **15% Cart Operations:** Calling `POST /api/v1/cart/items` and `GET /api/v1/cart`.
- **5% High-Stress Checkout Operations:** Calling `POST /api/v1/orders/checkout` with idempotency keys and competing for shared product stock.

---

## 4. Test Execution Commands

```powershell
# Run basic smoke test (10 VUs for 30 seconds)
k6 run --vus 10 --duration 30s k6/smoke_test.js

# Run full 1,000 concurrent user benchmark
k6 run k6/load_test_1000_users.js

# Run high-concurrency race condition inventory test (200 users buying 10 items simultaneously)
k6 run k6/inventory_concurrency_test.js
```

---

## 5. Result Interpretation Guidelines

- **`http_req_duration` p95 & p99:** Must stay under 500ms and 1,000ms respectively. If p95 spikes past 2,000ms, database connection starvation or slow queries are present.
- **`http_req_failed`:** Must be < 1%. If 500 errors spike, check Spring Boot logs for `HikariPool - Connection is not available` or deadlock exceptions.
- **Inventory Verification:** After the test, query `SELECT stock FROM products WHERE id = :id`. The remaining stock must be strictly `>= 0` and total orders created must equal `initial_stock - final_stock`.
