import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from 'nestjs-pino';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { EmotionCreatedEvent } from '../../entities/events/emotion-created.event';

@Injectable()
export class StreakHandler {
  constructor(
    private readonly logger: Logger,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent(EmotionCreatedEvent.getName())
  async handleEmotionCreated(event: EmotionCreatedEvent) {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    // Use transaction to prevent race conditions
    await this.prisma.$transaction(async (tx) => {
      const streak = await tx.userStreak.findUnique({
        where: { userId: event.userId },
      });

      if (!streak) {
        await tx.userStreak.create({
          data: {
            userId: event.userId,
            currentStreak: 1,
            longestStreak: 1,
            lastActivity: now,
          },
        });
        return;
      }

      const lastActivityDate = new Date(streak.lastActivity);
      const isYesterday =
        lastActivityDate.toDateString() === yesterday.toDateString();
      const isToday = lastActivityDate.toDateString() === now.toDateString();

      if (isToday) {
        // Already counted for today
        return;
      }

      const newCurrentStreak = isYesterday ? streak.currentStreak + 1 : 1;
      const newLongestStreak = Math.max(newCurrentStreak, streak.longestStreak);

      await tx.userStreak.update({
        where: { userId: event.userId },
        data: {
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
          lastActivity: now,
        },
      });

      this.logger.debug('Updated user streak', {
        userId: event.userId,
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
      });
    });
  }
}
