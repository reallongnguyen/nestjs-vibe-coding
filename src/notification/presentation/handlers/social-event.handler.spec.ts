import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { SocialEventHandler } from './social-event.handler';
import { NotificationProducerService } from '../../services/notification-producer.service';
import {
  PostLikedEvent,
  CommentAddedEvent,
  UserMentionedEvent,
  UserFollowedEvent,
} from '../../entities/events/social-interaction.events';

describe('SocialEventHandler', () => {
  let handler: SocialEventHandler;
  let notificationProducerService: NotificationProducerService;
  let logger: Logger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialEventHandler,
        {
          provide: Logger,
          useValue: {
            debug: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            info: jest.fn(),
          },
        },
        {
          provide: NotificationProducerService,
          useValue: {
            handlePostLiked: jest.fn().mockResolvedValue(undefined),
            handleCommentAdded: jest.fn().mockResolvedValue(undefined),
            handleUserMentioned: jest.fn().mockResolvedValue(undefined),
            handleUserFollowed: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    handler = module.get<SocialEventHandler>(SocialEventHandler);
    notificationProducerService = module.get<NotificationProducerService>(
      NotificationProducerService,
    );
    logger = module.get<Logger>(Logger);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('handlePostLikedEvent', () => {
    it('should call notificationProducerService.handlePostLiked with the event payload', async () => {
      // Arrange
      const mockEvent = new PostLikedEvent(
        'post-123',
        'user-456',
        'liker-789',
        'Liker Name',
        'avatar-url',
        'Post Title',
      );

      // Act
      await handler.handlePostLikedEvent(mockEvent);

      // Assert
      expect(notificationProducerService.handlePostLiked).toHaveBeenCalledWith(
        mockEvent,
      );
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('post.liked'),
      );
    });
  });

  describe('handleCommentAddedEvent', () => {
    it('should call notificationProducerService.handleCommentAdded with the event payload', async () => {
      // Arrange
      const mockEvent = new CommentAddedEvent(
        'comment-123',
        'post-456',
        'user-789',
        'commenter-012',
        'Commenter Name',
        'This is a comment',
        'Post Title',
        'avatar-url',
      );

      // Act
      await handler.handleCommentAddedEvent(mockEvent);

      // Assert
      expect(
        notificationProducerService.handleCommentAdded,
      ).toHaveBeenCalledWith(mockEvent);
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('comment.added'),
      );
    });
  });

  describe('handleUserMentionedEvent', () => {
    it('should call notificationProducerService.handleUserMentioned with the event payload', async () => {
      // Arrange
      const mockEvent = new UserMentionedEvent(
        'content-123',
        'post',
        'mentioned-456',
        'mentioner-789',
        'Mentioner Name',
        'This is a post with @mention',
        'Post Title',
        'avatar-url',
      );

      // Act
      await handler.handleUserMentionedEvent(mockEvent);

      // Assert
      expect(
        notificationProducerService.handleUserMentioned,
      ).toHaveBeenCalledWith(mockEvent);
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('user.mentioned'),
      );
    });
  });

  describe('handleUserFollowedEvent', () => {
    it('should call notificationProducerService.handleUserFollowed with the event payload', async () => {
      // Arrange
      const mockEvent = new UserFollowedEvent(
        'follower-123',
        'Follower Name',
        'following-456',
        'avatar-url',
      );

      // Act
      await handler.handleUserFollowedEvent(mockEvent);

      // Assert
      expect(
        notificationProducerService.handleUserFollowed,
      ).toHaveBeenCalledWith(mockEvent);
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('user.followed'),
      );
    });
  });
});
