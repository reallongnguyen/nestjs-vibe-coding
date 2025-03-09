import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../common/prisma/prisma.module';
import { EventManagerModule } from '../common/event-manager/event-manager.module';
import { GorseClient } from './services/gorse.client';
import { GorseSyncService } from './services/gorse-sync.service';
import moduleConfig from './recommendation.config';

@Module({
  imports: [
    ConfigModule.forFeature(moduleConfig),
    PrismaModule,
    EventManagerModule,
  ],
  providers: [GorseClient, GorseSyncService],
  exports: [GorseClient, GorseSyncService],
})
export class RecommendationModule {}
