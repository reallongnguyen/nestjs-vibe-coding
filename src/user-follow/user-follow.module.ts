import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventBusModule } from 'src/common/event-bus/event-bus.module';
import { PrismaService } from 'src/common';
import { UserFollowController } from './presentation/user-follow.controller';
import { UserFollowService } from './services/user-follow.service';
import { UserFollowRepository } from './repositories/user-follow.repository';
import { GetFollowingIdsHandler } from './presentation/handlers/get-following-ids.handler';

const CommandHandlers = [GetFollowingIdsHandler];

@Module({
  imports: [EventBusModule, CqrsModule],
  controllers: [UserFollowController],
  providers: [
    UserFollowService,
    UserFollowRepository,
    PrismaService,
    {
      provide: 'IUserFollowRepository',
      useClass: UserFollowRepository,
    },
    ...CommandHandlers,
  ],
})
export class UserFollowModule {}
