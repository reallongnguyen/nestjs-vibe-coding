import { PaginationQueryDto } from 'src/common';
import { FeedType } from '../feed.types';

export class GetRecommendationsCommand {
  constructor(
    public readonly userId: string | undefined,
    public readonly pagination: PaginationQueryDto,
    public readonly feedType: FeedType,
  ) {}
}
