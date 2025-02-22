import { Collection } from 'src/common/models';
import { AppError } from 'src/common/models/AppError';
import { Logger } from 'nestjs-pino';
import { EventBusPort } from 'src/common/event-bus/core/ports/event-bus.port';

import { UpsertUserInput } from './dto/user.input';
import { ProfileOutput } from './dto/profile.output';
import { Role } from '../entities/role.enum';
import { PatchProfileInput } from './dto/profile.input';
import { User } from '../entities/user.entity';
import { IUserRepository } from './interfaces/user.repository.interface';
import { ProfileUpdatedEvent } from '../entities/events/profile-updated.event';
import { UserActivity } from '../entities/user-activity.entity';
import { IUserActivityRepository } from './interfaces/user-activity.repository.interface';
import {
  BulkOperationType,
  BulkUserOperationDto,
} from '../presentation/dtos/bulk-user-operation.input';
import { UserSearchFiltersDto } from '../presentation/dtos/user-search-filters.input';
import { ActivityFiltersDto } from '../presentation/dtos/activity-filters.input';
import { BulkOperationResultDto } from '../presentation/dtos/bulk-user-operation.output';
import { PasswordResetResultDto } from '../presentation/dtos/password-reset-result.output';
import { RoleChangeEvent } from '../entities/events/role-change.event';
import { AccountDeactivatedEvent } from '../entities/events/account-deactivated.event';
import { AccountActivatedEvent } from '../entities/events/account-activated.event';
import { AccountDeletedEvent } from '../entities/events/account-deleted.event';

export class UserService {
  constructor(
    private readonly logger: Logger,
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBusPort,
    private readonly userActivityRepository: IUserActivityRepository,
  ) {}

  async createOrUpdateUser(input: UpsertUserInput): Promise<User> {
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

    this.eventBus.publish(new ProfileUpdatedEvent(user));

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

    this.eventBus.publish(new ProfileUpdatedEvent(updatedUser));

    return ProfileOutput.fromUser(updatedUser);
  }

  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError('user.get.notFound');
    }

    return user;
  }

  async searchUsers(filters: UserSearchFiltersDto): Promise<Collection<User>> {
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
          case BulkOperationType.UPDATE_ROLE:
            await this.userRepository.updateRole(userId, operation.newRoles);
            this.eventBus.publish(
              new RoleChangeEvent(userId, operation.newRoles, operatorId),
            );
            break;
          case BulkOperationType.DEACTIVATE:
            await this.userRepository.deactivate(userId);
            this.eventBus.publish(
              new AccountDeactivatedEvent(userId, operatorId),
            );
            break;
          case BulkOperationType.ACTIVATE:
            await this.userRepository.activate(userId);
            this.eventBus.publish(
              new AccountActivatedEvent(userId, operatorId),
            );
            break;
          case BulkOperationType.DELETE:
            await this.userRepository.delete(userId);
            this.eventBus.publish(new AccountDeletedEvent(userId, operatorId));
            break;
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
  ): Promise<Collection<UserActivity>> {
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
