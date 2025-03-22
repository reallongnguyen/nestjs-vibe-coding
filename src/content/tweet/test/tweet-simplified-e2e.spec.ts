/* eslint-disable no-console */
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { AuthGuard, RolesGuard } from 'src/common/auth';
import { EventBus } from '@nestjs/cqrs';
import { TweetController } from '../presentation/tweet.controller';
import { TweetService } from '../services/tweet.service';
import { TWEET_REPOSITORY } from '../repositories/tweet.repository';
import { TweetUserService } from '../services/tweet-user.service';
import { TweetImageService } from '../services/tweet-image.service';
import { TweetEventService } from '../services/tweet-event.service';

describe('Tweet Creation (simplified e2e)', () => {
  let app: INestApplication;
  let mockTweetRepository;
  let mockEventBus;

  const mockUserId = 'test-user-id';

  const mockUser = {
    id: mockUserId,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    roles: [UserRole.USER],
    avatar: null,
  };

  const mockAuthCtx = {
    isPerson: () => true,
    isService: () => false,
    isUser: () => true,
    getPerson: () => ({ id: mockUserId }),
    getUser: () => mockUser,
    getExpireAt: () => Date.now() + 3600000, // 1 hour from now
  };

  beforeEach(async () => {
    // Reset mocks on each test
    mockTweetRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      countByUserId: jest.fn(),
    };

    mockEventBus = {
      publish: jest.fn().mockImplementation((event) => {
        // Just log the event for debugging if needed
        console.log('Event published:', event?.eventName);
        return Promise.resolve();
      }),
    };

    const mockTweetUserService = {
      enrichTweetWithUser: jest.fn(),
      enrichTweetsWithUsers: jest.fn(),
    };

    const mockTweetImageService = {
      validateImages: jest.fn(),
    };

    const mockTweetEventService = {
      publishTweetCreated: jest.fn(),
      publishTweetUpdated: jest.fn(),
      publishTweetDeleted: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [TweetController],
      providers: [
        TweetService,
        {
          provide: TWEET_REPOSITORY,
          useValue: mockTweetRepository,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn((fn) => fn()),
          },
        },
        {
          provide: TweetUserService,
          useValue: mockTweetUserService,
        },
        {
          provide: TweetImageService,
          useValue: mockTweetImageService,
        },
        {
          provide: TweetEventService,
          useValue: mockTweetEventService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          req.authCtx = mockAuthCtx;
          req.user = mockUser;
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    app = moduleRef.createNestApplication();

    // Important: disable logging for tests
    app.useLogger(false);

    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  describe('createTweet', () => {
    it('should create a tweet with valid text content', async () => {
      const tweetContent = 'This is a test tweet';
      const expectedTweet = {
        id: 'tweet-1',
        content: tweetContent,
        images: [],
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTweetRepository.create.mockResolvedValue(expectedTweet);

      const response = await request(app.getHttpServer())
        .post('/tweets')
        .send({ content: tweetContent })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toBe(tweetContent);
      expect(response.body.author.id).toBe(mockUserId);

      expect(mockTweetRepository.create).toHaveBeenCalledWith({
        content: tweetContent,
        images: [],
        userId: mockUserId,
      });

      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: expect.stringContaining('tweet.created'),
          eventPayload: expect.objectContaining({
            tweetId: expectedTweet.id,
            userId: mockUserId,
          }),
        }),
      );
    });

    it('should create a tweet with exactly 280 characters', async () => {
      const tweetContent = 'A'.repeat(280);
      const expectedTweet = {
        id: 'tweet-1',
        content: tweetContent,
        images: [],
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTweetRepository.create.mockResolvedValue(expectedTweet);

      const response = await request(app.getHttpServer())
        .post('/tweets')
        .send({ content: tweetContent })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toBe(tweetContent);
      expect(response.body.content.length).toBe(280);
    });

    it('should create a tweet with images', async () => {
      const tweetContent = 'Tweet with images';
      const images = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
      ];
      const expectedTweet = {
        id: 'tweet-2',
        content: tweetContent,
        images,
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTweetRepository.create.mockResolvedValue(expectedTweet);

      const response = await request(app.getHttpServer())
        .post('/tweets')
        .send({
          content: tweetContent,
          images,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toBe(tweetContent);
      expect(response.body.images).toEqual(images);
      expect(response.body.author.id).toBe(mockUserId);

      expect(mockTweetRepository.create).toHaveBeenCalledWith({
        content: tweetContent,
        images,
        userId: mockUserId,
      });
    });

    it('should create a tweet with exactly 4 images', async () => {
      const tweetContent = 'Tweet with maximum allowed images';
      const images = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
        'https://example.com/image4.jpg',
      ];
      const expectedTweet = {
        id: 'tweet-3',
        content: tweetContent,
        images,
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTweetRepository.create.mockResolvedValue(expectedTweet);

      const response = await request(app.getHttpServer())
        .post('/tweets')
        .send({
          content: tweetContent,
          images,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toBe(tweetContent);
      expect(response.body.images).toEqual(images);
      expect(response.body.images.length).toBe(4);
    });

    it('should return 400 when creating tweet with empty content', async () => {
      await request(app.getHttpServer())
        .post('/tweets')
        .send({ content: '' })
        .expect(400);

      expect(mockTweetRepository.create).not.toHaveBeenCalled();
    });

    it('should return 400 when content is only whitespace', async () => {
      await request(app.getHttpServer())
        .post('/tweets')
        .send({ content: '   ' })
        .expect(400);

      expect(mockTweetRepository.create).not.toHaveBeenCalled();
    });

    it('should return 400 when content exceeds 280 characters', async () => {
      const tweetContent = 'A'.repeat(281);
      await request(app.getHttpServer())
        .post('/tweets')
        .send({ content: tweetContent })
        .expect(400);

      expect(mockTweetRepository.create).not.toHaveBeenCalled();
    });

    it('should return 400 when tweet has more than 4 images', async () => {
      const images = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
        'https://example.com/image4.jpg',
        'https://example.com/image5.jpg',
      ];

      await request(app.getHttpServer())
        .post('/tweets')
        .send({
          content: 'Tweet with too many images',
          images,
        })
        .expect(400);

      expect(mockTweetRepository.create).not.toHaveBeenCalled();
    });

    it('should handle missing images array by providing empty array', async () => {
      const tweetContent = 'Tweet without images field';
      const expectedTweet = {
        id: 'tweet-4',
        content: tweetContent,
        images: [],
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTweetRepository.create.mockResolvedValue(expectedTweet);

      const response = await request(app.getHttpServer())
        .post('/tweets')
        .send({ content: tweetContent })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.images).toEqual([]);

      expect(mockTweetRepository.create).toHaveBeenCalledWith({
        content: tweetContent,
        images: [],
        userId: mockUserId,
      });
    });

    it('should properly include user data in response', async () => {
      const tweetContent = 'Tweet with user data check';
      const expectedTweet = {
        id: 'tweet-5',
        content: tweetContent,
        images: [],
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTweetRepository.create.mockResolvedValue(expectedTweet);

      const response = await request(app.getHttpServer())
        .post('/tweets')
        .send({ content: tweetContent })
        .expect(201);

      expect(response.body.author).toEqual({
        id: mockUser.id,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        avatar: mockUser.avatar,
      });
    });
  });
});
