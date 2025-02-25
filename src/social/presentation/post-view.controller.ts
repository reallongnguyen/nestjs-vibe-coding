import {
  Controller,
  Post,
  Param,
  UseFilters,
  UseGuards,
  Ip,
  Headers,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard, RolesGuard, AuthContextUser, User } from 'src/common/auth';
import {
  CreatedResponse,
  ErrorResponse,
  RestExceptionFilter,
} from 'src/common/presentation/rest';

import { PostViewService } from '../services/post-view.service';
import { socialErrorMap } from '../entities/social-error.map';

@Controller({
  path: 'posts',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(new RestExceptionFilter(socialErrorMap))
@ApiTags('Posts')
export class PostViewController {
  constructor(private readonly postViewService: PostViewService) {}

  @Post(':id/view')
  @ApiOperation({ summary: 'Record a view on a post' })
  @CreatedResponse(null)
  @ErrorResponse('post.view', socialErrorMap)
  async recordView(
    @Param('id') id: string,
    @AuthContextUser() user: User,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<void> {
    await this.postViewService.recordView(id, user?.id, ip, userAgent);
  }
}
