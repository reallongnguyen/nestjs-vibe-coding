import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventBusModule } from 'src/common/event-bus/event-bus.module';
import redisConfig from './configuration/redis.config';
import { FeedController } from './presentation/feed.controller';
import { FeedService } from './services/feed.service';
import { ContentProcessorService } from './services/content-processor.service';
import { ContentProcessor } from './presentation/processors/content.processor';
import { ContentListener } from './presentation/listeners/content.listener';
import { FeedDistributionService } from './services/feed-distribution.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'content-processing',
    }),
    EventBusModule,
    RedisModule.forRootAsync({
      imports: [ConfigModule.forFeature(redisConfig)],
      useFactory: (configService: ConfigService) => ({
        config: configService.get('redis'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [FeedController],
  providers: [
    FeedService,
    ContentProcessorService,
    ContentProcessor,
    ContentListener,
    FeedDistributionService,
  ],
})
export class SocialModule {}
