import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ContentService } from './content.service';

describe('ContentService', () => {
  let service: ContentService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPublishedPost = {
    id: 'post-1',
    title: 'Test Post',
    subtitle: 'Test Subtitle',
    slug: 'test-post',
    content: JSON.stringify({ text: 'Test content' }),
    excerpt: 'Test excerpt',
    cover: 'cover.jpg',
    readingTime: 5,
    publishedAt: new Date(),
    updatedAt: new Date(),
    isArchived: false,
    userId: 'user-1',
    botId: null,
    authorType: 'USER',
    metadata: {},
    userAuthor: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      avatar: 'avatar.jpg',
    },
  };

  const mockUserEmotion = {
    id: 'emotion-1',
    userId: 'user-2',
    emotion: 'joy',
    intensity: 3,
    note: 'Feeling happy',
    date: new Date(),
    timestamp: new Date(),
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'user-2',
      firstName: 'Jane',
      lastName: 'Smith',
      avatar: 'avatar2.jpg',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        {
          provide: PrismaService,
          useValue: {
            publishedPost: {
              findMany: jest.fn().mockImplementation(() => Promise.resolve([])),
            },
            userEmotion: {
              findMany: jest.fn().mockImplementation(() => Promise.resolve([])),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ContentService>(ContentService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getContentByIds', () => {
    it('should return empty array for empty input', async () => {
      const result = await service.getContentByIds([]);
      expect(result).toEqual([]);
      expect(prisma.publishedPost.findMany).not.toHaveBeenCalled();
      expect(prisma.userEmotion.findMany).not.toHaveBeenCalled();
    });

    it('should fetch and transform posts and emotions', async () => {
      const ids = ['post-1', 'emotion-1'];
      jest
        .spyOn(prisma.publishedPost, 'findMany')
        .mockResolvedValueOnce([mockPublishedPost]);
      jest
        .spyOn(prisma.userEmotion, 'findMany')
        .mockResolvedValueOnce([mockUserEmotion]);

      const result = await service.getContentByIds(ids);

      expect(result).toHaveLength(2);
      expect(result).toContainEqual({
        id: mockPublishedPost.id,
        type: 'post',
        title: mockPublishedPost.title,
        content: mockPublishedPost.content,
        authorId: mockPublishedPost.userId,
        score: undefined,
        createdAt: mockPublishedPost.publishedAt,
        updatedAt: mockPublishedPost.updatedAt,
      });
      expect(result).toContainEqual({
        id: mockUserEmotion.id,
        type: 'emotion',
        content: mockUserEmotion.note,
        authorId: mockUserEmotion.userId,
        score: undefined,
        createdAt: mockUserEmotion.createdAt,
        updatedAt: mockUserEmotion.updatedAt,
      });
    });

    it('should handle missing optional fields', async () => {
      const postWithoutUser = {
        ...mockPublishedPost,
        userId: null,
        botId: 'bot-1',
        userAuthor: null,
      };
      const emotionWithoutNote = {
        ...mockUserEmotion,
        note: null,
      };

      jest
        .spyOn(prisma.publishedPost, 'findMany')
        .mockResolvedValueOnce([postWithoutUser]);
      jest
        .spyOn(prisma.userEmotion, 'findMany')
        .mockResolvedValueOnce([emotionWithoutNote]);

      const result = await service.getContentByIds(['post-1', 'emotion-1']);

      expect(result).toHaveLength(2);
      expect(result[0].authorId).toBe('bot-1');
      expect(result[1].content).toBe('');
    });
  });
});
