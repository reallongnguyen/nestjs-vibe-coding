import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventBusModule } from 'src/common/event-bus/event-bus.module';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { DraftPostController } from './presentation/draft-post.controller';
import { PublishedPostController } from './presentation/published-post.controller';
import { DraftPostService } from './services/draft-post.service';
import { PublishedPostService } from './services/published-post.service';
import { ContentService } from './services/content.service';
import { SocialEngagementHandler } from './presentation/handlers/social-engagement.handler';
import { DraftPostRepository } from './repositories/draft-post.repository';
import { TopicRepository } from './repositories/topic.repository';
import { ContentEvents } from './services/content.events';
import { PublishedPostRepository } from './repositories/published-post.repository';

@Module({
  imports: [EventBusModule, CqrsModule, PrismaModule],
  controllers: [DraftPostController, PublishedPostController],
  providers: [
    DraftPostService,
    PublishedPostService,
    {
      provide: 'IPublishedPostService',
      useClass: PublishedPostService,
    },
    SocialEngagementHandler,
    ContentService,
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
  ],
  exports: [DraftPostService, ContentService],
})
export class ContentModule {}
