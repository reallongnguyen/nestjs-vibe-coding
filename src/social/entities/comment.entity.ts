import { Comment as CommentPrisma } from '@prisma/client';

export class Comment implements CommentPrisma {
  id: string;
  content: string;
  postId: string;
  parentId: string | null;
  userId: string;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  botId: string | null;
  authorType: string;
}

export class CommentWithAuthor extends Comment {
  userAuthor?: {
    id: string;
    firstName: string;
    lastName: string | null;
    avatar: string | null;
  };

  botAuthor?: {
    id: string;
    name: string;
    avatar: string | null;
  };
}
