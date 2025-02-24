import { Module } from '@nestjs/common';
import { EventBusModule } from 'src/common/event-bus/event-bus.module';
import { DraftPostController } from './presentation/draft-post.controller';
import { DraftPostService } from './services/draft-post.service';
import { DraftPostRepository } from './repositories/draft-post.repository';
import { TopicRepository } from './repositories/topic.repository';
import { ContentEvents } from './services/content.events';

@Module({
  imports: [EventBusModule],
  controllers: [DraftPostController],
  providers: [
    DraftPostService,
    ContentEvents,
    {
      provide: 'IDraftPostRepository',
      useClass: DraftPostRepository,
    },
    {
      provide: 'ITopicRepository',
      useClass: TopicRepository,
    },
  ],
  exports: [DraftPostService],
})
export class ContentModule {}
