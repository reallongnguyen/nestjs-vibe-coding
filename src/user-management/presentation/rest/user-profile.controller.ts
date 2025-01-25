import {
  Body,
  Controller,
  Get,
  Inject,
  Patch,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  RequireAnyRoles,
  RolesGuard,
  AuthGuard,
  Role,
  AuthContextUser,
  User,
} from 'src/common/auth';
import {
  ErrorResponse,
  OkResponse,
  RestExceptionFilter,
  FormatRestResponseInterceptor,
} from 'src/common/presentation/rest';
import { EventBusPort } from 'src/common/event-bus/core/ports/event-bus.port';

import { UserService } from '../../application/services/user.service';
import { PatchProfileDto } from './input/profile.dto';
import { userErrorMap } from '../../domain/entities/user-error.map';
import { ProfileDto } from './output/profile.dto';
import { UserRepository } from '../../infrastructure/persistence/user.repository';
import { UserActivityRepository } from '../../infrastructure/persistence/user-activity.repository';

// Common decorator configurations for all endpoints
const REST_CONFIG = {
  guards: [AuthGuard, RolesGuard],
  interceptors: [new FormatRestResponseInterceptor()],
  filters: [new RestExceptionFilter(userErrorMap)],
};

@Controller({
  path: 'users/profile',
  version: '1',
})
@UseGuards(...REST_CONFIG.guards)
@UseInterceptors(...REST_CONFIG.interceptors)
@UseFilters(...REST_CONFIG.filters)
@ApiTags('users-profile')
@ErrorResponse('common', userErrorMap)
export class UserProfileController {
  private readonly userService: UserService;

  constructor(
    logger: Logger,
    userRepository: UserRepository,
    @Inject('EventBusPort')
    eventBus: EventBusPort,
    userActivityRepository: UserActivityRepository,
  ) {
    this.userService = new UserService(
      logger,
      userRepository,
      eventBus,
      userActivityRepository,
    );
  }

  @Get('/')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({ summary: 'Get user profile' })
  @OkResponse(ProfileDto)
  @ErrorResponse('user.profile.get', userErrorMap)
  async get(@AuthContextUser() user: User): Promise<ProfileDto> {
    const profile = await this.userService.getProfile(user.id);

    return ProfileDto.fromApplication(profile);
  }

  @Patch('/')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({ summary: 'Update user profile' })
  @OkResponse(ProfileDto)
  @ErrorResponse('user.profile.update', userErrorMap, {
    hasValidationErr: true,
  })
  async update(
    @Body() profileData: PatchProfileDto,
    @AuthContextUser() user: User,
  ): Promise<ProfileDto> {
    const updatedProfile = await this.userService.updateProfile(
      user.id,
      PatchProfileDto.toApplication(profileData),
    );

    return ProfileDto.fromApplication(updatedProfile);
  }
}
