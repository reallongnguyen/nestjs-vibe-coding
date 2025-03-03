import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';
import { Logger } from 'nestjs-pino';
import {
  PostLikedEvent,
  CommentAddedEvent,
  UserMentionedEvent,
  UserFollowedEvent,
} from 'src/common/event-bus/core/domain/events/social-interaction.events';
import { NotificationProducerService } from './notification-producer.service';

describe('NotificationProducerService', () => {
  let service: NotificationProducerService;
  let mockQueue: Partial<Queue>;
  let mockLogger: Partial<Logger>;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockResolvedValue(undefined),
    };

    mockLogger = {
      error: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationProducerService,
        {
          provide: getQueueToken('notification'),
          useValue: mockQueue,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<NotificationProducerService>(
      NotificationProducerService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handlePostLiked', () => {
    it('should add notification to queue when post is liked', async () => {
      // Arrange
      const postLikedEvent = new PostLikedEvent(
        'post-123',
        'owner-456',
        'liker-789',
        'Liker Name',
        'avatar-url',
        'Post Title',
      );

      // Act
      const result = await service.handlePostLiked(postLikedEvent);

      // Assert
      expect(result).toEqual({ data: '' });
      expect(mockQueue.add).toHaveBeenCalledTimes(1);
    });

    it('should not create notification when user likes their own post', async () => {
      // Arrange
      const postLikedEvent = new PostLikedEvent(
        'post-123',
        'owner-456',
        'owner-456', // Same as owner
        'Owner Name',
        'avatar-url',
        'Post Title',
      );

      // Act
      const result = await service.handlePostLiked(postLikedEvent);

      // Assert
      expect(result).toEqual({ data: '' });
      expect(mockQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('handleCommentAdded', () => {
    it('should add notification to queue when comment is added', async () => {
      // Arrange
      const commentAddedEvent = new CommentAddedEvent(
        'comment-123',
        'post-456',
        'owner-789',
        'commenter-012',
        'Commenter Name',
        'This is a comment',
        'Post Title',
        'avatar-url',
      );

      // Act
      const result = await service.handleCommentAdded(commentAddedEvent);

      // Assert
      expect(result).toEqual({ data: '' });
      expect(mockQueue.add).toHaveBeenCalledTimes(1);
    });

    it('should not create notification when user comments on their own post', async () => {
      // Arrange
      const commentAddedEvent = new CommentAddedEvent(
        'comment-123',
        'post-456',
        'owner-789',
        'owner-789', // Same as owner
        'Owner Name',
        'This is a comment',
        'Post Title',
        'avatar-url',
      );

      // Act
      const result = await service.handleCommentAdded(commentAddedEvent);

      // Assert
      expect(result).toEqual({ data: '' });
      expect(mockQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('handleUserMentioned', () => {
    it('should add notification to queue when user is mentioned', async () => {
      // Arrange
      const userMentionedEvent = new UserMentionedEvent(
        'post-123',
        'post',
        'mentioned-456',
        'mentioning-789',
        'Mentioning User',
        'Post content with @mention',
        'Post Title',
        'avatar-url',
      );

      // Act
      const result = await service.handleUserMentioned(userMentionedEvent);

      // Assert
      expect(result).toEqual({ data: '' });
      expect(mockQueue.add).toHaveBeenCalledTimes(1);
    });

    it('should not create notification when user mentions themselves', async () => {
      // Arrange
      const userMentionedEvent = new UserMentionedEvent(
        'post-123',
        'post',
        'user-456',
        'user-456', // Same as mentioned user
        'User Name',
        'Post content with @self-mention',
        'Post Title',
        'avatar-url',
      );

      // Act
      const result = await service.handleUserMentioned(userMentionedEvent);

      // Assert
      expect(result).toEqual({ data: '' });
      expect(mockQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('handleUserFollowed', () => {
    it('should add notification to queue when user follows another user', async () => {
      // Arrange
      const userFollowedEvent = new UserFollowedEvent(
        'follower-123',
        'Follower Name',
        'following-456',
        'avatar-url',
      );

      // Act
      const result = await service.handleUserFollowed(userFollowedEvent);

      // Assert
      expect(result).toEqual({ data: '' });
      expect(mockQueue.add).toHaveBeenCalledTimes(1);
    });
  });
});
