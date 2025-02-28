import { Feed } from '../../entities/feed.entity';

export interface GetFeedOutput {
  total: number;
  items: Feed[];
}
