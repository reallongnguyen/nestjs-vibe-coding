import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Logger } from 'nestjs-pino';
import { Collection } from 'src/common/models';

import { User } from '../entities/user.entity';
import {
  UpsertUserParams,
  UserRepositoryPort,
  FindUniqueUserParams,
  UpdateUserParams,
} from '../services/interface/user.repository.port';
import { Role } from '../entities/role.enum';
import { UserSearchFiltersDto } from '../presentation/rest/input/user-search-filters.dto';

@Injectable()
export class UserRepository implements UserRepositoryPort {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  async findUnique(params: FindUniqueUserParams): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        id: params.where.id,
        authId: params.where.authId,
      },
    });
  }

  async findMany(filters: UserSearchFiltersDto): Promise<Collection<User>> {
    return this.search(filters);
  }

  async count(): Promise<number> {
    return this.prisma.user.count();
  }

  async update(params: UpdateUserParams): Promise<User> {
    return this.prisma.user.update({
      where: {
        id: params.where.id,
        authId: params.where.authId,
      },
      data: params.data,
    });
  }

  async upsert(params: UpsertUserParams): Promise<User> {
    return this.prisma.user.upsert({
      where: params.where,
      create: params.create,
      update: params.update,
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async search(filters: UserSearchFiltersDto): Promise<Collection<User>> {
    const {
      offset = 0,
      limit = 20,
      searchTerm,
      role,
      status,
      orderDirection,
      orderBy,
      createdAtGte,
      createdAtLte,
    } = filters;

    const where: any = {
      OR: searchTerm
        ? [
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { firstName: { contains: searchTerm, mode: 'insensitive' } },
            { lastName: { contains: searchTerm, mode: 'insensitive' } },
            { phone: { contains: searchTerm } },
          ]
        : undefined,
      roles: role ? { has: role } : undefined,
      isActive: status ? status === 'active' : undefined,
      createdAt:
        createdAtGte || createdAtLte
          ? {
              gte: createdAtGte,
              lte: createdAtLte,
            }
          : undefined,
    };

    let prismaOrderBy = orderBy ? [{ [orderBy]: orderDirection }] : undefined;

    if (prismaOrderBy && orderBy === 'name') {
      prismaOrderBy = [
        {
          firstName: orderDirection,
        },
        {
          lastName: orderDirection,
        },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy: prismaOrderBy,
      skip: offset,
      take: limit,
    });

    const total = await this.prisma.user.count({ where });

    return new Collection(users, { total, offset, limit });
  }

  async updateRole(userId: string, roles: Role[]): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { roles },
    });
  }

  async deactivate(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }

  async activate(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });
  }

  async delete(userId: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id: userId },
    });
  }

  async createPasswordReset(
    userId: string,
  ): Promise<{ token: string; expiresAt: Date }> {
    this.logger.log(`Creating password reset for user ${userId}`);

    const token = Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return { token, expiresAt };
  }
}
