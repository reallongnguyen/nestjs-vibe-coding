import { ApiProperty } from '@nestjs/swagger';
import { UserStreak } from '@prisma/client';

export class StreakResponseDto {
  @ApiProperty({
    example: 5,
    description: 'Current streak count',
  })
  currentStreak: number;

  @ApiProperty({
    example: 10,
    description: 'Longest streak achieved',
  })
  longestStreak: number;

  @ApiProperty({
    example: '2024-03-20T15:00:00.000Z',
    description: 'Last activity timestamp',
  })
  lastActivity: Date;

  static fromDomain(streak: UserStreak): StreakResponseDto {
    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActivity: streak.lastActivity,
    };
  }
}
