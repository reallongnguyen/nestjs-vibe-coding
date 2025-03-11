import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { IEventBus } from '../../../common/event-manager';
import { SocialEngagementService } from '../social-engagement.service';
import { IViewRepository } from '../interfaces/view-repository.interface';
import { EngageableNotFoundError } from '../../entities/social.error';
import { ContentType } from '../../entities/events/social.events';
import { ContentViewedEvent } from '../../entities/events/content-viewed.event';

describe('SocialEngagementService', () => {
  let service: SocialEngagementService;
  let prisma: PrismaService;
  let eventBus: IEventBus;
  let viewRepository: IViewRepository;

  const mockPrisma = {
    publishedPost: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    userEmotion: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    comment: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    engageable: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const mockEventBus = {
    publish: jest.fn(),
  };

  const mockViewRepository = {
    insertView: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialEngagementService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: 'IEventBus',
          useValue: mockEventBus,
        },
        {
          provide: 'IViewRepository',
          useValue: mockViewRepository,
        },
      ],
    }).compile();

    service = module.get<SocialEngagementService>(SocialEngagementService);
    prisma = module.get<PrismaService>(PrismaService);
    eventBus = module.get<IEventBus>('IEventBus');
    viewRepository = module.get<IViewRepository>('IViewRepository');

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock responses
    mockPrisma.publishedPost.count.mockResolvedValue(1);
    mockPrisma.userEmotion.count.mockResolvedValue(1);
    mockPrisma.comment.count.mockResolvedValue(1);
  });

  describe('likeContent', () => {
    const mockUserId = 'user-123';
    const mockContentId = 'content-123';
    const mockTargetUserId = 'target-123';

    it('should emit like created event for post', async () => {
      // Arrange
      jest.spyOn(prisma.publishedPost, 'count').mockResolvedValue(1);
      jest.spyOn(prisma.publishedPost, 'findUnique').mockResolvedValue({
        userId: mockTargetUserId,
      } as any);

      // Act
      await service.likeContent('POST', mockContentId, mockUserId);

      // Assert
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: mockUserId,
          contentType: 'POST',
          contentId: mockContentId,
          targetUserId: mockTargetUserId,
        }),
      );
      expect((eventBus.publish as jest.Mock).mock.calls[0][0].eventName()).toBe(
        'social.like.created',
      );
    });

    it('should emit like created event for emotion', async () => {
      // Arrange
      jest.spyOn(prisma.userEmotion, 'count').mockResolvedValue(1);
      jest.spyOn(prisma.userEmotion, 'findUnique').mockResolvedValue({
        userId: mockTargetUserId,
      } as any);

      // Act
      await service.likeContent('EMOTION', mockContentId, mockUserId);

      // Assert
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: mockUserId,
          contentType: 'EMOTION',
          contentId: mockContentId,
          targetUserId: mockTargetUserId,
        }),
      );
      expect((eventBus.publish as jest.Mock).mock.calls[0][0].eventName()).toBe(
        'social.like.created',
      );
    });

    it('should throw EngageableNotFoundError if content does not exist', async () => {
      // Arrange
      jest.spyOn(prisma.publishedPost, 'count').mockResolvedValue(0);

      // Act & Assert
      await expect(
        service.likeContent('POST', mockContentId, mockUserId),
      ).rejects.toThrow(EngageableNotFoundError);
    });
  });

  describe('unlikeContent', () => {
    const mockUserId = 'user-123';
    const mockContentId = 'content-123';
    const mockTargetUserId = 'target-123';

    it('should emit like deleted event for post', async () => {
      // Arrange
      jest.spyOn(prisma.publishedPost, 'count').mockResolvedValue(1);
      jest.spyOn(prisma.publishedPost, 'findUnique').mockResolvedValue({
        userId: mockTargetUserId,
      } as any);

      // Act
      await service.unlikeContent('POST', mockContentId, mockUserId);

      // Assert
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: mockUserId,
          contentType: 'POST',
          contentId: mockContentId,
          targetUserId: mockTargetUserId,
        }),
      );
      expect((eventBus.publish as jest.Mock).mock.calls[0][0].eventName()).toBe(
        'social.like.deleted',
      );
    });

    it('should emit like deleted event for emotion', async () => {
      // Arrange
      jest.spyOn(prisma.userEmotion, 'count').mockResolvedValue(1);
      jest.spyOn(prisma.userEmotion, 'findUnique').mockResolvedValue({
        userId: mockTargetUserId,
      } as any);

      // Act
      await service.unlikeContent('EMOTION', mockContentId, mockUserId);

      // Assert
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: mockUserId,
          contentType: 'EMOTION',
          contentId: mockContentId,
          targetUserId: mockTargetUserId,
        }),
      );
      expect((eventBus.publish as jest.Mock).mock.calls[0][0].eventName()).toBe(
        'social.like.deleted',
      );
    });

    it('should throw EngageableNotFoundError if content does not exist', async () => {
      // Arrange
      jest.spyOn(prisma.publishedPost, 'count').mockResolvedValue(0);

      // Act & Assert
      await expect(
        service.unlikeContent('POST', mockContentId, mockUserId),
      ).rejects.toThrow(EngageableNotFoundError);
    });
  });

  describe('recordView', () => {
    const mockData = {
      contentId: '123e4567-e89b-12d3-a456-426614174000',
      type: 'POST',
      viewerHash: 'abc123',
      viewerId: '123e4567-e89b-12d3-a456-426614174001',
    };

    beforeEach(() => {
      mockPrisma.publishedPost.findUnique.mockResolvedValue({
        id: mockData.contentId,
      });
    });

    it('should record view and emit event for new view', async () => {
      mockViewRepository.insertView.mockResolvedValue({ isNewView: true });

      await service.recordView(
        mockData.type,
        mockData.contentId,
        mockData.viewerHash,
        mockData.viewerId,
      );

      expect(viewRepository.insertView).toHaveBeenCalledWith(
        mockData.contentId,
        ContentType.POST,
        mockData.viewerHash,
        mockData.viewerId,
      );

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(ContentViewedEvent),
      );

      const publishedEvent = mockEventBus.publish.mock.calls[0][0];
      expect(publishedEvent.toJSON()).toEqual({
        contentId: mockData.contentId,
        contentType: ContentType.POST,
        viewerHash: mockData.viewerHash,
        viewerId: mockData.viewerId,
        timestamp: expect.any(Date),
      });
    });

    it('should record view but not emit event for duplicate view', async () => {
      mockViewRepository.insertView.mockResolvedValue({ isNewView: false });

      await service.recordView(
        mockData.type,
        mockData.contentId,
        mockData.viewerHash,
        mockData.viewerId,
      );

      expect(viewRepository.insertView).toHaveBeenCalledWith(
        mockData.contentId,
        ContentType.POST,
        mockData.viewerHash,
        mockData.viewerId,
      );

      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should throw error for non-existent content', async () => {
      mockPrisma.publishedPost.findUnique.mockResolvedValue(null);

      await expect(
        service.recordView(
          mockData.type,
          mockData.contentId,
          mockData.viewerHash,
          mockData.viewerId,
        ),
      ).rejects.toThrow(EngageableNotFoundError);

      expect(viewRepository.insertView).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle anonymous views', async () => {
      mockViewRepository.insertView.mockResolvedValue({ isNewView: true });

      await service.recordView(
        mockData.type,
        mockData.contentId,
        mockData.viewerHash,
      );

      expect(viewRepository.insertView).toHaveBeenCalledWith(
        mockData.contentId,
        ContentType.POST,
        mockData.viewerHash,
        undefined,
      );

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(ContentViewedEvent),
      );

      const publishedEvent = mockEventBus.publish.mock.calls[0][0];
      expect(publishedEvent.toJSON()).toEqual({
        contentId: mockData.contentId,
        contentType: ContentType.POST,
        viewerHash: mockData.viewerHash,
        viewerId: undefined,
        timestamp: expect.any(Date),
      });
    });
  });

  describe('getEngagementStats', () => {
    const mockContentId = 'content-123';

    it('should return engagement stats when content exists', async () => {
      // Arrange
      const mockStats = {
        id: 'engageable-123',
        type: 'POST',
        contentId: mockContentId,
        likeCount: 10,
        commentCount: 5,
        viewCount: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.spyOn(prisma.engageable, 'findUnique').mockResolvedValue(mockStats);

      // Act
      const result = await service.getEngagementStats(mockContentId, 'POST');

      // Assert
      expect(result).toEqual({
        likeCount: mockStats.likeCount,
        commentCount: mockStats.commentCount,
        viewCount: mockStats.viewCount,
      });
    });

    it('should return zero stats when content does not exist', async () => {
      // Arrange
      jest.spyOn(prisma.engageable, 'findUnique').mockResolvedValue(null);

      // Act
      const result = await service.getEngagementStats(mockContentId, 'POST');

      // Assert
      expect(result).toEqual({
        likeCount: 0,
        commentCount: 0,
        viewCount: 0,
      });
    });
  });
});
