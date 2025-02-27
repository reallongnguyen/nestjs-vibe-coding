import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
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
import {
  CreatedResponse,
  ErrorResponse,
  PaginatedResponse,
} from 'src/common/presentation/rest';
import { Collection } from 'src/common/models';
import { PaginationQueryDto } from 'src/common/presentation/dtos/pagination-query.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { EmotionCommentableService } from '../services/emotion-commentable.service';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { CommentDto } from './dtos/comment.dto';
import { socialErrorMap } from '../entities/social-error.map';
import { EmotionPrivacyService } from '../services/emotion-privacy.service';

@ApiTags('Emotion Social')
@Controller({
  path: 'emotions',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
export class EmotionSocialController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly privacyService: EmotionPrivacyService,
  ) {}

  @Post(':emotionId/comments')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({ summary: 'Add a comment to an emotion' })
  @CreatedResponse(CommentDto)
  @ErrorResponse('emotion.comment', socialErrorMap)
  async addComment(
    @Param('emotionId') emotionId: string,
    @Body() dto: CreateCommentDto,
    @AuthContextUser() user: User,
  ): Promise<CommentDto> {
    const commentableService = new EmotionCommentableService(
      this.prisma,
      this.privacyService,
      emotionId,
    );

    const comment = await commentableService.comment(
      user.id,
      dto.content,
      dto.parentId,
    );

    return CommentDto.fromDomain(comment);
  }

  @Get(':emotionId/comments')
  @ApiOperation({ summary: 'Get comments for an emotion' })
  @PaginatedResponse(CommentDto)
  @ErrorResponse('emotion.getComments', socialErrorMap)
  async getComments(
    @Param('emotionId') emotionId: string,
    @Query() query: PaginationQueryDto,
    @AuthContextUser() user: User,
  ): Promise<Collection<CommentDto>> {
    const commentableService = new EmotionCommentableService(
      this.prisma,
      this.privacyService,
      emotionId,
    );

    const comments = await commentableService.getComments(query, user.id);

    return Collection.transform(comments, CommentDto.fromDomain);
  }

  @Get('comments/:commentId/replies')
  @ApiOperation({ summary: 'Get replies to a comment' })
  @PaginatedResponse(CommentDto)
  @ErrorResponse('emotion.getReplies', socialErrorMap)
  async getReplies(
    @Param('commentId') commentId: string,
    @Query() query: PaginationQueryDto,
    @AuthContextUser() user: User,
  ): Promise<Collection<CommentDto>> {
    const commentableService = new EmotionCommentableService(
      this.prisma,
      this.privacyService,
      commentId,
    );

    const replies = await commentableService.getReplies(
      commentId,
      query,
      user?.id,
    );

    return Collection.transform(replies, CommentDto.fromDomain);
  }
}
