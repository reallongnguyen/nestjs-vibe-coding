import { PageOptionsDto } from 'src/common';

export interface GetFeedInput {
  userId?: string;
  pageOptions: PageOptionsDto;
}
