import { UserFollow as UserFollowPrisma } from '@prisma/client';

export class UserFollow implements UserFollowPrisma {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

export class UserFollowWithUser extends UserFollow {
  follower?: {
    id: string;
    firstName: string;
    lastName: string | null;
    avatar: string | null;
  };

  following?: {
    id: string;
    firstName: string;
    lastName: string | null;
    avatar: string | null;
  };
}
