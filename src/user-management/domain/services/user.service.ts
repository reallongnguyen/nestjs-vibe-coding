import { Injectable } from '@nestjs/common';
import { Collection } from 'src/common/models';
import { AppError } from 'src/common/models/AppError';
import { Logger } from 'nestjs-pino';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ListUserInput, UpsertUserInput } from '../dto/input/user.input';
import { ProfileOutput } from '../dto/output/profile.output';
import { UserRepository } from '../../infrastructure/persistence/user.repository';
import { Role } from '../models/role.model';
import { PatchProfileInput } from '../dto/input/profile.input';
import { User } from '../models/user.entity';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: Logger,
    private readonly eventEmitter: EventEmitter2,
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

    this.eventEmitter.emit('profile.updated', user);

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

    this.eventEmitter.emit('profile.updated', updatedUser);

    return ProfileOutput.fromUser(updatedUser);
  }
}
