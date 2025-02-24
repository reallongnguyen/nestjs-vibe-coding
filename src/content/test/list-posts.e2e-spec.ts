import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestingApp } from 'src/test/test-app';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { createTestUser, TestUser } from 'src/test/utils/create-test-user';
import { createTestDraftPost } from './utils/create-test-draft';
import { createTestPublishedPost } from './utils/create-test-published';
import { createTestTopic } from './utils/create-test-topic';

describe('List Posts (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let user: TestUser;
  let otherUser: TestUser;

  beforeAll(async () => {
    app = await createTestingApp();
    prisma = app.get(PrismaService);
    user = await createTestUser(prisma);
    otherUser = await createTestUser(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/posts/drafts', () => {
    beforeEach(async () => {
      await prisma.draftPost.deleteMany();
    });

    it('should list user draft posts with pagination', async () => {
      // Create test data
      await Promise.all([
        createTestDraftPost(prisma, { userId: user.id }),
        createTestDraftPost(prisma, { userId: user.id }),
        createTestDraftPost(prisma, { userId: user.id }),
      ]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/posts/drafts')
        .set('Authorization', `Bearer ${user.token}`)
        .query({ offset: 0, limit: 2 })
        .expect(200);

      expect(response.body.edges).toHaveLength(2);
      expect(response.body.pagination).toEqual({
        total: 3,
        offset: 0,
        limit: 2,
      });
    });

    it('should filter drafts by publish status', async () => {
      // Create test data
      const published = await createTestPublishedPost(prisma, {
        userId: user.id,
      });
      await createTestDraftPost(prisma, { userId: user.id });
      await createTestDraftPost(prisma, {
        userId: user.id,
        publishedId: published.id,
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/posts/drafts')
        .set('Authorization', `Bearer ${user.token}`)
        .query({ published: true })
        .expect(200);

      expect(response.body.edges).toHaveLength(1);
      expect(response.body.edges[0].publishedId).toBe(published.id);
    });

    it('should filter drafts by topic', async () => {
      // Create test data
      const topic = await createTestTopic(prisma);
      await createTestDraftPost(prisma, {
        userId: user.id,
        topics: [topic.id],
      });
      await createTestDraftPost(prisma, { userId: user.id });

      const response = await request(app.getHttpServer())
        .get('/api/v1/posts/drafts')
        .set('Authorization', `Bearer ${user.token}`)
        .query({ topics: topic.id })
        .expect(200);

      expect(response.body.edges).toHaveLength(1);
      expect(response.body.edges[0].topics).toContain(topic.id);
    });
  });

  describe('GET /api/v1/posts/published', () => {
    beforeEach(async () => {
      await prisma.publishedPost.deleteMany();
    });

    it('should list published posts with pagination', async () => {
      // Create test data
      await Promise.all([
        createTestPublishedPost(prisma, { userId: user.id }),
        createTestPublishedPost(prisma, { userId: otherUser.id }),
        createTestPublishedPost(prisma, { userId: user.id }),
      ]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/posts/published')
        .query({ offset: 0, limit: 2 })
        .expect(200);

      expect(response.body.edges).toHaveLength(2);
      expect(response.body.pagination).toEqual({
        total: 3,
        offset: 0,
        limit: 2,
      });
    });

    it('should filter published posts by user', async () => {
      // Create test data
      await createTestPublishedPost(prisma, { userId: otherUser.id });
      const userPost = await createTestPublishedPost(prisma, {
        userId: user.id,
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/posts/published')
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200);

      expect(response.body.edges).toHaveLength(1);
      expect(response.body.edges[0].id).toBe(userPost.id);
    });

    it('should filter published posts by date range', async () => {
      // Create test data
      const oldDate = new Date('2023-01-01');
      const newDate = new Date();

      await createTestPublishedPost(prisma, {
        userId: user.id,
        publishedAt: oldDate,
      });
      const newPost = await createTestPublishedPost(prisma, {
        userId: user.id,
        publishedAt: newDate,
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/posts/published')
        .query({
          fromDate: newDate.toISOString().split('T')[0],
        })
        .expect(200);

      expect(response.body.edges).toHaveLength(1);
      expect(response.body.edges[0].id).toBe(newPost.id);
    });

    it('should search posts by title', async () => {
      // Create test data
      await createTestPublishedPost(prisma, {
        userId: user.id,
        title: 'Regular post',
      });
      const searchPost = await createTestPublishedPost(prisma, {
        userId: user.id,
        title: 'Special unique title',
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/posts/published')
        .query({ search: 'unique' })
        .expect(200);

      expect(response.body.edges).toHaveLength(1);
      expect(response.body.edges[0].id).toBe(searchPost.id);
    });

    it('should filter published posts by topics', async () => {
      // Create test data
      const topic1 = await createTestTopic(prisma);
      const topic2 = await createTestTopic(prisma);

      const postWithTopics = await createTestPublishedPost(prisma, {
        userId: user.id,
        topics: [topic1.id, topic2.id],
      });
      await createTestPublishedPost(prisma, { userId: user.id });

      // Test single topic filter
      const response1 = await request(app.getHttpServer())
        .get('/api/v1/posts/published')
        .query({ topics: topic1.id })
        .expect(200);

      expect(response1.body.edges).toHaveLength(1);
      expect(response1.body.edges[0].id).toBe(postWithTopics.id);
      expect(response1.body.edges[0].topics).toContain(topic1.id);

      // Test multiple topics filter
      const response2 = await request(app.getHttpServer())
        .get('/api/v1/posts/published')
        .query({ topics: `${topic1.id},${topic2.id}` })
        .expect(200);

      expect(response2.body.edges).toHaveLength(1);
      expect(response2.body.edges[0].id).toBe(postWithTopics.id);
      expect(response2.body.edges[0].topics).toEqual(
        expect.arrayContaining([topic1.id, topic2.id]),
      );
    });
  });
});
