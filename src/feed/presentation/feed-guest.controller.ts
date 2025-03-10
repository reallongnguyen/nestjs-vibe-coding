import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
  UseFilters,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CacheTTL, CacheInterceptor } from '@nestjs/cache-manager';
import {
  PagedResult,
  PageOptionsDto,
  PaginatedResponse,
  ErrorResponse,
  RestExceptionFilter,
} from 'src/common';
import { FeedService } from '../services/feed.service';
import { FeedType, feedErrorMap } from '../entities';
import { FeedItemDto } from './dtos/feed-item.dto';

// Common decorator configurations for all endpoints
const REST_CONFIG = {
  guards: [],
  filters: [new RestExceptionFilter(feedErrorMap)],
};

@ApiTags('Feeds for Guest Users')
@Controller({
  path: 'feeds/guest',
  version: '1',
})
@UseGuards(...REST_CONFIG.guards)
@UseFilters(...REST_CONFIG.filters)
@ErrorResponse('common', feedErrorMap)
export class FeedGuestController {
  constructor(private readonly feedService: FeedService) {}

  @Get('personalized')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(5000)
  @ApiOperation({
    summary: 'Get personalized feed',
    description:
      'Returns a personalized feed based on user preferences and behavior. Combines recommended, popular, and latest content.',
  })
  @PaginatedResponse(FeedItemDto)
  @ErrorResponse('feed.personalized', feedErrorMap)
  async getPersonalizedFeed(
    @Query() pageOptions: PageOptionsDto,
  ): Promise<PagedResult<FeedItemDto>> {
    const feed = await this.feedService.getFeed(
      undefined,
      pageOptions,
      FeedType.PERSONALIZED,
    );

    return PagedResult.transform(feed, FeedItemDto.fromDomain);
  }

  @Get('trending')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(5000)
  @ApiOperation({
    summary: 'Get trending feed',
    description:
      'Returns a feed of currently trending content. Available for both authenticated and guest users.',
  })
  @PaginatedResponse(FeedItemDto)
  @ErrorResponse('feed.trending', feedErrorMap)
  async getTrendingFeed(
    @Query() pageOptions: PageOptionsDto,
  ): Promise<PagedResult<FeedItemDto>> {
    const feed = await this.feedService.getFeed(
      undefined,
      pageOptions,
      FeedType.TRENDING,
    );

    return PagedResult.transform(feed, FeedItemDto.fromDomain);
  }

  @Get('latest')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(5000)
  @ApiOperation({
    summary: 'Get latest feed',
    description:
      'Returns a feed of the most recent content in chronological order.',
  })
  @PaginatedResponse(FeedItemDto)
  @ErrorResponse('feed.latest', feedErrorMap)
  async getLatestFeed(
    @Query() pageOptions: PageOptionsDto,
  ): Promise<PagedResult<FeedItemDto>> {
    const feed = await this.feedService.getFeed(
      undefined,
      pageOptions,
      FeedType.LATEST,
    );

    return PagedResult.transform(feed, FeedItemDto.fromDomain);
  }
}
