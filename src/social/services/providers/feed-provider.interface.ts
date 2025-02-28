import { GetFeedInput } from '../dtos/get-feed.input';
import { GetFeedOutput } from '../dtos/get-feed.output';

export interface FeedProvider {
  getFeed(input: GetFeedInput): Promise<GetFeedOutput>;
}
