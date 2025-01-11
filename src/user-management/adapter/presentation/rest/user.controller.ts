import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  UseFilters,
  UseGuards,
  UseInterceptors,
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
import { UserService } from '../../../core/application/services/user.service';
import { CreateUserDto } from './dto/input/user.dto';
import { PatchProfileDto } from './dto/input/profile.dto';
import { userErrorMap } from '../../../core/domain/entities/user-error.map';
import { UserDto } from './dto/output/user.dto';
import { ProfileDto } from './dto/output/profile.dto';

@Controller({
  path: 'users',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(new FormatRestResponseInterceptor())
@UseFilters(new RestExceptionFilter(userErrorMap))
@ApiTags('users')
@ErrorResponse('common', userErrorMap)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({
    description: 'Create a new user if not exist, otherwise update the user',
    summary: 'Create or Update an user',
  })
  @CreatedResponse(UserDto)
  @ErrorResponse('user.create', userErrorMap, { hasValidationErr: true })
  async create(
    @Body() userData: CreateUserDto,
    @AuthContext() authCtx: AuthCtx,
  ): Promise<UserDto> {
    if (!authCtx.person) {
      throw new AppError('common.requirePerson');
    }

    const userUpsertInput = CreateUserDto.toApplication(
      userData,
      authCtx.person.authId,
    );

    const user = await this.userService.createOrUpdateUser(userUpsertInput);

    return UserDto.fromApplication(user);
  }

  @Get()
  @RequireAnyRoles(Role.admin)
  @ApiOperation({
    description: 'Filter user with pagination',
    summary: 'List up users',
  })
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
  @RequireAnyRoles(Role.user)
  @ApiOperation({
    description: 'Get the profile of authenticated user',
    summary: 'Get my profile',
  })
  @OkResponse(ProfileDto)
  @ErrorResponse('user.profile', userErrorMap)
  async getProfile(@AuthContext() authCtx: AuthCtx): Promise<ProfileDto> {
    if (!authCtx.person) {
      throw new AppError('common.requirePerson');
    }

    const profile = await this.userService.getProfile(authCtx.person.userId);

    return ProfileDto.fromApplication(profile);
  }

  @Patch('/profile')
  @RequireAnyRoles(Role.user)
  @ApiOperation({
    description: 'Update the profile of authenticated user',
    summary: 'Update my profile',
  })
  @OkResponse(ProfileDto)
  @ErrorResponse('user.profile.update', userErrorMap, {
    hasValidationErr: true,
  })
  async updateProfile(
    @Body() profileData: PatchProfileDto,
    @AuthContext() authCtx: AuthCtx,
  ): Promise<ProfileDto> {
    if (!authCtx.person) {
      throw new AppError('common.requirePerson');
    }

    const updatedProfile = await this.userService.updateProfile(
      authCtx.person.userId,
      PatchProfileDto.toApplication(profileData),
    );

    return ProfileDto.fromApplication(updatedProfile);
  }
}
