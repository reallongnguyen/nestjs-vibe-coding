import {
  Body,
  Controller,
  Post,
  UseFilters,
  UseGuards,
  Inject,
  Logger,
  Param,
  Get,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
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
import {
  ContinueStoryDto,
  CreateStoryDto,
  ForkStoryDto,
  StoryResponseDto,
  ChainResponseDto,
  ChainVisualizationDto,
} from './dto';
import { ChainVisualizationService } from '../services/chain-visualization.service';

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
    private readonly chainVisualizationService: ChainVisualizationService,
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

  @Post(':parentId/continue')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({
    description: 'Continue an existing story',
    summary: 'Continue a story',
  })
  @ApiParam({
    name: 'parentId',
    description: 'ID of the parent story to continue',
    type: String,
  })
  @OkResponse(StoryResponseDto)
  async continueStory(
    @Param('parentId') parentId: string,
    @Body() continueStoryDto: ContinueStoryDto,
    @AuthContextUser() user: User,
  ): Promise<StoryResponseDto> {
    const story = await this.storyService.continueStory({
      content: continueStoryDto.content,
      images: continueStoryDto.images || [],
      userId: user.id,
      parentId,
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

  @Post(':storyId/fork')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({
    description: 'Fork a story to create a new branch',
    summary: 'Fork a story',
  })
  @ApiParam({
    name: 'storyId',
    description: 'ID of the story to fork',
    type: String,
  })
  @OkResponse(StoryResponseDto)
  async forkStory(
    @Param('storyId') storyId: string,
    @Body() forkStoryDto: ForkStoryDto,
    @AuthContextUser() user: User,
  ): Promise<StoryResponseDto> {
    const story = await this.storyService.forkStory({
      content: forkStoryDto.content,
      images: forkStoryDto.images || [],
      userId: user.id,
      sourceStoryId: storyId,
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

  @Get(':rootId/chain')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({
    description: 'Get a complete story chain by its root ID',
    summary: 'Get story chain',
  })
  @ApiParam({
    name: 'rootId',
    description: 'ID of the root story of the chain',
    type: String,
  })
  @OkResponse(ChainResponseDto)
  async getStoryChain(
    @Param('rootId') rootId: string,
    @AuthContextUser() user: User,
  ): Promise<ChainResponseDto> {
    const chain = await this.storyService.getStoryChain(rootId);

    // Transform the chain data to include author information
    const transformNode = (node: any): any => ({
      id: node.id,
      content: node.content,
      images: node.images,
      parentId: node.parentId,
      rootId: node.rootId,
      chainPosition: node.chainPosition,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
      author: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      },
      children: node.children.map(transformNode),
    });

    return {
      root: transformNode(chain.root),
      totalStories: chain.totalStories,
      maxDepth: chain.maxDepth,
    };
  }

  @Get(':rootId/visualization')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({
    description: 'Get visualization data for a story chain',
    summary: 'Get story chain visualization',
  })
  @ApiParam({
    name: 'rootId',
    description: 'ID of the root story of the chain',
    type: String,
  })
  @OkResponse(ChainVisualizationDto)
  async getStoryChainVisualization(
    @Param('rootId') rootId: string,
  ): Promise<ChainVisualizationDto> {
    return this.chainVisualizationService.visualizeChain(rootId);
  }
}
