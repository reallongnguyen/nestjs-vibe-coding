import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { IEventBus, ContentType } from 'src/common/event-manager';
import { CommentRepliedEvent } from 'src/social/entities/events/comment-replied.event';
import { CommentService } from '../comment.service';
import { ICommentRepository } from '../interfaces/comment-repository.interface';
import { EmotionPrivacyService } from '../emotion-privacy.service';
import { CommentCreatedEvent } from '../../entities/events/comment-created.event';

describe('CommentService', () => {
  let service: CommentService;
  let repository: jest.Mocked<ICommentRepository>;
  let prisma: jest.Mocked<PrismaService>;
  let eventBus: jest.Mocked<IEventBus>;
  let privacyService: EmotionPrivacyService;

  const mockLogger = {
    debug: jest.fn(),
    error: jest.fn(),
  };

  const mockComment = {
    id: 'comment123',
    content: 'Test comment',
    postId: 'post123',
    userId: 'user123',
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    authorType: 'USER',
  };

  const mockReply = {
    id: 'reply123',
    content: 'Test reply',
    postId: 'post123',
    userId: 'user456',
    parentId: 'comment123',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    authorType: 'USER',
  };

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByPost: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    prisma = {
      comment: {
        create: jest.fn().mockResolvedValue(mockComment),
        findUnique: jest.fn().mockResolvedValue(mockComment),
        count: jest.fn().mockResolvedValue(1),
      },
      publishedPost: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'post123', userId: 'user123' }),
        count: jest.fn().mockResolvedValue(1),
      },
      userEmotion: {
        findUnique: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(0),
      },
    } as any;

    eventBus = {
      publish: jest.fn(),
    };

    privacyService = {
      canView: jest.fn().mockResolvedValue(true),
      canLike: jest.fn().mockResolvedValue(true),
      canComment: jest.fn().mockResolvedValue(true),
      canViewLikes: jest.fn().mockResolvedValue(true),
      canViewComments: jest.fn().mockResolvedValue(true),
      canViewStats: jest.fn().mockResolvedValue(true),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: Logger,
          useValue: mockLogger,
        },
        {
          provide: 'ICommentRepository',
          useValue: repository,
        },
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: EmotionPrivacyService,
          useValue: privacyService,
        },
        {
          provide: 'IEventBus',
          useValue: eventBus,
        },
      ],
    }).compile();

    service = module.get<CommentService>(CommentService);
  });

  describe('createComment', () => {
    it('should publish CommentCreatedEvent when creating a new comment', async () => {
      prisma.publishedPost.count = jest.fn().mockResolvedValue(1);
      prisma.comment.create = jest.fn().mockResolvedValue(mockComment);

      await service.create(
        ContentType.POST,
        'post123',
        'user123',
        'Test comment',
      );

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(CommentCreatedEvent),
      );
      const event = (eventBus.publish as jest.Mock).mock.calls[0][0];
      expect(event.toJSON()).toEqual({
        targetUserId: mockComment.postId,
        actorId: mockComment.userId,
        contentType: ContentType.POST,
        contentId: mockComment.postId,
        commentId: mockComment.id,
        preview: mockComment.content,
      });
    });

    it('should publish CommentRepliedEvent when replying to a comment', async () => {
      prisma.publishedPost.count = jest.fn().mockResolvedValue(1);
      prisma.comment.findUnique = jest.fn().mockResolvedValue(mockComment);
      prisma.comment.create = jest.fn().mockResolvedValue(mockReply);

      await service.create(
        ContentType.POST,
        'post123',
        'user456',
        'Test reply',
        'comment123',
      );

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(CommentRepliedEvent),
      );
      const event = (eventBus.publish as jest.Mock).mock.calls[0][0];
      expect(event.toJSON()).toEqual({
        targetUserId: mockComment.userId,
        actorId: mockReply.userId,
        contentType: ContentType.POST,
        contentId: mockReply.postId,
        commentId: mockComment.id,
        preview: mockReply.content,
      });
    });

    it('should not publish CommentRepliedEvent if parent comment not found', async () => {
      prisma.publishedPost.count = jest.fn().mockResolvedValue(1);
      prisma.comment.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        service.create(
          ContentType.POST,
          'post123',
          'user456',
          'Test reply',
          'nonexistent',
        ),
      ).rejects.toThrow();

      expect(eventBus.publish).not.toHaveBeenCalled();
    });
  });
});
