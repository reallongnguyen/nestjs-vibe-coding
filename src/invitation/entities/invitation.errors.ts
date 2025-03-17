import { HttpStatus } from '@nestjs/common';
import { ErrorDefinition } from 'src/common/errors/app.error';

export const INVITATION_ERRORS = {
  'invitation-not-found': {
    message: 'Invitation with code {code} not found',
    status: HttpStatus.NOT_FOUND,
  },
  'invitation-expired': {
    message: 'Invitation with code {code} has expired',
    status: HttpStatus.BAD_REQUEST,
  },
  'invitation-already-accepted': {
    message: 'Invitation with code {code} has already been accepted',
    status: HttpStatus.BAD_REQUEST,
  },
  'invitation-invalid': {
    message: 'Invitation with code {code} is invalid: {reason}',
    status: HttpStatus.BAD_REQUEST,
  },
  'rate-limit-exceeded': {
    message: 'Rate limit for invitation creation exceeded for user {userId}',
    status: HttpStatus.TOO_MANY_REQUESTS,
  },
  'self-invitation': {
    message: 'User cannot create an invitation for themselves',
    status: HttpStatus.BAD_REQUEST,
  },
  'operation-failed': {
    message: 'Failed to perform invitation operation: {reason}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
} as const satisfies Record<string, ErrorDefinition>;
