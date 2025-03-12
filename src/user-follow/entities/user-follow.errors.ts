import { HttpStatus } from '@nestjs/common';
import { ErrorDefinition } from 'src/common/errors/app.error';

export const USER_FOLLOW_ERRORS = {
  'self-follow': {
    message: 'User {userId} cannot follow themselves',
    status: HttpStatus.BAD_REQUEST,
  },
  'already-following': {
    message: 'User {followerId} is already following user {followingId}',
    status: HttpStatus.BAD_REQUEST,
  },
  'user-not-found': {
    message: 'User {userId} not found',
    status: HttpStatus.NOT_FOUND,
  },
  'follow-not-found': {
    message:
      'Follow relationship between {followerId} and {followingId} not found',
    status: HttpStatus.NOT_FOUND,
  },
} as const satisfies Record<string, ErrorDefinition>;
