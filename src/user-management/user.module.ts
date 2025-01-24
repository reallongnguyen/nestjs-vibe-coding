import { Module } from '@nestjs/common';
import { EventBusModule } from 'src/common/event-bus/event-bus.module';
import { UserController } from './presentation/rest/user.controller';
import { UserService } from './application/services/user.service';
import { UserRepository } from './infrastructure/persistence/user.repository';
import { UserActivityRepository } from './infrastructure/persistence/user-activity.repository';

@Module({
  imports: [EventBusModule],
  controllers: [UserController],
  providers: [
    UserService,
    { provide: 'UserRepositoryPort', useClass: UserRepository },
    { provide: 'UserActivityRepositoryPort', useClass: UserActivityRepository },
  ],
})
export class UserModule {}
