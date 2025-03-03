import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  NotificationPreference,
  NotificationType,
  NotificationChannel,
} from '../entities/notification-preference.entity';
import { INotificationPreferenceRepository } from '../services/interfaces/notification-preference-repository.interface';

/**
 * Repository implementation for notification preferences
 */
@Injectable()
export class NotificationPreferenceRepository
  implements INotificationPreferenceRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findMany(options: {
    where?: {
      userId?: string;
      type?: string;
      enabled?: boolean;
    };
    skip?: number;
    take?: number;
    orderBy?: {
      createdAt?: 'asc' | 'desc';
      updatedAt?: 'asc' | 'desc';
    };
  }): Promise<NotificationPreference[]> {
    const preferences = await this.prisma.notificationPreference.findMany({
      where: {
        userId: options.where?.userId,
        type: options.where?.type,
        enabled: options.where?.enabled,
      },
      skip: options.skip,
      take: options.take || 20,
      orderBy: options.orderBy,
    });

    return preferences.map((pref) => this.mapToDomain(pref));
  }

  async count(where: {
    userId?: string;
    type?: string;
    enabled?: boolean;
  }): Promise<number> {
    return this.prisma.notificationPreference.count({
      where: {
        userId: where.userId,
        type: where.type,
        enabled: where.enabled,
      },
    });
  }

  async create(data: {
    userId: string;
    type: NotificationType;
    channels: string[];
    enabled: boolean;
  }): Promise<NotificationPreference> {
    const preference = await this.prisma.notificationPreference.create({
      data: {
        userId: data.userId,
        type: data.type,
        channels: data.channels,
        enabled: data.enabled,
      },
    });

    return this.mapToDomain(preference);
  }

  async update(
    id: string,
    data: {
      channels?: string[];
      enabled?: boolean;
    },
  ): Promise<NotificationPreference> {
    const updateData: any = {};

    if (data.channels !== undefined) {
      updateData.channels = data.channels;
    }

    if (data.enabled !== undefined) {
      updateData.enabled = data.enabled;
    }

    const preference = await this.prisma.notificationPreference.update({
      where: { id },
      data: updateData,
    });

    return this.mapToDomain(preference);
  }

  async findByUserIdAndType(
    userId: string,
    type: NotificationType,
  ): Promise<NotificationPreference | null> {
    const preference = await this.prisma.notificationPreference.findUnique({
      where: {
        userId_type: {
          userId,
          type,
        },
      },
    });

    return preference ? this.mapToDomain(preference) : null;
  }

  async findByUserId(userId: string): Promise<NotificationPreference[]> {
    const preferences = await this.prisma.notificationPreference.findMany({
      where: { userId },
    });

    return preferences.map((pref) => this.mapToDomain(pref));
  }

  async delete(id: string): Promise<NotificationPreference> {
    const preference = await this.prisma.notificationPreference.delete({
      where: { id },
    });

    return this.mapToDomain(preference);
  }

  /**
   * Map a database preference to a domain model
   */
  private mapToDomain(dbPreference: any): NotificationPreference {
    const preference = new NotificationPreference();
    preference.id = dbPreference.id;
    preference.userId = dbPreference.userId;
    preference.type = dbPreference.type as NotificationType;
    preference.channels = dbPreference.channels.map(
      (channel: string) => channel as NotificationChannel,
    );
    preference.enabled = dbPreference.enabled;
    preference.createdAt = dbPreference.createdAt;
    preference.updatedAt = dbPreference.updatedAt;
    return preference;
  }
}
