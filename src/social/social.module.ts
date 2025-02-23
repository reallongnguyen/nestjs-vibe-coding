import { Module } from '@nestjs/common';
import { FeedController } from './presentation/feed.controller';
import { FeedService } from './services/feed.service';

@Module({
  imports: [],
  controllers: [FeedController],
  providers: [FeedService],
})
export class SocialModule {}
