import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  UseFilters,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthGuard,
  RolesGuard,
  RequireAnyRoles,
  Role,
  AuthContextUser,
  User,
} from 'src/common/auth';
import {
  OkResponse,
  ErrorResponse,
  RestExceptionFilter,
} from 'src/common/presentation/rest';

import { PostLikeService } from '../services/post-like.service';
import { PostLikeResponseDto } from './dtos/post-like.dto';
import { socialErrorMap } from '../entities/social-error.map';

@Controller({
  path: 'posts',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(new RestExceptionFilter(socialErrorMap))
@ApiTags('Posts')
export class PostLikeController {
  constructor(private readonly postLikeService: PostLikeService) {}

  @Post(':id/like')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({ summary: 'Toggle like on a post' })
  @OkResponse(PostLikeResponseDto)
  @ErrorResponse('post.like', socialErrorMap)
  async toggleLike(
    @Param('id') id: string,
    @AuthContextUser() user: User,
  ): Promise<PostLikeResponseDto> {
    return this.postLikeService.toggleLike(id, user.id);
  }

  @Get(':id/like')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({ summary: 'Get like status of a post' })
  @OkResponse(PostLikeResponseDto)
  @ErrorResponse('post.likeStatus', socialErrorMap)
  async getLikeStatus(
    @Param('id') id: string,
    @AuthContextUser() user: User,
  ): Promise<PostLikeResponseDto> {
    return this.postLikeService.getLikeStatus(id, user.id);
  }
}
