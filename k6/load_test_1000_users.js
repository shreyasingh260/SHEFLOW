import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom Metrics
const successfulCheckouts = new Counter('successful_checkouts');
const rejectedCheckouts = new Counter('rejected_checkouts');
const authFailureRate = new Rate('auth_failure_rate');
const catalogBrowseLatency = new Trend('catalog_browse_latency');
const checkoutLatency = new Trend('checkout_latency');

const BASE_URL = __ENV.API_URL || 'http://localhost:8080/api/v1';

// 1,000 Virtual User Load Progression Stages
export const options = {
  stages: [
    { duration: '30s', target: 100 },   // Warm-up to 100 concurrent users
    { duration: '45s', target: 250 },   // Ramp up to 250 users
    { duration: '1m',  target: 500 },   // Ramp up to 500 users
    { duration: '1m',  target: 750 },   // Ramp up to 750 users
    { duration: '2m',  target: 1000 },  // Sustained peak load of 1,000 concurrent virtual users
    { duration: '30s', target: 1200 },  // Capacity exploration (1,200 VUs)
    { duration: '45s', target: 0 },     // Ramp-down to 0
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // 95% under 500ms, 99% under 1,000ms
    'http_req_failed': ['rate<0.01'],                  // HTTP failure rate below 1%
    'auth_failure_rate': ['rate<0.02'],
    'catalog_browse_latency': ['p(95)<300'],
    'checkout_latency': ['p(95)<600'],
  },
};

export default function () {
  const vuId = __VU;
  const iterId = __ITER;
  const userEmail = `k6_user_${vuId}_${iterId % 20}@test.com`;
  const userPassword = 'TestPassword@123';

  let authToken = null;

  // ─── 1. USER AUTHENTICATION & LOGIN (20% weight) ─────────────────────────
  group('1. User Login / Registration', function () {
    const loginPayload = JSON.stringify({
      email: userEmail,
      password: userPassword,
    });
    const params = { headers: { 'Content-Type': 'application/json' } };

    let res = http.post(`${BASE_URL}/auth/login`, loginPayload, params);
    if (res.status === 401) {
      // User doesn't exist yet: register
      const signupPayload = JSON.stringify({
        fullName: `k6 Virtual User ${vuId}`,
        email: userEmail,
        password: userPassword,
        confirmPassword: userPassword,
        dateOfBirth: '2000-01-01',
      });
      const signupRes = http.post(`${BASE_URL}/auth/signup`, signupPayload, params);
      if (signupRes.status === 200) {
        const body = JSON.parse(signupRes.body);
        authToken = body.accessToken;
      }
    } else if (res.status === 200) {
      const body = JSON.parse(res.body);
      authToken = body.accessToken;
      authFailureRate.add(0);
    } else {
      authFailureRate.add(1);
    }
  });

  sleep(Math.random() * 0.5 + 0.2);

  // ─── 2. PRODUCT BROWSING & PAGINATION (60% weight) ───────────────────────
  group('2. Product Browsing & Search', function () {
    const tStart = Date.now();
    // Browse page 0
    let res = http.get(`${BASE_URL}/products?page=0&size=10`);
    catalogBrowseLatency.add(Date.now() - tStart);

    check(res, {
      'catalog returns status 200': (r) => r.status === 200,
    });

    // Keyword search
    const query = (vuId % 2 === 0) ? 'pads' : 'cup';
    let searchRes = http.get(`${BASE_URL}/products/search?q=${query}&page=0&size=5`);
    check(searchRes, {
      'search returns status 200': (r) => r.status === 200,
    });
  });

  sleep(Math.random() * 0.5 + 0.2);

  if (!authToken) {
    return; // Cannot execute cart/checkout without auth
  }

  const authParams = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  };

  // ─── 3. CART OPERATIONS (15% weight) ─────────────────────────────────────
  let productIdToBuy = (vuId % 4) + 1; // target seeded products 1 to 4

  group('3. Cart Management', function () {
    // Add item to cart
    const addPayload = JSON.stringify({
      productId: productIdToBuy,
      quantity: 1,
    });
    let addRes = http.post(`${BASE_URL}/cart/items`, addPayload, authParams);
    check(addRes, {
      'add to cart returns 200': (r) => r.status === 200,
    });

    // Fetch user cart
    let cartRes = http.get(`${BASE_URL}/cart`, authParams);
    check(cartRes, {
      'cart fetch returns 200': (r) => r.status === 200,
      'cart has valid total': (r) => JSON.parse(r.body).grandTotal > 0,
    });
  });

  sleep(Math.random() * 0.5 + 0.2);

  // ─── 4. CHECKOUT & INVENTORY DEDUCTION (5% of loop) ──────────────────────
  // Trigger checkout on a fraction of simulated sessions
  if (iterId % 3 === 0) {
    group('4. Checkout & Idempotency', function () {
      const idempotencyKey = `idemp_${vuId}_${iterId}_${Date.now()}`;
      const checkoutPayload = JSON.stringify({
        idempotencyKey: idempotencyKey,
        shippingAddress: 'Plot 42, Sector 18, Gurugram, HR',
        contactPhone: '9876543210',
        paymentGateway: 'MOCK_GATEWAY',
      });

      const checkoutHeaders = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'Idempotency-Key': idempotencyKey,
        },
      };

      const tStart = Date.now();
      let checkoutRes = http.post(`${BASE_URL}/orders/checkout`, checkoutPayload, checkoutHeaders);
      checkoutLatency.add(Date.now() - tStart);

      if (checkoutRes.status === 200) {
        successfulCheckouts.add(1);
        check(checkoutRes, {
          'checkout confirmed with order number': (r) => JSON.parse(r.body).orderNumber !== undefined,
        });

        // Test idempotency replay
        let replayRes = http.post(`${BASE_URL}/orders/checkout`, checkoutPayload, checkoutHeaders);
        check(replayRes, {
          'idempotent replay returns 200': (r) => r.status === 200,
          'idempotent replay preserves order number': (r) => JSON.parse(r.body).orderNumber === JSON.parse(checkoutRes.body).orderNumber,
        });
      } else if (checkoutRes.status === 400 || checkoutRes.status === 500) {
        // Expected when physical stock is fully depleted
        rejectedCheckouts.add(1);
      }
    });
  }

  sleep(Math.random() * 0.8 + 0.2);
}
