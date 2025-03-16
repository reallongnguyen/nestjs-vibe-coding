import { CommandHandler, ICommandHandler, IEventBus } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { InjectEventBus } from 'src/common/event-manager';
import { GetUsersCommand } from '../../../feed/entities/commands/get-users.command';
import { UserService } from '../../services/user.service';
import { UserInfo } from '../../../feed/entities/feed.types';
import { IdentityErrorFactory } from '../../entities/errors';
import { UserRepository } from '../../repositories/user.repository';
import { UserActivityRepository } from '../../repositories/user-activity.repository';

@Injectable()
@CommandHandler(GetUsersCommand)
export class GetUsersHandler implements ICommandHandler<GetUsersCommand> {
  private readonly userService: UserService;

  constructor(
    private readonly logger: Logger,
    userRepository: UserRepository,
    @InjectEventBus()
    eventBus: IEventBus,
    userActivityRepository: UserActivityRepository,
  ) {
    this.userService = new UserService(
      this.logger,
      userRepository,
      eventBus,
      userActivityRepository,
    );
  }

  async execute(command: GetUsersCommand): Promise<UserInfo[]> {
    const { userIds } = command;

    try {
      this.logger.debug(`Getting users for IDs: ${userIds.join(', ')}`);

      const users = await this.userService.getUsersByIds(userIds);

      this.logger.debug(`Found ${users.length} users`);

      // Map to the UserInfo format required by the feed module
      return users.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName || '',
        avatarUrl: user.avatar,
      }));
    } catch (error) {
      this.logger.error(`Failed to get users: ${error.message}`);
      if (error.code?.startsWith('identity.')) {
        throw error;
      }
      throw IdentityErrorFactory.userQueryFailed(error);
    }
  }
}
