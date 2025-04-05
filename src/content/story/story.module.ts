import { Module } from '@nestjs/common';
import { LoggerModule } from 'src/common/logger/logger.module';
import { PrismaStoryRepository } from './repositories/prisma-story.repository';
import { STORY_REPOSITORY } from './repositories/story.repository';
import { StoryService } from './services/story.service';
import { StoryController } from './presentation/story.controller';
import { ChainVisualizationService } from './services/chain-visualization.service';

@Module({
  imports: [LoggerModule],
  controllers: [StoryController],
  providers: [
    StoryService,
    ChainVisualizationService,
    {
      provide: STORY_REPOSITORY,
      useClass: PrismaStoryRepository,
    },
  ],
  exports: [StoryService, ChainVisualizationService],
})
export class StoryModule {}
