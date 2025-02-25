import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventBusModule } from 'src/common/event-bus/event-bus.module';
import { ScheduleModule } from '@nestjs/schedule';
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
import { PostLikeController } from './presentation/post-like.controller';
import { PostViewController } from './presentation/post-view.controller';
import { PostLikeService } from './services/post-like.service';
import { PostViewService } from './services/post-view.service';
import { PostLikeRepository } from './repositories/post-like.repository';
import { PostViewRepository } from './repositories/post-view.repository';
import { ViewSyncCron } from './presentation/crons/view-sync.cron';

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
    ScheduleModule.forRoot(),
  ],
  controllers: [FeedController, PostLikeController, PostViewController],
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
    PostLikeService,
    PostViewService,
    PostLikeRepository,
    PostViewRepository,
    {
      provide: 'IPostLikeRepository',
      useClass: PostLikeRepository,
    },
    {
      provide: 'IPostViewRepository',
      useClass: PostViewRepository,
    },
    ViewSyncCron,
  ],
})
export class SocialModule {}
