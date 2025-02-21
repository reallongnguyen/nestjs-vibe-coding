import { Injectable } from '@nestjs/common';
import { Collection } from 'src/common/models';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { UserActivity as PrismaUserActivity } from '@prisma/client';

import { UserActivityRepositoryPort } from '../services/interface/user-activity.repository.port';
import { UserActivity } from '../entities/user-activity.entity';
import { ActivityFiltersDto } from '../presentation/rest/input/activity-filters.dto';
import { CreateUserActivityInput } from '../services/dto/activity.input';

@Injectable()
export class UserActivityRepository implements UserActivityRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(activity: CreateUserActivityInput): Promise<UserActivity> {
    const created = await this.prisma.userActivity.create({
      data: {
        userId: activity.userId,
        activityType: activity.activityType,
        metadata: activity.metadata,
        timestamp: new Date(),
      },
    });

    return this.mapToEntity(created);
  }

  async findByUserId(
    userId: string,
    filters: ActivityFiltersDto,
  ): Promise<Collection<UserActivity>> {
    const { offset = 0, limit = 10 } = filters;

    const [activities, total] = await Promise.all([
      this.prisma.userActivity.findMany({
        where: { userId },
        skip: offset,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.userActivity.count({
        where: { userId },
      }),
    ]);

    return {
      edges: activities.map(this.mapToEntity),
      pagination: {
        total,
        offset,
        limit,
      },
    };
  }

  async findAll(): Promise<UserActivity[]> {
    const activities = await this.prisma.userActivity.findMany({
      orderBy: { timestamp: 'desc' },
    });
    return activities.map(this.mapToEntity);
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.userActivity.deleteMany({
      where: { userId },
    });
  }

  private mapToEntity(prismaActivity: PrismaUserActivity): UserActivity {
    return new UserActivity(prismaActivity);
  }
}
