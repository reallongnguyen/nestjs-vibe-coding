import { Module } from '@nestjs/common';
import { EventBusModule } from 'src/common/event-bus/event-bus.module';
import { EmotionController } from './presentation/rest/emotion.controller';
import { CreateEmotionService } from './services/create-emotion.service';
import { EmotionPrismaRepository } from './repositories/emotion.prisma.repository';

@Module({
  imports: [EventBusModule],
  controllers: [EmotionController],
  providers: [
    {
      provide: 'IEmotionRepository',
      useClass: EmotionPrismaRepository,
    },
    CreateEmotionService,
  ],
})
export class GamificationModule {}
