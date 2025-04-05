import {
  Body,
  Controller,
  Get,
  Post,
  UseFilters,
  UseGuards,
  Param,
  Query,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PagedResult } from 'src/common/models';
import {
  AuthCtx,
  RequireAnyRoles,
  AuthContext,
  RolesGuard,
  AuthGuard,
  Role,
  AuthContextUser,
  User,
  CreatedResponse,
  OkResponse,
  PaginatedResponse,
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
import { CreateUserDto } from './dtos/user.input';
import { UserDto } from './dtos/user.output';
import { UserSearchFiltersDto } from './dtos/user-search-filters.input';
import { BulkUserOperationDto } from './dtos/bulk-user-operation.input';
import { BulkOperationResultDto } from './dtos/bulk-user-operation.output';
import { UserActivityDto } from './dtos/user-activity.output';
import { ActivityFiltersDto } from './dtos/activity-filters.input';
import { PasswordResetResultDto } from './dtos/password-reset-result.output';
import { UserActivityRepository } from '../repositories/user-activity.repository';
import { UserRepository } from '../repositories/user.repository';
import { IDENTITY_ERRORS, IdentityErrorFactory } from '../entities/errors';

@Controller({
  path: 'users',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(GlobalErrorFilter)
@ApiTags('users')
@ApiBearerAuth()
@ErrorResponse(COMMON_ERRORS)
export class UserController {
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

  @Post()
  @ApiOperation({ summary: 'Create user' })
  @CreatedResponse(UserDto)
  @ErrorResponse({
    REQUIRE_PERSON: IDENTITY_ERRORS.REQUIRE_PERSON,
  })
  async create(
    @Body() userData: CreateUserDto,
    @AuthContext() authCtx: AuthCtx,
  ): Promise<UserDto> {
    this.validatePerson(authCtx);

    const person = authCtx.getPerson();

    const userUpsertInput = CreateUserDto.toApplication(
      userData,
      person.authId,
      person.email,
      person.phone,
    );

    const user = await this.userService.createOrUpdateUser(userUpsertInput);

    return UserDto.fromApplication(user);
  }

  @Get()
  @ApiOperation({ summary: 'List users' })
  @PaginatedResponse(UserDto)
  @ErrorResponse({})
  @RequireAnyRoles(Role.ADMIN)
  async list(
    @Query() filters: UserSearchFiltersDto,
  ): Promise<PagedResult<UserDto>> {
    const userPagedResult = await this.userService.searchUsers(filters);

    const dtoPagedResult = PagedResult.transform(
      userPagedResult,
      UserDto.fromApplication,
    );

    const collectionWithUrls = await withImageUrlMap(this.imageUrlService)(
      dtoPagedResult,
      {
        width: ImageSize.SMALL,
        height: ImageSize.SMALL,
        resizeType: 'fill',
      },
    );

    return collectionWithUrls;
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk operations on users' })
  @OkResponse(BulkOperationResultDto)
  @ErrorResponse({
    INVALID_BULK_OPERATION: IDENTITY_ERRORS.INVALID_BULK_OPERATION,
  })
  @RequireAnyRoles(Role.ADMIN)
  async bulkOperation(
    @Body() operation: BulkUserOperationDto,
    @AuthContextUser() user: User,
  ): Promise<BulkOperationResultDto> {
    return this.userService.processBulkOperation(operation, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @OkResponse(UserDto)
  @ErrorResponse({
    USER_NOT_FOUND: IDENTITY_ERRORS.USER_NOT_FOUND,
  })
  async getUser(@Param('id') userId: string): Promise<UserDto> {
    const user = await this.userService.getUserById(userId);

    return withImageUrlMap(this.imageUrlService)(
      UserDto.fromApplication(user),
      {
        width: ImageSize.MEDIUM,
        height: ImageSize.MEDIUM,
        resizeType: 'fill',
      },
    );
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Get user activity' })
  @PaginatedResponse(UserActivityDto)
  @ErrorResponse({})
  @RequireAnyRoles(Role.ADMIN)
  async getUserActivity(
    @Param('id') userId: string,
    @Query() filters: ActivityFiltersDto,
  ): Promise<PagedResult<UserActivityDto>> {
    const activities = await this.userService.getUserActivity(userId, filters);

    return PagedResult.transform(activities, UserActivityDto.fromApplication);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: 'Reset user password' })
  @OkResponse(PasswordResetResultDto)
  @ErrorResponse({
    USER_NOT_FOUND: IDENTITY_ERRORS.USER_NOT_FOUND,
    USER_UPDATE_FAILED: IDENTITY_ERRORS.USER_UPDATE_FAILED,
  })
  @RequireAnyRoles(Role.ADMIN)
  async initiatePasswordReset(
    @Param('id') userId: string,
  ): Promise<PasswordResetResultDto> {
    return this.userService.initiatePasswordReset(userId);
  }

  private validatePerson(authCtx: AuthCtx): void {
    if (!authCtx.isPerson()) {
      throw IdentityErrorFactory.requirePerson();
    }
  }
}
