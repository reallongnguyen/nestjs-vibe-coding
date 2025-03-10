import { Logger } from 'nestjs-pino';
import { PagedResult, AppError } from 'src/common';
import { IEventBus } from 'src/common/event-manager';

import { UpsertUserInput } from './dto/user.input';
import { ProfileOutput } from './dto/profile.output';
import { Role } from '../entities/role.enum';
import { PatchProfileInput } from './dto/profile.input';
import { User } from '../entities/user.entity';
import { IUserRepository } from './interfaces/user.repository.interface';
import { IUserActivityRepository } from './interfaces/user-activity.repository.interface';
import {
  BulkOperationType,
  BulkUserOperationDto,
} from '../presentation/dtos/bulk-user-operation.input';
import { UserSearchFiltersDto } from '../presentation/dtos/user-search-filters.input';
import { ActivityFiltersDto } from '../presentation/dtos/activity-filters.input';
import { BulkOperationResultDto } from '../presentation/dtos/bulk-user-operation.output';
import { PasswordResetResultDto } from '../presentation/dtos/password-reset-result.output';
import {
  UserCreatedEvent,
  UserUpdatedEvent,
  UserRoleChangedEvent,
  UserDeactivatedEvent,
  UserActivatedEvent,
  UserDeletedEvent,
} from '../entities/events/user.events';
import { UserActivity } from '../entities/user-activity.entity';

export class UserService {
  constructor(
    private readonly logger: Logger,
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus,
    private readonly userActivityRepository: IUserActivityRepository,
  ) {}

  async createOrUpdateUser(input: UpsertUserInput): Promise<User> {
    const existingUser = await this.userRepository.findUnique({
      where: { authId: input.authId },
    });

    const user = await this.userRepository.upsert({
      where: { authId: input.authId },
      create: {
        authId: input.authId,
        firstName: input.name,
        email: input.email,
        phone: input.phoneNumber,
        roles: [Role.USER],
        avatar: input.avatar,
      },
      update: {
        firstName: input.name,
        avatar: input.avatar,
      },
    });

    // Emit appropriate event based on whether this was a create or update
    if (!existingUser) {
      await this.eventBus.publish(new UserCreatedEvent(user));
    } else {
      await this.eventBus.publish(new UserUpdatedEvent(user));
    }

    return user;
  }

  async getProfile(userId: string): Promise<ProfileOutput> {
    const user = await this.userRepository.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.error(
        `user: getProfile: user ${JSON.stringify(userId)} not found`,
      );

      throw new AppError('user.profile.get.notFound');
    }

    return ProfileOutput.fromUser(user);
  }

  async updateProfile(
    userId: string,
    input: PatchProfileInput,
  ): Promise<ProfileOutput> {
    const user = await this.userRepository.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`user: updateProfile: user ${userId} not found`);

      throw new AppError('user.profile.update.notFound');
    }

    const updatedUser = await this.userRepository.update({
      where: { id: userId },
      data: {
        firstName: input.name,
        avatar: input.avatar,
      },
    });

    await this.eventBus.publish(new UserUpdatedEvent(updatedUser));

    return ProfileOutput.fromUser(updatedUser);
  }

  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError('user.get.notFound');
    }

    return user;
  }

  async searchUsers(filters: UserSearchFiltersDto): Promise<PagedResult<User>> {
    return this.userRepository.search(filters);
  }

  async processBulkOperation(
    operation: BulkUserOperationDto,
    operatorId: string,
  ): Promise<BulkOperationResultDto> {
    const result: BulkOperationResultDto = {
      successCount: 0,
      failureCount: 0,
      errors: [],
    };

    const operations = operation.userIds.map(async (userId) => {
      try {
        switch (operation.operation) {
          case BulkOperationType.UPDATE_ROLE: {
            await this.userRepository.updateRole(userId, operation.newRoles);
            await this.eventBus.publish(
              new UserRoleChangedEvent(userId, operation.newRoles, operatorId),
            );
            break;
          }
          case BulkOperationType.DEACTIVATE: {
            await this.userRepository.deactivate(userId);
            await this.eventBus.publish(
              new UserDeactivatedEvent(userId, operatorId),
            );
            break;
          }
          case BulkOperationType.ACTIVATE: {
            await this.userRepository.activate(userId);
            await this.eventBus.publish(
              new UserActivatedEvent(userId, operatorId),
            );
            break;
          }
          case BulkOperationType.DELETE: {
            await this.userRepository.delete(userId);
            await this.eventBus.publish(
              new UserDeletedEvent(userId, operatorId),
            );
            break;
          }
          default:
            throw new AppError('user.bulk.invalidOperation');
        }
        result.successCount += 1;
      } catch (error) {
        result.failureCount += 1;
        result.errors.push({
          userId,
          error: error.message,
        });
      }
    });

    await Promise.all(operations);
    return result;
  }

  async getUserActivity(
    userId: string,
    filters: ActivityFiltersDto,
  ): Promise<PagedResult<UserActivity>> {
    return this.userActivityRepository.findByUserId(userId, filters);
  }

  async initiatePasswordReset(userId: string): Promise<PasswordResetResultDto> {
    const resetToken = await this.userRepository.createPasswordReset(userId);

    return {
      success: true,
      resetToken: resetToken.token,
      expiresAt: resetToken.expiresAt,
    };
  }
}
