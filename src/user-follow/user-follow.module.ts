import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventManagerModule } from 'src/common/event-manager/event-manager.module';
import { PrismaService } from 'src/common';
import { LoggerModule } from 'src/common/logger/logger.module';
import { UserFollowController } from './presentation/user-follow.controller';
import { UserFollowService } from './services/user-follow.service';
import { UserFollowRepository } from './repositories/user-follow.repository';
import { GetFollowingIdsHandler } from './presentation/handlers/get-following-ids.handler';
import { GetUserFollowStatusHandler } from './presentation/handlers/get-user-follow-status.handler';
import { InvitationAcceptedHandler } from './presentation/handlers/invitation-accepted.handler';
import { USER_FOLLOW_REPOSITORY_TOKEN } from './services/interfaces/tokens';

const CommandHandlers = [
  GetFollowingIdsHandler,
  GetUserFollowStatusHandler,
  InvitationAcceptedHandler,
];

@Module({
  imports: [EventManagerModule, CqrsModule, LoggerModule],
  controllers: [UserFollowController],
  providers: [
    UserFollowService,
    UserFollowRepository,
    PrismaService,
    {
      provide: USER_FOLLOW_REPOSITORY_TOKEN,
      useClass: UserFollowRepository,
    },
    ...CommandHandlers,
  ],
})
export class UserFollowModule {}
