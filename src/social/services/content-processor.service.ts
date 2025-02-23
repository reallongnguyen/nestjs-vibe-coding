import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class ContentProcessorService {
  constructor(
    @InjectQueue('content-processing') private readonly queue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  private calculateScore(intensity: number, createdAt: Date): number {
    const timeDiff = (Date.now() - createdAt.getTime()) / 1000 / 60 / 60;
    return (intensity * 1000) / (timeDiff + 1);
  }

  async processPost(postId: string): Promise<void> {
    await this.queue.add(
      'process-post',
      { postId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );
  }

  async processEmotion(emotionId: string): Promise<void> {
    await this.queue.add(
      'process-emotion',
      { emotionId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );
  }
}
