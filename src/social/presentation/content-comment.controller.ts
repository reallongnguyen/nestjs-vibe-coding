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
import {
  ApiOperation,
  ApiTags,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  AuthContextUser,
  AuthGuard,
  RequireAnyRoles,
  Role,
  RolesGuard,
  User,
  CreatedResponse,
  OkResponse,
  PaginatedResponse,
  PagedResult,
  PageOptionsDto,
} from 'src/common';
// import { COMMON_ERRORS, ErrorResponse } from 'src/common/errors'; // Removed ErrorResponse and COMMON_ERRORS
import { GlobalErrorFilter } from 'src/common/errors'; // Keep GlobalErrorFilter
import { ApiAppErrors } from 'src/common/swagger/api-app-errors.decorator';
import { CommonErrorCode } from 'src/common/errors/common.error-codes';
import { SocialErrorCode } from '../entities/errors/social.error-codes';
import { ContentType } from '../entities/events/social.events';

import { CommentService } from '../services/comment.service';
import {
  CommentDto,
  CreateCommentDto,
  UpdateCommentDto,
} from './dtos/comment.dto';
// import { SOCIAL_ERRORS, SocialErrorCode } from '../entities/errors'; // Removed SOCIAL_ERRORS, kept SocialErrorCode from above

@ApiTags('Content Comments')
@ApiBearerAuth()
@Controller({
  path: 'comments',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(GlobalErrorFilter)
// @ErrorResponse(COMMON_ERRORS) // Removed
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
  // @ErrorResponse({ // Removed
  //   [SocialErrorCode.COMMENT_NOT_FOUND]:
  //     SOCIAL_ERRORS[SocialErrorCode.COMMENT_NOT_FOUND],
  // })
  @ApiAppErrors([
    CommonErrorCode.AUTH_INVALID_TOKEN,
    CommonErrorCode.AUTH_NO_PRIVILEGE,
    CommonErrorCode.VALIDATION_FAILED,
    SocialErrorCode.ENGAGEABLE_NOT_FOUND, // If target post/emotion not found
    SocialErrorCode.COMMENT_NOT_FOUND,    // If parentId is provided and parent comment not found
    SocialErrorCode.COMMENT_CREATE_FAILED,
    CommonErrorCode.FORBIDDEN, // If emotion privacy prevents commenting
  ])
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
  // @ErrorResponse({}) // Removed
  @ApiAppErrors([
    CommonErrorCode.AUTH_INVALID_TOKEN, // Assuming user context might be used for private content in future
    // CommonErrorCode.AUTH_NO_PRIVILEGE, // Not explicitly role-protected beyond AuthGuard
    SocialErrorCode.ENGAGEABLE_NOT_FOUND, // If the content itself is not found
  ])
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
  // @ErrorResponse({ // Removed
  //   [SocialErrorCode.COMMENT_NOT_FOUND]:
  //     SOCIAL_ERRORS[SocialErrorCode.COMMENT_NOT_FOUND],
  //   [SocialErrorCode.COMMENT_NOT_OWNER]:
  //     SOCIAL_ERRORS[SocialErrorCode.COMMENT_NOT_OWNER],
  // })
  @ApiAppErrors([
    CommonErrorCode.AUTH_INVALID_TOKEN,
    CommonErrorCode.AUTH_NO_PRIVILEGE,
    CommonErrorCode.VALIDATION_FAILED,
    SocialErrorCode.COMMENT_NOT_FOUND,
    SocialErrorCode.COMMENT_NOT_OWNER,
    SocialErrorCode.COMMENT_UPDATE_FAILED,
  ])
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
  // @ErrorResponse({ // Removed
  //   [SocialErrorCode.COMMENT_NOT_FOUND]:
  //     SOCIAL_ERRORS[SocialErrorCode.COMMENT_NOT_FOUND],
  //   [SocialErrorCode.COMMENT_NOT_OWNER]:
  //     SOCIAL_ERRORS[SocialErrorCode.COMMENT_NOT_OWNER],
  // })
  @ApiAppErrors([
    CommonErrorCode.AUTH_INVALID_TOKEN,
    CommonErrorCode.AUTH_NO_PRIVILEGE,
    SocialErrorCode.COMMENT_NOT_FOUND,
    SocialErrorCode.COMMENT_NOT_OWNER,
    SocialErrorCode.COMMENT_DELETE_FAILED,
  ])
  async deleteComment(
    @Param('id') id: string,
    @AuthContextUser() user: User,
  ): Promise<void> {
    await this.commentService.delete(id, user.id);
  }
}
