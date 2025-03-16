import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../../src/common/prisma/prisma.service';
import {
  validateErrorResponse,
  createMockAuthToken,
} from '../../utils/error-testing.utils';
import {
  cleanDatabase,
  seedTestData,
  setupTestApp,
} from '../../utils/test-setup.utils';
import { AppModule } from '../../../src/app.module';

/**
 * Tests for error recovery paths in the User module
 *
 * These tests verify that the system can recover properly after encountering errors
 * and that state remains consistent even when operations fail.
 */
describe('User Module Error Recovery (E2E)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let testData: Record<string, any>;
  let authToken: string;
  let adminToken: string;

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

    // Create tokens for testing
    authToken = createMockAuthToken(testData.testUser.id);
    adminToken = createMockAuthToken('admin-id', ['admin']);
  });

  describe('User creation error recovery', () => {
    it('should allow successful user creation after a validation error', async () => {
      // Step 1: Try to create an invalid user (missing required fields)
      const invalidUserData = {
        email: 'not-a-valid-email',
      };

      await request(app.getHttpServer())
        .post('/users')
        .send(invalidUserData)
        .expect(400)
        .expect((res) => {
          validateErrorResponse(res);
          expect(res.body.code).toBe('common.validation');
        });

      // Step 2: Now create a valid user
      const validUserData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        authId: 'auth-123',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(validUserData)
        .expect(201);

      // Step 3: Verify the user was created
      const userId = response.body.id;
      expect(userId).toBeDefined();

      const user = await prismaService.$queryRaw`
        SELECT first_name, email FROM users WHERE id = ${userId}
      `;

      expect(user[0].first_name).toBe(validUserData.firstName);
      expect(user[0].email).toBe(validUserData.email);
    });

    it('should recover from duplicate email error by using a different email', async () => {
      // Step 1: Try to create user with an email that already exists
      const duplicateEmailData = {
        firstName: 'Duplicate',
        lastName: 'User',
        email: testData.testUser.email, // Use existing email to trigger conflict
        authId: 'another-auth-id',
      };

      await request(app.getHttpServer())
        .post('/users')
        .send(duplicateEmailData)
        .expect(409)
        .expect((res) => {
          validateErrorResponse(res);
          expect(res.body.code).toBe('user.create.emailExists');
        });

      // Step 2: Now try again with a different email
      duplicateEmailData.email = 'unique.email@example.com';

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(duplicateEmailData)
        .expect(201);

      // Step 3: Verify the user was created
      const userId = response.body.id;
      expect(userId).toBeDefined();

      const user = await prismaService.$queryRaw`
        SELECT email FROM users WHERE id = ${userId}
      `;

      expect(user[0].email).toBe(duplicateEmailData.email);
    });
  });

  describe('User update error recovery', () => {
    it('should allow successful update after validation error', async () => {
      // Step 1: Try update with invalid data
      const invalidUpdateData = {
        firstName: '', // Empty first name not allowed
        email: 'not-a-valid-email',
      };

      await request(app.getHttpServer())
        .put(`/users/${testData.testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidUpdateData)
        .expect(400)
        .expect((res) => {
          validateErrorResponse(res);
          expect(res.body.code).toBe('common.validation');
        });

      // Step 2: Now update with valid data
      const validUpdateData = {
        firstName: 'Updated',
        lastName: 'User',
        email: 'updated.user@example.com',
      };

      await request(app.getHttpServer())
        .put(`/users/${testData.testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validUpdateData)
        .expect(200);

      // Step 3: Verify the update was successful
      const user = await prismaService.$queryRaw`
        SELECT first_name, last_name, email FROM users WHERE id = ${testData.testUser.id}
      `;

      expect(user[0].first_name).toBe(validUpdateData.firstName);
      expect(user[0].last_name).toBe(validUpdateData.lastName);
      expect(user[0].email).toBe(validUpdateData.email);
    });
  });

  describe('Authentication error recovery', () => {
    it('should allow successful authentication after token expiration', async () => {
      // Step 1: Try to access protected endpoint with expired token
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'Bearer expired-token')
        .expect(401)
        .expect((res) => {
          validateErrorResponse(res);
          expect(res.body.code).toBe('common.auth.tokenExpired');
        });

      // Step 2: Get a new valid token (simulated in this test)
      const newToken = createMockAuthToken(testData.testUser.id);

      // Step 3: Try again with the new token
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);
    });

    it('should allow resource access after fixing permission issues', async () => {
      // Step 1: Try to access admin resource with regular user token
      await request(app.getHttpServer())
        .get('/users/admin/dashboard')
        .set('Authorization', `Bearer ${authToken}`) // Regular user token
        .expect(403)
        .expect((res) => {
          validateErrorResponse(res);
          expect(res.body.code).toBe('common.auth.forbidden');
        });

      // Step 2: Now try with proper admin token
      await request(app.getHttpServer())
        .get('/users/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('User preferences error recovery', () => {
    it('should allow setting valid preferences after validation error', async () => {
      // Step 1: Try to set invalid preferences
      const invalidPreferencesData = {
        notifications: 'invalid-format', // Should be an object
      };

      await request(app.getHttpServer())
        .put(`/users/${testData.testUser.id}/preferences`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPreferencesData)
        .expect(400)
        .expect((res) => {
          validateErrorResponse(res);
          expect(res.body.code).toBe('common.validation');
        });

      // Step 2: Now set valid preferences
      const validPreferencesData = {
        notifications: {
          email: true,
          push: false,
          sms: true,
        },
        privacy: {
          profileVisibility: 'public',
        },
      };

      await request(app.getHttpServer())
        .put(`/users/${testData.testUser.id}/preferences`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(validPreferencesData)
        .expect(200);

      // Step 3: Verify the preferences were set correctly
      const preferences = await prismaService.$queryRaw`
        SELECT preferences FROM user_preferences WHERE user_id = ${testData.testUser.id}
      `;

      const parsedPreferences = preferences[0].preferences;
      expect(parsedPreferences.notifications.email).toBe(true);
      expect(parsedPreferences.notifications.push).toBe(false);
      expect(parsedPreferences.privacy.profileVisibility).toBe('public');
    });
  });

  describe('Transaction integrity during errors', () => {
    it('should maintain consistent state when user creation fails midway', async () => {
      // This test verifies database transaction integrity during complex operations

      // Step 1: Try to create a user with a special transaction test mode that fails midway
      await request(app.getHttpServer())
        .post('/users?testMode=transactionFailure')
        .send({
          firstName: 'Transaction',
          lastName: 'Test',
          email: 'transaction.test@example.com',
          authId: 'auth-transaction-test',
          preferences: {
            notifications: {
              email: true,
            },
          },
        })
        .expect(500)
        .expect((res) => {
          validateErrorResponse(res);
          expect(res.body.code).toBe('user.create.transactionFailure');
        });

      // Step 2: Verify that no user or user preferences were created
      const userExists = await prismaService.$queryRaw`
        SELECT COUNT(*) as count FROM users WHERE email = 'transaction.test@example.com'
      `;

      expect(Number(userExists[0].count)).toBe(0);

      const preferencesExist = await prismaService.$queryRaw`
        SELECT COUNT(*) as count FROM user_preferences 
        WHERE user_id IN (SELECT id FROM users WHERE email = 'transaction.test@example.com')
      `;

      expect(Number(preferencesExist[0].count)).toBe(0);
    });
  });

  describe('Service dependency error recovery', () => {
    it('should recover after downstream service becomes available', async () => {
      // Step 1: Try to access integration that depends on a downstream service (simulated as unavailable)
      await request(app.getHttpServer())
        .get(`/users/${testData.testUser.id}/integrations`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Trigger-Error', 'downstream')
        .expect(503)
        .expect((res) => {
          validateErrorResponse(res);
          expect(res.body.code).toBe('user.integrations.serviceUnavailable');
        });

      // Step 2: Now try again without simulating the downstream service error
      await request(app.getHttpServer())
        .get(`/users/${testData.testUser.id}/integrations`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Error logging and monitoring', () => {
    it('should continue handling requests after logging service failure', async () => {
      // Step 1: Cause an error that will be logged (with logging service failure simulated)
      await request(app.getHttpServer())
        .get('/users/non-existent-id')
        .set('X-Test-Error-Logger', 'fail')
        .expect(404)
        .expect((res) => {
          validateErrorResponse(res);
          expect(res.body.code).toBe('user.profile.get.notFound');
        });

      // Step 2: Verify subsequent requests still work normally
      await request(app.getHttpServer())
        .get(`/users/${testData.testUser.id}`)
        .expect(200);
    });
  });
});
