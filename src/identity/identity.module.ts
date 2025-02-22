import { Module } from '@nestjs/common';
import { EventBusModule } from 'src/common/event-bus/event-bus.module';
import { UserController } from './presentation/user.controller';
import { UserService } from './services/user.service';
import { UserRepository } from './repositories/user.repository';
import { UserActivityRepository } from './repositories/user-activity.repository';
import { UserProfileController } from './presentation/user-profile.controller';
import { UserActivityHandler } from './presentation/user-activity.handler';
import { UserActivityService } from './services/user-activity.service';

@Module({
  imports: [EventBusModule],
  controllers: [UserProfileController, UserController],
  providers: [
    UserService,
    UserRepository,
    UserActivityRepository,
    UserActivityHandler,
    UserActivityService,
    {
      provide: 'IUserActivityRepository',
      useClass: UserActivityRepository,
    },
  ],
})
export class IdentityModule {}
