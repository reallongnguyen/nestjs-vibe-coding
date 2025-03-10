import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { AppError } from 'src/common';
import { GetRecommendationsCommand } from '../../../feed/entities/commands/get-recommendations.command';
import { ContentDistributionService } from '../../services/content-distribution.service';

@Injectable()
@CommandHandler(GetRecommendationsCommand)
export class RecommendationHandler
  implements ICommandHandler<GetRecommendationsCommand>
{
  private readonly logger = new Logger(RecommendationHandler.name);

  constructor(
    private readonly recommendationService: ContentDistributionService,
  ) {}

  async execute(command: GetRecommendationsCommand): Promise<string[]> {
    const { userId, feedType, pagination } = command;

    try {
      this.logger.debug(
        `Getting recommendations for user ${userId} with feed type ${feedType}`,
      );

      const contentIds = await this.recommendationService.getRecommendations(
        userId as string | undefined,
        feedType,
        pagination.offset,
        pagination.limit,
      );

      this.logger.debug(
        `Found ${contentIds.length} recommendations for user ${userId}`,
      );

      return contentIds;
    } catch (error) {
      this.logger.error(
        `Failed to get recommendations for user ${userId}: ${error.message}`,
        error.stack,
      );
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('RECOMMENDATION.GET_FAILED', error.message);
    }
  }
}
