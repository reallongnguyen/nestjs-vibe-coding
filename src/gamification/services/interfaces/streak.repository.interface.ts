import { UserStreak } from '@prisma/client';

export interface IStreakRepository {
  findByUserId(userId: string): Promise<UserStreak | null>;
}
