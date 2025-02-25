import { PostLike as PrismaPostLike } from '@prisma/client';

export class PostLike implements PrismaPostLike {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date;
}
