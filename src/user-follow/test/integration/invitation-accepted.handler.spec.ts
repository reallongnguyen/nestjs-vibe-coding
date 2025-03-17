import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { PrismaService } from 'src/common';
import { AppError } from 'src/common/errors/app.error';
import { InvitationAcceptedEvent } from 'src/invitation/entities/events/invitation-accepted.event';
import { USER_FOLLOW_ERRORS } from '../../entities/user-follow.errors';
import { InvitationAcceptedHandler } from '../../presentation/handlers/invitation-accepted.handler';
import { UserFollowRepository } from '../../repositories/user-follow.repository';
import { UserFollowService } from '../../services/user-follow.service';

describe('InvitationAcceptedHandler', () => {
  let handler: InvitationAcceptedHandler;
  let userFollowService: UserFollowService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationAcceptedHandler,
        UserFollowService,
        {
          provide: 'IUserFollowRepository',
          useClass: UserFollowRepository,
        },
        PrismaService,
        EventBus,
      ],
    }).compile();

    handler = module.get<InvitationAcceptedHandler>(InvitationAcceptedHandler);
    userFollowService = module.get<UserFollowService>(UserFollowService);
  });

  it('should create follow relationship when invitation is accepted', async () => {
    // Arrange
    const event = new InvitationAcceptedEvent(
      'invitation-1',
      'inviter-1',
      'accepter-1',
      'code-123',
    );

    const followUserSpy = jest
      .spyOn(userFollowService, 'followUser')
      .mockResolvedValue({
        id: 'follow-1',
        followerId: event.acceptedBy,
        followingId: event.inviterId,
        createdAt: new Date(),
      });

    // Act
    await handler.handle(event);

    // Assert
    expect(followUserSpy).toHaveBeenCalledWith(
      event.acceptedBy,
      event.inviterId,
    );
  });

  it('should handle case when follow relationship already exists', async () => {
    // Arrange
    const event = new InvitationAcceptedEvent(
      'invitation-1',
      'inviter-1',
      'accepter-1',
      'code-123',
    );

    const error = new AppError(
      'already-following',
      USER_FOLLOW_ERRORS['already-following'],
      {
        params: {
          followerId: event.acceptedBy,
          followingId: event.inviterId,
        },
      },
    );

    jest.spyOn(userFollowService, 'followUser').mockRejectedValue(error);

    // Act & Assert
    await expect(handler.handle(event)).rejects.toThrow(error);
  });

  it('should handle unexpected errors', async () => {
    // Arrange
    const event = new InvitationAcceptedEvent(
      'invitation-1',
      'inviter-1',
      'accepter-1',
      'code-123',
    );

    const unexpectedError = new Error('Unexpected error');
    jest
      .spyOn(userFollowService, 'followUser')
      .mockRejectedValue(unexpectedError);

    // Act & Assert
    await expect(handler.handle(event)).rejects.toThrow(AppError);
    await expect(handler.handle(event)).rejects.toMatchObject({
      code: 'operation-failed',
      message: USER_FOLLOW_ERRORS['operation-failed'].message,
    });
  });
});
