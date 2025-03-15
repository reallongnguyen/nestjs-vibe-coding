import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { AuthGuard } from 'src/common/auth';
import { mockUser } from 'src/common/test/mock-user';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { DatabaseHelper } from 'src/common/test/database.helper';
import { LoggerHelper } from 'src/common/test/logger.helper';
import { ContentModule } from '../content.module';
import { createTestDraft, publishTestPost } from './content.test-helpers';

// Create a second mock user for authorization tests
const mockUser2 = {
  ...mockUser,
  id: 'user-2',
  sub: 'auth0|user2',
  email: 'user2@example.com',
};

/**
 * Integration tests for error handling in the Content module
 * This focuses specifically on testing the standardized error responses
 */
describe('Content Error Handling (Integration)', () => {
  let app: INestApplication;
  let dbHelper: DatabaseHelper;
  let prisma: PrismaService;
  let loggerHelper: LoggerHelper;
  let draftId: string;
  let publishedId: string;
  let mockAuthUser = mockUser; // Default test user

  beforeAll(async () => {
    loggerHelper = new LoggerHelper();
    loggerHelper.setupLoggerSpy();

    const moduleRef = await Test.createTestingModule({
      imports: [ContentModule, PrismaModule],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: () => true,
        getRequest: () => ({
          user: mockAuthUser,
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
    mockAuthUser = mockUser; // Reset to default user
    await dbHelper.cleanDatabase();

    // Create a test draft post for each test
    const draftResponse = await createTestDraft(app, mockUser.id.toString());
    draftId = draftResponse.id;

    // Create a published post for some tests
    const publishResponse = await publishTestPost(
      app,
      draftId,
      mockUser.id.toString(),
    );
    publishedId = publishResponse.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Draft Post Error Handling', () => {
    it('should return 404 when draft post is not found', async () => {
      const nonExistentId = 'non-existent-id';

      const response = await request(app.getHttpServer())
        .patch(`/posts/drafts/${nonExistentId}`)
        .send({
          title: 'Updated Title',
        })
        .expect(404);

      // Verify error response structure
      expect(response.body).toMatchObject({
        code: 'content.draft.notFound',
        message: expect.stringContaining(nonExistentId),
        params: {
          draftId: nonExistentId,
        },
      });
    });

    it('should return 403 when user is not draft owner', async () => {
      // Switch to a different user
      mockAuthUser = mockUser2;

      const response = await request(app.getHttpServer())
        .patch(`/posts/drafts/${draftId}`)
        .send({
          title: 'Unauthorized Update',
        })
        .expect(403);

      // Verify error response structure
      expect(response.body).toMatchObject({
        code: 'content.draft.notOwner',
        message: expect.stringContaining(draftId),
        params: {
          draftId,
          userId: mockUser2.id,
        },
      });
    });

    it('should return 409 when trying to publish with existing slug', async () => {
      // Create a second draft
      const secondDraftResponse = await createTestDraft(
        app,
        mockUser.id.toString(),
      );
      const secondDraftId = secondDraftResponse.id;

      // Try to publish with same slug as already published post
      const response = await request(app.getHttpServer())
        .post(`/posts/drafts/${secondDraftId}/publish`)
        .send({
          slug: 'test-published-post', // This slug already exists
        })
        .expect(409);

      // Verify error response structure
      expect(response.body).toMatchObject({
        code: 'content.slug.exists',
        message: expect.stringContaining('test-published-post'),
        params: {
          slug: 'test-published-post',
        },
      });
    });
  });

  describe('Published Post Error Handling', () => {
    it('should return 404 when published post is not found', async () => {
      const nonExistentId = 'non-existent-id';

      const response = await request(app.getHttpServer())
        .delete(`/posts/published/${nonExistentId}`)
        .expect(404);

      // Verify error response structure
      expect(response.body).toMatchObject({
        code: 'content.published.notFound',
        message: expect.stringContaining(nonExistentId),
        params: {
          postId: nonExistentId,
        },
      });
    });

    it('should return 403 when user is not published post owner', async () => {
      // Switch to a different user
      mockAuthUser = mockUser2;

      const response = await request(app.getHttpServer())
        .delete(`/posts/published/${publishedId}`)
        .expect(403);

      // Verify error response structure
      expect(response.body).toMatchObject({
        code: 'content.published.notOwner',
        message: expect.stringContaining(publishedId),
        params: {
          postId: publishedId,
          userId: mockUser2.id,
        },
      });
    });

    it('should return 400 when trying to apply draft to non-existent published post', async () => {
      // Create a draft that is not linked to any published post
      const unlinkedDraftResponse = await createTestDraft(
        app,
        mockUser.id.toString(),
      );
      const unlinkedDraftId = unlinkedDraftResponse.id;

      const response = await request(app.getHttpServer())
        .post(`/posts/drafts/${unlinkedDraftId}/apply`)
        .send({
          excerpt: 'New excerpt',
        })
        .expect(400);

      // Verify error response structure
      expect(response.body).toMatchObject({
        code: 'content.draft.notLinkedToPublished',
        message: expect.stringContaining(unlinkedDraftId),
        params: {
          draftId: unlinkedDraftId,
        },
      });
    });
  });
});
