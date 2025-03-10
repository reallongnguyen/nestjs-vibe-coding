/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable prettier/prettier */
/* eslint-disable no-undef */
/* eslint-disable import/no-unresolved */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 50 },  // Ramp up to 50 users
    { duration: '3m', target: 50 },  // Stay at 50 users
    { duration: '1m', target: 100 }, // Ramp up to 100 users
    { duration: '3m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests must complete below 200ms
    errors: ['rate<0.01'],            // Error rate must be less than 1%
  },
};

const BASE_URL = __ENV.GORSE_URL || 'http://localhost:8088';
const API_KEY = __ENV.GORSE_API_KEY || 'gorse';

// Headers setup
const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY,
};

// Helper function to generate test data
function generateTestData() {
  const userId = `user_${Math.floor(Math.random() * 1000)}`;
  const itemId = `item_${Math.floor(Math.random() * 1000)}`;
  const timestamp = new Date().toISOString();

  return { userId, itemId, timestamp };
}

export default function () {
  const { userId, itemId, timestamp } = generateTestData();

  // Test user operations
  const userRes = http.post(`${BASE_URL}/api/user`, JSON.stringify({
    UserId: userId,
    Labels: ['test', 'load'],
    Subscribe: ['category1'],
  }), { headers });

  check(userRes, {
    'user created successfully': (r) => r.status === 200,
  }) || errorRate.add(1);

  // Test item operations
  const itemRes = http.post(`${BASE_URL}/api/item`, JSON.stringify({
    ItemId: itemId,
    Labels: ['test', 'load'],
    Categories: ['category1'],
    Timestamp: timestamp,
  }), { headers });

  check(itemRes, {
    'item created successfully': (r) => r.status === 200,
  }) || errorRate.add(1);

  // Test feedback operations
  const feedbackRes = http.post(`${BASE_URL}/api/feedback`, JSON.stringify([{
    FeedbackType: 'like',
    UserId: userId,
    ItemId: itemId,
    Timestamp: timestamp,
  }]), { headers });

  check(feedbackRes, {
    'feedback created successfully': (r) => r.status === 200,
  }) || errorRate.add(1);

  // Test recommendation operations
  const recommendRes = http.get(`${BASE_URL}/api/recommend/${userId}?n=10`, { headers });

  check(recommendRes, {
    'recommendations retrieved successfully': (r) => r.status === 200,
  }) || errorRate.add(1);

  // Test health check
  const healthRes = http.get(`${BASE_URL}/api/health/ready`, { headers });

  check(healthRes, {
    'health check successful': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);
} 
