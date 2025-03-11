import { PageOptionsDto } from 'src/common';
import { ContentWithMetrics } from '../../entities/content-with-metrics.entity';

export interface ISocialRepository {
  /**
   * Get content created by specific authors
   * @param authorIds Array of author IDs
   * @param pagination Pagination parameters
   * @param sortBy Sort order (recent, popular)
   * @returns Array of content items and total count
   */
  getContentByAuthors(
    authorIds: string[],
    pageOptions: PageOptionsDto,
    sortBy?: string,
  ): Promise<[ContentWithMetrics[], number]>;

  /**
   * Get content from users that the specified user is following
   * @param userId ID of the user
   * @param pagination Pagination parameters
   * @param sortBy Sort order (recent, popular)
   * @returns Array of content items and total count
   */
  getContentFromFollowedUsers(
    userId: string,
    pageOptions: PageOptionsDto,
    sortBy?: string,
  ): Promise<[ContentWithMetrics[], number]>;
}
