import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../common/prisma/prisma.module';
import { EventManagerModule } from '../common/event-manager/event-manager.module';
import { GorseClient } from './services/gorse.client';
import { GorseSyncService } from './services/gorse-sync.service';
import moduleConfig from './recommendation.config';
import { GorseSyncHandler } from './presentation/handlers/gorse-sync.handler';
import { ContentEventsHandler } from './presentation/handlers/content-events.handler';
import { UserEventsHandler } from './presentation/handlers/user-events.hander';

@Module({
  imports: [
    ConfigModule.forFeature(moduleConfig),
    PrismaModule,
    EventManagerModule,
  ],
  providers: [
    GorseClient,
    GorseSyncService,
    GorseSyncHandler,
    ContentEventsHandler,
    UserEventsHandler,
  ],
})
export class RecommendationModule {}
