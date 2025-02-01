import { Collection } from 'src/common/models';
import { AppError } from 'src/common/models/AppError';
import { Logger } from 'nestjs-pino';
import { EventBusPort } from 'src/common/event-bus/core/ports/event-bus.port';

import { UpsertUserInput } from '../input/user.input';
import { ProfileOutput } from '../output/profile.output';
import { Role } from '../../domain/entities/role.enum';
import { PatchProfileInput } from '../input/profile.input';
import { User } from '../../domain/entities/user.entity';
import { UserRepositoryPort } from '../../ports/incoming/user.repository.port';
import { ProfileUpdatedEvent } from '../../domain/events/profile-updated.event';
import { UserActivity } from '../../domain/entities/user-activity.entity';
import { UserActivityRepositoryPort } from '../../ports/incoming/user-activity.repository.port';
import {
  BulkOperationType,
  BulkUserOperationDto,
} from '../../presentation/rest/input/bulk-user-operation.dto';
import { UserSearchFiltersDto } from '../../presentation/rest/input/user-search-filters.dto';
import { ActivityFiltersDto } from '../../presentation/rest/input/activity-filters.dto';
import { BulkOperationResultDto } from '../../presentation/rest/output/bulk-user-operation.dto';
import { PasswordResetResultDto } from '../../presentation/rest/output/password-reset-result.dto';
import { RoleChangeEvent } from '../../domain/events/role-change.event';
import { AccountDeactivatedEvent } from '../../domain/events/account-deactivated.event';
import { AccountActivatedEvent } from '../../domain/events/account-activated.event';
import { AccountDeletedEvent } from '../../domain/events/account-deleted.event';

export class UserService {
  constructor(
    private readonly logger: Logger,
    private readonly userRepository: UserRepositoryPort,
    private readonly eventBus: EventBusPort,
    private readonly userActivityRepository: UserActivityRepositoryPort,
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
