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
  // ErrorResponse, // Removed
  // COMMON_ERRORS, // Removed
} from 'src/common/errors';
import { ApiAppErrors } from 'src/common/swagger/api-app-errors.decorator';
import { CommonErrorCode } from 'src/common/errors/common.error-codes';
import { IdentityErrorCode } from '../entities/errors/identity.error-codes';
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
// import { IDENTITY_ERRORS, IdentityErrorFactory } from '../entities/errors'; // IDENTITY_ERRORS removed
import { IdentityErrorFactory } from '../entities/errors'; // Keep IdentityErrorFactory

@Controller({
  path: 'users',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(GlobalErrorFilter)
@ApiTags('users')
@ApiBearerAuth()
// @ErrorResponse(COMMON_ERRORS) // Removed
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
  // @ErrorResponse({ // Removed
  //   REQUIRE_PERSON: IDENTITY_ERRORS.REQUIRE_PERSON,
  // })
  @ApiAppErrors([
    CommonErrorCode.AUTH_INVALID_TOKEN,
    IdentityErrorCode.REQUIRE_PERSON,
    IdentityErrorCode.USER_CREATE_FAILED,
    CommonErrorCode.VALIDATION_FAILED, // Assuming CreateUserDto is validated
  ])
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
  // @ErrorResponse({}) // Removed
  @RequireAnyRoles(Role.ADMIN)
  @ApiAppErrors([
    CommonErrorCode.AUTH_INVALID_TOKEN,
    CommonErrorCode.AUTH_NO_PRIVILEGE,
    IdentityErrorCode.USER_QUERY_FAILED,
  ])
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
  // @ErrorResponse({ // Removed
  //   INVALID_BULK_OPERATION: IDENTITY_ERRORS.INVALID_BULK_OPERATION,
  // })
  @RequireAnyRoles(Role.ADMIN)
  @ApiAppErrors([
    CommonErrorCode.AUTH_INVALID_TOKEN,
    CommonErrorCode.AUTH_NO_PRIVILEGE,
    IdentityErrorCode.INVALID_BULK_OPERATION,
    IdentityErrorCode.USER_NOT_FOUND, // If any user in the list is not found
    IdentityErrorCode.USER_DELETE_FAILED, // For delete operations
    IdentityErrorCode.USER_UPDATE_FAILED, // For activate/deactivate/role updates
    CommonErrorCode.VALIDATION_FAILED, // Assuming BulkUserOperationDto is validated
  ])
  async bulkOperation(
    @Body() operation: BulkUserOperationDto,
    @AuthContextUser() user: User,
  ): Promise<BulkOperationResultDto> {
    return this.userService.processBulkOperation(operation, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @OkResponse(UserDto)
  // @ErrorResponse({ // Removed
  //   USER_NOT_FOUND: IDENTITY_ERRORS.USER_NOT_FOUND,
  // })
  @ApiAppErrors([
    CommonErrorCode.AUTH_INVALID_TOKEN, // Though typically public or requires basic auth
    IdentityErrorCode.USER_NOT_FOUND,
  ])
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
  // @ErrorResponse({}) // Removed
  @RequireAnyRoles(Role.ADMIN)
  @ApiAppErrors([
    CommonErrorCode.AUTH_INVALID_TOKEN,
    CommonErrorCode.AUTH_NO_PRIVILEGE,
    IdentityErrorCode.USER_NOT_FOUND, // If the user for whom activity is fetched is not found
    IdentityErrorCode.USER_QUERY_FAILED, // If the activity query itself fails
  ])
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
  // @ErrorResponse({ // Removed
  //   USER_NOT_FOUND: IDENTITY_ERRORS.USER_NOT_FOUND,
  //   USER_UPDATE_FAILED: IDENTITY_ERRORS.USER_UPDATE_FAILED,
  // })
  @RequireAnyRoles(Role.ADMIN)
  @ApiAppErrors([
    CommonErrorCode.AUTH_INVALID_TOKEN,
    CommonErrorCode.AUTH_NO_PRIVILEGE,
    IdentityErrorCode.USER_NOT_FOUND,
    IdentityErrorCode.PASSWORD_RESET_FAILED,
  ])
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
