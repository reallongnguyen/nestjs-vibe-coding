import { Inject, Injectable } from '@nestjs/common';
import { Collection } from 'src/common/models';
import { AppError } from 'src/common/models/AppError';
import { Logger } from 'nestjs-pino';
import { EventBusPort } from 'src/common/event-bus/core/ports/event-bus.port';

import { ListUserInput, UpsertUserInput } from '../input/user.input';
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

@Injectable()
export class UserService {
  constructor(
    private readonly logger: Logger,
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
    @Inject('EventBusPort')
    private readonly eventBus: EventBusPort,
    @Inject('UserActivityRepositoryPort')
    private readonly userActivityRepository: UserActivityRepositoryPort,
  ) {}

  async getUsers(params: ListUserInput): Promise<Collection<User>> {
    const { name, offset, limit, orderBy, orderDirection } = params;

    const users = await this.userRepository.findMany({
      skip: offset,
      take: limit,
      where: { name },
      orderBy: { [orderBy]: orderDirection },
    });

    const total = await this.userRepository.count();

    return {
      edges: users,
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  async createOrUpdateUser(input: UpsertUserInput): Promise<User> {
    const user = await this.userRepository.upsert({
      where: { authId: input.authId },
      create: {
        ...input,
        roles: [Role.USER],
      },
      update: input,
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

      throw new AppError('user.getProfile.notFound');
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

      throw new AppError('user.notFound');
    }

    Object.assign(user, input);

    const updatedUser = await this.userRepository.update({
      where: { id: userId },
      data: input,
    });

    this.eventBus.publish(new ProfileUpdatedEvent(updatedUser));

    return ProfileOutput.fromUser(updatedUser);
  }

  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async searchUsers(filters: UserSearchFiltersDto): Promise<Collection<User>> {
    return this.userRepository.search(filters);
  }

  async processBulkOperation(
    operation: BulkUserOperationDto,
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
            await this.userRepository.updateRole(userId, operation.newRole);
            break;
          case BulkOperationType.DEACTIVATE:
            await this.userRepository.deactivate(userId);
            break;
          case BulkOperationType.DELETE:
            await this.userRepository.delete(userId);
            break;
          default:
            throw new Error('Invalid operation');
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
