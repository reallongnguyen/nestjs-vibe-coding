import { Module } from '@nestjs/common';
import { EventBusModule } from 'src/common/event-bus/event-bus.module';
import { UserController } from './presentation/rest/user.controller';
import { UserService } from './services/user.service';
import { UserRepository } from './repositories/user.repository';
import { UserActivityRepository } from './repositories/user-activity.repository';
import { UserProfileController } from './presentation/rest/user-profile.controller';
import { UserActivityHandler } from './presentation/events/user-activity.handler';

@Module({
  imports: [EventBusModule],
  controllers: [UserProfileController, UserController],
  providers: [
    UserService,
    UserRepository,
    UserActivityRepository,
    UserActivityHandler,
  ],
})
export class IdentityModule {}
