/**
 * Interface for content that can be liked
 */
export interface ILikeable {
  /**
   * Like content
   * @param userId ID of the user liking the content
   */
  like(userId: string): Promise<void>;

  /**
   * Unlike content
   * @param userId ID of the user unliking the content
   */
  unlike(userId: string): Promise<void>;

  /**
   * Get total like count
   */
  getLikeCount(): Promise<number>;

  /**
   * Check if content is liked by user
   * @param userId ID of the user to check
   */
  isLikedBy(userId: string): Promise<boolean>;
}
