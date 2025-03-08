import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { IEventBus } from 'src/common/event-bus';
import { SocialEngagementService } from '../social-engagement.service';
import { IViewRepository } from '../interfaces/view-repository.interface';
import { EngageableNotFoundError } from '../../entities/social.error';

describe('SocialEngagementService', () => {
  let service: SocialEngagementService;
  let prisma: PrismaService;
  let eventBus: IEventBus;
  let viewRepository: IViewRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialEngagementService,
        {
          provide: PrismaService,
          useValue: {
            publishedPost: {
              findUnique: jest.fn(),
              count: jest.fn(),
            },
            userEmotion: {
              findUnique: jest.fn(),
              count: jest.fn(),
            },
            engageable: {
              findUnique: jest.fn(),
              upsert: jest.fn(),
            },
          },
        },
        {
          provide: 'IEventBus',
          useValue: {
            publish: jest.fn(),
          },
        },
        {
          provide: 'IViewRepository',
          useValue: {
            insertView: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SocialEngagementService>(SocialEngagementService);
    prisma = module.get<PrismaService>(PrismaService);
    eventBus = module.get<IEventBus>('IEventBus');
    viewRepository = module.get<IViewRepository>('IViewRepository');
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
    const mockUserId = 'user-123';
    const mockContentId = 'content-123';
    const mockViewerHash = 'viewer-hash-123';

    it('should emit content viewed event for post when view is new', async () => {
      // Arrange
      jest.spyOn(prisma.publishedPost, 'count').mockResolvedValue(1);
      jest.spyOn(viewRepository, 'insertView').mockResolvedValue({
        isNewView: true,
      });

      // Act
      await service.recordView(
        'POST',
        mockContentId,
        mockViewerHash,
        mockUserId,
      );

      // Assert
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'POST',
          contentId: mockContentId,
          viewerHash: mockViewerHash,
          viewerId: mockUserId,
        }),
      );
      expect((eventBus.publish as jest.Mock).mock.calls[0][0].eventName()).toBe(
        'social.content.viewed',
      );
    });

    it('should emit content viewed event for emotion when view is new', async () => {
      // Arrange
      jest.spyOn(prisma.userEmotion, 'count').mockResolvedValue(1);
      jest.spyOn(viewRepository, 'insertView').mockResolvedValue({
        isNewView: true,
      });

      // Act
      await service.recordView(
        'EMOTION',
        mockContentId,
        mockViewerHash,
        mockUserId,
      );

      // Assert
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'EMOTION',
          contentId: mockContentId,
          viewerHash: mockViewerHash,
          viewerId: mockUserId,
        }),
      );
      expect((eventBus.publish as jest.Mock).mock.calls[0][0].eventName()).toBe(
        'social.content.viewed',
      );
    });

    it('should not emit event when view is not new', async () => {
      // Arrange
      jest.spyOn(prisma.publishedPost, 'count').mockResolvedValue(1);
      jest.spyOn(viewRepository, 'insertView').mockResolvedValue({
        isNewView: false,
      });

      // Act
      await service.recordView(
        'POST',
        mockContentId,
        mockViewerHash,
        mockUserId,
      );

      // Assert
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should throw EngageableNotFoundError if content does not exist', async () => {
      // Arrange
      jest.spyOn(prisma.publishedPost, 'count').mockResolvedValue(0);

      // Act & Assert
      await expect(
        service.recordView('POST', mockContentId, mockViewerHash, mockUserId),
      ).rejects.toThrow(EngageableNotFoundError);
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
