import { Injectable } from '@nestjs/common';
import { GetFeedInput } from './dtos/get-feed.input';
import { GetFeedOutput } from './dtos/get-feed.output';
import { FeedCacheProvider } from './providers/feed-cache.provider';

@Injectable()
export class FeedService {
  constructor(private readonly feedProvider: FeedCacheProvider) {}

  async getFeed(input: GetFeedInput): Promise<GetFeedOutput> {
    return this.feedProvider.getFeed(input);
  }
}
