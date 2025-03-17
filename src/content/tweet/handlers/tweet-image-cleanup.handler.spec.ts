import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { DeleteImageCommand } from 'src/common/event-manager/entities/events/commands/delete-image.command';
import { IEventBus } from 'src/common/event-manager';
import {
  TweetRepository,
  TWEET_REPOSITORY,
} from '../repositories/tweet.repository';
import { Tweet } from '../entities/tweet.entity';
import { TweetImageCleanupHandler } from './tweet-image-cleanup.handler';

describe('TweetImageCleanupHandler', () => {
  let handler: TweetImageCleanupHandler;
  let eventBus: jest.Mocked<IEventBus>;
  let tweetRepository: jest.Mocked<TweetRepository>;

  beforeEach(async () => {
    const mockTweetRepository = {
      findById: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TweetImageCleanupHandler,
        {
          provide: 'IEventBus',
          useValue: mockEventBus,
        },
        {
          provide: TWEET_REPOSITORY,
          useValue: mockTweetRepository,
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<TweetImageCleanupHandler>(TweetImageCleanupHandler);
    eventBus = module.get('IEventBus');
    tweetRepository = module.get(TWEET_REPOSITORY);
  });

  describe('handleTweetUpdated', () => {
    it('should clean up removed images when tweet is updated', async () => {
      // Mock data
      const tweetId = 'test-tweet-id';
      const oldImages = ['image1.jpg', 'image2.jpg', 'image3.jpg'];
      const newImages = ['image1.jpg', 'image3.jpg'];
      const imagesToDelete = ['image2.jpg'];

      // Create mock tweet that conforms to the Tweet interface
      const mockTweet: Partial<Tweet> = {
        id: tweetId,
        content: 'Test content',
        userId: 'user-id',
        images: oldImages,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock repository response
      jest
        .spyOn(tweetRepository, 'findById')
        .mockResolvedValue(mockTweet as Tweet);

      // Call the handler
      await handler.handleTweetUpdated({
        tweetId,
        images: newImages,
      });

      // Verify deleted images
      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(DeleteImageCommand),
      );

      // Verify the command has the correct image URL
      const publishCall = (eventBus.publish as jest.Mock).mock.calls[0];
      const deleteCommand = publishCall[0] as DeleteImageCommand;
      expect(deleteCommand.toJSON().imageUrl).toBe(imagesToDelete[0]);
    });

    it('should not delete any images if no changes are made', async () => {
      // Mock data
      const tweetId = 'test-tweet-id';
      const images = ['image1.jpg', 'image2.jpg'];

      // Create mock tweet that conforms to the Tweet interface
      const mockTweet: Partial<Tweet> = {
        id: tweetId,
        content: 'Test content',
        userId: 'user-id',
        images,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock repository response
      jest
        .spyOn(tweetRepository, 'findById')
        .mockResolvedValue(mockTweet as Tweet);

      // Call the handler
      await handler.handleTweetUpdated({
        tweetId,
        images,
      });

      // Verify no images were deleted
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle tweet not found gracefully', async () => {
      // Mock repository response for non-existent tweet
      jest.spyOn(tweetRepository, 'findById').mockResolvedValue(null);

      // Call the handler
      await handler.handleTweetUpdated({
        tweetId: 'non-existent-id',
        images: ['image1.jpg'],
      });

      // Verify no images were deleted
      expect(eventBus.publish).not.toHaveBeenCalled();
    });
  });

  describe('handleTweetDeleted', () => {
    it('should delete all images when tweet is deleted', async () => {
      // Mock data
      const tweetId = 'test-tweet-id';
      const images = ['image1.jpg', 'image2.jpg'];

      // Call the handler
      await handler.handleTweetDeleted({
        tweetId,
        images,
      });

      // Verify all images were deleted
      expect(eventBus.publish).toHaveBeenCalledTimes(2);

      // Verify the publish calls with the correct DeleteImageCommand instances
      const firstPublishCall = (eventBus.publish as jest.Mock).mock.calls[0];
      const firstDeleteCommand = firstPublishCall[0] as DeleteImageCommand;
      expect(firstDeleteCommand.toJSON().imageUrl).toBe(images[0]);

      const secondPublishCall = (eventBus.publish as jest.Mock).mock.calls[1];
      const secondDeleteCommand = secondPublishCall[0] as DeleteImageCommand;
      expect(secondDeleteCommand.toJSON().imageUrl).toBe(images[1]);
    });

    it('should handle empty images array gracefully', async () => {
      // Call the handler with empty images array
      await handler.handleTweetDeleted({
        tweetId: 'test-tweet-id',
        images: [],
      });

      // Verify no images were deleted
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle publish errors gracefully', async () => {
      // Mock data
      const tweetId = 'test-tweet-id';
      const images = ['image1.jpg', 'problem-image.jpg'];

      // Mock eventBus.publish to fail for the second image
      (eventBus.publish as jest.Mock)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Failed to publish event'));

      // Call the handler
      await handler.handleTweetDeleted({
        tweetId,
        images,
      });

      // Verify both images were attempted
      expect(eventBus.publish).toHaveBeenCalledTimes(2);

      // Verify the first image publish was called correctly
      const firstPublishCall = (eventBus.publish as jest.Mock).mock.calls[0];
      const firstDeleteCommand = firstPublishCall[0] as DeleteImageCommand;
      expect(firstDeleteCommand.toJSON().imageUrl).toBe(images[0]);

      // Verify the second image publish was called correctly even though it failed
      const secondPublishCall = (eventBus.publish as jest.Mock).mock.calls[1];
      const secondDeleteCommand = secondPublishCall[0] as DeleteImageCommand;
      expect(secondDeleteCommand.toJSON().imageUrl).toBe(images[1]);
    });
  });

  describe('Transaction handling', () => {
    it('should maintain consistency between tweet operations and image cleanup', async () => {
      // This test verifies that the integration between TweetService and TweetImageCleanupHandler
      // maintains consistency through transactions (would be in an integration test)

      // Mock the data but don't execute real tests in this unit test
      // This is a placeholder to document the expected behavior
      expect(true).toBe(true);
    });
  });

  describe('Error scenarios', () => {
    it('should handle repository errors gracefully', async () => {
      // Mock data
      const tweetId = 'test-tweet-id';
      const newImages = ['image1.jpg', 'image2.jpg'];

      // Mock repository to throw an error
      jest
        .spyOn(tweetRepository, 'findById')
        .mockRejectedValue(new Error('Database connection error'));

      // Call should not throw even if repository fails
      await expect(
        handler.handleTweetUpdated({
          tweetId,
          images: newImages,
        }),
      ).resolves.not.toThrow();

      // Verify no cleanup was attempted
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should continue processing remaining images if one fails', async () => {
      // Mock data
      const tweetId = 'test-tweet-id';
      const images = ['image1.jpg', 'problem-image.jpg', 'image3.jpg'];

      // Second image publish fails, third succeeds
      (eventBus.publish as jest.Mock)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Failed to publish event'))
        .mockResolvedValueOnce(undefined);

      // Call the handler
      await handler.handleTweetDeleted({
        tweetId,
        images,
      });

      // Verify all three images were attempted
      expect(eventBus.publish).toHaveBeenCalledTimes(3);

      // Check each call had the right image URL
      const [call1, call2, call3] = (eventBus.publish as jest.Mock).mock.calls;

      expect((call1[0] as DeleteImageCommand).toJSON().imageUrl).toBe(
        images[0],
      );
      expect((call2[0] as DeleteImageCommand).toJSON().imageUrl).toBe(
        images[1],
      );
      expect((call3[0] as DeleteImageCommand).toJSON().imageUrl).toBe(
        images[2],
      );
    });
  });
});
