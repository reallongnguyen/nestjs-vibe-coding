import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import * as crypto from 'crypto';
import {
  AuthContextUser,
  AuthGuard,
  OptionalAuthGuard,
  RequireAnyRoles,
  Role,
  RolesGuard,
  User,
  OptionalAuthContext,
  AuthCtx,
} from 'src/common/auth';
import {
  ErrorResponse,
  OkResponse,
  RestExceptionFilter,
} from 'src/common/presentation/rest';
import { SocialEngagementService } from '../services/social-engagement.service';
import { socialErrorMap } from '../entities/social-error.map';
import { EngagementStatsDto } from './dtos/engagement-stats.dto';

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
    return this.socialEngagementService.getEngagementStats(id, type);
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
    await this.socialEngagementService.likeContent(type, id, user.id);
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
    await this.socialEngagementService.unlikeContent(type, id, user.id);
  }

  @Post('view/:type/:id')
  @UseGuards(OptionalAuthGuard)
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
    @Req() request: Request,
    @OptionalAuthContext() authCtx?: AuthCtx,
  ): Promise<void> {
    // Generate viewer hash from IP and user agent
    const ip = request.ip || request.socket.remoteAddress || 'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';

    // Get viewer ID if authenticated
    const viewerId = authCtx?.isUser() ? authCtx.getUser().id : undefined;

    const viewerHash = this.generateViewerHash(viewerId ?? ip, userAgent);

    await this.socialEngagementService.recordView(
      type,
      id,
      viewerHash,
      viewerId,
    );
  }

  /**
   * Generate a hash to identify a viewer based on IP and user agent
   * @param ip Client IP address
   * @param userAgent Browser user agent
   * @returns Hashed identifier
   */
  private generateViewerHash(identity: string, userAgent: string): string {
    const data = `${identity}:${userAgent}`;

    return crypto.createHash('sha256').update(data).digest('hex');
  }
}
