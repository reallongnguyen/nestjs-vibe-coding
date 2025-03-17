import { Inject, Injectable } from '@nestjs/common';
import { InvitationStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PagedResult, PageOptionsDto } from 'src/common';
import { IEventBus, InjectEventBus } from 'src/common/event-manager';
import { AppError } from 'src/common/errors/app.error';
import { InvitationErrorCode, INVITATION_ERRORS } from '../entities/errors';
import { InvitationCreatedEvent } from '../entities/events/invitation-created.event';
import { InvitationAcceptedEvent } from '../entities/events/invitation-accepted.event';
import { IInvitationRepository } from './interfaces/invitation-repository.interface';
import {
  CreateInvitationOptions,
  IInvitationService,
  InvitationDto,
  InvitationStatsDto,
  InvitationVerificationResult,
} from './interfaces/invitation-service.interface';

@Injectable()
export class InvitationService implements IInvitationService {
  constructor(
    @Inject('IInvitationRepository')
    private readonly invitationRepository: IInvitationRepository,
    @InjectEventBus()
    private readonly eventBus: IEventBus,
  ) {}

  private generateInvitationCode(): string {
    // Generate a 10-character random code
    return randomBytes(5).toString('hex').substring(0, 10);
  }

  async createInvitation(userId: string, options?: CreateInvitationOptions) {
    const code = this.generateInvitationCode();
    const invitation = await this.invitationRepository.create({
      inviterId: userId,
      code,
      message: options?.message,
      email: options?.email,
      expiresAt: options?.expiresAt,
    });

    await this.eventBus.publish(
      new InvitationCreatedEvent(
        invitation.id,
        invitation.inviterId,
        invitation.code,
        invitation.email,
      ),
    );

    return invitation;
  }

  async verifyInvitation(
    code: string,
  ): Promise<InvitationVerificationResult | null> {
    const invitation = await this.invitationRepository.findByCode(code);

    if (!invitation) {
      throw new AppError(
        InvitationErrorCode.INVITATION_NOT_FOUND,
        INVITATION_ERRORS[InvitationErrorCode.INVITATION_NOT_FOUND],
        {
          params: { code },
        },
      );
    }

    if (!invitation.isValid()) {
      if (invitation.isExpired()) {
        throw new AppError(
          InvitationErrorCode.INVITATION_EXPIRED,
          INVITATION_ERRORS[InvitationErrorCode.INVITATION_EXPIRED],
          {
            params: { code },
          },
        );
      }
      if (invitation.isAccepted()) {
        throw new AppError(
          InvitationErrorCode.INVITATION_ALREADY_ACCEPTED,
          INVITATION_ERRORS[InvitationErrorCode.INVITATION_ALREADY_ACCEPTED],
          { params: { code } },
        );
      }
      throw new AppError(
        InvitationErrorCode.INVITATION_INVALID,
        INVITATION_ERRORS[InvitationErrorCode.INVITATION_INVALID],
        {
          params: { code, reason: 'Invalid status' },
        },
      );
    }

    return {
      isValid: true,
      inviterId: invitation.inviterId,
      inviterName: invitation.inviter?.firstName || 'Unknown',
      message: invitation.message || undefined,
    };
  }

  async acceptInvitation(code: string, userId: string) {
    const invitation = await this.invitationRepository.findByCode(code);

    if (!invitation) {
      throw new AppError(
        InvitationErrorCode.INVITATION_NOT_FOUND,
        INVITATION_ERRORS[InvitationErrorCode.INVITATION_NOT_FOUND],
        {
          params: { code },
        },
      );
    }

    if (invitation.inviterId === userId) {
      throw new AppError(
        InvitationErrorCode.INVITATION_SELF_ACCEPT,
        INVITATION_ERRORS[InvitationErrorCode.INVITATION_SELF_ACCEPT],
      );
    }

    if (!invitation.isValid()) {
      if (invitation.isExpired()) {
        throw new AppError(
          InvitationErrorCode.INVITATION_EXPIRED,
          INVITATION_ERRORS[InvitationErrorCode.INVITATION_EXPIRED],
          {
            params: { code },
          },
        );
      }
      if (invitation.isAccepted()) {
        throw new AppError(
          InvitationErrorCode.INVITATION_ALREADY_ACCEPTED,
          INVITATION_ERRORS[InvitationErrorCode.INVITATION_ALREADY_ACCEPTED],
          { params: { code } },
        );
      }
      throw new AppError(
        InvitationErrorCode.INVITATION_INVALID,
        INVITATION_ERRORS[InvitationErrorCode.INVITATION_INVALID],
        {
          params: { code, reason: 'Invalid status' },
        },
      );
    }

    const updatedInvitation = await this.invitationRepository.updateStatus(
      invitation.id,
      InvitationStatus.ACCEPTED,
      userId,
    );

    await this.eventBus.publish(
      new InvitationAcceptedEvent(
        invitation.id,
        invitation.inviterId,
        userId,
        invitation.code,
      ),
    );

    return updatedInvitation;
  }

  async getUserInvitations(
    userId: string,
    pageOptions: PageOptionsDto,
  ): Promise<PagedResult<InvitationDto>> {
    const [invitations, total] =
      await this.invitationRepository.findByInviterId(userId, pageOptions);

    const items = invitations.map((invitation) => ({
      id: invitation.id,
      code: invitation.code,
      inviterId: invitation.inviterId,
      inviterName: invitation.inviter?.firstName || 'Unknown',
      message: invitation.message,
      email: invitation.email,
      status: invitation.status,
      acceptedAt: invitation.acceptedAt,
      createdAt: invitation.createdAt,
    }));

    return new PagedResult<InvitationDto>(
      items,
      pageOptions.toResponseMeta(total),
    );
  }

  async getUserInvitationStats(userId: string): Promise<InvitationStatsDto> {
    const { sent, accepted } =
      await this.invitationRepository.getInvitationStats(userId);
    const conversionRate = sent > 0 ? (accepted / sent) * 100 : 0;

    return {
      sent,
      accepted,
      conversionRate,
    };
  }
}
