import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';

const successfulPurchases = new Counter('successful_purchases');
const rejectedOutOfStock = new Counter('rejected_out_of_stock');

const BASE_URL = __ENV.API_URL || 'http://localhost:8080/api/v1';

// 100 Virtual Users firing simultaneously
export const options = {
  scenarios: {
    flash_sale_spike: {
      executor: 'shared-iterations',
      vus: 100,
      iterations: 100,
      maxDuration: '30s',
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<400'],
  },
};

export default function () {
  const vuId = __VU;
  const email = `flash_buyer_${vuId}_${Date.now()}@test.com`;
  const password = 'FlashSalePass@123';

  // 1. Quick Register
  const signupRes = http.post(`${BASE_URL}/auth/signup`, JSON.stringify({
    fullName: `Flash Buyer ${vuId}`,
    email: email,
    password: password,
    confirmPassword: password,
    dateOfBirth: '2001-01-01',
  }), { headers: { 'Content-Type': 'application/json' } });

  if (signupRes.status !== 200) return;
  const token = JSON.parse(signupRes.body).accessToken;
  const authHeaders = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  // 2. Add product #2 (Menstrual Cup) to cart
  http.post(`${BASE_URL}/cart/items`, JSON.stringify({
    productId: 2,
    quantity: 1,
  }), authHeaders);

  // 3. Compete in Checkout
  const checkoutRes = http.post(`${BASE_URL}/orders/checkout`, JSON.stringify({
    idempotencyKey: `flash_key_${vuId}_${Date.now()}`,
    shippingAddress: 'Instant Flash Sale Address',
    contactPhone: '9876543210',
  }), authHeaders);

  if (checkoutRes.status === 200) {
    successfulPurchases.add(1);
  } else {
    rejectedOutOfStock.add(1);
  }
}
