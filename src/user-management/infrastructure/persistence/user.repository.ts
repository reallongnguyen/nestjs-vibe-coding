import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Logger } from 'nestjs-pino';
import { User } from '../../domain/models/user.entity';
import {
  UpsertUserParams,
  UserRepositoryPort,
  FindManyUserParams,
  FindUniqueUserParams,
  UpdateUserParams,
} from '../../domain/ports/user.repository.port';

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

  async findMany(params: FindManyUserParams): Promise<User[]> {
    return this.prisma.user.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: params.orderBy,
    });
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
      create: {
        authId: params.create.authId,
        name: params.create.name,
        avatar: params.create.avatar,
        roles: params.create.roles,
      },
      update: params.update,
    });
  }
}
