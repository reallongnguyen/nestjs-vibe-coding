import { PageOptionsDto } from 'src/common';
import { FeedType } from '../feed.types';

export class GetRecommendationsCommand {
  constructor(
    public readonly userId: string | undefined,
    public readonly pageOptions: PageOptionsDto,
    public readonly feedType: FeedType,
  ) {}
}
