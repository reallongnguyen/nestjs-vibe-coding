import { Controller, Get, Query, UseGuards, UseFilters } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthGuard,
  RolesGuard,
  RequireAnyRoles,
  Role,
  AuthContextUser,
  User,
} from 'src/common/auth';
import {
  ErrorResponse,
  PaginatedResponse,
  RestExceptionFilter,
} from 'src/common/presentation/rest';
import Collection from 'src/common/models/Collection';

import { FeedService } from '../services/feed.service';
import { GetFeedFiltersDto } from './dtos/get-feed-filters.dto';
import { FeedItemDto } from './dtos/feed-response.dto';
import { feedErrorMap } from '../entities/feed-error.map';

const REST_CONFIG = {
  guards: [AuthGuard, RolesGuard],
  filters: [new RestExceptionFilter(feedErrorMap)],
};

@Controller({
  path: 'feeds',
  version: '1',
})
@UseGuards(...REST_CONFIG.guards)
@UseFilters(...REST_CONFIG.filters)
@ApiTags('feeds')
@ErrorResponse('common', feedErrorMap)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  @RequireAnyRoles(Role.USER)
  @ApiOperation({ summary: 'Get user feed' })
  @PaginatedResponse(FeedItemDto)
  @ErrorResponse('feed.list', feedErrorMap)
  async getFeed(
    @Query() filters: GetFeedFiltersDto,
    @AuthContextUser() user: User,
  ): Promise<Collection<FeedItemDto>> {
    const { items, total } = await this.feedService.getFeed({
      userId: user.id,
      offset: filters.offset || 0,
      limit: filters.limit || 16,
    });

    return new Collection(items.map(FeedItemDto.fromApplication), {
      limit: filters.limit || 16,
      offset: filters.offset || 0,
      total,
    });
  }
}
