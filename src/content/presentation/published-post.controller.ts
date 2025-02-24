import {
  Controller,
  UseGuards,
  Param,
  UseFilters,
  Delete,
  Get,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthContextUser, AuthGuard, User, RolesGuard } from 'src/common/auth';
import { Collection } from 'src/common/models';
import {
  ErrorResponse,
  OkResponse,
  PaginatedResponse,
  RestExceptionFilter,
} from 'src/common/presentation/rest';
import { CacheTTL, CacheInterceptor } from '@nestjs/cache-manager';
import { contentErrorMap } from '../entities/content-error.map';
import { PublishedPostService } from '../services/published-post.service';
import { ListPostsQueryDto } from './dtos/list-posts.dto';
import { PublishedPostListItemDto } from './dtos/post-response.dto';

@ApiTags('Posts')
@Controller({
  path: 'posts/published',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(new RestExceptionFilter(contentErrorMap))
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
  @PaginatedResponse(PublishedPostListItemDto)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(5000)
  async listPublished(
    @Query() query: ListPostsQueryDto,
  ): Promise<Collection<PublishedPostListItemDto>> {
    const result = await this.publishedPostService.listPublished(query);

    return Collection.transform(result, (post) => ({
      id: post.id,
      title: post.title,
      subtitle: post.subtitle,
      content: post.content,
      cover: post.cover,
      slug: post.slug,
      excerpt: post.excerpt,
      topics: post.topics,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      viewCount: post.viewCount,
      likeCount: post.likeCount,
      author: {
        id: post.userAuthor?.id,
        name: [post.userAuthor?.firstName, post.userAuthor?.lastName]
          .filter(Boolean)
          .join(' '),
        avatar: post.userAuthor?.avatar,
      },
    }));
  }
}
