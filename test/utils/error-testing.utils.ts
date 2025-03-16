import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

/**
 * Standard error response schema expected from the application
 */
export interface ErrorResponseSchema {
  code: string;
  message: string;
  timestamp: string;
  params?: Record<string, any>;
}

/**
 * Validates that a response contains a properly structured error response
 * @param response The HTTP response to validate
 */
export const validateErrorResponse = (response: any): void => {
  expect(response.body).toBeDefined();
  expect(response.body).toHaveProperty('code');
  expect(response.body).toHaveProperty('message');
  expect(response.body).toHaveProperty('timestamp');
};

/**
 * Tests a specific error scenario and validates the response
 * @param app The NestJS application instance
 * @param method HTTP method to use
 * @param endpoint API endpoint to test
 * @param expectedStatus Expected HTTP status code
 * @param expectedErrorCode Expected error code in response
 * @param requestBody Optional request body for POST/PUT/PATCH requests
 * @param headers Optional request headers
 */
export const testErrorScenario = (
  app: INestApplication,
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  endpoint: string,
  expectedStatus: number,
  expectedErrorCode: string,
  requestBody?: any,
  headers?: Record<string, string>,
) => {
  const req = request(app.getHttpServer())[method](endpoint);

  // Add headers if provided
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      req.set(key, value);
    });
  }

  // Add request body for appropriate methods
  if (['post', 'put', 'patch'].includes(method) && requestBody) {
    req.send(requestBody);
  }

  return req.expect(expectedStatus).expect((res) => {
    validateErrorResponse(res);
    expect(res.body.code).toBe(expectedErrorCode);
  });
};

/**
 * Measures the performance of an error response
 * @param app The NestJS application instance
 * @param method HTTP method to use
 * @param endpoint API endpoint to test
 * @param expectedStatus Expected HTTP status code
 * @param expectedErrorCode Expected error code in response
 * @param requestBody Optional request body
 * @param maxResponseTimeMs Maximum acceptable response time in milliseconds
 */
export const measureErrorResponseTime = async (
  app: INestApplication,
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  endpoint: string,
  expectedStatus: number,
  expectedErrorCode: string,
  requestBody?: any,
  maxResponseTimeMs: number = 50,
): Promise<number> => {
  const start = process.hrtime();

  await testErrorScenario(
    app,
    method,
    endpoint,
    expectedStatus,
    expectedErrorCode,
    requestBody,
  );

  const end = process.hrtime(start);
  const timeInMs = end[0] * 1000 + end[1] / 1000000;

  expect(timeInMs).toBeLessThan(maxResponseTimeMs);

  return timeInMs;
};

/**
 * Generates a test object with invalid properties to trigger validation errors
 * @param validObject Valid object to base the invalid one on
 * @param invalidProperties Properties to make invalid
 */
export const generateInvalidTestObject = <T extends Record<string, any>>(
  validObject: T,
  invalidProperties: Record<keyof T, any>,
): T => {
  return {
    ...validObject,
    ...invalidProperties,
  };
};

/**
 * Creates a mock auth token for testing protected endpoints
 * @param userId User ID to include in the token
 * @param roles User roles to include in the token
 */
export const createMockAuthToken = (
  userId: string,
  roles: string[] = ['user'],
): string => {
  // Create a simple JWT token structure
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .toString('base64')
    .replace(/=/g, '');
  const payload = Buffer.from(JSON.stringify({ sub: userId, roles }))
    .toString('base64')
    .replace(/=/g, '');
  const signature = Buffer.from('test-signature')
    .toString('base64')
    .replace(/=/g, '');

  return `${header}.${payload}.${signature}`;
};
