import {
  Controller,
  UseGuards,
  Param,
  UseFilters,
  Delete,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthContextUser, AuthGuard, User, RolesGuard } from 'src/common/auth';
import {
  ErrorResponse,
  OkResponse,
  RestExceptionFilter,
} from 'src/common/presentation/rest';
import { contentErrorMap } from '../entities/content-error.map';
import { PublishedPostService } from '../services/published-post.service';

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
}
