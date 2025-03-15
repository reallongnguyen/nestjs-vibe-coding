import {
  Controller,
  UseGuards,
  Param,
  UseFilters,
  Delete,
  Get,
  Query,
  UseInterceptors,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  CreatedResponse,
  OkResponse,
  PaginatedResponse,
  PagedResult,
  AuthContextUser,
  AuthGuard,
  User,
  RolesGuard,
} from 'src/common';
import {
  GlobalErrorFilter,
  ErrorResponse,
  COMMON_ERRORS,
} from 'src/common/errors';
import { CacheTTL, CacheInterceptor } from '@nestjs/cache-manager';
import { PublishedPostService } from '../services/published-post.service';
import { ListPostsQueryDto } from './dtos/list-posts.dto';
import { DraftPostResponseDto } from './dtos/post-response.dto';
import { PublishedPostDto } from './dtos/published-post.dto';
import { CONTENT_ERRORS } from '../entities/errors';

@ApiTags('Posts')
@Controller({
  path: 'posts/published',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(GlobalErrorFilter)
@ErrorResponse(COMMON_ERRORS)
export class PublishedPostController {
  constructor(private readonly publishedPostService: PublishedPostService) {}

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a published post' })
  @ApiParam({ name: 'id', type: 'string', description: 'Published post ID' })
  @OkResponse(null)
  @ErrorResponse({
    PUBLISHED_POST_DELETE_FAILED: CONTENT_ERRORS.PUBLISHED_POST_DELETE_FAILED,
    PUBLISHED_POST_NOT_FOUND: CONTENT_ERRORS.PUBLISHED_POST_NOT_FOUND,
    PUBLISHED_POST_NOT_OWNER: CONTENT_ERRORS.PUBLISHED_POST_NOT_OWNER,
  })
  async deletePublished(
    @Param('id') id: string,
    @AuthContextUser() user: User,
  ): Promise<void> {
    await this.publishedPostService.deletePublished(id, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List published posts' })
  @PaginatedResponse(PublishedPostDto)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(5000)
  async listPublished(
    @Query() query: ListPostsQueryDto,
  ): Promise<PagedResult<PublishedPostDto>> {
    const result = await this.publishedPostService.listPublished(query);

    return PagedResult.transform(result, (post) =>
      PublishedPostDto.fromDomain(post),
    );
  }

  @Post(':id/draft')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create a draft from a published post' })
  @CreatedResponse(DraftPostResponseDto)
  @ErrorResponse({
    PUBLISHED_POST_NOT_FOUND: CONTENT_ERRORS.PUBLISHED_POST_NOT_FOUND,
    PUBLISHED_POST_NOT_OWNER: CONTENT_ERRORS.PUBLISHED_POST_NOT_OWNER,
  })
  async createDraftFromPublished(
    @Param('id') id: string,
    @AuthContextUser() user: User,
  ): Promise<DraftPostResponseDto> {
    const draft = await this.publishedPostService.createDraftFromPublished(
      id,
      user.id,
    );
    return DraftPostResponseDto.fromDomain(draft);
  }
}
