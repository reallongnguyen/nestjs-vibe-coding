import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CacheModule } from 'src/common/cache';
import { ContentModule } from 'src/content/content.module';
import { FeedController } from './presentation/feed.controller';
import { FeedService } from './services/feed.service';
import { FeedCacheService } from './services/feed-cache.service';
import { FeedEnrichmentService } from './services/feed-enrichment.service';

@Module({
  imports: [CqrsModule, CacheModule, ContentModule],
  controllers: [FeedController],
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
