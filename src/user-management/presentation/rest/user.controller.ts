import {
  Body,
  Controller,
  Get,
  Post,
  UseFilters,
  UseGuards,
  Param,
  Query,
  Inject,
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
} from 'src/common/auth';
import {
  ErrorResponse,
  CreatedResponse,
  OkResponse,
  PaginatedResponse,
  RestExceptionFilter,
} from 'src/common/presentation/rest';
import { EventBusPort } from 'src/common/event-bus/core/ports/event-bus.port';

import { UserService } from '../../application/services/user.service';
import { CreateUserDto } from './input/user.dto';
import { userErrorMap } from '../../domain/entities/user-error.map';
import { UserDto } from './output/user.dto';
import { UserSearchFiltersDto } from './input/user-search-filters.dto';
import { BulkUserOperationDto } from './input/bulk-user-operation.dto';
import { BulkOperationResultDto } from './output/bulk-user-operation.dto';
import { UserActivityDto } from './output/user-activity.dto';
import { ActivityFiltersDto } from './input/activity-filters.dto';
import { PasswordResetResultDto } from './output/password-reset-result.dto';
import { UserActivityRepository } from '../../infrastructure/persistence/user-activity.repository';
import { UserRepository } from '../../infrastructure/persistence/user.repository';

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

    return Collection.transform(userCollection, UserDto.fromApplication);
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

    return UserDto.fromApplication(user);
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
