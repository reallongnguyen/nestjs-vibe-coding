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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthContextUser,
  AuthGuard,
  RequireAnyRoles,
  Role,
  RolesGuard,
  User,
} from 'src/common/auth';
import { Collection } from 'src/common/models';
import { PaginationQueryDto } from 'src/common/presentation/dtos/pagination-query.dto';
import {
  CreatedResponse,
  ErrorResponse,
  OkResponse,
  PaginatedResponse,
  RestExceptionFilter,
} from 'src/common/presentation/rest';
import { CommentService } from '../services/comment.service';
import { CommentLikeService } from '../services/comment-like.service';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { UpdateCommentDto } from './dtos/update-comment.dto';
import { CommentDto } from './dtos/comment.dto';
import { commentErrorMap } from '../entities/comment-error.map';

@ApiTags('Comments')
@Controller({
  path: 'comments',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(new RestExceptionFilter(commentErrorMap))
@ErrorResponse('common', commentErrorMap)
export class CommentController {
  constructor(
    private readonly commentService: CommentService,
    private readonly commentLikeService: CommentLikeService,
  ) {}

  @Post()
  @RequireAnyRoles(Role.USER)
  @ApiOperation({ summary: 'Create comment' })
  @CreatedResponse(CommentDto)
  @ErrorResponse('comment.create', commentErrorMap, { hasValidationErr: true })
  async createComment(
    @Body() data: CreateCommentDto,
    @AuthContextUser() user: User,
  ): Promise<CommentDto> {
    const comment = await this.commentService.create(data, user.id);
    return CommentDto.fromDomain(comment);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get comment by id' })
  @OkResponse(CommentDto)
  async getComment(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CommentDto> {
    const comment = await this.commentService.findById(id);
    return CommentDto.fromDomain(comment);
  }

  @Get('post/:postId')
  @ApiOperation({ summary: 'Get comments by post' })
  @PaginatedResponse(CommentDto)
  @ErrorResponse('comment.list', commentErrorMap)
  async getCommentsByPost(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query() pagination: PaginationQueryDto,
  ): Promise<Collection<CommentDto>> {
    const comments = await this.commentService.findByPost(postId, pagination);
    return Collection.transform(comments, CommentDto.fromDomain);
  }

  @Patch(':id')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({ summary: 'Update comment' })
  @OkResponse(CommentDto)
  @ErrorResponse('comment.update', commentErrorMap, { hasValidationErr: true })
  async updateComment(
    @Param('id', ParseUUIDPipe) id: string,
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
    @Param('id', ParseUUIDPipe) id: string,
    @AuthContextUser() user: User,
  ): Promise<void> {
    await this.commentService.delete(id, user.id);
  }

  @Post(':id/like')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({ summary: 'Like comment' })
  @OkResponse(null)
  @ErrorResponse('comment.like', commentErrorMap)
  async likeComment(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthContextUser() user: User,
  ): Promise<void> {
    await this.commentLikeService.like(id, user.id);
  }

  @Delete(':id/like')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({ summary: 'Unlike comment' })
  @OkResponse(null)
  @ErrorResponse('comment.unlike', commentErrorMap)
  async unlikeComment(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthContextUser() user: User,
  ): Promise<void> {
    await this.commentLikeService.unlike(id, user.id);
  }
}
