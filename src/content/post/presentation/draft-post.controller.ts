import {
  Controller,
  Post,
  Body,
  UseGuards,
  Patch,
  Param,
  UseFilters,
  Delete,
  Get,
  Query,
  Inject,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuthContextUser,
  AuthGuard,
  RequireAnyRoles,
  User,
  Role,
  RolesGuard,
  CreatedResponse,
  OkResponse,
  PaginatedResponse,
  PagedResult,
} from 'src/common';
import {
  GlobalErrorFilter,
  ErrorResponse,
  COMMON_ERRORS,
} from 'src/common/errors';
import { DraftPostService } from '../services/draft-post.service';
import { CONTENT_ERRORS } from '../entities/errors';
import {
  ApplyDraftDto,
  CreateDraftPostDto,
  DraftPostResponseDto,
  PublishDraftDto,
  UpdateDraftPostDto,
} from './dtos/draft-post.dto';
import { PublishedPostDto } from './dtos/published-post.dto';
import { ListDraftPostsQueryDto } from './dtos/list-posts.dto';
import { DraftPostListItemDto } from './dtos/post-list.dto';
import { UserAuthor } from '../entities/published-post.entity';
import { IPublishedPostRepository } from '../services/interfaces/published-post.repository.interface';

@Controller({
  path: 'drafts',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(GlobalErrorFilter)
@ApiTags('draft-posts')
@ApiBearerAuth()
@ErrorResponse({
  ...COMMON_ERRORS,
})
export class DraftPostController {
  constructor(
    private readonly draftPostService: DraftPostService,
    @Inject('IPublishedPostRepository')
    private readonly publishedPostRepository: IPublishedPostRepository,
  ) {}

  @Post()
  @RequireAnyRoles(Role.USER, Role.CONTENT_CREATOR)
  @ApiOperation({ summary: 'Create a draft post' })
  @CreatedResponse(DraftPostResponseDto)
  @ErrorResponse({
    DRAFT_CREATE_FAILED: CONTENT_ERRORS.DRAFT_CREATE_FAILED,
    TOPIC_NOT_FOUND: CONTENT_ERRORS.TOPIC_NOT_FOUND,
  })
  async createDraft(
    @AuthContextUser() user: User,
    @Body() dto: CreateDraftPostDto,
  ): Promise<DraftPostResponseDto> {
    return this.draftPostService.createDraft(user.id, dto.toData(user.id));
  }

  @Patch(':id')
  @RequireAnyRoles(Role.USER, Role.CONTENT_CREATOR)
  @ApiParam({ name: 'id', type: 'string', description: 'Draft post ID' })
  @ApiOperation({ summary: 'Update a draft post' })
  @OkResponse(DraftPostResponseDto)
  @ErrorResponse({
    DRAFT_UPDATE_FAILED: CONTENT_ERRORS.DRAFT_UPDATE_FAILED,
    DRAFT_NOT_FOUND: CONTENT_ERRORS.DRAFT_NOT_FOUND,
    DRAFT_NOT_OWNER: CONTENT_ERRORS.DRAFT_NOT_OWNER,
    TOPIC_NOT_FOUND: CONTENT_ERRORS.TOPIC_NOT_FOUND,
  })
  async updateDraft(
    @AuthContextUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateDraftPostDto,
  ): Promise<DraftPostResponseDto> {
    return this.draftPostService.updateDraft(user.id, id, dto.toData());
  }

  @Post(':id/publish')
  @RequireAnyRoles(Role.USER, Role.CONTENT_CREATOR)
  @ApiParam({ name: 'id', type: 'string', description: 'Draft post ID' })
  @ApiOperation({ summary: 'Publish a draft post' })
  @OkResponse(PublishedPostDto)
  @ErrorResponse({
    DRAFT_PUBLISH_FAILED: CONTENT_ERRORS.DRAFT_PUBLISH_FAILED,
    DRAFT_NOT_FOUND: CONTENT_ERRORS.DRAFT_NOT_FOUND,
    DRAFT_NOT_OWNER: CONTENT_ERRORS.DRAFT_NOT_OWNER,
    SLUG_EXISTS: CONTENT_ERRORS.SLUG_EXISTS,
  })
  async publishDraft(
    @AuthContextUser() user: User,
    @Param('id') id: string,
    @Body() dto: PublishDraftDto,
  ): Promise<PublishedPostDto> {
    const post = await this.draftPostService.publishDraft(
      user.id,
      id,
      dto.toData(),
    );

    // Create the userAuthor object from the user data
    const userAuthor: UserAuthor = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar || '',
    };

    // Create a PublishedPostWithAuthor object
    const postWithAuthor = {
      ...post,
      userAuthor,
      topics: post.topics || [],
    };

    return PublishedPostDto.fromDomain(postWithAuthor);
  }

  @Delete(':id')
  @RequireAnyRoles(Role.USER, Role.CONTENT_CREATOR)
  @ApiOperation({ summary: 'Delete a draft post' })
  @ApiParam({ name: 'id', type: 'string', description: 'Draft post ID' })
  @OkResponse(null)
  @ErrorResponse({
    DRAFT_NOT_FOUND: CONTENT_ERRORS.DRAFT_NOT_FOUND,
    DRAFT_NOT_OWNER: CONTENT_ERRORS.DRAFT_NOT_OWNER,
  })
  async deleteDraft(
    @Param('id') id: string,
    @AuthContextUser() user: User,
  ): Promise<void> {
    await this.draftPostService.deleteDraft(id, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List user draft posts' })
  @PaginatedResponse(DraftPostListItemDto)
  async listDrafts(
    @Query() query: ListDraftPostsQueryDto,
    @AuthContextUser() user: User,
  ): Promise<PagedResult<DraftPostListItemDto>> {
    const result = await this.draftPostService.listDrafts(user.id, query);

    return PagedResult.transform(result, (draft) => ({
      id: draft.id,
      title: draft.title,
      subtitle: draft.subtitle,
      content: draft.content,
      cover: draft.cover,
      topics: draft.topics,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
      published: !!draft.publishedId,
      publishedId: draft.publishedId,
    }));
  }

  @Post(':id/apply')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Apply draft changes to published post' })
  @OkResponse(PublishedPostDto)
  @ErrorResponse({
    DRAFT_PUBLISH_FAILED: CONTENT_ERRORS.DRAFT_PUBLISH_FAILED,
    DRAFT_NOT_FOUND: CONTENT_ERRORS.DRAFT_NOT_FOUND,
    DRAFT_NOT_OWNER: CONTENT_ERRORS.DRAFT_NOT_OWNER,
    DRAFT_NOT_LINKED_TO_PUBLISHED: CONTENT_ERRORS.DRAFT_NOT_LINKED_TO_PUBLISHED,
  })
  async applyDraft(
    @Param('id') id: string,
    @Body() dto: ApplyDraftDto,
    @AuthContextUser() user: User,
  ): Promise<PublishedPostDto> {
    const post = await this.draftPostService.applyDraft(user.id, id, dto);

    // Create the userAuthor object from the user data
    const userAuthor: UserAuthor = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar || '',
    };

    // Create a PublishedPostWithAuthor object
    const postWithAuthor = {
      ...post,
      userAuthor,
      topics: post.topics || [],
    };

    return PublishedPostDto.fromDomain(postWithAuthor);
  }
}
