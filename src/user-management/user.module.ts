import { Module } from '@nestjs/common';
import { EventBusModule } from 'src/common/event-bus/event-bus.module';
import { UserController } from './adapter/presentation/rest/user.controller';
import { UserService } from './core/application/services/user.service';
import { UserRepository } from './adapter/infrastructure/persistence/user.repository';

@Module({
  imports: [EventBusModule],
  controllers: [UserController],
  providers: [
    UserService,
    { provide: 'UserRepositoryPort', useClass: UserRepository },
  ],
})
export class UserModule {}
