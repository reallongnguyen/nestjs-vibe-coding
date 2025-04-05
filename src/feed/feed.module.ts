import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { CacheModule } from 'src/common/cache';
import { LoggerModule } from 'src/common/logger/logger.module';
import { FeedController } from './presentation/feed.controller';
import { FeedService } from './services/feed.service';
import { FeedEnrichmentService } from './services/feed-enrichment.service';
import { FeedGuestController } from './presentation/feed-guest.controller';
import { FeedCacheManagerService } from './services/feed-cache-manager.service';
import { FeedFallbackService } from './services/feed-fallback.service';
import feedConfig from './feed.config';

@Module({
  imports: [
    CqrsModule,
    CacheModule,
    ConfigModule.forFeature(feedConfig),
    LoggerModule,
  ],
  controllers: [FeedController, FeedGuestController],
  providers: [
    FeedService,
    {
      provide: 'IFeedEnrichmentService',
      useClass: FeedEnrichmentService,
    },
    FeedCacheManagerService,
    FeedFallbackService,
  ],
  exports: [FeedService],
})
export class FeedModule {}
