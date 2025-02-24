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
import { ContentModule } from '../content.module';
import { TEST_TOPIC, TEST_DRAFT_POST } from './content.test-data';

describe('DraftPostController (Integration)', () => {
  let app: INestApplication;
  let dbHelper: DatabaseHelper;
  let prisma: PrismaService;
  let loggerHelper: LoggerHelper;

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
});
