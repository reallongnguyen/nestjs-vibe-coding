import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { EventManagerModule } from 'src/common/event-manager/event-manager.module';
import { LoggerModule } from 'src/common/logger/logger.module';
import { PrismaInvitationRepository } from './repositories/invitation.repository';
import { InvitationService } from './services/invitation.service';
import { InvitationController } from './presentation/invitation.controller';
import { InvitationRateLimitGuard } from './presentation/middlewares/invitation-rate-limit.middleware';

@Module({
  imports: [
    PrismaModule,
    EventManagerModule,
    LoggerModule,
    ThrottlerModule.forRoot([
      {
        ttl: 3600, // 1 hour
        limit: 10, // 10 invitations per hour
      },
    ]),
  ],
  controllers: [InvitationController],
  providers: [
    {
      provide: 'IInvitationRepository',
      useClass: PrismaInvitationRepository,
    },
    {
      provide: 'IInvitationService',
      useClass: InvitationService,
    },
    {
      provide: 'APP_GUARD',
      useClass: InvitationRateLimitGuard,
    },
  ],
  exports: ['IInvitationService'],
})
export class InvitationModule {}
