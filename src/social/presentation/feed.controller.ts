import { Controller, Get, Query, UseFilters } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ErrorResponse,
  PaginatedResponse,
  RestExceptionFilter,
  PagedResult,
  OptionalAuthGuard,
  OptionalAuthContext,
  AuthCtx,
} from 'src/common';
import {
  ImageSize,
  ImageUrlService,
} from 'src/common/img-proxy/services/image-url.service';
import { withImageUrlMap } from 'src/common/img-proxy/dto/with-image-urls.mixin';

import { FeedService } from '../services/feed.service';
import { GetFeedFiltersDto } from './dtos/get-feed-filters.dto';
import { FeedItemDto } from './dtos/feed-response.dto';
import { feedErrorMap } from '../entities/feed-error.map';

const REST_CONFIG = {
  guards: [OptionalAuthGuard],
  filters: [new RestExceptionFilter(feedErrorMap)],
};

@Controller({
  path: 'deprecated-feeds',
  version: '1',
})
@UseFilters(...REST_CONFIG.filters)
@ApiTags('Feeds (deprecated)')
@ErrorResponse('common', feedErrorMap)
export class FeedController {
  constructor(
    private readonly feedService: FeedService,
    private readonly imageUrlService: ImageUrlService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user feed' })
  @PaginatedResponse(FeedItemDto)
  @ErrorResponse('feed.list', feedErrorMap)
  async getFeed(
    @Query() filters: GetFeedFiltersDto,
    @OptionalAuthContext() authCtx?: AuthCtx,
  ): Promise<PagedResult<FeedItemDto>> {
    const { items, total } = await this.feedService.getFeed({
      userId: authCtx?.getUser()?.id,
      offset: filters.offset || 0,
      limit: filters.limit || 16,
    });

    const collection = new PagedResult(items.map(FeedItemDto.fromApplication), {
      limit: filters.limit || 16,
      offset: filters.offset || 0,
      total,
    });

    return withImageUrlMap(this.imageUrlService)(collection, {
      width: ImageSize.CONTENT_XL,
      height: ImageSize.CONTENT_XL,
      resizeType: 'fill',
      generateThumbnail: true,
    });
  }
}
