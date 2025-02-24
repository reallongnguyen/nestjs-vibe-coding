import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard, AuthContext, AuthCtx } from 'src/common/auth';
import { CreatedResponse, ErrorResponse } from 'src/common/presentation/rest';
import { AppError } from 'src/common/models';
import { DraftPost } from '../../entities/draft-post.entity';
import { CreateDraftPostDto } from '../dtos/create-draft-post.dto';
import { DraftPostService } from '../../services/draft-post.service';
import { contentErrorMap } from '../../entities/content-error.map';

@ApiTags('Posts')
@Controller('posts/drafts')
@UseGuards(AuthGuard)
export class DraftPostController {
  constructor(private readonly draftPostService: DraftPostService) {}

  @Post()
  @ApiOperation({ summary: 'Create a draft post' })
  @CreatedResponse(DraftPost)
  @ErrorResponse('draft.create', contentErrorMap, { hasValidationErr: true })
  async createDraft(
    @Body() data: CreateDraftPostDto,
    @AuthContext() auth: AuthCtx,
  ): Promise<DraftPost> {
    if (!auth.getUser()) {
      throw new AppError('common.requiredUser');
    }

    return this.draftPostService.createDraft(
      auth.getUser().id,
      data.toData(auth.getUser().id),
    );
  }
}
