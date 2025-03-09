import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/common';
import { GorseFeedbackType, EventBusAdapter } from 'src/common/event-manager';
import { GorseSyncService } from './gorse-sync.service';
import { GorseClient } from './gorse.client';

jest.mock('src/common/prisma/prisma.service');

describe('GorseSyncService', () => {
  let service: GorseSyncService;
  let gorseClient: jest.Mocked<GorseClient>;
  let prisma: jest.Mocked<PrismaService>;

  const mockGorseClient = {
    insertUser: jest.fn(),
    insertItem: jest.fn(),
    insertFeedback: jest.fn(),
  };

  const mockPrisma = {
    user: {
      findMany: jest.fn().mockImplementation(() => Promise.resolve([])),
      findUnique: jest.fn().mockImplementation(() => Promise.resolve(null)),
    },
    publishedPost: {
      findMany: jest.fn().mockImplementation(() => Promise.resolve([])),
      findUnique: jest.fn().mockImplementation(() => Promise.resolve(null)),
    },
    like: {
      findMany: jest.fn().mockImplementation(() => Promise.resolve([])),
      findFirst: jest.fn().mockImplementation(() => Promise.resolve(null)),
    },
  };

  const mockEventBus = {
    publish: jest.fn(),
    subscribe: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GorseSyncService,
        {
          provide: GorseClient,
          useValue: mockGorseClient,
        },
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: EventBusAdapter,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    service = module.get<GorseSyncService>(GorseSyncService);
    gorseClient = module.get(GorseClient);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('performInitialSync', () => {
    const mockUsers = [
      { id: 'user1', updatedAt: new Date() },
      { id: 'user2', updatedAt: new Date() },
    ];

    const mockPosts = [
      {
        id: 'post1',
        publishedAt: new Date(),
        topics: [{ topic: { name: 'topic1' } }],
      },
      {
        id: 'post2',
        publishedAt: new Date(),
        topics: [{ topic: { name: 'topic2' } }],
      },
    ];

    const mockLikes = [
      {
        userId: 'user1',
        contentId: 'post1',
        createdAt: new Date(),
      },
      {
        userId: 'user2',
        contentId: 'post2',
        createdAt: new Date(),
      },
    ];

    beforeEach(() => {
      mockPrisma.user.findMany.mockImplementation(() =>
        Promise.resolve(mockUsers),
      );
      mockPrisma.publishedPost.findMany.mockImplementation(() =>
        Promise.resolve(mockPosts),
      );
      mockPrisma.like.findMany.mockImplementation(() =>
        Promise.resolve(mockLikes),
      );
    });

    it('should sync users, posts, and likes', async () => {
      await service.performInitialSync();

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          updatedAt: true,
        },
      });

      expect(prisma.publishedPost.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          publishedAt: true,
          topics: {
            select: {
              topic: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      expect(prisma.like.findMany).toHaveBeenCalledWith({
        where: {
          type: 'POST',
        },
        select: {
          userId: true,
          contentId: true,
          createdAt: true,
        },
      });

      expect(gorseClient.insertUser).toHaveBeenCalledTimes(2);
      expect(gorseClient.insertItem).toHaveBeenCalledTimes(2);
      expect(gorseClient.insertFeedback).toHaveBeenCalledTimes(2);
    });

    it('should handle errors during sync', async () => {
      const error = new Error('Sync failed');
      mockPrisma.user.findMany.mockImplementation(() => Promise.reject(error));

      await expect(service.performInitialSync()).rejects.toThrow(error);
    });
  });

  describe('handleUserSync', () => {
    const mockUser = {
      id: 'user1',
      updatedAt: new Date(),
    };

    beforeEach(() => {
      mockPrisma.user.findUnique.mockImplementation(() =>
        Promise.resolve(mockUser),
      );
    });

    it('should sync user to Gorse', async () => {
      await service.handleUserUpdate('user1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user1' },
        select: {
          id: true,
          updatedAt: true,
        },
      });

      expect(gorseClient.insertUser).toHaveBeenCalledWith('user1', [], []);
    });

    it('should handle errors during user sync', async () => {
      const error = new Error('User sync failed');
      mockGorseClient.insertUser.mockImplementation(() =>
        Promise.reject(error),
      );

      await expect(service.handleUserUpdate('user1')).rejects.toThrow(error);
    });
  });

  describe('handleNewContent', () => {
    const mockContent = {
      id: 'post1',
      publishedAt: new Date(),
      topics: [{ topic: { name: 'topic1' } }],
    };

    beforeEach(() => {
      mockPrisma.publishedPost.findUnique.mockImplementation(() =>
        Promise.resolve(mockContent),
      );
    });

    it('should sync content to Gorse', async () => {
      await service.handleNewContent('post1');

      expect(prisma.publishedPost.findUnique).toHaveBeenCalledWith({
        where: { id: 'post1' },
        select: {
          id: true,
          publishedAt: true,
          topics: {
            select: {
              topic: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      expect(gorseClient.insertItem).toHaveBeenCalledWith(
        mockContent.id,
        mockContent.publishedAt,
        mockContent.topics.map((t) => t.topic.name),
        [],
      );
    });

    it('should handle errors during content sync', async () => {
      const error = new Error('Content sync failed');
      mockPrisma.publishedPost.findUnique.mockImplementation(() =>
        Promise.reject(error),
      );

      await expect(service.handleNewContent('post1')).rejects.toThrow(error);
    });
  });

  describe('handleFeedback', () => {
    const mockFeedback = {
      userId: 'user1',
      contentId: 'post1',
      createdAt: new Date(),
    };

    beforeEach(() => {
      mockPrisma.like.findFirst.mockImplementation(() =>
        Promise.resolve(mockFeedback),
      );
    });

    it('should sync feedback to Gorse', async () => {
      await service.handleFeedback('user1', 'post1');

      expect(prisma.like.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user1',
          contentId: 'post1',
          type: 'POST',
        },
        select: {
          userId: true,
          contentId: true,
          createdAt: true,
        },
      });

      expect(gorseClient.insertFeedback).toHaveBeenCalledWith({
        FeedbackType: GorseFeedbackType.LIKE,
        UserId: mockFeedback.userId,
        ItemId: mockFeedback.contentId,
        Timestamp: mockFeedback.createdAt.toISOString(),
      });
    });

    it('should handle errors during feedback sync', async () => {
      const error = new Error('Feedback sync failed');
      mockPrisma.like.findFirst.mockImplementation(() => Promise.reject(error));

      await expect(service.handleFeedback('user1', 'post1')).rejects.toThrow(
        error,
      );
    });
  });
});
