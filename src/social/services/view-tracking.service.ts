import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { IEventBus, InjectEventBus } from 'src/common/event-manager';
import { ContentType } from '../entities/events/social.events';
import { ContentViewedEvent } from '../entities/events/content-viewed.event';
import { SocialEngagementRedisService } from './social-engagement-redis.service';
import { SocialEngagementMetricsService } from './social-engagement-metrics.service';

const BATCH_PROCESS_INTERVAL = 1000; // 1 second

@Injectable()
export class ViewTrackingService {
  private readonly logger = new Logger(ViewTrackingService.name);
  private batchProcessingTimer: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: SocialEngagementRedisService,
    private readonly metricsService: SocialEngagementMetricsService,
    @InjectEventBus()
    private readonly eventBus: IEventBus,
  ) {
    this.startBatchProcessing();
  }

  onModuleDestroy() {
    if (this.batchProcessingTimer) {
      clearInterval(this.batchProcessingTimer);
    }
  }

  /**
   * Track content view
   * @param type Content type
   * @param contentId Content ID
   * @param viewerHash Viewer hash
   * @param viewerId Optional viewer ID
   */
  async trackView(
    type: string,
    contentId: string,
    viewerHash: string,
    viewerId?: string,
  ): Promise<void> {
    const upperType = type.toUpperCase() as ContentType;
    const startTime = Date.now();

    try {
      // Track view in Redis
      const isNewView = await this.redisService.trackView(
        upperType,
        contentId,
        viewerHash,
        viewerId,
      );

      // Emit content viewed event if it's a new view
      if (isNewView) {
        const event = new ContentViewedEvent(
          contentId,
          upperType,
          viewerHash,
          viewerId,
        );
        await this.eventBus.publish(event);
      }

      this.metricsService.trackViewOperation(upperType, 'success');
    } catch (error) {
      this.metricsService.trackViewOperation(upperType, 'error');
      throw error;
    } finally {
      this.metricsService.trackViewOperationDuration(
        upperType,
        Date.now() - startTime,
      );
    }
  }

  /**
   * Start batch processing timer
   */
  private startBatchProcessing(): void {
    this.batchProcessingTimer = setInterval(async () => {
      try {
        await this.processBatches();
      } catch (error) {
        this.logger.error('Failed to process view batches', error);
      }
    }, BATCH_PROCESS_INTERVAL);
  }

  /**
   * Process all view batches
   */
  private async processBatches(): Promise<void> {
    const startTime = Date.now();
    const contentTypes = Object.values(ContentType);

    try {
      // Process batches for each content type
      await Promise.all(
        contentTypes.map(async (type) => {
          const views = await this.redisService.processBatch(type);
          if (views.length === 0) {
            return;
          }

          // Group views by content ID
          const viewsByContent = views.reduce(
            (acc, view) => {
              const key = view.contentId;
              if (!acc[key]) {
                acc[key] = [];
              }
              acc[key].push(view);
              return acc;
            },
            {} as Record<string, typeof views>,
          );

          // Update view counts in database
          await Promise.all(
            Object.entries(viewsByContent).map(
              async ([contentId, contentViews]) => {
                await this.prisma.engageable.upsert({
                  where: {
                    type_contentId: {
                      type,
                      contentId,
                    },
                  },
                  create: {
                    type,
                    contentId,
                    viewCount: contentViews.length,
                    likeCount: 0,
                    commentCount: 0,
                  },
                  update: {
                    viewCount: {
                      increment: contentViews.length,
                    },
                  },
                });
              },
            ),
          );

          this.metricsService.trackBatchProcessing(
            type,
            'success',
            views.length,
          );
        }),
      );
    } catch (error) {
      this.metricsService.trackBatchProcessing('ALL', 'error', 0);
      this.logger.error('Failed to process view batches', error);
    } finally {
      this.metricsService.trackBatchProcessingDuration(
        'ALL',
        Date.now() - startTime,
      );
    }
  }
}
