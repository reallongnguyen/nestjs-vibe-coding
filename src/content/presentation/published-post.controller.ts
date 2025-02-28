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
import { AuthContextUser, AuthGuard, User, RolesGuard } from 'src/common/auth';
import { Collection } from 'src/common/models';
import {
  CreatedResponse,
  ErrorResponse,
  OkResponse,
  PaginatedResponse,
  RestExceptionFilter,
} from 'src/common/presentation/rest';
import { CacheTTL, CacheInterceptor } from '@nestjs/cache-manager';
import { contentErrorMap } from '../entities/content-error.map';
import { PublishedPostService } from '../services/published-post.service';
import { ListPostsQueryDto } from './dtos/list-posts.dto';
import { DraftPostResponseDto } from './dtos/post-response.dto';
import { PublishedPostDto } from './dtos/published-post.dto';

@ApiTags('Posts')
@Controller({
  path: 'posts/published',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(new RestExceptionFilter(contentErrorMap))
@ErrorResponse('common', contentErrorMap)
export class PublishedPostController {
  constructor(private readonly publishedPostService: PublishedPostService) {}

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a published post' })
  @ApiParam({ name: 'id', type: 'string', description: 'Published post ID' })
  @OkResponse(null)
  @ErrorResponse('post.published.delete', contentErrorMap)
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
  ): Promise<Collection<PublishedPostDto>> {
    const result = await this.publishedPostService.listPublished(query);

    return Collection.transform(result, (post) =>
      PublishedPostDto.fromDomain(post),
    );
  }

  @Post(':id/draft')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create a draft from a published post' })
  @CreatedResponse(DraftPostResponseDto)
  @ErrorResponse('post.createDraftFromPublished', contentErrorMap)
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
