import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  AuthContextUser,
  AuthGuard,
  RequireAnyRoles,
  Role,
  RolesGuard,
  User,
} from 'src/common/auth';
import {
  ErrorResponse,
  OkResponse,
  RestExceptionFilter,
} from 'src/common/presentation/rest';
import { SocialEngagementService } from '../services/social-engagement.service';
import { socialErrorMap } from '../entities/social-error.map';
import { EngagementStatsDto } from './dtos/engagement-stats.dto';
import { RecordViewDto } from './dtos/record-view.dto';

@ApiTags('Social Engagement')
@Controller({
  path: 'social',
  version: '1',
})
@UseFilters(new RestExceptionFilter(socialErrorMap))
@ErrorResponse('common', socialErrorMap)
export class SocialEngagementController {
  constructor(
    private readonly socialEngagementService: SocialEngagementService,
  ) {}

  @Get('engagement/:type/:id')
  @ApiOperation({ summary: 'Get engagement statistics for content' })
  @ApiParam({
    name: 'type',
    enum: ['POST', 'EMOTION'],
    description: 'Content type',
  })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @OkResponse(EngagementStatsDto)
  @ErrorResponse('social.engagement.get', socialErrorMap)
  async getEngagementStats(
    @Param('type') type: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EngagementStatsDto> {
    const stats = await this.socialEngagementService.getEngagementStats(
      id,
      type,
    );
    return stats;
  }

  @Post('like/:type/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireAnyRoles(Role.USER)
  @ApiOperation({ summary: 'Like content' })
  @ApiParam({
    name: 'type',
    enum: ['POST', 'EMOTION'],
    description: 'Content type',
  })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @OkResponse(null)
  @ErrorResponse('social.like', socialErrorMap)
  async likeContent(
    @Param('type') type: string,
    @Param('id', ParseUUIDPipe) id: string,
    @AuthContextUser() user: User,
  ): Promise<void> {
    if (type === 'POST') {
      const likeable = this.socialEngagementService.getLikeableForPost(id);
      await likeable.like(user.id);
    } else if (type === 'EMOTION') {
      const likeable = this.socialEngagementService.getLikeableForEmotion(id);
      await likeable.like(user.id);
    } else {
      throw new Error(`Unsupported content type: ${type}`);
    }
  }

  @Post('unlike/:type/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireAnyRoles(Role.USER)
  @ApiOperation({ summary: 'Unlike content' })
  @ApiParam({
    name: 'type',
    enum: ['POST', 'EMOTION'],
    description: 'Content type',
  })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @OkResponse(null)
  @ErrorResponse('social.unlike', socialErrorMap)
  async unlikeContent(
    @Param('type') type: string,
    @Param('id', ParseUUIDPipe) id: string,
    @AuthContextUser() user: User,
  ): Promise<void> {
    if (type === 'POST') {
      const likeable = this.socialEngagementService.getLikeableForPost(id);
      await likeable.unlike(user.id);
    } else if (type === 'EMOTION') {
      const likeable = this.socialEngagementService.getLikeableForEmotion(id);
      await likeable.unlike(user.id);
    } else {
      throw new Error(`Unsupported content type: ${type}`);
    }
  }

  @Post('view/:type/:id')
  @ApiOperation({ summary: 'Record content view' })
  @ApiParam({
    name: 'type',
    enum: ['POST', 'EMOTION'],
    description: 'Content type',
  })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @OkResponse(null)
  @ErrorResponse('social.view', socialErrorMap)
  async recordView(
    @Param('type') type: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: RecordViewDto,
  ): Promise<void> {
    if (type === 'POST') {
      const viewable = this.socialEngagementService.getViewableForPost(id);
      await viewable.view(query.viewerHash, query.viewerId);
    } else if (type === 'EMOTION') {
      const viewable = this.socialEngagementService.getViewableForEmotion(id);
      await viewable.view(query.viewerHash, query.viewerId);
    } else {
      throw new Error(`Unsupported content type: ${type}`);
    }
  }
}
