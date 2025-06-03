import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
  UseFilters,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CacheTTL, CacheInterceptor } from '@nestjs/cache-manager';
import {
  AuthGuard,
  PagedResult,
  AuthContextUser,
  PaginatedResponse,
  RolesGuard,
  RequireAnyRoles,
  Role,
  PageOptionsDto,
} from 'src/common';
import {
  GlobalErrorFilter,
  ErrorResponse,
  // COMMON_ERRORS, // Removed
} from 'src/common/errors';
import { ApiAppErrors } from 'src/common/swagger/api-app-errors.decorator';
import { CommonErrorCode } from 'src/common/errors/common.error-codes';
import { FeedErrorCode } from '../errors/feed.error-codes';
import { FeedService } from '../services/feed.service';
import { FeedType } from '../entities';
import { FeedItemDto } from './dtos/feed-item.dto';
// import { FEED_ERRORS } from '../errors'; // Removed

// Common decorator configurations for all endpoints
const REST_CONFIG = {
  guards: [AuthGuard, RolesGuard],
  filters: [GlobalErrorFilter],
};

@ApiTags('Feeds')
@ApiBearerAuth()
@Controller({
  path: 'feeds',
  version: '1',
})
@UseGuards(...REST_CONFIG.guards)
@UseFilters(...REST_CONFIG.filters)
// @ErrorResponse(COMMON_ERRORS) // Removed
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get('personalized')
  @RequireAnyRoles(Role.USER)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(5000)
  @ApiOperation({
    summary: 'Get personalized feed',
    description:
      'Returns a personalized feed based on user preferences and behavior. Combines recommended, popular, and latest content.',
  })
  @PaginatedResponse(FeedItemDto)
  // @ErrorResponse({}) // Removed
  @ApiAppErrors([
    CommonErrorCode.AUTH_INVALID_TOKEN,
    CommonErrorCode.AUTH_NO_PRIVILEGE,
    FeedErrorCode.PERSONALIZED_FEED_FAILED,
    FeedErrorCode.FEED_GENERATION_FAILED,
    FeedErrorCode.FEED_ENRICHMENT_FAILED,
    FeedErrorCode.FEED_CACHE_FAILED,
    FeedErrorCode.IDENTITY_FETCH_FAILED,
    FeedErrorCode.SOCIAL_METRICS_FETCH_FAILED,
  ])
  async getPersonalizedFeed(
    @AuthContextUser('id') userId: string,
    @Query() pageOptions: PageOptionsDto,
  ): Promise<PagedResult<FeedItemDto>> {
    const feed = await this.feedService.getFeed(
      userId,
      pageOptions,
      FeedType.PERSONALIZED,
    );

    return PagedResult.transform(feed, FeedItemDto.fromDomain);
  }

  @Get('following')
  @RequireAnyRoles(Role.USER)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(5000)
  @ApiOperation({
    summary: 'Get following feed',
    description: 'Returns posts from users the current user is following.',
  })
  @PaginatedResponse(FeedItemDto)
  // @ErrorResponse({}) // Removed
  @ApiAppErrors([
    CommonErrorCode.AUTH_INVALID_TOKEN,
    CommonErrorCode.AUTH_NO_PRIVILEGE,
    FeedErrorCode.FOLLOWING_FEED_FAILED,
    FeedErrorCode.FEED_GENERATION_FAILED,
    FeedErrorCode.FEED_ENRICHMENT_FAILED,
    FeedErrorCode.FEED_CACHE_FAILED,
    FeedErrorCode.IDENTITY_FETCH_FAILED,
    FeedErrorCode.SOCIAL_METRICS_FETCH_FAILED,
    FeedErrorCode.FOLLOW_STATUS_FETCH_FAILED,
  ])
  async getFollowingFeed(
    @AuthContextUser('id') userId: string,
    @Query() pageOptions: PageOptionsDto,
  ): Promise<PagedResult<FeedItemDto>> {
    const feed = await this.feedService.getFeed(
      userId,
      pageOptions,
      FeedType.FOLLOWING,
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
  // @ErrorResponse(FEED_ERRORS) // Removed
  @ApiAppErrors([
    CommonErrorCode.AUTH_INVALID_TOKEN,
    CommonErrorCode.AUTH_NO_PRIVILEGE, // Assuming trending might still require auth for consistency or future features
    FeedErrorCode.TRENDING_FEED_FAILED,
    FeedErrorCode.FEED_GENERATION_FAILED,
    FeedErrorCode.FEED_ENRICHMENT_FAILED,
    FeedErrorCode.FEED_CACHE_FAILED,
    FeedErrorCode.IDENTITY_FETCH_FAILED,
    FeedErrorCode.SOCIAL_METRICS_FETCH_FAILED,
  ])
  async getTrendingFeed(
    @Query() pageOptions: PageOptionsDto,
    @AuthContextUser('id') userId: string,
  ): Promise<PagedResult<FeedItemDto>> {
    const feed = await this.feedService.getFeed(
      userId,
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
  // @ErrorResponse({}) // Removed
  @ApiAppErrors([
    CommonErrorCode.AUTH_INVALID_TOKEN, // Assuming latest might still require auth
    CommonErrorCode.AUTH_NO_PRIVILEGE,
    FeedErrorCode.LATEST_FEED_FAILED,
    FeedErrorCode.FEED_GENERATION_FAILED,
    FeedErrorCode.FEED_ENRICHMENT_FAILED,
    FeedErrorCode.FEED_CACHE_FAILED,
    FeedErrorCode.IDENTITY_FETCH_FAILED,
    FeedErrorCode.SOCIAL_METRICS_FETCH_FAILED,
  ])
  async getLatestFeed(
    @Query() pageOptions: PageOptionsDto,
    @AuthContextUser('id') userId?: string,
  ): Promise<PagedResult<FeedItemDto>> {
    const feed = await this.feedService.getFeed(
      userId,
      pageOptions,
      FeedType.LATEST,
    );

    return PagedResult.transform(feed, FeedItemDto.fromDomain);
  }
}
