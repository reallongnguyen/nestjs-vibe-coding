import { PostView } from '../../entities/post-view.entity';

export interface IPostViewRepository {
  recordView(
    postId: string,
    viewerId: string | null,
    viewerHash: string,
  ): Promise<PostView>;
  getViewCount(postId: string): Promise<number>;
  syncViewsFromRedis(postId: string): Promise<void>;
}
