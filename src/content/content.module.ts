import { Module } from '@nestjs/common';
import { EventBusModule } from 'src/common/event-bus/event-bus.module';
import { CqrsModule } from '@nestjs/cqrs';
import { DraftPostController } from './presentation/draft-post.controller';
import { DraftPostService } from './services/draft-post.service';
import { DraftPostRepository } from './repositories/draft-post.repository';
import { TopicRepository } from './repositories/topic.repository';
import { ContentEvents } from './services/content.events';
import { PublishedPostController } from './presentation/published-post.controller';
import { PublishedPostRepository } from './repositories/published-post.repository';
import { PublishedPostService } from './services/published-post.service';

@Module({
  imports: [EventBusModule, CqrsModule],
  controllers: [DraftPostController, PublishedPostController],
  providers: [
    DraftPostService,
    PublishedPostService,
    ContentEvents,
    {
      provide: 'IDraftPostRepository',
      useClass: DraftPostRepository,
    },
    {
      provide: 'IPublishedPostRepository',
      useClass: PublishedPostRepository,
    },
    {
      provide: 'ITopicRepository',
      useClass: TopicRepository,
    },
  ],
  exports: [DraftPostService],
})
export class ContentModule {}
