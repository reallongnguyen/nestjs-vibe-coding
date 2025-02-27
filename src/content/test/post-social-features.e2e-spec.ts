import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { createTestUser } from 'src/test/utils/create-test-user';
import { cleanDatabase } from './utils/clean-database';
import { createTestPublishedPost } from './utils/create-test-published';

describe('Post Social Features (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUser;
  let testPost;
  let authToken;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Create test user and post
    testUser = await createTestUser(prisma);
    testPost = await createTestPublishedPost(prisma, { userId: testUser.id });

    // Get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'password123',
      });

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  it('should like a post', async () => {
    await request(app.getHttpServer())
      .post(`/v1/social/like/POST/${testPost.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Check if the post was liked
    const stats = await request(app.getHttpServer())
      .get(`/v1/social/engagement/POST/${testPost.id}`)
      .expect(200);

    expect(stats.body.likeCount).toBe(1);
  });

  it('should unlike a post', async () => {
    await request(app.getHttpServer())
      .post(`/v1/social/unlike/POST/${testPost.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Check if the post was unliked
    const stats = await request(app.getHttpServer())
      .get(`/v1/social/engagement/POST/${testPost.id}`)
      .expect(200);

    expect(stats.body.likeCount).toBe(0);
  });

  it('should track post views', async () => {
    const viewerHash = 'test-viewer-hash';

    await request(app.getHttpServer())
      .post(`/v1/social/view/POST/${testPost.id}`)
      .query({ viewerHash })
      .expect(200);

    // Check if the view was recorded
    const stats = await request(app.getHttpServer())
      .get(`/v1/social/engagement/POST/${testPost.id}`)
      .expect(200);

    expect(stats.body.viewCount).toBe(1);
  });

  it('should get engagement statistics', async () => {
    const response = await request(app.getHttpServer())
      .get(`/v1/social/engagement/POST/${testPost.id}`)
      .expect(200);

    expect(response.body).toHaveProperty('likeCount');
    expect(response.body).toHaveProperty('viewCount');
    expect(response.body).toHaveProperty('commentCount');
  });
});
