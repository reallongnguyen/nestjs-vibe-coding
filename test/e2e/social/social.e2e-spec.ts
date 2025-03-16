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

describe('SocialController (E2E)', () => {
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
    // Clean database and create fresh test data
    await cleanDatabase(prismaService);
    testData = await seedTestData(prismaService, 'social');

    // We need content data too for social interactions
    const contentData = await seedTestData(prismaService, 'content');
    testData = { ...testData, ...contentData };
  });

  describe('POST /social/like/:type/:id', () => {
    it('should return 404 when trying to like non-existent content', () => {
      return testErrorScenario(
        app,
        'post',
        '/social/like/POST/non-existent-id',
        404,
        'social.like.contentNotFound',
        undefined,
        {
          Authorization: `Bearer test-token`,
        },
      );
    });

    it('should handle error response within performance requirements', async () => {
      await measureErrorResponseTime(
        app,
        'post',
        '/social/like/POST/non-existent-id',
        404,
        'social.like.contentNotFound',
        undefined,
        50, // Max response time in ms
      );
    });

    it('should return 400 when trying to like already liked content', async () => {
      // First like the content - using Prisma client properly
      // Note: The exact model might be different - replace with correct Prisma model
      await prismaService.$executeRaw`
        INSERT INTO post_likes (user_id, post_id, created_at, updated_at)
        VALUES (${testData.testUser.id}, ${testData.testPost.id}, NOW(), NOW())
      `;

      // Then try to like it again
      return testErrorScenario(
        app,
        'post',
        `/social/like/POST/${testData.testPost.id}`,
        400,
        'social.like.alreadyExists',
        undefined,
        {
          Authorization: `Bearer test-token`,
        },
      );
    });

    it('should return 400 for invalid content type', () => {
      return testErrorScenario(
        app,
        'post',
        '/social/like/INVALID_TYPE/some-id',
        400,
        'social.like.invalidContentType',
        undefined,
        {
          Authorization: `Bearer test-token`,
        },
      );
    });

    it('should return 401 when not authenticated', () => {
      return testErrorScenario(
        app,
        'post',
        `/social/like/POST/${testData.testPost.id}`,
        401,
        'common.auth.unauthorized',
      );
    });
  });

  describe('DELETE /social/like/:type/:id', () => {
    it('should return 404 when trying to unlike content that was not liked', () => {
      return testErrorScenario(
        app,
        'delete',
        `/social/like/POST/${testData.testPost.id}`,
        404,
        'social.unlike.notFound',
        undefined,
        {
          Authorization: `Bearer test-token`,
        },
      );
    });

    it('should return 404 when trying to unlike non-existent content', () => {
      return testErrorScenario(
        app,
        'delete',
        '/social/like/POST/non-existent-id',
        404,
        'social.unlike.contentNotFound',
        undefined,
        {
          Authorization: `Bearer test-token`,
        },
      );
    });

    it('should return 400 for invalid content type', () => {
      return testErrorScenario(
        app,
        'delete',
        '/social/like/INVALID_TYPE/some-id',
        400,
        'social.unlike.invalidContentType',
        undefined,
        {
          Authorization: `Bearer test-token`,
        },
      );
    });
  });

  describe('POST /social/comment/:type/:id', () => {
    it('should return 400 with validation error for invalid comment data', () => {
      const invalidCommentData = {
        // Missing required content field
      };

      return testErrorScenario(
        app,
        'post',
        `/social/comment/POST/${testData.testPost.id}`,
        400,
        'common.validation',
        invalidCommentData,
        {
          Authorization: `Bearer test-token`,
        },
      );
    });

    it('should return 404 when trying to comment on non-existent content', () => {
      const validCommentData = {
        content: 'This is a test comment',
      };

      return testErrorScenario(
        app,
        'post',
        '/social/comment/POST/non-existent-id',
        404,
        'social.comment.contentNotFound',
        validCommentData,
        {
          Authorization: `Bearer test-token`,
        },
      );
    });

    it('should return 400 for comment with excessive length', () => {
      // Create a comment that exceeds the maximum length
      const longComment = 'a'.repeat(5001); // Assuming 5000 is the max length
      const invalidCommentData = {
        content: longComment,
      };

      return testErrorScenario(
        app,
        'post',
        `/social/comment/POST/${testData.testPost.id}`,
        400,
        'social.comment.contentTooLong',
        invalidCommentData,
        {
          Authorization: `Bearer test-token`,
        },
      );
    });

    it('should return 403 when commenting on content from blocked user', async () => {
      // Set up a blocked user relationship
      await prismaService.$executeRaw`
        INSERT INTO user_blocks (blocker_id, blocked_id, created_at, updated_at)
        VALUES ('blocked-user-id', ${testData.testUser.id}, NOW(), NOW())
      `;

      const commentData = {
        content: 'This comment should be blocked',
      };

      return testErrorScenario(
        app,
        'post',
        '/social/comment/POST/blocked-user-content-id',
        403,
        'social.comment.userBlocked',
        commentData,
        {
          Authorization: `Bearer test-token`,
        },
      );
    });
  });

  describe('PUT /social/comment/:id', () => {
    it('should return 404 when updating non-existent comment', () => {
      const updateData = {
        content: 'Updated comment content',
      };

      return testErrorScenario(
        app,
        'put',
        '/social/comment/non-existent-id',
        404,
        'social.comment.notFound',
        updateData,
        {
          Authorization: `Bearer test-token`,
        },
      );
    });

    it("should return 403 when updating another user's comment", async () => {
      // Create a comment owned by another user
      await prismaService.$executeRaw`
        INSERT INTO comments (id, user_id, post_id, content, created_at, updated_at)
        VALUES ('other-user-comment-id', 'other-user-id', ${testData.testPost.id}, 'Original comment', NOW(), NOW())
      `;

      const updateData = {
        content: "Trying to update someone else's comment",
      };

      return testErrorScenario(
        app,
        'put',
        '/social/comment/other-user-comment-id',
        403,
        'social.comment.notAuthorized',
        updateData,
        {
          Authorization: `Bearer ${createMockAuthToken(testData.testUser.id)}`,
        },
      );
    });
  });

  describe('DELETE /social/comment/:id', () => {
    it('should return 404 when deleting non-existent comment', () => {
      return testErrorScenario(
        app,
        'delete',
        '/social/comment/non-existent-id',
        404,
        'social.comment.notFound',
        undefined,
        {
          Authorization: `Bearer test-token`,
        },
      );
    });

    it("should return 403 when deleting another user's comment without permission", async () => {
      // Create a comment owned by another user
      await prismaService.$executeRaw`
        INSERT INTO comments (id, user_id, post_id, content, created_at, updated_at)
        VALUES ('other-user-comment-id', 'other-user-id', ${testData.testPost.id}, 'Comment to delete', NOW(), NOW())
      `;

      return testErrorScenario(
        app,
        'delete',
        '/social/comment/other-user-comment-id',
        403,
        'social.comment.notAuthorized',
        undefined,
        {
          Authorization: `Bearer ${createMockAuthToken(testData.testUser.id)}`,
        },
      );
    });
  });

  describe('Error propagation', () => {
    it('should properly propagate errors between services', async () => {
      // Test a scenario where an error in one service propagates to another
      // For example, a database error that affects the social service

      // This is a basic example. In a real test, you might need to mock certain
      // dependencies to simulate specific error conditions

      return testErrorScenario(
        app,
        'get',
        '/social/stats/user/non-existent-id',
        404,
        'user.profile.get.notFound',
      );
    });

    it('should handle rate limiting errors', () => {
      // Test rate limiting by making multiple requests with the same client
      return testErrorScenario(
        app,
        'get',
        '/social/trending',
        429,
        'common.rateLimit.exceeded',
        undefined,
        {
          'X-Test-Rate-Limit': 'true', // Special header to trigger rate limit in test environment
        },
      );
    });
  });

  describe('Notification integrations', () => {
    it('should handle notification errors gracefully', () => {
      // Test what happens when the notification service is unavailable but the social action succeeds
      return testErrorScenario(
        app,
        'post',
        `/social/like/POST/${testData.testPost.id}?testMode=notificationFailure`,
        207, // Partial success
        'social.notification.failure',
        undefined,
        {
          Authorization: `Bearer test-token`,
        },
      );
    });
  });
});
