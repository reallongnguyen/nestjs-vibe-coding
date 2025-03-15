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
import { PagedResult, PageOptionsDto, PaginatedResponse } from 'src/common';
import {
  GlobalErrorFilter,
  ErrorResponse,
  COMMON_ERRORS,
} from 'src/common/errors';
import { FeedService } from '../services/feed.service';
import { FeedType } from '../entities';
import { FeedItemDto } from './dtos/feed-item.dto';

// Common decorator configurations for all endpoints
const REST_CONFIG = {
  guards: [],
  filters: [GlobalErrorFilter],
};

@ApiTags('Feeds for Guest Users')
@Controller({
  path: 'feeds/guest',
  version: '1',
})
@UseGuards(...REST_CONFIG.guards)
@UseFilters(...REST_CONFIG.filters)
@ErrorResponse(COMMON_ERRORS)
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
  @ErrorResponse({})
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
  @CacheTTL(10000)
  @ApiOperation({
    summary: 'Get trending feed',
    description:
      'Returns trending posts based on engagement metrics like views, likes, and comments.',
  })
  @PaginatedResponse(FeedItemDto)
  @ErrorResponse({})
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
    description: 'Returns the most recently published posts.',
  })
  @PaginatedResponse(FeedItemDto)
  @ErrorResponse({})
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
