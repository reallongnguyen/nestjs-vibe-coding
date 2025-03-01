import { AppError } from 'src/common';

export class UserFollowError extends AppError {
  constructor(
    message: string,
    metadata?: Record<string, string | number | boolean>,
  ) {
    super('USER_FOLLOW_ERROR', metadata);
    this.message = message;
  }
}

export class UserFollowNotFoundError extends UserFollowError {
  constructor(followerId: string, followingId: string) {
    super('User follow relationship not found', { followerId, followingId });
  }
}

export class SelfFollowError extends UserFollowError {
  constructor(userId: string) {
    super('Users cannot follow themselves', { userId });
  }
}

export class AlreadyFollowingError extends UserFollowError {
  constructor(followerId: string, followingId: string) {
    super('User is already following this user', { followerId, followingId });
  }
}

export class UserNotFoundError extends UserFollowError {
  constructor(userId: string) {
    super('User not found', { userId });
  }
}
