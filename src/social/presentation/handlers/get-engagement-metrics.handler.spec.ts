import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { GetEngagementMetricsHandler } from './get-engagement-metrics.handler';
import { SocialEngagementService } from '../../services/social-engagement.service';
import { GetEngagementMetricsCommand } from '../../../feed/entities/commands/get-engagement-metrics.command';

describe('GetEngagementMetricsHandler', () => {
  let handler: GetEngagementMetricsHandler;
  let socialEngagementService: SocialEngagementService;

  const mockSocialEngagementService = {
    getEngagementStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetEngagementMetricsHandler,
        {
          provide: SocialEngagementService,
          useValue: mockSocialEngagementService,
        },
        {
          provide: Logger,
          useValue: {
            debug: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetEngagementMetricsHandler>(
      GetEngagementMetricsHandler,
    );
    socialEngagementService = module.get<SocialEngagementService>(
      SocialEngagementService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return engagement metrics for content IDs', async () => {
      // Arrange
      const contentIds = ['content1', 'content2'];
      const command = new GetEngagementMetricsCommand(contentIds);

      mockSocialEngagementService.getEngagementStats.mockImplementation(
        (contentId) =>
          Promise.resolve({
            likeCount: contentId === 'content1' ? 10 : 20,
            commentCount: contentId === 'content1' ? 5 : 15,
            viewCount: contentId === 'content1' ? 100 : 200,
          }),
      );

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toEqual([
        {
          contentId: 'content1',
          likeCount: 10,
          commentCount: 5,
          viewCount: 100,
        },
        {
          contentId: 'content2',
          likeCount: 20,
          commentCount: 15,
          viewCount: 200,
        },
      ]);

      expect(socialEngagementService.getEngagementStats).toHaveBeenCalledTimes(
        2,
      );
      expect(socialEngagementService.getEngagementStats).toHaveBeenCalledWith(
        'content1',
        'ARTICLE',
      );
      expect(socialEngagementService.getEngagementStats).toHaveBeenCalledWith(
        'content2',
        'ARTICLE',
      );
    });

    it('should return empty array when no content IDs are provided', async () => {
      // Arrange
      const contentIds: string[] = [];
      const command = new GetEngagementMetricsCommand(contentIds);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toEqual([]);
      expect(socialEngagementService.getEngagementStats).not.toHaveBeenCalled();
    });

    it('should handle errors for individual content items', async () => {
      // Arrange
      const contentIds = ['content1', 'content2'];
      const command = new GetEngagementMetricsCommand(contentIds);

      // First call succeeds, second call fails
      mockSocialEngagementService.getEngagementStats
        .mockImplementationOnce(() =>
          Promise.resolve({
            likeCount: 10,
            commentCount: 5,
            viewCount: 100,
          }),
        )
        .mockRejectedValueOnce(new Error('Failed to get metrics'));

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toEqual([
        {
          contentId: 'content1',
          likeCount: 10,
          commentCount: 5,
          viewCount: 100,
        },
        {
          contentId: 'content2',
          likeCount: 0,
          commentCount: 0,
          viewCount: 0,
        },
      ]);

      expect(socialEngagementService.getEngagementStats).toHaveBeenCalledTimes(
        2,
      );
    });
  });
});
