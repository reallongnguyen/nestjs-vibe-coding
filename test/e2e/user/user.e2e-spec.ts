import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../../src/common/prisma/prisma.service';
import {
  testErrorScenario,
  measureErrorResponseTime,
  createMockAuthToken,
} from '../../utils/error-testing.utils';
import {
  cleanDatabase,
  seedTestData,
  setupTestApp,
} from '../../utils/test-setup.utils';
import { AppModule } from '../../../src/app.module';

describe('UserController (E2E)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let testData: Record<string, any>;

  beforeAll(async () => {
    // Setup app with all required modules
    app = await setupTestApp([AppModule]);
    prismaService = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean database and create fresh test data before each test
    await cleanDatabase(prismaService);
    testData = await seedTestData(prismaService, 'user');
  });

  describe('GET /users/:id', () => {
    it('should return 404 with proper error code when user not found', () => {
      return testErrorScenario(
        app,
        'get',
        '/users/non-existent-id',
        404,
        'user.profile.get.notFound',
      );
    });

    it('should handle error response within performance requirements', async () => {
      await measureErrorResponseTime(
        app,
        'get',
        '/users/non-existent-id',
        404,
        'user.profile.get.notFound',
        undefined,
        50, // Max response time in ms
      );
    });
  });

  describe('POST /users', () => {
    it('should return 400 with validation error for invalid user data', () => {
      const invalidUserData = {
        // Missing required fields
        email: 'not-a-valid-email',
      };

      return testErrorScenario(
        app,
        'post',
        '/users',
        400,
        'common.validation',
        invalidUserData,
      );
    });

    it('should return 409 when creating user with existing email', async () => {
      const existingUserData = {
        firstName: 'Duplicate',
        lastName: 'User',
        email: testData.testUser.email, // Use existing email to trigger conflict
        authId: 'another-auth-id',
      };

      return testErrorScenario(
        app,
        'post',
        '/users',
        409,
        'user.create.emailExists',
        existingUserData,
      );
    });
  });

  describe('PUT /users/:id', () => {
    it('should return 404 when updating non-existent user', () => {
      const validUpdateData = {
        firstName: 'Updated',
        lastName: 'User',
      };

      return testErrorScenario(
        app,
        'put',
        '/users/non-existent-id',
        404,
        'user.update.notFound',
        validUpdateData,
        {
          Authorization: `Bearer admin-token`,
        },
      );
    });

    it('should return 400 with validation error for invalid update data', () => {
      const invalidUpdateData = {
        firstName: '', // Empty first name not allowed
        email: 'not-a-valid-email',
      };

      return testErrorScenario(
        app,
        'put',
        `/users/${testData.testUser.id}`,
        400,
        'common.validation',
        invalidUpdateData,
        {
          Authorization: `Bearer admin-token`,
        },
      );
    });
  });

  describe('DELETE /users/:id', () => {
    it('should return 404 when deleting non-existent user', () => {
      return testErrorScenario(
        app,
        'delete',
        '/users/non-existent-id',
        404,
        'user.delete.notFound',
        undefined,
        {
          Authorization: `Bearer admin-token`,
        },
      );
    });

    it('should return 403 when regular user tries to delete another user', () => {
      return testErrorScenario(
        app,
        'delete',
        '/users/another-user-id',
        403,
        'common.auth.forbidden',
        undefined,
        {
          Authorization: `Bearer ${createMockAuthToken(testData.testUser.id)}`,
        },
      );
    });
  });

  describe('Authentication errors', () => {
    it('should return 401 for protected endpoint without auth token', () => {
      return testErrorScenario(
        app,
        'get',
        '/users/me', // Protected endpoint requiring auth
        401,
        'common.auth.unauthorized',
      );
    });

    it('should return 401 for invalid token format', () => {
      return testErrorScenario(
        app,
        'get',
        '/users/me',
        401,
        'common.auth.invalidToken',
        undefined,
        {
          Authorization: 'Invalid-Token-Format',
        },
      );
    });

    it('should return 401 for expired token', () => {
      return testErrorScenario(
        app,
        'get',
        '/users/me',
        401,
        'common.auth.tokenExpired',
        undefined,
        {
          Authorization: 'Bearer expired-token',
        },
      );
    });

    it('should return 403 for admin-only endpoints with non-admin token', () => {
      return testErrorScenario(
        app,
        'get',
        '/users/admin/dashboard', // Admin only endpoint
        403,
        'common.auth.forbidden',
        undefined,
        {
          Authorization: `Bearer ${createMockAuthToken(testData.testUser.id)}`,
        },
      );
    });
  });

  describe('User Preferences', () => {
    it('should return 404 when setting preferences for non-existent user', () => {
      const preferencesData = {
        notifications: {
          email: true,
          push: false,
        },
      };

      return testErrorScenario(
        app,
        'put',
        '/users/non-existent-id/preferences',
        404,
        'user.preferences.userNotFound',
        preferencesData,
        {
          Authorization: `Bearer admin-token`,
        },
      );
    });

    it('should return 400 for invalid preferences format', () => {
      const invalidPreferencesData = {
        notifications: 'invalid-format', // Should be an object
      };

      return testErrorScenario(
        app,
        'put',
        `/users/${testData.testUser.id}/preferences`,
        400,
        'common.validation',
        invalidPreferencesData,
        {
          Authorization: `Bearer ${createMockAuthToken(testData.testUser.id)}`,
        },
      );
    });
  });

  describe('Error Propagation', () => {
    it('should propagate database errors properly', () => {
      // This test would typically use mocking to simulate a database error
      // For E2E tests, we might test a route that we know will trigger an error
      // that propagates through multiple services

      return testErrorScenario(
        app,
        'get',
        '/users/internal-error-trigger',
        500,
        'common.internal',
        undefined,
        {
          'X-Trigger-Error': 'database',
        },
      );
    });

    it('should handle errors from downstream services', () => {
      return testErrorScenario(
        app,
        'get',
        `/users/${testData.testUser.id}/integrations`,
        503,
        'user.integrations.serviceUnavailable',
        undefined,
        {
          Authorization: `Bearer ${createMockAuthToken(testData.testUser.id)}`,
          'X-Trigger-Error': 'downstream',
        },
      );
    });
  });
});
