import { Controller, Get, Query, UseGuards, UseFilters } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import {
  AuthGuard,
  RolesGuard,
  PagedResult,
  ErrorResponse,
  RestExceptionFilter,
  AuthContextUser,
  OkResponse,
  PageOptionsDto,
} from 'src/common';
import { withImageUrlMap } from 'src/common/img-proxy/dto/with-image-urls.mixin';
import {
  ImageSize,
  ImageUrlService,
} from 'src/common/img-proxy/services/image-url.service';

import { FollowingFeedService } from '../services/following-feed.service';
import { ContentDto } from './dtos/content.dto';
import { socialErrorMap } from '../entities/social-error.map';

@ApiTags('Feeds (deprecated)')
@Controller({
  path: 'deprecated-feeds',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(new RestExceptionFilter(socialErrorMap))
@ErrorResponse('common', socialErrorMap)
export class FollowingFeedController {
  constructor(
    private readonly followingFeedService: FollowingFeedService,
    private readonly imageUrlService: ImageUrlService,
  ) {}

  @Get('following')
  @ApiOperation({ summary: 'Get feed of content from followed users' })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['recent', 'popular'],
    description: 'Sort order for the feed',
  })
  @OkResponse(PagedResult)
  async getFollowingFeed(
    @AuthContextUser('id') userId: string,
    @Query() pageOptions: PageOptionsDto,
    @Query('sortBy') sortBy?: string,
  ): Promise<PagedResult<ContentDto>> {
    const collection = await this.followingFeedService.getFollowingFeed(
      userId,
      pageOptions,
      sortBy,
    );

    return withImageUrlMap(this.imageUrlService)(collection, {
      width: ImageSize.CONTENT_XL,
      height: ImageSize.CONTENT_XL,
      resizeType: 'fill',
      generateThumbnail: true,
    });
  }
}
