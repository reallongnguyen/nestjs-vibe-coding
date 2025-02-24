import { Module } from '@nestjs/common';
import { DraftPostController } from './presentation/controllers/draft-post.controller';
import { DraftPostService } from './services/draft-post.service';
import { DraftPostRepository } from './repositories/draft-post.repository';
import { TopicRepository } from './repositories/topic.repository';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DraftPostController],
  providers: [
    DraftPostService,
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
