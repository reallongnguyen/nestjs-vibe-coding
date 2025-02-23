import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class ContentProcessorService {
  constructor(
    @InjectQueue('content-processing') private readonly queue: Queue,
  ) {}

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

  async removePost(postId: string): Promise<void> {
    await this.queue.add(
      'remove-post',
      { postId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );
  }

  async removeEmotion(emotionId: string): Promise<void> {
    await this.queue.add(
      'remove-emotion',
      { emotionId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );
  }
}
