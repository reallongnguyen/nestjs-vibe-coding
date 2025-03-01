import {
  Body,
  Controller,
  Get,
  Patch,
  UseFilters,
  UseGuards,
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
  ErrorResponse,
  OkResponse,
  RestExceptionFilter,
} from 'src/common';

import { InjectEventBus, IEventBus } from 'src/common/event-bus';

import { UserService } from '../services/user.service';
import { PatchProfileDto } from './dtos/profile.input';
import { userErrorMap } from '../entities/user-error.map';
import { ProfileDto } from './dtos/profile.output';
import { UserRepository } from '../repositories/user.repository';
import { UserActivityRepository } from '../repositories/user-activity.repository';

// Common decorator configurations for all endpoints
const REST_CONFIG = {
  guards: [AuthGuard, RolesGuard],
  filters: [new RestExceptionFilter(userErrorMap)],
};

@Controller({
  path: 'users/profile',
  version: '1',
})
@UseGuards(...REST_CONFIG.guards)
@UseFilters(...REST_CONFIG.filters)
@ApiTags('users-profile')
@ErrorResponse('common', userErrorMap)
export class UserProfileController {
  private readonly userService: UserService;

  constructor(
    logger: Logger,
    userRepository: UserRepository,
    @InjectEventBus()
    eventBus: IEventBus,
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
