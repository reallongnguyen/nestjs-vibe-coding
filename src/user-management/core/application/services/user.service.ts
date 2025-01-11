import { Inject, Injectable } from '@nestjs/common';
import { Collection } from 'src/common/models';
import { AppError } from 'src/common/models/AppError';
import { Logger } from 'nestjs-pino';
import { EventBusPort } from 'src/common/event-bus/core/ports/event-bus.port';

import { ListUserInput, UpsertUserInput } from '../dto/input/user.input';
import { ProfileOutput } from '../dto/output/profile.output';
import { Role } from '../../domain/entities/role.enum';
import { PatchProfileInput } from '../dto/input/profile.input';
import { User } from '../../domain/entities/user.entity';
import { UserRepositoryPort } from '../../ports/incoming/user.repository.port';
import { ProfileUpdatedEvent } from '../../domain/events/profile-updated.event';

@Injectable()
export class UserService {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
    private readonly logger: Logger,
    @Inject('EventBusPort')
    private readonly eventBus: EventBusPort,
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
        roles: [Role.user],
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
}
