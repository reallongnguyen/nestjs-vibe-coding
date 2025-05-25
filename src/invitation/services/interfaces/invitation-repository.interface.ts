import { InvitationStatus } from 'src/generated/client';
import { PageOptionsDto } from 'src/common/presentation/dtos/page-options.dto';
import { Invitation } from '../../entities/invitation.entity';

export interface IInvitationRepository {
  /**
   * Create a new invitation
   * @param data Invitation data
   * @returns Created invitation
   */
  create(data: {
    inviterId: string;
    code: string;
    message?: string;
    email?: string;
    expiresAt?: Date;
  }): Promise<Invitation>;

  /**
   * Find invitation by code
   * @param code Invitation code
   * @returns Invitation if found, null otherwise
   */
  findByCode(code: string): Promise<Invitation | null>;

  /**
   * Update invitation status
   * @param id Invitation ID
   * @param status New status
   * @param acceptedBy Optional user ID who accepted
   * @returns Updated invitation
   */
  updateStatus(
    id: string,
    status: InvitationStatus,
    acceptedBy?: string,
  ): Promise<Invitation>;

  /**
   * Get invitations by inviter ID
   * @param inviterId User ID of inviter
   * @param pageOptions Pagination options
   * @returns Paged invitations
   */
  findByInviterId(
    inviterId: string,
    pageOptions: PageOptionsDto,
  ): Promise<[Invitation[], number]>;

  /**
   * Get invitation statistics for a user
   * @param inviterId User ID
   * @returns Count of sent and accepted invitations
   */
  getInvitationStats(inviterId: string): Promise<{
    sent: number;
    accepted: number;
  }>;
}
