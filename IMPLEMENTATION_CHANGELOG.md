# SheFlow Backend Implementation & Remediation Changelog

**Tracking File for All Technical Modifications & Remediations**

---

## [Phase 1 & 2: Inspection & Baseline Audit] - November 9, 2026
- Inspected all backend controllers, services, repositories, entities, configuration files, and Maven dependencies.
- Discovered 4 Critical, 5 High, and 6 Medium vulnerabilities/bottlenecks.
- Generated baseline audit reports:
  - `BACKEND_AUDIT_REPORT.md`
  - `SECURITY_AUDIT_REPORT.md`
  - `PERFORMANCE_AUDIT_REPORT.md`
  - `LOAD_TESTING_GUIDE.md`
  - `PRODUCTION_READINESS_CHECKLIST.md`

---

## [Phase 4: Security Remediation & Access Control] - Completed
- Fixed Critical & High Vulnerabilities:
  1. **[CRIT-01] Secure Password Reset flow**: `AuthController.java` and `AuthService.java` now enforce 6-digit OTP verification and 5-minute single-use `PASSWORD_RESET` signed JWT tokens. Unauthorized password overwriting without OTP is rejected.
  2. **[CRIT-04] Strict CORS configuration**: `CorsConfig.java` now strictly restricts `Access-Control-Allow-Origin` to configured frontend origins (`http://localhost:3000`, `http://localhost:5173`, etc.) read from `app.cors.allowed-origins` property. Wildcard `*` removed.
  3. **[CRIT-03] Removed hardcoded email fallback**: Completely removed `"shreya@example.com"` fallback across all controllers (`TrackingController.java`, `CycleController.java`, and `ChatController.java`). Added `getAuthenticatedEmail()` utility that strictly enforces authentication and throws `BadCredentialsException`.
  4. **[HIGH-03] JWT Refresh Token Validation**: Added cryptographic signature and expiration verification in `JwtUtil.validateRefreshToken()` ensuring refresh tokens have valid `"type":"REFRESH"` claims.
  5. **[MED-03] Rate Limiting Filter**: Implemented `RateLimitFilter.java` using a sliding-window algorithm enforcing a maximum of 30 requests per minute per IP on `/api/v1/auth/**` to prevent brute-force attacks.
  6. **[MED-06] Exception Sanitization**: Updated `GlobalExceptionHandler.java` to log full stack traces internally via SLF4J and return sanitized, generic error responses to prevent database schema and stack trace leakage.
  7. **Transactional Integrity**: Added `@Transactional(rollbackFor = Exception.class)` on `UserController.completeOnboarding()` and `updateCurrentUser()`.

---

## [Phase 5: E-Commerce Primitives & Concurrency Control] - Completed
- Models, Repositories, Services & Controllers implemented:
  1. Added `stock`, `price`, `brand` fields to `Product.java` with composite database indexes.
  2. Implemented `Cart` & `CartItem` entities with server-side price/total validation and delivery fee calculation (free delivery for orders >= ₹499).
  3. Implemented `Order` & `OrderItem` entities with `idempotencyKey` unique constraint and `OrderStatus` lifecycle enum.
  4. Implemented `OrderService` with **atomic SQL conditional decrement** (`UPDATE products SET stock = stock - qty WHERE id = ? AND stock >= qty`) and persistence context cache eviction (`@Modifying(clearAutomatically = true)`), ensuring 100% protection against overselling and race conditions under concurrent load.
  5. Implemented `PaymentTransaction` entity and repository with transaction ID deduplication.
  6. Added `CartController` (GET/POST/PUT/DELETE) and `OrderController` with idempotent checkout and paginated order history.

---

## [Phase 6: Database Optimization & HikariCP Tuning] - Completed
- HikariCP pool tuned in `application.properties`:
  - `maximum-pool-size=50`
  - `minimum-idle=20`
  - `connection-timeout=20000ms`
  - `leak-detection-threshold=2000ms`
  - `idle-timeout=300000ms`
- Embedded Tomcat tuned for high concurrency:
  - `server.tomcat.threads.max=200`
  - `server.tomcat.threads.min-spare=30`
  - `server.tomcat.accept-count=1000`
  - `server.tomcat.max-connections=10000`
- Composite database indexes added:
  - `idx_products_cat_rating` (`category`, `rating`)
  - `idx_products_name` (`name`)
  - `idx_products_brand` (`brand`)
  - `idx_period_logs_user_date` (`user_id`, `start_date`)
  - `idx_users_created_at` (`created_at`)
- Spring Data JPA pagination added to `ProductController.java` (`?page=&size=`) and JPQL keyword search (`/api/v1/products/search?q=`).

---

## [Phase 7: Monitoring & Observability] - Completed
- Added `spring-boot-starter-actuator` and `micrometer-registry-prometheus` dependencies.
- Configured endpoints in `application.properties`:
  - `/actuator/health` (with probes enabled)
  - `/actuator/prometheus` (Prometheus metrics exposition)
  - `/actuator/metrics`
  - `/actuator/info`
- Configured `SecurityConfig.java` to permit actuator access for monitoring systems.

---

## [Phase 8: Automated Tests & k6 Scripts] - Completed
- Unit & Concurrency Test Suite created in `src/test/java/com/sheflow/backend/`:
  - `OrderServiceConcurrencyTest.java`: Multi-threaded race condition audit (10 concurrent threads, 5 items in stock) proving exactly 5 orders succeed, 5 are rejected with insufficient stock, and final stock in MySQL is exactly 0. Verified idempotency replay safety.
  - `CartServiceTest.java`: Automated testing of cart totals, delivery fee thresholds, inventory quantity limits, and cart cleanup.
  - `AuthControllerTest.java`: Automated verification of user registration, duplicate email rejection, invalid password rejection, and password reset OTP enforcement.
- Grafana k6 scripts created:
  - `k6/load_test_1000_users.js`: 7-stage ramp-up scenario targeting 1,000 concurrent VUs with realistic workload distribution (60% browse/search, 20% cart, 15% auth, 5% checkout).
  - `k6/inventory_concurrency_test.js`: 100 concurrent VU flash sale checkout stress test.
