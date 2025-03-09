import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from 'nestjs-pino';
import { PrismaService } from 'src/common/prisma/prisma.service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { EventBusMessage } from 'src/common/event-manager';

import { EMOTION_EVENTS } from '../../entities/events/emotion-created.event';

@Injectable()
export class StreakHandler {
  constructor(
    private readonly logger: Logger,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent(EMOTION_EVENTS.EMOTION_CREATED.eventName)
  async handleEmotionCreated(
    event: EventBusMessage<typeof EMOTION_EVENTS.EMOTION_CREATED.schema>,
  ) {
    dayjs.extend(utc);
    dayjs.extend(timezone);

    // calculate streak by UTC timezone
    const now = dayjs().tz('UTC');
    const yesterday = dayjs().tz('UTC').subtract(1, 'day');

    // TODO: use cache to prevent check streak if user already checked today

    // Use transaction to prevent race conditions
    await this.prisma.$transaction(async (tx) => {
      const streak = await tx.userStreak.findUnique({
        where: { userId: event.payload.userId },
      });

      if (!streak) {
        await tx.userStreak.create({
          data: {
            userId: event.payload.userId,
            currentStreak: 1,
            longestStreak: 1,
            lastActivity: now.toDate(),
          },
        });
        return;
      }

      const lastActivityDate = dayjs(streak.lastActivity).tz('UTC');
      const isYesterday = lastActivityDate.isSame(yesterday, 'D');
      const isToday = lastActivityDate.isSame(now, 'D');

      if (isToday) {
        // Already counted for today
        return;
      }

      const newCurrentStreak = isYesterday ? streak.currentStreak + 1 : 1;
      const newLongestStreak = Math.max(newCurrentStreak, streak.longestStreak);

      await tx.userStreak.update({
        where: { userId: event.payload.userId },
        data: {
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
          lastActivity: now.toDate(),
        },
      });

      this.logger.debug('Updated user streak', {
        userId: event.payload.userId,
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
      });
    });
  }
}
