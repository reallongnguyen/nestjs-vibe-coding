import { HttpStatus } from '@nestjs/common';
import { AppError, ErrorDefinition } from './app.error';

export const COMMON_ERRORS = {
  // Server errors
  'server.error': {
    message: 'Internal server error',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },

  // Authentication errors
  'auth.invalid-token': {
    message: 'Access token has expired or is not valid',
    status: HttpStatus.UNAUTHORIZED,
  },
  'auth.invalid-api-key': {
    message: 'Invalid or missing API key',
    status: HttpStatus.UNAUTHORIZED,
  },
  'auth.no-privilege': {
    message: 'Required one of the following roles: {roles}',
    status: HttpStatus.FORBIDDEN,
  },
  'auth.forbidden': {
    message: 'Forbidden',
    status: HttpStatus.FORBIDDEN,
  },
  'auth.require-person': {
    message: 'Agent must be a person',
    status: HttpStatus.FORBIDDEN,
  },
  'auth.require-user': {
    message: 'Agent must be a user',
    status: HttpStatus.FORBIDDEN,
  },
} as const satisfies Record<string, ErrorDefinition>;

// Type for common error codes
export type CommonErrorCode = keyof typeof COMMON_ERRORS;

// Helper function to create common errors
export function createCommonError(
  code: CommonErrorCode,
  params?: Record<string, unknown>,
): AppError {
  return new AppError(code, COMMON_ERRORS[code], { params });
}
