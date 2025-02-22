import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

import { IStreakRepository } from './interfaces/streak.repository.interface';
import { UserStreak } from '../entities/user-streak.entity';

@Injectable()
export class GetStreakService {
  constructor(
    private readonly logger: Logger,
    @Inject('IStreakRepository')
    private readonly streakRepository: IStreakRepository,
  ) {}

  async execute(userId: string) {
    const streak = await this.streakRepository.findByUserId(userId);

    const initialStreak = {
      id: '',
      userId,
      currentStreak: 0,
      longestStreak: 0,
      lastActivity: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as UserStreak;

    return streak || initialStreak;
  }
}
