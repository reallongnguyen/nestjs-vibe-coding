import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { TweetService } from '../services/tweet.service';
import { TWEET_REPOSITORY } from '../repositories/tweet.repository';
import { TweetUserService } from '../services/tweet-user.service';
import { TweetImageService } from '../services/tweet-image.service';
import { TweetEventService } from '../services/tweet-event.service';

describe('TweetService Validation', () => {
  let tweetService: TweetService;
  const mockTweetRepository = {
    create: jest.fn(),
  };
  const mockEventBus = {
    publish: jest.fn(),
  };
  const mockPrismaService = {};
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

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
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
          useValue: mockPrismaService,
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
    }).compile();

    tweetService = moduleRef.get<TweetService>(TweetService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTweet', () => {
    it('should throw BadRequestException when content is empty', async () => {
      const dto = { content: '', images: [], userId: 'user1' };

      await expect(tweetService.createTweet(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(tweetService.createTweet(dto)).rejects.toThrow(
        'Tweet content cannot be empty',
      );
    });

    it('should throw BadRequestException when content is only whitespace', async () => {
      const dto = { content: '   ', images: [], userId: 'user1' };

      await expect(tweetService.createTweet(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(tweetService.createTweet(dto)).rejects.toThrow(
        'Tweet content cannot be empty',
      );
    });

    it('should throw BadRequestException when content is null or undefined', async () => {
      const dtoNull = { content: null, images: [], userId: 'user1' };
      const dtoUndefined = { content: undefined, images: [], userId: 'user1' };

      await expect(tweetService.createTweet(dtoNull as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(
        tweetService.createTweet(dtoUndefined as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when content exceeds 280 characters', async () => {
      const dto = {
        content: 'A'.repeat(281),
        images: [],
        userId: 'user1',
      };

      await expect(tweetService.createTweet(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(tweetService.createTweet(dto)).rejects.toThrow(
        'Tweet content cannot exceed 280 characters',
      );
    });

    it('should throw BadRequestException when there are more than 4 images', async () => {
      const dto = {
        content: 'Valid content',
        images: ['img1', 'img2', 'img3', 'img4', 'img5'],
        userId: 'user1',
      };

      await expect(tweetService.createTweet(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(tweetService.createTweet(dto)).rejects.toThrow(
        'Tweet cannot have more than 4 images',
      );
    });

    it('should handle undefined images array by using empty array', async () => {
      const dto = {
        content: 'Valid content',
        images: undefined,
        userId: 'user1',
      };

      const mockCreatedTweet = {
        id: 'tweet1',
        content: dto.content,
        images: [],
        userId: dto.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTweetRepository.create.mockResolvedValue(mockCreatedTweet);

      const result = await tweetService.createTweet(dto);

      expect(result).toEqual(mockCreatedTweet);
      expect(mockTweetRepository.create).toHaveBeenCalledWith({
        content: dto.content,
        images: [],
        userId: dto.userId,
      });
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('should create a tweet with exactly 280 characters', async () => {
      const dto = {
        content: 'A'.repeat(280),
        images: [],
        userId: 'user1',
      };

      const mockCreatedTweet = {
        id: 'tweet1',
        content: dto.content,
        images: [],
        userId: dto.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTweetRepository.create.mockResolvedValue(mockCreatedTweet);

      const result = await tweetService.createTweet(dto);

      expect(result).toEqual(mockCreatedTweet);
      expect(mockTweetRepository.create).toHaveBeenCalledWith({
        content: dto.content,
        images: [],
        userId: dto.userId,
      });
    });

    it('should create a tweet with exactly 4 images', async () => {
      const dto = {
        content: 'Valid content',
        images: ['img1', 'img2', 'img3', 'img4'],
        userId: 'user1',
      };

      const mockCreatedTweet = {
        id: 'tweet1',
        content: dto.content,
        images: dto.images,
        userId: dto.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTweetRepository.create.mockResolvedValue(mockCreatedTweet);

      const result = await tweetService.createTweet(dto);

      expect(result).toEqual(mockCreatedTweet);
      expect(mockTweetRepository.create).toHaveBeenCalledWith({
        content: dto.content,
        images: dto.images,
        userId: dto.userId,
      });
    });

    it('should create a tweet when input is valid', async () => {
      const dto = {
        content: 'Valid content',
        images: ['img1', 'img2'],
        userId: 'user1',
      };

      const mockCreatedTweet = {
        id: 'tweet1',
        content: dto.content,
        images: dto.images,
        userId: dto.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTweetRepository.create.mockResolvedValue(mockCreatedTweet);

      const result = await tweetService.createTweet(dto);

      expect(result).toEqual(mockCreatedTweet);
      expect(mockTweetRepository.create).toHaveBeenCalledWith({
        content: dto.content,
        images: dto.images,
        userId: dto.userId,
      });
      expect(mockEventBus.publish).toHaveBeenCalled();
    });
  });
});
