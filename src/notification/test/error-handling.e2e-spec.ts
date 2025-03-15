import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { AuthGuard } from 'src/common/auth';
import { mockUser } from 'src/common/test/mock-user';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { DatabaseHelper } from 'src/common/test/database.helper';
import { LoggerHelper } from 'src/common/test/logger.helper';
import { NotificationModule } from '../notification.module';
import { NotificationErrorCode } from '../entities/errors';
import { NotificationChannel } from '../entities/notification-preference.entity';

describe('Notification Error Handling (Integration)', () => {
  let app: INestApplication;
  let dbHelper: DatabaseHelper;
  let prisma: PrismaService;
  let loggerHelper: LoggerHelper;
  const testUserId = mockUser.id;

  beforeAll(async () => {
    loggerHelper = new LoggerHelper();
    loggerHelper.setupLoggerSpy();

    const moduleRef = await Test.createTestingModule({
      imports: [NotificationModule, PrismaModule],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: () => true,
        getRequest: () => ({
          user: mockUser,
        }),
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    prisma = moduleRef.get(PrismaService);
    dbHelper = new DatabaseHelper(prisma);

    await app.init();
    await dbHelper.cleanDatabase();
  });

  beforeEach(async () => {
    await dbHelper.cleanDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Notification API Error Handling', () => {
    it('should return 404 when notification is not found', async () => {
      const nonExistentId = 'non-existent-id';

      const response = await request(app.getHttpServer())
        .patch(`/notifications/${nonExistentId}/view`)
        .expect(404);

      // Verify error response structure
      expect(response.body).toMatchObject({
        code: expect.stringContaining(
          NotificationErrorCode.NOTIFICATION_NOT_FOUND,
        ),
        message: expect.stringContaining(nonExistentId),
        params: {
          notificationId: nonExistentId,
        },
      });
    });

    it('should return proper error when attempting to create notification with invalid data', async () => {
      const invalidData = {
        // Missing required fields
      };

      const response = await request(app.getHttpServer())
        .post(`/notifications`)
        .send(invalidData)
        .expect(400);

      // Verify validation error structure
      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.arrayContaining([expect.any(String)]),
        error: 'Bad Request',
      });
    });
  });

  describe('Notification Preference Error Handling', () => {
    it('should return 404 when preference is not found', async () => {
      const nonExistentType = 'non-existent-type';

      const response = await request(app.getHttpServer())
        .get(`/notifications/preferences/${nonExistentType}`)
        .expect(404);

      // Verify error response structure
      expect(response.body).toMatchObject({
        code: expect.stringContaining(
          NotificationErrorCode.PREFERENCE_NOT_FOUND,
        ),
        message: expect.any(String),
      });
    });

    it('should return 409 when attempting to create duplicate preference', async () => {
      // First create a preference
      await request(app.getHttpServer())
        .post(`/notifications/preferences`)
        .send({
          type: 'test-preference',
          channel: 'in-app',
          enabled: true,
        })
        .expect(201);

      // Try to create the same preference again
      const response = await request(app.getHttpServer())
        .post(`/notifications/preferences`)
        .send({
          type: 'test-preference',
          channel: 'in-app',
          enabled: true,
        })
        .expect(409);

      // Verify error response structure
      expect(response.body).toMatchObject({
        code: expect.stringContaining(
          NotificationErrorCode.PREFERENCE_ALREADY_EXISTS,
        ),
        message: expect.any(String),
      });
    });
  });

  describe('Notification Template Error Handling', () => {
    it('should return 404 when template is not found', async () => {
      const nonExistentId = 'non-existent-id';

      const response = await request(app.getHttpServer())
        .get(`/notifications/templates/${nonExistentId}`)
        .expect(404);

      // Verify error response structure
      expect(response.body).toMatchObject({
        code: expect.stringContaining(NotificationErrorCode.TEMPLATE_NOT_FOUND),
        message: expect.any(String),
      });
    });

    it('should return 400 when template has invalid syntax', async () => {
      const invalidTemplate = {
        type: 'test-template',
        language: 'en',
        title: 'Test Template',
        body: '{{invalid syntax}}',
      };

      const response = await request(app.getHttpServer())
        .post(`/notifications/templates`)
        .send(invalidTemplate)
        .expect(400);

      // Verify error response structure
      expect(response.body).toMatchObject({
        code: expect.stringContaining(
          NotificationErrorCode.TEMPLATE_INVALID_SYNTAX,
        ),
        message: expect.any(String),
      });
    });
  });

  describe('Rate Limit Error Handling', () => {
    it('should return 429 when rate limit is exceeded', async () => {
      // Setup rate limit to be exceeded
      await prisma.notificationPreference.create({
        data: {
          userId: testUserId,
          type: 'test-rate-limit',
          channels: [NotificationChannel.IN_APP],
          enabled: true,
          metadata: {
            rateLimits: {
              perMinute: 1,
            },
          },
        },
      });

      // Create a notification to hit the rate limit
      await request(app.getHttpServer())
        .post(`/notifications/send`)
        .send({
          type: 'test-rate-limit',
          userId: testUserId,
          title: 'Test',
          body: 'Test message',
        })
        .expect(201);

      // Try to create another notification that should exceed the rate limit
      const response = await request(app.getHttpServer())
        .post(`/notifications/send`)
        .send({
          type: 'test-rate-limit',
          userId: testUserId,
          title: 'Test 2',
          body: 'Test message 2',
        })
        .expect(429);

      // Verify error response structure
      expect(response.body).toMatchObject({
        code: expect.stringContaining(
          NotificationErrorCode.RATE_LIMIT_EXCEEDED,
        ),
        message: expect.any(String),
      });
    });
  });
});
