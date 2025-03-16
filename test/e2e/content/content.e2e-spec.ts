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

describe('Content Module (E2E)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let testData: Record<string, any>;
  let authToken: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    // Clean database and create fresh test data
    await cleanDatabase(prismaService);
    testData = await seedTestData(prismaService, 'content');

    // Create tokens for testing
    authToken = createMockAuthToken(testData.testUser.id);
    adminToken = createMockAuthToken('admin-id', ['admin']);
  });

  describe('Draft Posts', () => {
    describe('GET /posts/drafts', () => {
      it('should return 401 when not authenticated', () => {
        return testErrorScenario(
          app,
          'get',
          '/posts/drafts',
          401,
          'common.auth.unauthorized',
        );
      });

      it('should handle error response within performance requirements', async () => {
        await measureErrorResponseTime(
          app,
          'get',
          '/posts/drafts',
          401,
          'common.auth.unauthorized',
          undefined,
          50, // Max response time in ms
        );
      });
    });

    describe('POST /posts/drafts', () => {
      it('should return 400 with validation error for invalid draft data', () => {
        const invalidDraftData = {
          // Missing required fields like title, content
        };

        return testErrorScenario(
          app,
          'post',
          '/posts/drafts',
          400,
          'common.validation',
          invalidDraftData,
          {
            Authorization: `Bearer ${authToken}`,
          },
        );
      });

      it('should return 400 for draft with invalid content format', () => {
        const invalidContentDraftData = {
          title: 'Test Draft',
          content: {
            // Missing required structure for content
          },
          summary: 'Test Summary',
        };

        return testErrorScenario(
          app,
          'post',
          '/posts/drafts',
          400,
          'common.validation',
          invalidContentDraftData,
          {
            Authorization: `Bearer ${authToken}`,
          },
        );
      });
    });

    describe('PATCH /posts/drafts/:id', () => {
      it('should return 404 when updating non-existent draft', () => {
        const updateData = {
          title: 'Updated Draft Title',
        };

        return testErrorScenario(
          app,
          'patch',
          '/posts/drafts/non-existent-id',
          404,
          'content.draft.notFound',
          updateData,
          {
            Authorization: `Bearer ${authToken}`,
          },
        );
      });

      it("should return 403 when updating another user's draft", async () => {
        // Create a draft owned by another user
        const otherUserDraft = await prismaService.draftPost.create({
          data: {
            title: 'Other User Draft',
            content: JSON.stringify({ blocks: [] }),
            userId: 'other-user-id',
          },
        });

        const updateData = {
          title: "Trying to update someone else's draft",
        };

        return testErrorScenario(
          app,
          'patch',
          `/posts/drafts/${otherUserDraft.id}`,
          403,
          'content.draft.notOwner',
          updateData,
          {
            Authorization: `Bearer ${authToken}`,
          },
        );
      });
    });

    describe('DELETE /posts/drafts/:id', () => {
      it('should return 404 when deleting non-existent draft', () => {
        return testErrorScenario(
          app,
          'delete',
          '/posts/drafts/non-existent-id',
          404,
          'content.draft.notFound',
          undefined,
          {
            Authorization: `Bearer ${authToken}`,
          },
        );
      });

      it("should return 403 when deleting another user's draft", async () => {
        // Create a draft owned by another user
        const otherUserDraft = await prismaService.draftPost.create({
          data: {
            title: 'Other User Draft to Delete',
            content: JSON.stringify({ blocks: [] }),
            userId: 'other-user-id',
          },
        });

        return testErrorScenario(
          app,
          'delete',
          `/posts/drafts/${otherUserDraft.id}`,
          403,
          'content.draft.notOwner',
          undefined,
          {
            Authorization: `Bearer ${authToken}`,
          },
        );
      });
    });

    describe('POST /posts/drafts/:id/publish', () => {
      it('should return 404 when publishing non-existent draft', () => {
        const publishData = {
          slug: 'test-publish-non-existent',
        };

        return testErrorScenario(
          app,
          'post',
          '/posts/drafts/non-existent-id/publish',
          404,
          'content.draft.notFound',
          publishData,
          {
            Authorization: `Bearer ${authToken}`,
          },
        );
      });

      it('should return 409 when publishing with existing slug', async () => {
        // Create a draft to publish
        const draft = await prismaService.draftPost.create({
          data: {
            title: 'Draft to Publish',
            content: JSON.stringify({ blocks: [] }),
            userId: testData.testUser.id,
          },
        });

        // Create an existing published post with the slug we'll try to use
        await prismaService.publishedPost.create({
          data: {
            title: 'Existing Published Post',
            content: JSON.stringify({ blocks: [] }),
            userId: testData.testUser.id,
            slug: 'existing-slug',
            excerpt: 'This is a test post',
          },
        });

        const publishData = {
          slug: 'existing-slug', // This slug already exists
        };

        return testErrorScenario(
          app,
          'post',
          `/posts/drafts/${draft.id}/publish`,
          409,
          'content.slug.exists',
          publishData,
          {
            Authorization: `Bearer ${authToken}`,
          },
        );
      });
    });
  });

  describe('Published Posts', () => {
    describe('GET /posts/published', () => {
      it('should return 400 for invalid query parameters', () => {
        return testErrorScenario(
          app,
          'get',
          '/posts/published?page=-1', // Invalid page number
          400,
          'common.validation',
          undefined,
          {
            Authorization: `Bearer ${authToken}`,
          },
        );
      });
    });

    describe('DELETE /posts/published/:id', () => {
      it('should return 404 when deleting non-existent published post', () => {
        return testErrorScenario(
          app,
          'delete',
          '/posts/published/non-existent-id',
          404,
          'content.published.notFound',
          undefined,
          {
            Authorization: `Bearer ${authToken}`,
          },
        );
      });

      it("should return 403 when deleting another user's published post", async () => {
        // Create a published post owned by another user
        const otherUserPost = await prismaService.publishedPost.create({
          data: {
            title: 'Other User Published Post',
            content: JSON.stringify({ blocks: [] }),
            userId: 'other-user-id',
            slug: 'other-user-post',
            excerpt: 'This is a test post',
          },
        });

        return testErrorScenario(
          app,
          'delete',
          `/posts/published/${otherUserPost.id}`,
          403,
          'content.published.notOwner',
          undefined,
          {
            Authorization: `Bearer ${authToken}`,
          },
        );
      });
    });

    describe('POST /posts/published/:id/draft', () => {
      it('should return 404 when creating draft from non-existent published post', () => {
        return testErrorScenario(
          app,
          'post',
          '/posts/published/non-existent-id/draft',
          404,
          'content.published.notFound',
          undefined,
          {
            Authorization: `Bearer ${authToken}`,
          },
        );
      });

      it("should return 403 when creating draft from another user's published post", async () => {
        // Create a published post owned by another user
        const otherUserPost = await prismaService.publishedPost.create({
          data: {
            title: 'Other User Published Post for Draft',
            content: JSON.stringify({ blocks: [] }),
            userId: 'other-user-id',
            slug: 'other-user-post-for-draft',
            excerpt: 'This is a test post',
          },
        });

        return testErrorScenario(
          app,
          'post',
          `/posts/published/${otherUserPost.id}/draft`,
          403,
          'content.published.notOwner',
          undefined,
          {
            Authorization: `Bearer ${authToken}`,
          },
        );
      });
    });
  });

  describe('Content moderation', () => {
    it('should return 403 when publishing content with prohibited terms', async () => {
      // Create a draft with prohibited content
      const draft = await prismaService.draftPost.create({
        data: {
          title: 'Draft with Prohibited Content',
          content: JSON.stringify({
            blocks: [
              {
                type: 'paragraph',
                data: {
                  text: 'This contains prohibited content that violates guidelines',
                },
              },
            ],
          }),
          userId: testData.testUser.id,
        },
      });

      // Enable test mode to trigger content moderation
      return testErrorScenario(
        app,
        'post',
        `/posts/drafts/${draft.id}/publish?testMode=contentModeration`,
        403,
        'content.moderation.prohibited',
        { slug: 'prohibited-content' },
        {
          Authorization: `Bearer ${authToken}`,
        },
      );
    });

    it('should handle error response when moderation service is unavailable', async () => {
      // Create a draft to publish
      const draft = await prismaService.draftPost.create({
        data: {
          title: 'Normal Draft',
          content: JSON.stringify({ blocks: [] }),
          userId: testData.testUser.id,
        },
      });

      // Set header to simulate moderation service failure
      return testErrorScenario(
        app,
        'post',
        `/posts/drafts/${draft.id}/publish`,
        503,
        'content.moderation.serviceUnavailable',
        { slug: 'normal-content' },
        {
          Authorization: `Bearer ${authToken}`,
          'X-Test-Moderation-Failure': 'true',
        },
      );
    });
  });

  describe('Topic operations', () => {
    it('should return 404 when referencing non-existent topic', async () => {
      // Create a draft with non-existent topic
      const draftData = {
        title: 'Draft with Non-existent Topic',
        content: JSON.stringify({ blocks: [] }),
        topics: ['non-existent-topic-id'],
      };

      return testErrorScenario(
        app,
        'post',
        '/posts/drafts',
        404,
        'content.topic.notFound',
        draftData,
        {
          Authorization: `Bearer ${authToken}`,
        },
      );
    });
  });

  describe('Error propagation', () => {
    it('should propagate database errors properly', () => {
      // Set header to trigger a simulated database error
      return testErrorScenario(
        app,
        'get',
        '/posts/drafts?testMode=databaseError',
        500,
        'common.internal',
        undefined,
        {
          Authorization: `Bearer ${authToken}`,
          'X-Trigger-Error': 'database',
        },
      );
    });
  });
});
