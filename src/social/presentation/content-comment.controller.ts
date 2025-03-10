import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseFilters,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
import {
  AuthContextUser,
  AuthGuard,
  RequireAnyRoles,
  Role,
  RolesGuard,
  User,
  CreatedResponse,
  ErrorResponse,
  OkResponse,
  PaginatedResponse,
  RestExceptionFilter,
  PagedResult,
  PageOptionsDto,
} from 'src/common';
import { ContentType } from '../entities/events/social.events';

import { CommentService } from '../services/comment.service';
import {
  CommentDto,
  CreateCommentDto,
  UpdateCommentDto,
} from './dtos/comment.dto';
import { commentErrorMap } from '../entities/comment-error.map';

@ApiTags('Content Comments')
@Controller({
  path: 'comments',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(new RestExceptionFilter(commentErrorMap))
@ErrorResponse('common', commentErrorMap)
export class ContentCommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post(':type/:id')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({ summary: 'Create comment for content' })
  @ApiParam({
    name: 'type',
    enum: [ContentType.POST, ContentType.EMOTION],
    description: 'Content type',
  })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @CreatedResponse(CommentDto)
  @ErrorResponse('comment.create', commentErrorMap, { hasValidationErr: true })
  async createComment(
    @Param('type') type: ContentType.POST | ContentType.EMOTION,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: CreateCommentDto,
    @AuthContextUser() user: User,
  ): Promise<CommentDto> {
    const comment = await this.commentService.create(
      type,
      id,
      user.id,
      data.content,
      data.parentId,
    );

    return CommentDto.fromDomain(comment);
  }

  @Get(':type/:id')
  @ApiOperation({ summary: 'Get comments for content' })
  @ApiParam({
    name: 'type',
    enum: ['POST', 'EMOTION'],
    description: 'Content type',
  })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @PaginatedResponse(CommentDto)
  @ErrorResponse('comment.list', commentErrorMap)
  async getCommentsByContent(
    @Param('type') type: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() pageOptions: PageOptionsDto,
    @AuthContextUser() user: User,
  ): Promise<PagedResult<CommentDto>> {
    const comments = await this.commentService.getCommentsByContent(
      type,
      id,
      pageOptions,
      user.id,
    );

    return PagedResult.transform(comments, CommentDto.fromDomain);
  }

  @Patch(':id')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({ summary: 'Update comment' })
  @OkResponse(CommentDto)
  @ErrorResponse('comment.update', commentErrorMap, { hasValidationErr: true })
  async updateComment(
    @Param('id') id: string,
    @Body() data: UpdateCommentDto,
    @AuthContextUser() user: User,
  ): Promise<CommentDto> {
    const comment = await this.commentService.update(id, data, user.id);
    return CommentDto.fromDomain(comment);
  }

  @Delete(':id')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({ summary: 'Delete comment' })
  @OkResponse(null)
  @ErrorResponse('comment.delete', commentErrorMap)
  async deleteComment(
    @Param('id') id: string,
    @AuthContextUser() user: User,
  ): Promise<void> {
    await this.commentService.delete(id, user.id);
  }
}
