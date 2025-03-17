import { InvitationStatus } from '@prisma/client';
import { PagedResult, PageOptionsDto } from 'src/common';
import { Invitation } from '../../entities/invitation.entity';

export interface CreateInvitationOptions {
  message?: string;
  email?: string;
  expiresAt?: Date;
}

export interface InvitationVerificationResult {
  isValid: boolean;
  inviterId: string;
  inviterName: string;
  message?: string;
}

export interface InvitationDto {
  id: string;
  code: string;
  inviterId: string;
  inviterName: string;
  message?: string;
  email?: string;
  status: InvitationStatus;
  acceptedAt?: Date;
  createdAt: Date;
}

export interface InvitationStatsDto {
  sent: number;
  accepted: number;
  conversionRate: number;
}

export interface IInvitationService {
  /**
   * Create a new invitation
   * @param userId ID of the user creating the invitation
   * @param options Optional settings for the invitation
   * @returns The created invitation
   */
  createInvitation(
    userId: string,
    options?: CreateInvitationOptions,
  ): Promise<Invitation>;

  /**
   * Verify if an invitation code is valid
   * @param code Invitation code to verify
   * @returns Invitation details if valid, null otherwise
   */
  verifyInvitation(code: string): Promise<InvitationVerificationResult>;

  /**
   * Mark an invitation as accepted by a user
   * @param code Invitation code
   * @param userId ID of the user who accepted the invitation
   * @returns Updated invitation
   */
  acceptInvitation(code: string, userId: string): Promise<Invitation>;

  /**
   * Get invitations sent by a user
   * @param userId ID of the user
   * @param pageOptions Pagination options
   * @returns Paged result of invitations
   */
  getUserInvitations(
    userId: string,
    pageOptions: PageOptionsDto,
  ): Promise<PagedResult<InvitationDto>>;

  /**
   * Get invitation statistics for a user
   * @param userId ID of the user
   * @returns Statistics about sent and accepted invitations
   */
  getUserInvitationStats(userId: string): Promise<InvitationStatsDto>;
}
