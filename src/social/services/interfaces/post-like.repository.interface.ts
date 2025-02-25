import { PostLike } from '../../entities/post-like.entity';

export interface IPostLikeRepository {
  create(postId: string, userId: string): Promise<PostLike>;
  delete(postId: string, userId: string): Promise<void>;
  findByPostAndUser(postId: string, userId: string): Promise<PostLike | null>;
  countByPost(postId: string): Promise<number>;
}
