import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
  UseFilters,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import {
  AuthGuard,
  AuthContextUser,
  RequireAnyRoles,
  Role,
  RolesGuard,
  CreatedResponse,
  OkResponse,
  PaginatedResponse,
  User,
} from 'src/common';
import {
  GlobalErrorFilter,
  ErrorResponse,
  COMMON_ERRORS,
} from 'src/common/errors';
import { PageOptionsDto } from 'src/common/presentation/dtos/page-options.dto';
import { IInvitationService } from '../services/interfaces/invitation-service.interface';
import { CreateInvitationDto } from './dtos/create-invitation.dto';
import { VerifyInvitationDto } from './dtos/verify-invitation.dto';
import { AcceptInvitationDto } from './dtos/accept-invitation.dto';
import { InvitationResponseDto } from './dtos/invitation-response.dto';
import { InvitationVerificationResponseDto } from './dtos/invitation-verification-response.dto';
import { InvitationListResponseDto } from './dtos/invitation-list-response.dto';
import { InvitationStatsResponseDto } from './dtos/invitation-stats-response.dto';
import { InvitationRateLimitGuard } from './middlewares/invitation-rate-limit.middleware';
import { InvitationErrorCode, INVITATION_ERRORS } from '../entities/errors';

@ApiTags('Invitations')
@Controller({
  path: 'invitations',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(GlobalErrorFilter)
@ErrorResponse(COMMON_ERRORS)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiForbiddenResponse({ description: 'Forbidden' })
export class InvitationController {
  constructor(
    @Inject('IInvitationService')
    private readonly invitationService: IInvitationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(InvitationRateLimitGuard)
  @RequireAnyRoles(Role.USER)
  @ApiOperation({ summary: 'Create a new invitation' })
  @CreatedResponse(InvitationResponseDto)
  @ErrorResponse({
    INVITATION_CREATE_FAILED:
      INVITATION_ERRORS[InvitationErrorCode.INVITATION_CREATE_FAILED],
    INVITATION_LIMIT_EXCEEDED:
      INVITATION_ERRORS[InvitationErrorCode.INVITATION_LIMIT_EXCEEDED],
  })
  async createInvitation(
    @AuthContextUser() user: User,
    @Body() createInvitationDto: CreateInvitationDto,
  ): Promise<InvitationResponseDto> {
    const invitation = await this.invitationService.createInvitation(
      user.id,
      createInvitationDto,
    );
    return new InvitationResponseDto(invitation);
  }

  @Get('verify/:code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify an invitation code' })
  @ApiParam({ name: 'code', type: 'string', description: 'Invitation code' })
  @OkResponse(InvitationVerificationResponseDto)
  @ErrorResponse({
    INVITATION_NOT_FOUND:
      INVITATION_ERRORS[InvitationErrorCode.INVITATION_NOT_FOUND],
    INVITATION_VERIFY_FAILED:
      INVITATION_ERRORS[InvitationErrorCode.INVITATION_VERIFY_FAILED],
  })
  async verifyInvitation(
    @Param() params: VerifyInvitationDto,
  ): Promise<InvitationVerificationResponseDto> {
    const result = await this.invitationService.verifyInvitation(params.code);
    return new InvitationVerificationResponseDto(result);
  }

  @Post('accept/:code')
  @HttpCode(HttpStatus.OK)
  @RequireAnyRoles(Role.USER)
  @ApiOperation({ summary: 'Accept an invitation' })
  @ApiParam({ name: 'code', type: 'string', description: 'Invitation code' })
  @OkResponse(InvitationResponseDto)
  @ErrorResponse({
    INVITATION_NOT_FOUND:
      INVITATION_ERRORS[InvitationErrorCode.INVITATION_NOT_FOUND],
    INVITATION_ACCEPT_FAILED:
      INVITATION_ERRORS[InvitationErrorCode.INVITATION_ACCEPT_FAILED],
    INVITATION_ALREADY_ACCEPTED:
      INVITATION_ERRORS[InvitationErrorCode.INVITATION_ALREADY_ACCEPTED],
    INVITATION_SELF_ACCEPT:
      INVITATION_ERRORS[InvitationErrorCode.INVITATION_SELF_ACCEPT],
  })
  async acceptInvitation(
    @AuthContextUser() user: User,
    @Param() params: AcceptInvitationDto,
  ): Promise<InvitationResponseDto> {
    const invitation = await this.invitationService.acceptInvitation(
      params.code,
      user.id,
    );
    return new InvitationResponseDto(invitation);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequireAnyRoles(Role.USER)
  @ApiOperation({ summary: 'Get user invitations' })
  @PaginatedResponse(InvitationListResponseDto)
  @ErrorResponse({
    INVITATION_LIST_FAILED:
      INVITATION_ERRORS[InvitationErrorCode.INVITATION_LIST_FAILED],
  })
  async getUserInvitations(
    @AuthContextUser() user: User,
    @Query() pageOptions: PageOptionsDto,
  ): Promise<InvitationListResponseDto> {
    const invitations = await this.invitationService.getUserInvitations(
      user.id,
      pageOptions,
    );
    return new InvitationListResponseDto(invitations);
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @RequireAnyRoles(Role.USER)
  @ApiOperation({ summary: 'Get user invitation statistics' })
  @OkResponse(InvitationStatsResponseDto)
  @ErrorResponse({
    INVITATION_STATS_FAILED:
      INVITATION_ERRORS[InvitationErrorCode.INVITATION_STATS_FAILED],
  })
  async getUserInvitationStats(
    @AuthContextUser() user: User,
  ): Promise<InvitationStatsResponseDto> {
    const stats = await this.invitationService.getUserInvitationStats(user.id);
    return new InvitationStatsResponseDto(stats);
  }
}
