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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppError, Collection } from 'src/common/models';
import {
  AuthCtx,
  RequireAnyRoles,
  AuthContext,
  RolesGuard,
  AuthGuard,
  Role,
  AuthContextUser,
  User,
  ErrorResponse,
  CreatedResponse,
  OkResponse,
  PaginatedResponse,
  RestExceptionFilter,
} from 'src/common';
import {
  ImageSize,
  ImageUrlService,
} from 'src/common/img-proxy/services/image-url.service';
import { InjectEventBus, IEventBus } from 'src/common/event-manager';
import { withImageUrlMap } from 'src/common/img-proxy/dto/with-image-urls.mixin';

import { UserService } from '../services/user.service';
import { CreateUserDto } from './dtos/user.input';
import { userErrorMap } from '../entities/user-error.map';
import { UserDto } from './dtos/user.output';
import { UserSearchFiltersDto } from './dtos/user-search-filters.input';
import { BulkUserOperationDto } from './dtos/bulk-user-operation.input';
import { BulkOperationResultDto } from './dtos/bulk-user-operation.output';
import { UserActivityDto } from './dtos/user-activity.output';
import { ActivityFiltersDto } from './dtos/activity-filters.input';
import { PasswordResetResultDto } from './dtos/password-reset-result.output';
import { UserActivityRepository } from '../repositories/user-activity.repository';
import { UserRepository } from '../repositories/user.repository';

// Common decorator configurations for all endpoints
const REST_CONFIG = {
  guards: [AuthGuard, RolesGuard],
  filters: [new RestExceptionFilter(userErrorMap)],
};

@Controller({
  path: 'users',
  version: '1',
})
@UseGuards(...REST_CONFIG.guards)
@UseFilters(...REST_CONFIG.filters)
@ApiTags('users')
@ErrorResponse('common', userErrorMap)
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
  @ErrorResponse('user.create', userErrorMap, { hasValidationErr: true })
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
  @RequireAnyRoles(Role.ADMIN)
  @ApiOperation({ summary: 'Get many users' })
  @PaginatedResponse(UserDto)
  @ErrorResponse('user.list', userErrorMap, { hasValidationErr: true })
  async list(
    @Query() filters: UserSearchFiltersDto,
  ): Promise<Collection<UserDto>> {
    const userCollection = await this.userService.searchUsers(filters);

    const dtoCollection = Collection.transform(
      userCollection,
      UserDto.fromApplication,
    );

    const collectionWithUrls = await withImageUrlMap(this.imageUrlService)(
      dtoCollection,
      {
        width: ImageSize.SMALL,
        height: ImageSize.SMALL,
        resizeType: 'fill',
      },
    );

    return collectionWithUrls;
  }

  @Post('/bulk')
  @RequireAnyRoles(Role.ADMIN)
  @ApiOperation({
    summary: 'Bulk user operations (update/delete/deactivate/activate)',
  })
  @OkResponse(BulkOperationResultDto)
  @ErrorResponse('user.bulk', userErrorMap, { hasValidationErr: true })
  async bulkOperation(
    @Body() operation: BulkUserOperationDto,
    @AuthContextUser() user: User,
  ): Promise<BulkOperationResultDto> {
    return this.userService.processBulkOperation(operation, user.id);
  }

  @Get('/:id')
  @RequireAnyRoles(Role.ADMIN)
  @ApiOperation({ summary: 'Get user by ID' })
  @OkResponse(UserDto)
  @ErrorResponse('user.get', userErrorMap)
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

  @Get('/:id/activity')
  @RequireAnyRoles(Role.ADMIN)
  @ApiOperation({ summary: 'Get user activity log' })
  @PaginatedResponse(UserActivityDto)
  async getUserActivity(
    @Param('id') userId: string,
    @Query() filters: ActivityFiltersDto,
  ): Promise<Collection<UserActivityDto>> {
    const activities = await this.userService.getUserActivity(userId, filters);

    return Collection.transform(activities, UserActivityDto.fromApplication);
  }

  @Post('/:id/reset-password')
  @RequireAnyRoles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin-initiated password reset' })
  @OkResponse(PasswordResetResultDto)
  @ErrorResponse('user.password.reset', userErrorMap)
  async initiatePasswordReset(
    @Param('id') userId: string,
  ): Promise<PasswordResetResultDto> {
    return this.userService.initiatePasswordReset(userId);
  }

  private validatePerson(authCtx: AuthCtx): void {
    if (!authCtx.isPerson()) {
      throw new AppError('common.requirePerson');
    }
  }
}
