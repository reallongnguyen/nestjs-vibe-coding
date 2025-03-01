import { Module } from '@nestjs/common';
import { EventBusModule } from 'src/common/event-bus/event-bus.module';
import { PrismaService } from 'src/common';
import { UserFollowController } from './presentation/user-follow.controller';
import { UserFollowService } from './services/user-follow.service';
import { UserFollowRepository } from './repositories/user-follow.repository';

@Module({
  imports: [EventBusModule],
  controllers: [UserFollowController],
  providers: [
    UserFollowService,
    UserFollowRepository,
    PrismaService,
    {
      provide: 'IUserFollowRepository',
      useClass: UserFollowRepository,
    },
  ],
  exports: [UserFollowService],
})
export class UserFollowModule {}
