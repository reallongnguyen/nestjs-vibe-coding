import { GetFeedInput } from '../dto/get-feed.input';
import { GetFeedOutput } from '../dto/get-feed.output';

export interface FeedProvider {
  getFeed(input: GetFeedInput): Promise<GetFeedOutput>;
}
