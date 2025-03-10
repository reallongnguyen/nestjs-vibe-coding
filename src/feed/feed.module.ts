import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CacheModule } from 'src/common/cache';
import { FeedController } from './presentation/feed.controller';
import { FeedService } from './services/feed.service';
import { FeedCacheService } from './services/feed-cache.service';
import { FeedEnrichmentService } from './services/feed-enrichment.service';
import { FeedGuestController } from './presentation/feed-guest.controller';

@Module({
  imports: [CqrsModule, CacheModule],
  controllers: [FeedController, FeedGuestController],
  providers: [
    FeedService,
    {
      provide: 'IFeedCacheService',
      useClass: FeedCacheService,
    },
    {
      provide: 'IFeedEnrichmentService',
      useClass: FeedEnrichmentService,
    },
  ],
  exports: [FeedService],
})
export class FeedModule {}
