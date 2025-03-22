import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CqrsModule } from '@nestjs/cqrs';
import { TweetService } from './services/tweet.service';
import { TweetUserService } from './services/tweet-user.service';
import { TweetImageService } from './services/tweet-image.service';
import { TweetEventService } from './services/tweet-event.service';
import { TweetImageCleanupHandler } from './handlers/tweet-image-cleanup.handler';
import { PrismaTweetRepository } from './repositories/prisma-tweet.repository';
import { TWEET_REPOSITORY } from './tweet.constants';
import { TweetController } from './presentation/tweet.controller';

@Module({
  imports: [
    CqrsModule,
    CacheModule.register({
      ttl: 900, // 15 minutes in seconds
      max: 100, // maximum number of items in cache
    }),
  ],
  controllers: [TweetController],
  providers: [
    TweetService,
    TweetUserService,
    TweetImageService,
    TweetEventService,
    TweetImageCleanupHandler,
    {
      provide: TWEET_REPOSITORY,
      useClass: PrismaTweetRepository,
    },
  ],
  exports: [TweetService],
})
export class TweetModule {}
