import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { FeedController } from './presentation/feed.controller';
import { FeedService } from './services/feed.service';
import { ContentProcessorService } from './services/content-processor.service';
import { ContentProcessor } from './processors/content.processor';
import { ContentListener } from './listeners/content.listener';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'content-processing',
    }),
    EventEmitterModule.forRoot(),
  ],
  controllers: [FeedController],
  providers: [
    FeedService,
    ContentProcessorService,
    ContentProcessor,
    ContentListener,
  ],
})
export class SocialModule {}
