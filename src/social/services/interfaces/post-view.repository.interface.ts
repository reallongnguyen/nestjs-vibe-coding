export interface IPostViewRepository {
  recordView(
    postId: string,
    viewerId: string | null,
    viewerHash: string,
  ): Promise<void>;
  getViewCount(postId: string): Promise<number>;
  syncViewsFromRedis(postIds: string[]): Promise<void>;
}
