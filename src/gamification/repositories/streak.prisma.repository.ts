import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { UserStreak } from '../entities/user-streak.entity';

import { IStreakRepository } from '../services/interfaces/streak.repository.interface';

@Injectable()
export class StreakPrismaRepository implements IStreakRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<UserStreak | null> {
    return this.prisma.userStreak.findUnique({
      where: { userId },
    });
  }
}
