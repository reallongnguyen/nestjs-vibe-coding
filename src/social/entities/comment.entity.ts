import { Comment as CommentPrisma } from 'src/generated/client';

export class Comment implements CommentPrisma {
  id: string;
  content: string;
  postId: string;
  tweetId: string | null;
  storyId: string | null;
  parentId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  botId: string | null;
  authorType: string;
  emotionId: string | null;
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
