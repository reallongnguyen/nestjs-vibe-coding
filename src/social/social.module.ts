import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventBusModule } from 'src/common/event-bus/event-bus.module';
import moduleConfig from './social.config';
import { FeedController } from './presentation/feed.controller';
import { FeedService } from './services/feed.service';
import { ContentProcessorService } from './services/content-processor.service';
import { ContentProcessor } from './presentation/processors/content.processor';
import { ContentHandler } from './presentation/handlers/content.handler';
import { FeedDistributionService } from './services/feed-distribution.service';
import { FeedCacheService } from './services/feed-cache.service';
import { FeedDatabaseProvider } from './services/providers/feed-database.provider';
import { FeedCacheProvider } from './services/providers/feed-cache.provider';
import { ContentRankingForFeedService } from './services/content-ranking-for-feed.service';

@Module({
  imports: [
    ConfigModule.forFeature(moduleConfig),
    BullModule.registerQueue({
      name: 'content-processing',
    }),
    EventBusModule,
    RedisModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        config: configService.get('social.redis'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [FeedController],
  providers: [
    FeedService,
    ContentProcessorService,
    ContentRankingForFeedService,
    ContentProcessor,
    ContentHandler,
    FeedDistributionService,
    FeedCacheService,
    FeedDatabaseProvider,
    FeedCacheProvider,
  ],
})
export class SocialModule {}
