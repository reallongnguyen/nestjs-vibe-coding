import { Module } from '@nestjs/common';
import { TweetService } from './services/tweet.service';
import { PrismaTweetRepository } from './repositories/prisma-tweet.repository';
import { TWEET_REPOSITORY } from './repositories/tweet.repository';
import { TweetController } from './presentation/tweet.controller';
import { TweetImageCleanupHandler } from './handlers/tweet-image-cleanup.handler';

@Module({
  imports: [],
  controllers: [TweetController],
  providers: [
    TweetService,
    {
      provide: TWEET_REPOSITORY,
      useClass: PrismaTweetRepository,
    },
    TweetImageCleanupHandler,
  ],
  exports: [TweetService],
})
export class TweetModule {}
