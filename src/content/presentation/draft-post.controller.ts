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
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  AuthContextUser,
  AuthGuard,
  RequireAnyRoles,
  User,
  Role,
  RolesGuard,
  CreatedResponse,
  ErrorResponse,
  OkResponse,
  PaginatedResponse,
  RestExceptionFilter,
  PagedResult,
} from 'src/common';
import { CreateDraftPostDto } from './dtos/create-draft-post.dto';
import { DraftPostService } from '../services/draft-post.service';
import { contentErrorMap } from '../entities/content-error.map';
import { UpdateDraftPostDto } from './dtos/update-draft-post.dto';
import { PublishDraftDto } from './dtos/publish-draft.dto';
import { ListDraftPostsQueryDto } from './dtos/list-posts.dto';
import {
  DraftPostListItemDto,
  DraftPostResponseDto,
  PublishedPostResponseDto,
} from './dtos/post-response.dto';
import { ApplyDraftDto } from './dtos/apply-draft.dto';

@ApiTags('Posts')
@Controller({
  path: 'posts/drafts',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(new RestExceptionFilter(contentErrorMap))
@ErrorResponse('common', contentErrorMap)
export class DraftPostController {
  constructor(private readonly draftPostService: DraftPostService) {}

  @Post()
  @RequireAnyRoles(Role.USER, Role.CONTENT_CREATOR)
  @ApiOperation({ summary: 'Create a draft post' })
  @CreatedResponse(DraftPostResponseDto)
  @ErrorResponse('draft.create', contentErrorMap, { hasValidationErr: true })
  async createDraft(
    @AuthContextUser() user: User,
    @Body() dto: CreateDraftPostDto,
  ): Promise<DraftPostResponseDto> {
    return this.draftPostService.createDraft(user.id, dto.toData(user.id));
  }

  @Patch(':id')
  @RequireAnyRoles(Role.USER, Role.CONTENT_CREATOR)
  @ApiOperation({ summary: 'Update a draft post' })
  @OkResponse(DraftPostResponseDto)
  @ErrorResponse('draft.update', contentErrorMap, { hasValidationErr: true })
  async updateDraft(
    @AuthContextUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateDraftPostDto,
  ): Promise<DraftPostResponseDto> {
    return this.draftPostService.updateDraft(user.id, id, dto.toData());
  }

  @Post(':id/publish')
  @RequireAnyRoles(Role.USER, Role.CONTENT_CREATOR)
  @ApiOperation({ summary: 'Publish a draft post' })
  @OkResponse(PublishedPostResponseDto)
  @ErrorResponse('draft.publish', contentErrorMap, { hasValidationErr: true })
  async publishDraft(
    @AuthContextUser() user: User,
    @Param('id') id: string,
    @Body() dto: PublishDraftDto,
  ): Promise<PublishedPostResponseDto> {
    const post = await this.draftPostService.publishDraft(
      user.id,
      id,
      dto.toData(),
    );

    return PublishedPostResponseDto.fromDomain(post);
  }

  @Delete(':id')
  @RequireAnyRoles(Role.USER, Role.CONTENT_CREATOR)
  @ApiOperation({ summary: 'Delete a draft post' })
  @ApiParam({ name: 'id', type: 'string', description: 'Draft post ID' })
  @OkResponse(null)
  @ErrorResponse('post.draft.delete', contentErrorMap)
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
  @OkResponse(PublishedPostResponseDto)
  @ErrorResponse('post.applyDraft', contentErrorMap)
  async applyDraft(
    @Param('id') id: string,
    @Body() dto: ApplyDraftDto,
    @AuthContextUser() user: User,
  ): Promise<PublishedPostResponseDto> {
    return this.draftPostService.applyDraft(user.id, id, dto);
  }
}
