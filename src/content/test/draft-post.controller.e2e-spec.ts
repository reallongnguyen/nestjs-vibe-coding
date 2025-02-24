/* eslint-disable no-await-in-loop */
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { AuthGuard } from 'src/common/auth';
import { mockUser } from 'src/common/test/mock-user';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { DatabaseHelper } from 'src/common/test/database.helper';
import { LoggerHelper } from 'src/common/test/logger.helper';
import { EventBusPort } from 'src/common/event-bus/core/ports/event-bus.port';
import { EventBusAdapter } from 'src/common/event-bus/adapters/infrastructure/event-bus.adapter';
import { generateSlug } from '../services/utils/content.utils';
import { ContentModule } from '../content.module';
import {
  TEST_TOPIC,
  TEST_DRAFT_POST,
  EXPECTED_PUBLISHED_POST,
} from './content.test-data';

describe('DraftPostController (Integration)', () => {
  let app: INestApplication;
  let dbHelper: DatabaseHelper;
  let prisma: PrismaService;
  let loggerHelper: LoggerHelper;
  let draftId: string;

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
          user: mockUser,
        }),
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    prisma = moduleRef.get(PrismaService);
    dbHelper = new DatabaseHelper(prisma);

    await app.init();
  });

  beforeEach(async () => {
    await dbHelper.cleanDatabase();
    await dbHelper.createTestTopic(TEST_TOPIC);

    // Create a test draft post
    const response = await request(app.getHttpServer())
      .post('/posts/drafts')
      .set('Authorization', `Bearer ${mockUser.token}`)
      .send(TEST_DRAFT_POST);

    draftId = response.body.id;
  });

  afterAll(async () => {
    await dbHelper.cleanDatabase();
    await app.close();
    loggerHelper.restoreLogger();
  });

  describe('POST /posts/drafts', () => {
    describe('Success cases', () => {
      it('should create a draft post and log success', async () => {
        const response = await request(app.getHttpServer())
          .post('/posts/drafts')
          .set('Authorization', `Bearer ${mockUser.token}`)
          .send(TEST_DRAFT_POST)
          .expect(201);

        // Verify response
        expect(response.body).toMatchObject({
          title: TEST_DRAFT_POST.title,
          subtitle: TEST_DRAFT_POST.subtitle,
          content: TEST_DRAFT_POST.content,
          cover: TEST_DRAFT_POST.cover,
          topics: TEST_DRAFT_POST.topics,
          userId: mockUser.id,
        });

        // Verify database state
        const savedDraft = await prisma.draftPost.findUnique({
          where: { id: response.body.id },
        });
        expect(savedDraft).toBeTruthy();
        expect(savedDraft).toMatchObject({
          title: TEST_DRAFT_POST.title,
          subtitle: TEST_DRAFT_POST.subtitle,
          topics: TEST_DRAFT_POST.topics,
        });

        // Verify logging
        const logs = loggerHelper.getLoggerCalls();
        expect(logs.debug).toEqual(
          expect.arrayContaining([
            expect.arrayContaining([
              expect.stringContaining('Creating draft post for user'),
            ]),
            expect.arrayContaining([
              expect.stringContaining('Created draft post'),
            ]),
          ]),
        );
        expect(logs.error).toHaveLength(0);
      });

      it('should create a draft post with only required fields', async () => {
        const minimalPost = {
          title: 'Test Post',
          content: { blocks: [] },
          topics: [TEST_TOPIC.id],
        };

        const response = await request(app.getHttpServer())
          .post('/posts/drafts')
          .set('Authorization', `Bearer ${mockUser.token}`)
          .send(minimalPost)
          .expect(201);

        expect(response.body).toMatchObject({
          title: minimalPost.title,
          content: minimalPost.content,
          topics: minimalPost.topics,
          userId: mockUser.id,
          subtitle: null,
          cover: null,
        });
      });
    });

    describe('Error cases', () => {
      it('should handle non-existent topics with proper error and logging', async () => {
        const dto = {
          ...TEST_DRAFT_POST,
          topics: ['non-existent-topic-1', 'non-existent-topic-2'],
        };

        const response = await request(app.getHttpServer())
          .post('/posts/drafts')
          .set('Authorization', `Bearer ${mockUser.token}`)
          .send(dto)
          .expect(404);

        // Verify error response
        expect(response.body.message).toBe(
          'One or more topics not found: non-existent-topic-1, non-existent-topic-2',
        );

        // Verify no draft was created
        const draftsCount = await prisma.draftPost.count();
        expect(draftsCount).toBe(0);

        // Verify logging
        const logs = loggerHelper.getLoggerCalls();
        expect(logs.warn).toEqual(
          expect.arrayContaining([
            expect.arrayContaining([
              expect.stringContaining('Topics not found'),
            ]),
          ]),
        );
      });

      it('should handle database errors with proper error response and logging', async () => {
        // Reset the table instead of dropping it
        await dbHelper.resetTable('draft_posts');

        const response = await request(app.getHttpServer())
          .post('/posts/drafts')
          .set('Authorization', `Bearer ${mockUser.token}`)
          .send(TEST_DRAFT_POST)
          .expect(500);

        // Verify error response
        expect(response.body.message).toBe('Failed to create draft post');

        // Verify logging
        const logs = loggerHelper.getLoggerCalls();
        expect(logs.error).toEqual(
          expect.arrayContaining([
            expect.arrayContaining([
              expect.stringContaining('Failed to create draft post'),
            ]),
          ]),
        );
      });

      it('should validate required fields', async () => {
        const invalidRequests = [
          {}, // Empty request
          { content: { blocks: [] }, topics: [TEST_TOPIC.id] }, // Missing title
          { title: 'Test', topics: [TEST_TOPIC.id] }, // Missing content
          { title: 'Test', content: { blocks: [] } }, // Missing topics
        ];

        for (const dto of invalidRequests) {
          await request(app.getHttpServer())
            .post('/posts/drafts')
            .set('Authorization', `Bearer ${mockUser.token}`)
            .send(dto)
            .expect(400);
        }
      });

      it('should validate field types', async () => {
        const invalidRequests = [
          { title: 123, content: { blocks: [] }, topics: [TEST_TOPIC.id] }, // Invalid title type
          { title: 'Test', content: 'invalid', topics: [TEST_TOPIC.id] }, // Invalid content type
          { title: 'Test', content: { blocks: [] }, topics: 'invalid' }, // Invalid topics type
        ];

        for (const dto of invalidRequests) {
          await request(app.getHttpServer())
            .post('/posts/drafts')
            .set('Authorization', `Bearer ${mockUser.token}`)
            .send(dto)
            .expect(400);
        }
      });

      it('should validate topic existence', async () => {
        const dto = {
          ...TEST_DRAFT_POST,
          topics: ['non-existent-topic'],
        };

        const response = await request(app.getHttpServer())
          .post('/posts/drafts')
          .set('Authorization', `Bearer ${mockUser.token}`)
          .send(dto)
          .expect(404);

        expect(response.body.message).toBe('One or more topics not found');
      });

      it('should require authentication', async () => {
        await request(app.getHttpServer())
          .post('/posts/drafts')
          .send(TEST_DRAFT_POST)
          .expect(401);
      });
    });
  });

  describe('PATCH /posts/drafts/:id', () => {
    describe('Success cases', () => {
      it('should update draft post with all fields', async () => {
        const updateData = {
          title: 'Updated Title',
          subtitle: 'Updated Subtitle',
          content: { blocks: [{ type: 'text', text: 'Updated content' }] },
          cover: 'https://example.com/new-image.jpg',
          topics: [TEST_TOPIC.id],
        };

        const response = await request(app.getHttpServer())
          .patch(`/posts/drafts/${draftId}`)
          .set('Authorization', `Bearer ${mockUser.token}`)
          .send(updateData)
          .expect(200);

        // Verify response
        expect(response.body).toMatchObject({
          id: draftId,
          ...updateData,
          userId: mockUser.id,
        });

        // Verify database state
        const savedDraft = await prisma.draftPost.findUnique({
          where: { id: draftId },
        });
        expect(savedDraft).toMatchObject(updateData);

        // Verify logging
        const logs = loggerHelper.getLoggerCalls();
        expect(logs.debug).toEqual(
          expect.arrayContaining([
            expect.arrayContaining([
              expect.stringContaining('Updating draft post'),
            ]),
            expect.arrayContaining([
              expect.stringContaining('Updated draft post'),
            ]),
          ]),
        );
      });

      it('should support partial updates', async () => {
        const updateData = {
          title: 'Updated Title',
        };

        const response = await request(app.getHttpServer())
          .patch(`/posts/drafts/${draftId}`)
          .set('Authorization', `Bearer ${mockUser.token}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toMatchObject({
          ...TEST_DRAFT_POST,
          ...updateData,
          id: draftId,
          userId: mockUser.id,
        });
      });
    });

    describe('Error cases', () => {
      it('should return 404 when draft not found', async () => {
        const nonExistentId = 'non-existent-id';
        await request(app.getHttpServer())
          .patch(`/posts/drafts/${nonExistentId}`)
          .set('Authorization', `Bearer ${mockUser.token}`)
          .send({ title: 'New Title' })
          .expect(404);
      });

      it('should return 403 when user is not owner', async () => {
        const otherUser = { ...mockUser, id: 'other-user-id' };
        const moduleRef = await Test.createTestingModule({
          imports: [ContentModule, PrismaModule],
        })
          .overrideGuard(AuthGuard)
          .useValue({
            canActivate: () => true,
            getRequest: () => ({
              user: otherUser,
            }),
          })
          .compile();

        const otherApp = moduleRef.createNestApplication();
        otherApp.useGlobalPipes(new ValidationPipe());
        await otherApp.init();

        await request(otherApp.getHttpServer())
          .patch(`/posts/drafts/${draftId}`)
          .set('Authorization', `Bearer ${otherUser.token}`)
          .send({ title: 'New Title' })
          .expect(403);

        await otherApp.close();
      });

      it('should return 404 when topic not found', async () => {
        const updateData = {
          topics: ['non-existent-topic'],
        };

        const response = await request(app.getHttpServer())
          .patch(`/posts/drafts/${draftId}`)
          .set('Authorization', `Bearer ${mockUser.token}`)
          .send(updateData)
          .expect(404);

        expect(response.body.message).toBe(
          'One or more topics not found: non-existent-topic',
        );
      });

      it('should validate input data', async () => {
        const invalidData = {
          title: 123, // Should be string
          content: 'not-an-object', // Should be object
          topics: 'not-an-array', // Should be array
        };

        await request(app.getHttpServer())
          .patch(`/posts/drafts/${draftId}`)
          .set('Authorization', `Bearer ${mockUser.token}`)
          .send(invalidData)
          .expect(400);
      });

      it('should require authentication', async () => {
        await request(app.getHttpServer())
          .patch(`/posts/drafts/${draftId}`)
          .send({ title: 'New Title' })
          .expect(401);
      });
    });
  });

  describe('POST /posts/drafts/:id/publish', () => {
    describe('Success cases', () => {
      it('should publish draft post and emit event', async () => {
        const eventBus = app.get<EventBusPort>(EventBusAdapter);
        const publishSpy = jest.spyOn(eventBus, 'publish');

        const publishData = {
          title: 'Updated Title for Publishing',
          subtitle: 'Updated Subtitle',
          excerpt: 'Custom excerpt for the published post',
        };

        const response = await request(app.getHttpServer())
          .post(`/posts/drafts/${draftId}/publish`)
          .set('Authorization', `Bearer ${mockUser.token}`)
          .send(publishData)
          .expect(201);

        // Verify event was published
        expect(publishSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            publishedId: response.body.id,
            draftId,
            userId: mockUser.id,
            title: publishData.title,
            slug: response.body.slug,
          }),
        );
      });

      it('should publish draft post with all fields', async () => {
        const publishData = {
          title: 'Updated Title for Publishing',
          subtitle: 'Updated Subtitle',
          excerpt: 'Custom excerpt for the published post',
        };

        const response = await request(app.getHttpServer())
          .post(`/posts/drafts/${draftId}/publish`)
          .set('Authorization', `Bearer ${mockUser.token}`)
          .send(publishData)
          .expect(201);

        // Verify response matches expected structure
        expect(response.body).toMatchObject({
          ...EXPECTED_PUBLISHED_POST,
          title: publishData.title,
          subtitle: publishData.subtitle,
          excerpt: publishData.excerpt,
          slug: expect.stringContaining(generateSlug(publishData.title)),
          userId: mockUser.id,
        });

        // Verify database state
        const publishedPost = await prisma.publishedPost.findUnique({
          where: { id: response.body.id },
        });
        expect(publishedPost).toBeTruthy();
        expect(publishedPost).toMatchObject({
          title: publishData.title,
          content: TEST_DRAFT_POST.content,
        });

        const updatedDraft = await prisma.draftPost.findUnique({
          where: { id: draftId },
        });
        expect(updatedDraft?.publishedId).toBe(response.body.id);

        // Verify logging
        const logs = loggerHelper.getLoggerCalls();
        expect(logs.debug).toEqual(
          expect.arrayContaining([
            expect.arrayContaining([
              expect.stringContaining('Publishing draft post'),
            ]),
            expect.arrayContaining([
              expect.stringContaining('Published draft post'),
            ]),
          ]),
        );
      });

      it('should publish with minimal data using draft values', async () => {
        const response = await request(app.getHttpServer())
          .post(`/posts/drafts/${draftId}/publish`)
          .set('Authorization', `Bearer ${mockUser.token}`)
          .send({})
          .expect(201);

        expect(response.body).toMatchObject({
          ...EXPECTED_PUBLISHED_POST,
          userId: mockUser.id,
        });
      });
    });

    describe('Error cases', () => {
      it('should return 404 when draft not found', async () => {
        const nonExistentId = 'non-existent-id';
        await request(app.getHttpServer())
          .post(`/posts/drafts/${nonExistentId}/publish`)
          .set('Authorization', `Bearer ${mockUser.token}`)
          .send({})
          .expect(404);
      });

      it('should return 403 when user is not owner', async () => {
        const otherUser = { ...mockUser, id: 'other-user-id' };
        const moduleRef = await Test.createTestingModule({
          imports: [ContentModule, PrismaModule],
        })
          .overrideGuard(AuthGuard)
          .useValue({
            canActivate: () => true,
            getRequest: () => ({
              user: otherUser,
            }),
          })
          .compile();

        const otherApp = moduleRef.createNestApplication();
        otherApp.useGlobalPipes(new ValidationPipe());
        await otherApp.init();

        await request(otherApp.getHttpServer())
          .post(`/posts/drafts/${draftId}/publish`)
          .set('Authorization', `Bearer ${otherUser.token}`)
          .send({})
          .expect(403);

        await otherApp.close();
      });

      it('should validate input data', async () => {
        const invalidData = {
          title: 123, // Should be string
          subtitle: true, // Should be string
          excerpt: {}, // Should be string
        };

        await request(app.getHttpServer())
          .post(`/posts/drafts/${draftId}/publish`)
          .set('Authorization', `Bearer ${mockUser.token}`)
          .send(invalidData)
          .expect(400);
      });

      it('should require authentication', async () => {
        await request(app.getHttpServer())
          .post(`/posts/drafts/${draftId}/publish`)
          .send({})
          .expect(401);
      });
    });
  });
});
