import { Comment } from '../../entities/comment.entity';

export interface CommentOutput extends Comment {
  userAuthor?: {
    id: string;
    firstName: string;
    lastName: string | null;
    avatar: string | null;
  };
  botAuthor?: {
    id: string;
    name: string;
    avatar?: string | null;
  };
}
