import { Module } from '@nestjs/common';
import { EventBusModule } from 'src/common/event-bus/event-bus.module';
import { UserController } from './adapter/presentation/rest/user.controller';
import { UserService } from './core/application/services/user.service';
import { UserRepository } from './adapter/infrastructure/persistence/user.repository';
import { UserActivityRepository } from './adapter/infrastructure/persistence/user-activity.repository';

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
