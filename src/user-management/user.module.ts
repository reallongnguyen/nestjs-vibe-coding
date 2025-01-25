import { Module } from '@nestjs/common';
import { EventBusModule } from 'src/common/event-bus/event-bus.module';
import { UserController } from './presentation/rest/user.controller';
import { UserService } from './application/services/user.service';
import { UserRepository } from './infrastructure/persistence/user.repository';
import { UserActivityRepository } from './infrastructure/persistence/user-activity.repository';
import { UserProfileController } from './presentation/rest/user-profile.controller';

@Module({
  imports: [EventBusModule],
  controllers: [UserProfileController, UserController],
  providers: [UserService, UserRepository, UserActivityRepository],
})
export class UserModule {}
