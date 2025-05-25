import { Injectable } from '@nestjs/common';
import { PagedResult } from 'src/common/models';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  UserActivity as PrismaUserActivity,
  UserActivityType,
} from 'src/generated/client';

import { IUserActivityRepository } from '../services/interfaces/user-activity.repository.interface';
import { UserActivity } from '../entities/user-activity.entity';
import { ActivityFiltersDto } from '../presentation/dtos/activity-filters.input';
import { CreateUserActivityInput } from '../services/dto/activity.input';

@Injectable()
export class UserActivityRepository implements IUserActivityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(activity: CreateUserActivityInput): Promise<UserActivity> {
    const created = await this.prisma.userActivity.create({
      data: {
        userId: activity.userId,
        activityType: activity.activityType,
        performedBy: activity.performedBy,
        details: activity.details,
        metadata: activity.metadata,
        timestamp: new Date(),
        ipAddress: activity.ipAddress,
        userAgent: activity.userAgent,
        success: activity.success,
        location: activity.location,
        deviceId: activity.deviceId,
      },
    });

    return this.mapToEntity(created);
  }

  async findByUserId(
    userId: string,
    filters: ActivityFiltersDto,
  ): Promise<PagedResult<UserActivity>> {
    const { activityType, startDate, endDate } = filters;

    const { skip, take } = filters.toDatabaseQuery();

    const [items, total] = await Promise.all([
      this.prisma.userActivity.findMany({
        where: {
          userId,
          activityType: (activityType as UserActivityType) || undefined,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        skip,
        take,
      }),

      this.prisma.userActivity.count({
        where: {
          userId,
          activityType: (activityType as UserActivityType) || undefined,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ]);

    return new PagedResult(
      items.map(this.mapToEntity),
      filters.toResponseMeta(total),
    );
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
