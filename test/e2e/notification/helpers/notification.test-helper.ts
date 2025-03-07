/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../src/common/prisma/prisma.service';

@Injectable()
export class NotificationTestHelper {
  constructor(private readonly prisma: PrismaService) {}

  async verifyDelivery(notificationId: string): Promise<boolean> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    return !!notification;
  }

  async getAggregatedNotification(userId: string) {
    return this.prisma.notification.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async simulateLoad(config: {
    notifications: any[];
    duration: number;
    distribution: 'even' | 'burst';
  }) {
    const results = {
      successCount: 0,
      totalLatency: 0,
      totalCount: config.notifications.length,
    };

    // Implementation details...

    return {
      successRate: results.successCount / results.totalCount,
      averageLatency: results.totalLatency / results.totalCount,
    };
  }

  async simulateServiceOutage(service: string): Promise<void> {
    // Implementation details...
  }

  async restoreService(service: string): Promise<void> {
    // Implementation details...
  }

  async setUserPreferences(
    userId: string,
    preferences: Record<string, boolean>,
  ): Promise<void> {
    // Implementation details...
  }

  async verifyMilestoneNotification(contentId: string) {
    return this.prisma.notification.findFirst({
      where: {
        type: 'MILESTONE',
        metadata: {
          path: ['contentId'],
          equals: contentId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
