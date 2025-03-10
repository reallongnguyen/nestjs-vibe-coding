import { PagedResult, PaginationQueryDto } from 'src/common';
import { ContentDto } from '../../presentation/dtos/content.dto';

export interface IFollowingFeedService {
  /**
   * Get a feed of content from users the current user is following
   * @param userId ID of the current user
   * @param pagination Pagination parameters
   * @param sortBy Sort order (recent, popular)
   * @returns PagedResult of content items
   */
  getFollowingFeed(
    userId: string,
    pagination: PaginationQueryDto,
    sortBy?: string,
  ): Promise<PagedResult<ContentDto>>;
}
