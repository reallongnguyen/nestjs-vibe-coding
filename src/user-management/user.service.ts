import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Collection } from 'src/common/models';
import { AppError } from 'src/common/models/AppError';
import { Logger } from 'nestjs-pino';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User } from './models/user.model';
import { Role } from './models/role.model';

export class UserUpsertInput {
  authId: string;
  name: string;
  avatar?: string;
}

export class UserOutput implements Omit<User, 'createdAt' | 'updatedAt'> {
  id: string;
  authId: string;
  name: string;
  avatar: string;
  roles: Role[];

  static fromUser(u: User): UserOutput {
    const uo = new UserOutput();

    uo.id = u.id;
    uo.authId = u.authId;
    uo.name = u.name;
    uo.avatar = u.avatar;
    uo.roles = u.roles;

    return uo;
  }
}

export class ProfileOutput extends UserOutput {}

export class ListUserInput {
  name?: string;
  offset?: number;
  limit?: number;
  orderBy?: 'name';
  orderDirection?: 'asc' | 'desc';
}

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private logger: Logger,
    private eventEmitter: EventEmitter2,
  ) {}

  async users(params: ListUserInput): Promise<Collection<UserOutput>> {
    const { name, offset, limit, orderBy, orderDirection } = params;

    try {
      const users = await this.prisma.user.findMany({
        skip: offset,
        take: limit,
        where: { name },
        orderBy: { [orderBy]: orderDirection },
      });

      const total = await this.prisma.user.count();

      return {
        edges: users.map(UserOutput.fromUser),
        pagination: {
          total,
          limit,
          offset,
        },
      };
    } catch (err) {
      this.logger.error(`user: list: ${err.message}`);

      throw new AppError('common.serverError');
    }
  }

  async createOrUpdateUser(input: UserUpsertInput): Promise<UserOutput> {
    try {
      const user = await this.prisma.user.upsert({
        where: { authId: input.authId },
        create: {
          ...input,
          roles: [Role.user],
        },
        update: input,
      });

      this.eventEmitter.emit('profile.updated', user);

      return UserOutput.fromUser(user);
    } catch (err) {
      this.logger.error(`user: createOrUpdateUser: ${err.message}`);

      throw new AppError('common.serverError');
    }
  }

  async getProfile(userId: string): Promise<ProfileOutput> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        this.logger.error(
          `user: getProfile: user ${JSON.stringify(userId)} not found`,
        );

        throw new AppError('user.getProfile.notFound');
      }

      return ProfileOutput.fromUser(user);
    } catch (err) {
      this.logger.error(`user: getProfile: ${err.message}`);

      throw new AppError('common.serverError');
    }
  }
}
