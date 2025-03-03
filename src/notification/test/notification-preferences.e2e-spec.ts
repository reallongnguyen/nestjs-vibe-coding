import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import {
  NotificationChannel,
  NotificationType,
} from '../entities/notification-preference.entity';
import { AuthGuard } from '../../common';

// Mock authentication guard to bypass authentication for testing
class MockAuthGuard {
  canActivate() {
    return true;
  }
}

describe('Notification Preferences (e2e)', () => {
  let app: INestApplication;
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard)
      .useClass(MockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/v1/notifications/preferences (GET)', () => {
    it('should return a list of notification preferences', () => {
      return request(app.getHttpServer())
        .get('/v1/notifications/preferences')
        .set('x-user-id', mockUserId)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('edges');
          expect(res.body).toHaveProperty('pagination');
          expect(Array.isArray(res.body.edges)).toBe(true);
        });
    });

    it('should support pagination parameters', () => {
      return request(app.getHttpServer())
        .get('/v1/notifications/preferences?offset=0&limit=10')
        .set('x-user-id', mockUserId)
        .expect(200)
        .expect((res) => {
          expect(res.body.pagination).toEqual(
            expect.objectContaining({
              offset: 0,
              limit: 10,
            }),
          );
        });
    });
  });

  describe('/v1/notifications/preferences/:type (GET)', () => {
    it('should return a specific notification preference', () => {
      return request(app.getHttpServer())
        .get(`/v1/notifications/preferences/${NotificationType.POST_LIKE}`)
        .set('x-user-id', mockUserId)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('userId', mockUserId);
          expect(res.body).toHaveProperty('type', NotificationType.POST_LIKE);
          expect(res.body).toHaveProperty('channels');
          expect(res.body).toHaveProperty('enabled');
        });
    });

    it('should create a default preference if not found', () => {
      return request(app.getHttpServer())
        .get(`/v1/notifications/preferences/${NotificationType.USER_MENTION}`)
        .set('x-user-id', mockUserId)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('userId', mockUserId);
          expect(res.body).toHaveProperty(
            'type',
            NotificationType.USER_MENTION,
          );
          expect(res.body).toHaveProperty('enabled', true); // Default is enabled
        });
    });
  });

  describe('/v1/notifications/preferences (POST)', () => {
    it('should create a new notification preference', () => {
      return request(app.getHttpServer())
        .post('/v1/notifications/preferences')
        .set('x-user-id', mockUserId)
        .send({
          type: NotificationType.POST_COMMENT,
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          enabled: true,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('userId', mockUserId);
          expect(res.body).toHaveProperty(
            'type',
            NotificationType.POST_COMMENT,
          );
          expect(res.body.channels).toEqual([
            NotificationChannel.IN_APP,
            NotificationChannel.EMAIL,
          ]);
          expect(res.body).toHaveProperty('enabled', true);
        });
    });

    it('should validate input data', () => {
      return request(app.getHttpServer())
        .post('/v1/notifications/preferences')
        .set('x-user-id', mockUserId)
        .send({
          type: 'INVALID_TYPE',
          channels: ['INVALID_CHANNEL'],
          enabled: true,
        })
        .expect(400);
    });
  });

  describe('/v1/notifications/preferences/:type (PUT)', () => {
    it('should update an existing notification preference', () => {
      return request(app.getHttpServer())
        .put(`/v1/notifications/preferences/${NotificationType.POST_LIKE}`)
        .set('x-user-id', mockUserId)
        .send({
          channels: [NotificationChannel.IN_APP],
          enabled: false,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('type', NotificationType.POST_LIKE);
          expect(res.body.channels).toEqual([NotificationChannel.IN_APP]);
          expect(res.body).toHaveProperty('enabled', false);
        });
    });

    it('should create and update a preference if not found', () => {
      return request(app.getHttpServer())
        .put(
          `/v1/notifications/preferences/${NotificationType.SYSTEM_ANNOUNCEMENT}`,
        )
        .set('x-user-id', mockUserId)
        .send({
          channels: [NotificationChannel.PUSH],
          enabled: true,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty(
            'type',
            NotificationType.SYSTEM_ANNOUNCEMENT,
          );
          expect(res.body.channels).toEqual([NotificationChannel.PUSH]);
          expect(res.body).toHaveProperty('enabled', true);
        });
    });

    it('should validate input data', () => {
      return request(app.getHttpServer())
        .put(`/v1/notifications/preferences/${NotificationType.POST_LIKE}`)
        .set('x-user-id', mockUserId)
        .send({
          channels: ['INVALID_CHANNEL'],
        })
        .expect(400);
    });
  });
});
