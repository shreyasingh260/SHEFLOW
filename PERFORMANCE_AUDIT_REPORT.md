# SheFlow Database, Connection Pool & 1,000-Concurrent-User Performance Audit Report

**Date:** November 9, 2026  
**Auditor:** MySQL Database Specialist & Senior Performance Engineer  
**Workload Target:** 1,000 Concurrent Virtual Users  
**Primary Architecture Target:** 0 overselling, 0 duplicate orders, <500ms p95 latency, <1s p99 latency, <1% failure rate

---

## 1. Baseline Performance Analysis

### 1.1. HikariCP Connection Pool
- **Current State:** Default Hikari configuration (`maximum-pool-size = 10`, `minimum-idle = 10`, `connection-timeout = 30000ms`).
- **Capacity Calculation under 1,000 Concurrent Virtual Users:**
  - With 1,000 concurrent threads active and an average query execution duration of 15ms:
    $$\text{Max Throughput with 10 connections} = \frac{10}{0.015\text{s}} \approx 666 \text{ queries/sec}$$
  - When 1,000 concurrent virtual users execute multi-query endpoints (e.g., checkout = read product + lock product + check stock + create order + insert order items + insert payment = 6 queries):
    $$\text{Required Query Throughput} \approx 6,000 \text{ queries/sec}$$
  - **Result:** Connection pool queue saturation within **1.2 seconds**. 90%+ of incoming requests will throw `SQLTransientConnectionException: HikariPool-1 - Connection is not available, request timed out after 30000ms`.
- **Target HikariCP Configuration:**
  - `maximum-pool-size: 50`
  - `minimum-idle: 20`
  - `connection-timeout: 20000` (20s)
  - `idle-timeout: 300000` (5 mins)
  - `max-lifetime: 1200000` (20 mins)
  - `leak-detection-threshold: 2000` (2s leak detection)

---

## 2. Database Schema, Query & Indexing Deficiencies

### 2.1. Missing Database Indexes
Inspecting the entities revealed that queries are executing without database index support:

1. **`products` table:**
   - Query: `SELECT * FROM products WHERE UPPER(category) = ? ORDER BY rating DESC`
   - **Current Index:** Only PRIMARY KEY (`id`).
   - **Bottleneck:** Full table scan (`type = ALL`, `Using filesort`).
   - **Remedy:** Composite index `idx_products_cat_rating (category, rating DESC)`.
   - **Search Query:** `SELECT * FROM products WHERE name LIKE ?`
   - **Remedy:** Index on `name` or fulltext index for keyword search.

2. **`period_logs` table:**
   - Query: `SELECT * FROM period_logs WHERE user_id = ? ORDER BY start_date DESC`
   - **Bottleneck:** Filesort on `start_date` for user queries.
   - **Remedy:** Composite index `idx_period_logs_user_date (user_id, start_date DESC)`.

3. **`water_logs` table:**
   - Query: `SELECT * FROM water_logs WHERE user_id = ? AND log_date = ?`
   - **Bottleneck:** Repeated table scan on high-frequency hydration logging.
   - **Remedy:** Unique composite index `uk_water_logs_user_date (user_id, log_date)`.

4. **`orders` table (To Be Built):**
   - Query: `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`
   - **Remedy:** Composite index `idx_orders_user_created (user_id, created_at DESC)`.
   - Idempotency query: `SELECT * FROM orders WHERE idempotency_key = ?`
   - **Remedy:** Unique constraint `uk_orders_idempotency (idempotency_key)`.

---

## 3. Concurrency, Race Conditions & Inventory Overselling

### 3.1. The "Last Item in Stock" Race Condition
In an e-commerce catalog under high concurrency (e.g. 500 users trying to buy the last 5 Nua Menstrual Cups):
- **Naive Implementation (Vulnerable):**
  1. `Product p = repo.findById(id);`
  2. `if (p.getStock() >= qty) { p.setStock(p.getStock() - qty); repo.save(p); }`
- **Result:** Two concurrent transactions read `stock = 1` at the exact same millisecond. Both pass the check. Both decrement to 0 and save. **1 physical item is sold to 2 different paying customers.**

### 3.2. Concurrency Control Solution
1. **Pessimistic Locking in JPA:**
   ```java
   @Lock(LockModeType.PESSIMISTIC_WRITE)
   @Query("SELECT p FROM Product p WHERE p.id = :id")
   Optional<Product> findByIdWithLock(@Param("id") Long id);
   ```
   *Places an InnoDB `SELECT ... FOR UPDATE` row lock, forcing concurrent purchase requests for the same item to serialize safely.*
2. **Atomic In-Database Decrement:**
   ```sql
   UPDATE products SET stock = stock - :quantity WHERE id = :id AND stock >= :quantity;
   ```
   *Guarantees zero negative stock at the database engine level.*

---

## 4. Target Performance Benchmarks (k6 Load Test Plan)

| Workflow / Endpoint | 100 VUs Target | 500 VUs Target | 1,000 VUs Target | Max Failure Rate |
|:---|:---:|:---:|:---:|:---:|
| **Public Catalog Browsing (`GET /products`)** | p95 < 60ms | p95 < 150ms | p95 < 300ms | < 0.1% |
| **Product Search (`GET /products/search`)** | p95 < 80ms | p95 < 200ms | p95 < 350ms | < 0.1% |
| **User Authentication (`POST /auth/login`)** | p95 < 120ms | p95 < 300ms | p95 < 500ms | < 0.5% |
| **Cart Operations (`POST /cart/items`)** | p95 < 90ms | p95 < 220ms | p95 < 400ms | < 0.5% |
| **Checkout & Inventory Lock (`POST /orders/checkout`)** | p95 < 150ms | p95 < 350ms | p95 < 600ms | 0% (0 oversell) |
