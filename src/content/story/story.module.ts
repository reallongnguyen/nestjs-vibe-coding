import { Module } from '@nestjs/common';
import { LoggerModule } from 'src/common/logger/logger.module';
import { PrismaStoryRepository } from './repositories/prisma-story.repository';
import { STORY_REPOSITORY } from './story.constants';
import { StoryService } from './services/story.service';
import { StoryController } from './presentation/story.controller';

@Module({
  imports: [LoggerModule],
  controllers: [StoryController],
  providers: [
    {
      provide: STORY_REPOSITORY,
      useClass: PrismaStoryRepository,
    },
    StoryService,
  ],
  exports: [STORY_REPOSITORY, StoryService],
})
export class StoryModule {}
