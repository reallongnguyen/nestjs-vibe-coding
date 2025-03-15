import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

describe('Identity Error Handling (e2e)', () => {
  let app: INestApplication;
  let userToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get a valid token for testing
    // This would need to be implemented based on your auth system
    userToken = 'test-token';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User Not Found Error', () => {
    it('should return 404 with proper error structure when user not found', async () => {
      const nonExistentUserId = 'non-existent-id';

      const response = await request(app.getHttpServer())
        .get(`/users/${nonExistentUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        code: 'user.get.notFound',
        message: expect.stringContaining(nonExistentUserId),
      });
    });
  });

  describe('Invalid Bulk Operation Error', () => {
    it('should return 400 with proper error structure for invalid bulk operation', async () => {
      const invalidOperation = {
        operation: 'INVALID_OPERATION',
        userIds: ['user-1', 'user-2'],
      };

      const response = await request(app.getHttpServer())
        .post('/users/bulk')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidOperation)
        .expect(400);

      expect(response.body).toMatchObject({
        code: 'user.bulk.invalidOperation',
        message: expect.stringContaining('INVALID_OPERATION'),
      });
    });
  });

  describe('Require Person Error', () => {
    it('should return 403 when non-person entity tries to create a user', async () => {
      // This test would need to be implemented based on your auth system
      // Mock a non-person token and try to create a user
      const nonPersonToken = 'non-person-token';

      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${nonPersonToken}`)
        .send({
          name: 'Test User',
          email: 'test@example.com',
        })
        .expect(403);

      expect(response.body).toMatchObject({
        code: 'common.requirePerson',
        message: expect.any(String),
      });
    });
  });
});
