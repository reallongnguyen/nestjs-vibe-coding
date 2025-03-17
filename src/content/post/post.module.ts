import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DraftPostController } from './presentation/draft-post.controller';
import { PublishedPostController } from './presentation/published-post.controller';
import { DraftPostService } from './services/draft-post.service';
import { PublishedPostService } from './services/published-post.service';
import { DraftPostRepository } from './repositories/draft-post.repository';
import { PublishedPostRepository } from './repositories/published-post.repository';
import { TopicRepository } from './repositories/topic.repository';
import { ContentEvents } from './services/content.events';
import { SocialEngagementHandler } from './presentation/handlers/social-engagement.handler';

@Module({
  imports: [CqrsModule],
  controllers: [DraftPostController, PublishedPostController],
  providers: [
    DraftPostService,
    PublishedPostService,
    {
      provide: 'IPublishedPostService',
      useClass: PublishedPostService,
    },
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
    ContentEvents,
    SocialEngagementHandler,
  ],
  exports: [DraftPostService, PublishedPostService],
})
export class PostModule {}
