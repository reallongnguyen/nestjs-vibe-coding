import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventManagerModule } from 'src/common/event-manager/event-manager.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CqrsModule } from '@nestjs/cqrs';

import moduleConfig from './social.config';
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
import { SocialEngagementRedisService } from './services/social-engagement-redis.service';
import { SocialEngagementMetricsService } from './services/social-engagement-metrics.service';

@Module({
  imports: [
    ConfigModule.forFeature(moduleConfig),
    BullModule.registerQueue({
      name: 'content-processing',
    }),
    EventManagerModule,
    RedisModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        config: configService.get('social.redis'),
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    CqrsModule,
  ],
  controllers: [ContentCommentController, SocialEngagementController],
  providers: [
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
    SocialEngagementRedisService,
    SocialEngagementMetricsService,
  ],
})
export class SocialModule {}
