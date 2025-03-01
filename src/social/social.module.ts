import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventBusModule } from 'src/common/event-bus/event-bus.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CqrsModule } from '@nestjs/cqrs';
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
import { CommentService } from './services/comment.service';
import { CommentRepository } from './repositories/comment.repository';
import { SocialEngagementService } from './services/social-engagement.service';
import { SocialEngagementController } from './presentation/social-engagement.controller';
import { EmotionPrivacyService } from './services/emotion-privacy.service';
import { ContentCommentController } from './presentation/content-comment.controller';
import { UpdateCommentCountHandler } from './presentation/handlers/update-comment-count.handler';
import { UpdateLikeCountHandler } from './presentation/handlers/update-like-count.handler';
import { LikeRepository } from './repositories/like.repository';
import { UpdateViewCountHandler } from './presentation/handlers/update-view-count.handler';
import { ViewRepository } from './repositories/view.repository';
import { SocialRepository } from './repositories/social.repository';
import { FollowingFeedService } from './services/following-feed.service';
import { FollowingFeedController } from './presentation/following-feed.controller';

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
    CqrsModule,
  ],
  controllers: [
    FeedController,
    ContentCommentController,
    SocialEngagementController,
    FollowingFeedController,
  ],
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
    {
      provide: 'ICommentRepository',
      useClass: CommentRepository,
    },
    CommentService,
    SocialEngagementService,
    EmotionPrivacyService,
    UpdateCommentCountHandler,
    UpdateLikeCountHandler,
    {
      provide: 'ILikeRepository',
      useClass: LikeRepository,
    },
    UpdateViewCountHandler,
    {
      provide: 'IViewRepository',
      useClass: ViewRepository,
    },
    {
      provide: 'ISocialRepository',
      useClass: SocialRepository,
    },
    FollowingFeedService,
  ],
})
export class SocialModule {}
