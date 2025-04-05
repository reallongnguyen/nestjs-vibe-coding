import { Injectable, Inject } from '@nestjs/common';
import { AppError } from 'src/common/errors/app.error';
import { OnEvent } from '@nestjs/event-emitter';
import { InvitationEventSchemas } from 'src/common/event-manager/entities/events/schemas/invitation.events';
import { LOGGER_TOKEN } from 'src/common/logger/logger.token';
import { Logger } from 'nestjs-pino';
import { USER_FOLLOW_ERRORS } from '../../entities/user-follow.errors';
import { UserFollowService } from '../../services/user-follow.service';

@Injectable()
export class InvitationAcceptedHandler {
  constructor(
    private readonly userFollowService: UserFollowService,
    @Inject(LOGGER_TOKEN) private readonly logger: Logger,
  ) {}

  /**
   * Handles invitation acceptance events by creating bidirectional follow relationships
   * between the inviter and the invitation accepter.
   *
   * When an invitation is accepted:
   * 1. The accepter follows the inviter (creating a fan relationship)
   * 2. The inviter follows the accepter back (creating a mutual follow)
   *
   * This creates an immediate mutual connection between users who connect through invitations,
   * fostering stronger user relationships from the start.
   *
   * @param event The invitation accepted event payload
   * @throws AppError if follow relationship creation fails
   */
  @OnEvent(InvitationEventSchemas.INVITATION_ACCEPTED.eventName)
  async handle(
    event: typeof InvitationEventSchemas.INVITATION_ACCEPTED.schema,
  ) {
    try {
      this.logger.debug(
        `Processing invitation acceptance - creating bidirectional follow: inviter=${event.inviterId}, accepter=${event.acceptedBy}`,
      );

      // Step 1: Accepter follows inviter
      await this.userFollowService.followUser(
        event.acceptedBy,
        event.inviterId,
      );
      this.logger.debug(
        `Created follow relationship: ${event.acceptedBy} -> ${event.inviterId}`,
      );

      // Step 2: Inviter follows accepter back
      await this.userFollowService.followUser(
        event.inviterId,
        event.acceptedBy,
      );
      this.logger.debug(
        `Created follow relationship: ${event.inviterId} -> ${event.acceptedBy}`,
      );

      this.logger.debug(
        `Successfully created bidirectional follow relationship between users: ${event.inviterId} <-> ${event.acceptedBy}`,
      );
    } catch (error) {
      // If it's already a known AppError, rethrow it
      if (error instanceof AppError) {
        throw error;
      }

      // Otherwise, wrap it in a generic error
      this.logger.error(
        `Failed to process invitation acceptance and create follow relationships: ${error.message}`,
        error.stack,
      );
      throw new AppError(
        'operation-failed',
        USER_FOLLOW_ERRORS['operation-failed'],
        {
          params: {
            reason: 'Failed to create bidirectional follow relationship',
          },
          cause: error,
        },
      );
    }
  }
}
