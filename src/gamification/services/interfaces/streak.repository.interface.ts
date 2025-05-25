import { UserStreak } from 'src/generated/client';

export interface IStreakRepository {
  findByUserId(userId: string): Promise<UserStreak | null>;
}
