import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GorseClient } from './services/gorse.client';
import { GorseSyncService } from './services/gorse-sync.service';
import moduleConfig from './recommendation.config';
import { GorseSyncHandler } from './presentation/handlers/gorse-sync.handler';
import { ContentEventsHandler } from './presentation/handlers/content-events.handler';
import { UserEventsHandler } from './presentation/handlers/user-events.hander';
import { ContentDistributionService } from './services/content-distribution.service';
import { RecommendationHandler } from './presentation/handlers/recommendation.handler';
import { ContentSyncHandler } from './presentation/handlers/content-sync.handler';

@Module({
  imports: [ConfigModule.forFeature(moduleConfig)],
  providers: [
    GorseClient,
    GorseSyncService,
    GorseSyncHandler,
    ContentEventsHandler,
    UserEventsHandler,
    ContentDistributionService,
    RecommendationHandler,
    ContentSyncHandler,
  ],
  exports: [ContentDistributionService, GorseSyncService],
})
export class RecommendationModule {}
