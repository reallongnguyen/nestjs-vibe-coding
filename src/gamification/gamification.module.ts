import { Module } from '@nestjs/common';
import { EmotionController } from './presentation/emotion.controller';
import { CreateEmotionService } from './services/create-emotion.service';
import { EmotionPrismaRepository } from './repositories/emotion.prisma.repository';
import { StreakPrismaRepository } from './repositories/streak.prisma.repository';
import { GetStreakService } from './services/get-streak.service';
import { StreakController } from './presentation/streak.controller';
import { StreakHandler } from './presentation/handlers/streak.handler';
import { GetEmotionHistoryService } from './services/get-emotion-history.service';

@Module({
  imports: [],
  controllers: [EmotionController, StreakController],
  providers: [
    {
      provide: 'IEmotionRepository',
      useClass: EmotionPrismaRepository,
    },
    {
      provide: 'IStreakRepository',
      useClass: StreakPrismaRepository,
    },
    CreateEmotionService,
    GetStreakService,
    StreakHandler,
    GetEmotionHistoryService,
  ],
})
export class GamificationModule {}
