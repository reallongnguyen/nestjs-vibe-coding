import { HttpStatus } from '@nestjs/common';

/**
 * Error codes for the Invitation module
 */
export enum InvitationErrorCode {
  INVITATION_CREATE_FAILED = 'INVITATION_CREATE_FAILED',
  INVITATION_LIMIT_EXCEEDED = 'INVITATION_LIMIT_EXCEEDED',
  INVITATION_NOT_FOUND = 'INVITATION_NOT_FOUND',
  INVITATION_VERIFY_FAILED = 'INVITATION_VERIFY_FAILED',
  INVITATION_ACCEPT_FAILED = 'INVITATION_ACCEPT_FAILED',
  INVITATION_ALREADY_ACCEPTED = 'INVITATION_ALREADY_ACCEPTED',
  INVITATION_SELF_ACCEPT = 'INVITATION_SELF_ACCEPT',
  INVITATION_LIST_FAILED = 'INVITATION_LIST_FAILED',
  INVITATION_STATS_FAILED = 'INVITATION_STATS_FAILED',
  INVITATION_ALREADY_USED = 'INVITATION_ALREADY_USED',
  INVITATION_EXPIRED = 'INVITATION_EXPIRED',
  INVITATION_INVALID = 'INVITATION_INVALID',
  INVITATION_REVOKED = 'INVITATION_REVOKED',
}

/**
 * Error definition interface
 */
export interface ErrorDefinition {
  message: string;
  status: HttpStatus;
}

/**
 * Error definitions for Invitation module
 * Each error code maps to a message template and HTTP status code
 */
export const INVITATION_ERRORS: Record<InvitationErrorCode, ErrorDefinition> = {
  [InvitationErrorCode.INVITATION_CREATE_FAILED]: {
    message: 'Failed to create invitation: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [InvitationErrorCode.INVITATION_LIMIT_EXCEEDED]: {
    message: 'Invitation limit exceeded for user: {{userId}}',
    status: HttpStatus.TOO_MANY_REQUESTS,
  },
  [InvitationErrorCode.INVITATION_NOT_FOUND]: {
    message: 'Invitation not found with code: {{code}}',
    status: HttpStatus.NOT_FOUND,
  },
  [InvitationErrorCode.INVITATION_VERIFY_FAILED]: {
    message: 'Failed to verify invitation: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [InvitationErrorCode.INVITATION_ACCEPT_FAILED]: {
    message: 'Failed to accept invitation: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [InvitationErrorCode.INVITATION_ALREADY_ACCEPTED]: {
    message: 'Invitation has already been accepted',
    status: HttpStatus.BAD_REQUEST,
  },
  [InvitationErrorCode.INVITATION_SELF_ACCEPT]: {
    message: 'Cannot accept your own invitation',
    status: HttpStatus.BAD_REQUEST,
  },
  [InvitationErrorCode.INVITATION_LIST_FAILED]: {
    message: 'Failed to list invitations: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [InvitationErrorCode.INVITATION_STATS_FAILED]: {
    message: 'Failed to get invitation statistics: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [InvitationErrorCode.INVITATION_ALREADY_USED]: {
    message: 'Invitation has already been used',
    status: HttpStatus.BAD_REQUEST,
  },
  [InvitationErrorCode.INVITATION_EXPIRED]: {
    message: 'Invitation has expired',
    status: HttpStatus.BAD_REQUEST,
  },
  [InvitationErrorCode.INVITATION_INVALID]: {
    message: 'Invalid invitation code',
    status: HttpStatus.BAD_REQUEST,
  },
  [InvitationErrorCode.INVITATION_REVOKED]: {
    message: 'Invitation has been revoked',
    status: HttpStatus.BAD_REQUEST,
  },
};
