import { InvitationStatus } from '@prisma/client';

export interface InviterInfo {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
}

export interface InvitationWithInviter {
  id: string;
  code: string;
  inviterId: string;
  inviter?: InviterInfo;
  message?: string | null;
  email?: string | null;
  status: InvitationStatus;
  expiresAt?: Date | null;
  acceptedAt?: Date | null;
  acceptedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Invitation {
  id: string;
  code: string;
  inviterId: string;
  inviter?: InviterInfo;
  message?: string | null;
  email?: string | null;
  status: InvitationStatus;
  expiresAt?: Date | null;
  acceptedAt?: Date | null;
  acceptedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: InvitationWithInviter) {
    Object.assign(this, data);
  }

  /**
   * Check if the invitation is still valid
   */
  isValid(): boolean {
    return this.status === InvitationStatus.PENDING && !this.isExpired();
  }

  /**
   * Check if the invitation is expired
   */
  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  /**
   * Check if the invitation has been accepted
   */
  isAccepted(): boolean {
    return this.status === InvitationStatus.ACCEPTED;
  }
}

export interface CreateInvitationData {
  inviterId: string;
  code: string;
  message?: string;
  email?: string;
  expiresAt?: Date;
}
