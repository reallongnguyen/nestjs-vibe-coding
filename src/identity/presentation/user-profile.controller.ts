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
  OkResponse,
} from 'src/common';
import {
  GlobalErrorFilter,
  ErrorResponse,
  COMMON_ERRORS,
} from 'src/common/errors';
import {
  ImageSize,
  ImageUrlService,
} from 'src/common/img-proxy/services/image-url.service';
import { InjectEventBus, IEventBus } from 'src/common/event-manager';
import { withImageUrlMap } from 'src/common/img-proxy/dto/with-image-urls.mixin';

import { UserService } from '../services/user.service';
import { PatchProfileDto } from './dtos/profile.input';
import { ProfileDto } from './dtos/profile.output';
import { UserRepository } from '../repositories/user.repository';
import { UserActivityRepository } from '../repositories/user-activity.repository';
import { IDENTITY_ERRORS } from '../entities/errors';

@Controller({
  path: 'users/profile',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(GlobalErrorFilter)
@ApiTags('users-profile')
@ErrorResponse(COMMON_ERRORS)
export class UserProfileController {
  private readonly userService: UserService;

  constructor(
    logger: Logger,
    userRepository: UserRepository,
    @InjectEventBus()
    eventBus: IEventBus,
    userActivityRepository: UserActivityRepository,
    private readonly imageUrlService: ImageUrlService,
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
  @ErrorResponse({
    USER_PROFILE_NOT_FOUND: IDENTITY_ERRORS.USER_PROFILE_NOT_FOUND,
  })
  async get(@AuthContextUser() user: User): Promise<ProfileDto> {
    const profile = await this.userService.getProfile(user.id);

    return withImageUrlMap(this.imageUrlService)(
      ProfileDto.fromApplication(profile),
      {
        width: ImageSize.MEDIUM,
        height: ImageSize.MEDIUM,
        resizeType: 'fill',
        generateThumbnail: true,
        thumbnailSize: ImageSize.SMALL,
      },
    );
  }

  @Patch('/')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({ summary: 'Update user profile' })
  @OkResponse(ProfileDto)
  @ErrorResponse({})
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
