import { FeedContentType } from '../feed.types';

export class GetContentsCommand {
  constructor(readonly contentIds: string[]) {}
}

export interface ContentIdWithType {
  id: string;
  type: FeedContentType;
}
