import { Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { v7 as uuidv7 } from 'uuid';

export interface BatchProcessorConfig<T> {
  // Function to process the batch
  processBatch: (items: T[]) => Promise<void>;
  // Redis key for the batch list
  batchKey?: string;
  // Maximum size of a batch before processing
  batchSize?: number;
  // Maximum time (ms) to wait before processing an incomplete batch
  batchTimeout?: number;
  // Optional function to validate item before adding to batch
  validateItem?: (item: T) => boolean | Promise<boolean>;
  // Optional custom logger
  logger?: Logger;
  // Optional timer interval (ms) to check if batch should be processed
  timerInterval?: number;
}

export class RedisBatchProcessor<T> {
  private readonly logger: Logger;
  private readonly redis: Redis;
  private readonly config: BatchProcessorConfig<T>;
  private timer: NodeJS.Timeout | null = null;
  private readonly timerInterval: number;
  private readonly batchKey: string;
  private readonly batchSize: number;
  private readonly batchTimeout: number;

  constructor(redis: Redis, config: BatchProcessorConfig<T>) {
    this.redis = redis;
    this.config = config;
    this.logger = config.logger || new Logger(RedisBatchProcessor.name);

    this.batchKey = config.batchKey || uuidv7();
    this.batchSize = config.batchSize || 256;
    this.batchTimeout = config.batchTimeout || 8000;
    this.timerInterval = config.timerInterval || 1000;

    this.startTimer();
  }

  private startTimer(): void {
    if (this.timer) {
      return;
    }

    this.timer = setInterval(async () => {
      try {
        const batchStartTime = await this.redis.get(`${this.batchKey}:start`);
        if (
          batchStartTime &&
          Date.now() - parseInt(batchStartTime, 10) >= this.batchTimeout
        ) {
          await this.forceBatchProcess();
        }
      } catch (error) {
        this.logger.error(
          `${this.batchKey}: Timer-triggered batch processing failed: ${error.message}`,
          error.stack,
        );
      }
    }, this.timerInterval);

    // Ensure the timer doesn't prevent the process from exiting
    this.timer.unref();
  }

  public stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async add(item: T): Promise<void> {
    try {
      // Validate item if validator provided
      if (this.config.validateItem) {
        const isValid = await this.config.validateItem(item);
        if (!isValid) {
          throw new Error(
            `${this.batchKey}: Invalid item for batch processing`,
          );
        }
      }

      // Add to batch
      const batchData = JSON.stringify(item);
      await this.redis.rpush(this.batchKey, batchData);

      // Get current batch info
      const batchSize = await this.redis.llen(this.batchKey);

      // Check if we should process the batch
      const shouldProcess = batchSize >= this.batchSize;

      if (shouldProcess) {
        await this.processBatch();
      } else if (batchSize === 1) {
        // Set start time for new batch
        await this.redis.set(`${this.batchKey}:start`, Date.now().toString());
      }
    } catch (error) {
      this.logger.error(
        `${this.batchKey}: Failed to add item to batch: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async processBatch(): Promise<void> {
    const multi = this.redis.multi();

    try {
      // Get all items
      const items = await this.redis.lrange(this.batchKey, 0, -1);

      // Parse items
      const parsedItems = items.map((item) => JSON.parse(item) as T);

      // Process batch
      await this.config.processBatch(parsedItems);

      // Clean up batch keys
      multi.del(this.batchKey).del(`${this.batchKey}:start`);

      await multi.exec();

      this.logger.debug(
        `${this.batchKey}: Successfully processed batch of ${parsedItems.length} items`,
      );
    } catch (error) {
      this.logger.error(
        `${this.batchKey}: Failed to process batch: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async forceBatchProcess(): Promise<void> {
    const batchSize = await this.redis.llen(this.batchKey);
    if (batchSize > 0) {
      await this.processBatch();
    }
  }

  async onApplicationShutdown(): Promise<void> {
    this.stopTimer();
    await this.forceBatchProcess();
  }
}
