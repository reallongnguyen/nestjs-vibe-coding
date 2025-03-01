import { AppError } from 'src/common';

export class UserFollowError extends AppError {
  constructor(
    message: string,
    metadata?: Record<string, string | number | boolean>,
  ) {
    super(message, metadata);
  }
}

export class UserFollowNotFoundError extends AppError {
  constructor(followerId: string, followingId: string) {
    super('user-follow.unfollowUser.userFollowNotFound', {
      followerId,
      followingId,
    });
  }
}

export class SelfFollowError extends AppError {
  constructor(userId: string) {
    super('user-follow.followUser.selfFollow', { userId });
  }
}

export class AlreadyFollowingError extends AppError {
  constructor(followerId: string, followingId: string) {
    super('user-follow.followUser.alreadyFollowing', {
      followerId,
      followingId,
    });
  }
}

export class UserNotFoundError extends AppError {
  constructor(userId: string) {
    super('user-follow.followUser.userNotFound', { userId });
  }
}
