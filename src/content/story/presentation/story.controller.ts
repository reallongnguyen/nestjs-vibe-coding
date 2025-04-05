import {
  Body,
  Controller,
  Post,
  UseFilters,
  UseGuards,
  Inject,
  Logger,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthContextUser,
  AuthGuard,
  OkResponse,
  RequireAnyRoles,
  Role,
  RolesGuard,
  User,
} from 'src/common';
import { GlobalErrorFilter, ErrorResponse } from 'src/common/errors';
import { LOGGER_TOKEN } from 'src/common/logger/logger.token';
import { StoryService } from '../services/story.service';
import { CreateStoryDto, StoryResponseDto } from './dto';

@Controller({
  path: 'stories',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(GlobalErrorFilter)
@ApiTags('stories')
@ApiBearerAuth()
@ErrorResponse({})
export class StoryController {
  constructor(
    private readonly storyService: StoryService,
    @Inject(LOGGER_TOKEN) private readonly logger: Logger,
  ) {}

  @Post()
  @RequireAnyRoles(Role.USER)
  @ApiOperation({
    description: 'Create a new story',
    summary: 'Create a story',
  })
  @OkResponse(StoryResponseDto)
  async createStory(
    @Body() createStoryDto: CreateStoryDto,
    @AuthContextUser() user: User,
  ): Promise<StoryResponseDto> {
    const story = await this.storyService.createStory({
      content: createStoryDto.content,
      images: createStoryDto.images || [],
      userId: user.id,
      parentId: createStoryDto.parentId || null,
    });

    return {
      id: story.id,
      content: story.content,
      images: story.images,
      parentId: story.parentId,
      rootId: story.rootId,
      chainPosition: story.chainPosition,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
      author: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      },
    };
  }
}
