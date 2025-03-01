/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseFilters,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  AuthGuard,
  RolesGuard,
  Collection,
  PaginationQueryDto,
  ErrorResponse,
  RestExceptionFilter,
} from 'src/common';
import { UserFollowService } from '../services/user-follow.service';
import { FollowerDto } from './dtos/follower.dto';
import { FollowCountsDto } from './dtos/follow-counts.dto';
import { userFollowErrorMap } from '../entities/user-follow-error.map';

@ApiTags('User Follow')
@Controller({
  path: 'users',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(new RestExceptionFilter(userFollowErrorMap))
@ErrorResponse('user-follow', userFollowErrorMap)
@ApiBearerAuth()
export class UserFollowController {
  constructor(private readonly userFollowService: UserFollowService) {}

  // Controller methods will be implemented in SOC-006-2 and SOC-006-3
}
