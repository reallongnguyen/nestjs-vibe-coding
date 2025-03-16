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
 * Tests for error recovery paths in the Social module
 *
 * These tests verify that the system can recover properly after encountering errors
 * and that state remains consistent even when operations fail.
 */
describe('Social Module Error Recovery (E2E)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let testData: Record<string, any>;
  let authToken: string;

  beforeAll(async () => {
    // Setup app with all required modules
    app = await setupTestApp([AppModule]);
    prismaService = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean database and create fresh test data
    await cleanDatabase(prismaService);
    testData = await seedTestData(prismaService, 'social');

    // We need content data too for social interactions
    const contentData = await seedTestData(prismaService, 'content');
    testData = { ...testData, ...contentData };

    // Create a valid auth token for tests
    authToken = createMockAuthToken(testData.testUser.id);
  });

  describe('Like error recovery', () => {
    it('should allow successful like after a previous error', async () => {
      // Step 1: Try to like non-existent content (this will fail)
      await request(app.getHttpServer())
        .post('/social/like/POST/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
        .expect((res) => {
          validateErrorResponse(res);
          expect(res.body.code).toBe('social.like.contentNotFound');
        });

      // Step 2: Now try to like existing content (this should succeed)
      await request(app.getHttpServer())
        .post(`/social/like/POST/${testData.testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      // Step 3: Verify the like was created successfully
      const likeExists = await prismaService.$queryRaw`
        SELECT COUNT(*) as count FROM post_likes 
        WHERE user_id = ${testData.testUser.id} AND post_id = ${testData.testPost.id}
      `;

      expect(Number(likeExists[0].count)).toBe(1);
    });

    it('should maintain consistent state when like operation fails', async () => {
      // Step 1: Create a like manually
      await prismaService.$executeRaw`
        INSERT INTO post_likes (user_id, post_id, created_at, updated_at)
        VALUES (${testData.testUser.id}, ${testData.testPost.id}, NOW(), NOW())
      `;

      // Step 2: Try to like it again (this will fail with already exists error)
      await request(app.getHttpServer())
        .post(`/social/like/POST/${testData.testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
        .expect((res) => {
          validateErrorResponse(res);
          expect(res.body.code).toBe('social.like.alreadyExists');
        });

      // Step 3: Verify there's still only one like record
      const likeCount = await prismaService.$queryRaw`
        SELECT COUNT(*) as count FROM post_likes 
        WHERE user_id = ${testData.testUser.id} AND post_id = ${testData.testPost.id}
      `;

      expect(Number(likeCount[0].count)).toBe(1);
    });
  });

  describe('Comment error recovery', () => {
    it('should allow successful comment after a validation error', async () => {
      // Step 1: Try to create an invalid comment (empty content)
      const invalidCommentData = {};

      await request(app.getHttpServer())
        .post(`/social/comment/POST/${testData.testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidCommentData)
        .expect(400)
        .expect((res) => {
          validateErrorResponse(res);
          expect(res.body.code).toBe('common.validation');
        });

      // Step 2: Now create a valid comment
      const validCommentData = { content: 'This is a valid comment' };

      const response = await request(app.getHttpServer())
        .post(`/social/comment/POST/${testData.testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(validCommentData)
        .expect(201);

      // Step 3: Verify the comment was created
      const commentId = response.body.id;
      expect(commentId).toBeDefined();

      const comment = await prismaService.$queryRaw`
        SELECT content FROM comments WHERE id = ${commentId}
      `;

      expect(comment[0].content).toBe(validCommentData.content);
    });

    it('should allow comment update after a previous update error', async () => {
      // Step 1: Create a comment
      const createResponse = await request(app.getHttpServer())
        .post(`/social/comment/POST/${testData.testPost.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Initial comment' })
        .expect(201);

      const commentId = createResponse.body.id;

      // Step 2: Try to update with invalid data (empty content)
      await request(app.getHttpServer())
        .put(`/social/comment/${commentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400)
        .expect((res) => {
          validateErrorResponse(res);
          expect(res.body.code).toBe('common.validation');
        });

      // Step 3: Now update with valid data
      const updatedContent = 'This is the updated comment';

      await request(app.getHttpServer())
        .put(`/social/comment/${commentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: updatedContent })
        .expect(200);

      // Step 4: Verify the update was successful
      const comment = await prismaService.$queryRaw`
        SELECT content FROM comments WHERE id = ${commentId}
      `;

      expect(comment[0].content).toBe(updatedContent);
    });
  });

  describe('Rate limiting recovery', () => {
    it('should reset rate limit after the cool-down period', async () => {
      // This test assumes the rate limiter has a configurable window for testing
      // We'll use a test header to simulate rate limiting with a short window

      // Step 1: Hit the rate limit
      await request(app.getHttpServer())
        .get('/social/trending')
        .set('X-Test-Rate-Limit', 'true')
        .expect(429)
        .expect((res) => {
          validateErrorResponse(res);
          expect(res.body.code).toBe('common.rateLimit.exceeded');
        });

      // Step 2: Signal to the test environment to fast-forward the rate limit window
      await request(app.getHttpServer())
        .post('/test-utils/fast-forward-rate-limit')
        .set('Authorization', `Bearer admin-test-token`)
        .expect(200);

      // Step 3: Should now be able to make requests again
      await request(app.getHttpServer()).get('/social/trending').expect(200);
    });
  });

  describe('Transaction integrity during errors', () => {
    it('should roll back all changes when an operation partially fails', async () => {
      // Set up a special test mode that will cause a partial failure in a complex operation
      // For example, a batch operation that fails in the middle

      // Step 1: Try a batch operation that will fail halfway through
      await request(app.getHttpServer())
        .post('/social/batch-operation')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          operations: [
            {
              type: 'like',
              contentType: 'POST',
              contentId: testData.testPost.id,
            },
            {
              type: 'comment',
              contentType: 'POST',
              contentId: testData.testPost.id,
              content: 'Test comment',
            },
            {
              type: 'share',
              contentType: 'POST',
              contentId: 'non-existent-id',
            }, // This will fail
          ],
          transactionOptions: { rollbackOnError: true },
        })
        .expect(500)
        .expect((res) => {
          validateErrorResponse(res);
          expect(res.body.code).toBe('social.batch.partialFailure');
        });

      // Step 2: Verify the database is consistent (no likes or comments created)
      const likeCount = await prismaService.$queryRaw`
        SELECT COUNT(*) as count FROM post_likes 
        WHERE user_id = ${testData.testUser.id} AND post_id = ${testData.testPost.id}
      `;

      expect(Number(likeCount[0].count)).toBe(0);

      const commentCount = await prismaService.$queryRaw`
        SELECT COUNT(*) as count FROM comments 
        WHERE user_id = ${testData.testUser.id} AND post_id = ${testData.testPost.id}
      `;

      expect(Number(commentCount[0].count)).toBe(0);
    });
  });

  describe('Notification failure recovery', () => {
    it('should allow retry of failed notifications', async () => {
      // Step 1: Perform an action that will succeed but the notification will fail
      await request(app.getHttpServer())
        .post(
          `/social/like/POST/${testData.testPost.id}?testMode=notificationFailure`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .expect(207) // Partial success
        .expect((res) => {
          validateErrorResponse(res);
          expect(res.body.code).toBe('social.notification.failure');
        });

      // Step 2: Verify the like was created despite notification failure
      const likeExists = await prismaService.$queryRaw`
        SELECT COUNT(*) as count FROM post_likes 
        WHERE user_id = ${testData.testUser.id} AND post_id = ${testData.testPost.id}
      `;

      expect(Number(likeExists[0].count)).toBe(1);

      // Step 3: Now retry the notification
      await request(app.getHttpServer())
        .post('/social/retry-notifications')
        .set('Authorization', `Bearer admin-test-token`)
        .send({
          userId: testData.testUser.id,
          contentId: testData.testPost.id,
          actionType: 'like',
        })
        .expect(200);

      // Step 4: Verify the notification was created
      const notificationExists = await prismaService.$queryRaw`
        SELECT COUNT(*) as count FROM notifications 
        WHERE recipient_id = ${testData.testPost.authorId} 
        AND actor_id = ${testData.testUser.id}
        AND content_id = ${testData.testPost.id}
      `;

      expect(Number(notificationExists[0].count)).toBe(1);
    });
  });
});
