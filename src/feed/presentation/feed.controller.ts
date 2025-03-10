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
  AuthGuard,
  Collection,
  PaginationQueryDto,
  AuthContextUser,
  PaginatedResponse,
  ErrorResponse,
  RolesGuard,
  RestExceptionFilter,
  RequireAnyRoles,
  Role,
} from 'src/common';
import { FeedService } from '../services/feed.service';
import { FeedType, feedErrorMap } from '../entities';
import { FeedItemDto } from './dtos/feed-item.dto';

// Common decorator configurations for all endpoints
const REST_CONFIG = {
  guards: [AuthGuard, RolesGuard],
  filters: [new RestExceptionFilter(feedErrorMap)],
};

@ApiTags('Feeds')
@Controller({
  path: 'feeds',
  version: '1',
})
@UseGuards(...REST_CONFIG.guards)
@UseFilters(...REST_CONFIG.filters)
@ErrorResponse('common', feedErrorMap)
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
  @ErrorResponse('feed.personalized', feedErrorMap)
  async getPersonalizedFeed(
    @AuthContextUser('id') userId: string,
    @Query() pagination: PaginationQueryDto,
  ): Promise<Collection<FeedItemDto>> {
    const feed = await this.feedService.getFeed(
      userId,
      pagination,
      FeedType.PERSONALIZED,
    );

    return Collection.transform(feed, FeedItemDto.fromDomain);
  }

  @Get('following')
  @RequireAnyRoles(Role.USER)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(5000)
  @ApiOperation({
    summary: 'Get following feed',
    description:
      'Returns a feed of content from users that the authenticated user follows.',
  })
  @PaginatedResponse(FeedItemDto)
  @ErrorResponse('feed.following', feedErrorMap)
  async getFollowingFeed(
    @AuthContextUser('id') userId: string,
    @Query() pagination: PaginationQueryDto,
  ): Promise<Collection<FeedItemDto>> {
    const feed = await this.feedService.getFeed(
      userId,
      pagination,
      FeedType.FOLLOWING,
    );

    return Collection.transform(feed, FeedItemDto.fromDomain);
  }

  @Get('trending')
  @RequireAnyRoles(Role.USER)
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
    @Query() pagination: PaginationQueryDto,
    @AuthContextUser('id') userId: string,
  ): Promise<Collection<FeedItemDto>> {
    const feed = await this.feedService.getFeed(
      userId,
      pagination,
      FeedType.TRENDING,
    );

    return Collection.transform(feed, FeedItemDto.fromDomain);
  }

  @Get('latest')
  @RequireAnyRoles(Role.USER)
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
    @AuthContextUser('id') userId: string,
    @Query() pagination: PaginationQueryDto,
  ): Promise<Collection<FeedItemDto>> {
    const feed = await this.feedService.getFeed(
      userId,
      pagination,
      FeedType.LATEST,
    );

    return Collection.transform(feed, FeedItemDto.fromDomain);
  }
}
