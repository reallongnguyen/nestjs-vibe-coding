import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  UseFilters,
  UseGuards,
  UseInterceptors,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppError, Collection } from 'src/common/models';
import {
  AuthCtx,
  RequireAnyRoles,
  AuthContext,
  RolesGuard,
  AuthGuard,
  Role,
} from 'src/common/auth';
import {
  ErrorResponse,
  CreatedResponse,
  OkResponse,
  PaginatedResponse,
  RestExceptionFilter,
  FormatRestResponseInterceptor,
} from 'src/common/presentation/rest';
import { UserService } from '../../application/services/user.service';
import { CreateUserDto } from './input/user.dto';
import { PatchProfileDto } from './input/profile.dto';
import { userErrorMap } from '../../domain/entities/user-error.map';
import { UserDto } from './output/user.dto';
import { ProfileDto } from './output/profile.dto';
import { UserSearchFiltersDto } from './input/user-search-filters.dto';
import { BulkUserOperationDto } from './input/user-bulk-operation.dto';
import { BulkOperationResultDto } from './output/bulk-user-operation.dto';
import { UserActivityDto } from './output/user-activity.dto';
import { ActivityFiltersDto } from './input/activity-filters.dto';
import { PasswordResetResultDto } from './output/password-reset-result.dto';

// Common decorator configurations for all endpoints
const REST_CONFIG = {
  guards: [AuthGuard, RolesGuard],
  interceptors: [new FormatRestResponseInterceptor()],
  filters: [new RestExceptionFilter(userErrorMap)],
};

@Controller({
  path: 'users',
  version: '1',
})
@UseGuards(...REST_CONFIG.guards)
@UseInterceptors(...REST_CONFIG.interceptors)
@UseFilters(...REST_CONFIG.filters)
@ApiTags('users')
@ErrorResponse('common', userErrorMap)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create or Update an user' })
  @CreatedResponse(UserDto)
  @ErrorResponse('user.create', userErrorMap, { hasValidationErr: true })
  async create(
    @Body() userData: CreateUserDto,
    @AuthContext() authCtx: AuthCtx,
  ): Promise<UserDto> {
    this.validatePerson(authCtx);

    const userUpsertInput = CreateUserDto.toApplication(
      userData,
      authCtx.person.authId,
    );

    const user = await this.userService.createOrUpdateUser(userUpsertInput);

    return UserDto.fromApplication(user);
  }

  @Get()
  @RequireAnyRoles(Role.ADMIN)
  @ApiOperation({ summary: 'List up users' })
  @PaginatedResponse(UserDto)
  @ErrorResponse('user.list', userErrorMap, { hasValidationErr: true })
  async list(): Promise<Collection<UserDto>> {
    const userCollection = await this.userService.getUsers({});

    return {
      ...userCollection,
      edges: userCollection.edges.map(UserDto.fromApplication),
    };
  }

  @Get('/profile')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({ summary: 'Get my profile' })
  @OkResponse(ProfileDto)
  @ErrorResponse('user.profile', userErrorMap)
  async getProfile(@AuthContext() authCtx: AuthCtx): Promise<ProfileDto> {
    this.validatePerson(authCtx);

    const profile = await this.userService.getProfile(authCtx.person.userId);

    return ProfileDto.fromApplication(profile);
  }

  @Patch('/profile')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({ summary: 'Update my profile' })
  @OkResponse(ProfileDto)
  @ErrorResponse('user.profile.update', userErrorMap, {
    hasValidationErr: true,
  })
  async updateProfile(
    @Body() profileData: PatchProfileDto,
    @AuthContext() authCtx: AuthCtx,
  ): Promise<ProfileDto> {
    this.validatePerson(authCtx);

    const updatedProfile = await this.userService.updateProfile(
      authCtx.person.userId,
      PatchProfileDto.toApplication(profileData),
    );

    return ProfileDto.fromApplication(updatedProfile);
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

  @Get('/search')
  @RequireAnyRoles(Role.ADMIN)
  @ApiOperation({ summary: 'Search users with filters' })
  @PaginatedResponse(UserDto)
  async searchUsers(
    @Query() filters: UserSearchFiltersDto,
  ): Promise<Collection<UserDto>> {
    const userCollection = await this.userService.searchUsers(filters);
    return {
      ...userCollection,
      edges: userCollection.edges.map(UserDto.fromApplication),
    };
  }

  @Post('/bulk')
  @RequireAnyRoles(Role.ADMIN)
  @ApiOperation({ summary: 'Bulk user operations (update/delete/deactivate)' })
  @OkResponse(BulkOperationResultDto)
  async bulkOperation(
    @Body() operation: BulkUserOperationDto,
  ): Promise<BulkOperationResultDto> {
    return this.userService.processBulkOperation(operation);
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
    return {
      ...activities,
      edges: activities.edges.map(UserActivityDto.fromApplication),
    };
  }

  @Post('/:id/reset-password')
  @RequireAnyRoles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin-initiated password reset' })
  @OkResponse(PasswordResetResultDto)
  async initiatePasswordReset(
    @Param('id') userId: string,
  ): Promise<PasswordResetResultDto> {
    return this.userService.initiatePasswordReset(userId);
  }

  private validatePerson(authCtx: AuthCtx): void {
    if (!authCtx.person) {
      throw new AppError('common.requirePerson');
    }
  }
}
