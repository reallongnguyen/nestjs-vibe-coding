import {
  Controller,
  Post,
  Body,
  UseGuards,
  Patch,
  Param,
  UseFilters,
  Delete,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  AuthContextUser,
  AuthGuard,
  RequireAnyRoles,
  User,
  Role,
  RolesGuard,
} from 'src/common/auth';
import {
  CreatedResponse,
  ErrorResponse,
  OkResponse,
  RestExceptionFilter,
} from 'src/common/presentation/rest';
import { DraftPost } from '../entities/draft-post.entity';
import { CreateDraftPostDto } from './dtos/create-draft-post.dto';
import { DraftPostService } from '../services/draft-post.service';
import { contentErrorMap } from '../entities/content-error.map';
import { UpdateDraftPostDto } from './dtos/update-draft-post.dto';
import { PublishDraftDto } from './dtos/publish-draft.dto';
import { PublishedPost } from '../entities/published-post.entity';

@ApiTags('Posts')
@Controller({
  path: 'posts/drafts',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(new RestExceptionFilter(contentErrorMap))
export class DraftPostController {
  constructor(private readonly draftPostService: DraftPostService) {}

  @Post()
  @RequireAnyRoles(Role.USER, Role.CONTENT_CREATOR)
  @ApiOperation({ summary: 'Create a draft post' })
  @CreatedResponse(DraftPost)
  @ErrorResponse('draft.create', contentErrorMap, { hasValidationErr: true })
  async createDraft(
    @AuthContextUser() user: User,
    @Body() dto: CreateDraftPostDto,
  ): Promise<DraftPost> {
    return this.draftPostService.createDraft(user.id, dto.toData(user.id));
  }

  @Patch(':id')
  @RequireAnyRoles(Role.USER, Role.CONTENT_CREATOR)
  @ApiOperation({ summary: 'Update a draft post' })
  @OkResponse(DraftPost)
  @ErrorResponse('draft.update', contentErrorMap, { hasValidationErr: true })
  async updateDraft(
    @AuthContextUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateDraftPostDto,
  ): Promise<DraftPost> {
    return this.draftPostService.updateDraft(user.id, id, dto.toData());
  }

  @Post(':id/publish')
  @RequireAnyRoles(Role.USER, Role.CONTENT_CREATOR)
  @ApiOperation({ summary: 'Publish a draft post' })
  @OkResponse(PublishedPost)
  @ErrorResponse('draft.publish', contentErrorMap, { hasValidationErr: true })
  async publishDraft(
    @AuthContextUser() user: User,
    @Param('id') id: string,
    @Body() dto: PublishDraftDto,
  ): Promise<PublishedPost> {
    return this.draftPostService.publishDraft(user.id, id, dto.toData());
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
}
