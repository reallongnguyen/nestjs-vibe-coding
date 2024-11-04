import {
  Body,
  Controller,
  Get,
  Post,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppError, Collection } from 'src/common/models';
import {
  AuthContextInfo,
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
  HttpExceptionFilter,
  FormatHttpResponseInterceptor,
} from 'src/common/present/http';
import { UserUpsertInput, UserService } from './user.service';
import { UserCreateDto, UserDto } from './dto/user.dto';
import { ProfileDto } from './dto/profile.dto';
import { userErrorMap } from './models/user-error.map';

@Controller({
  path: 'users',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(new FormatHttpResponseInterceptor())
@UseFilters(new HttpExceptionFilter(userErrorMap))
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
    @Body() userData: UserCreateDto,
    @AuthContext() authCtx: AuthContextInfo,
  ): Promise<UserDto> {
    if (!authCtx.person) {
      throw new AppError('common.requirePerson');
    }

    const userUpsertInput: UserUpsertInput = {
      ...userData,
      authId: authCtx.person.authId,
    };

    const user = await this.userService.createOrUpdateUser(userUpsertInput);

    return user;
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
    const userCollection = await this.userService.users({});

    return userCollection;
  }

  @Get('/profile')
  @RequireAnyRoles(Role.user)
  @ApiOperation({
    description: 'Get the profile of authenticated user',
    summary: 'Get my profile',
  })
  @OkResponse(ProfileDto)
  @ErrorResponse('user.profile', userErrorMap)
  async getProfile(
    @AuthContext() authCtx: AuthContextInfo,
  ): Promise<ProfileDto> {
    if (!authCtx.person) {
      throw new AppError('common.requirePerson');
    }

    const profile = await this.userService.getProfile(authCtx.person.userId);

    return profile;
  }
}
