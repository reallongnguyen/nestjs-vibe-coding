import {
  Controller,
  Post,
  Body,
  UseGuards,
  Patch,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthContextUser, AuthGuard, User } from 'src/common/auth';
import { CreatedResponse, ErrorResponse } from 'src/common/presentation/rest';
import { DraftPost } from '../entities/draft-post.entity';
import { CreateDraftPostDto } from './dtos/create-draft-post.dto';
import { DraftPostService } from '../services/draft-post.service';
import { contentErrorMap } from '../entities/content-error.map';
import { UpdateDraftPostDto } from './dtos/update-draft-post.dto';

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
    @AuthContextUser() user: User,
    @Body() dto: CreateDraftPostDto,
  ): Promise<DraftPost> {
    return this.draftPostService.createDraft(user.id, dto.toData(user.id));
  }

  @Patch(':id')
  async updateDraft(
    @AuthContextUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateDraftPostDto,
  ): Promise<DraftPost> {
    return this.draftPostService.updateDraft(user.id, id, dto.toData());
  }
}
