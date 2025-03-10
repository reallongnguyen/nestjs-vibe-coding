import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseFilters,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import {
  AuthGuard,
  RolesGuard,
  PagedResult,
  PageOptionsDto,
  ErrorResponse,
  RestExceptionFilter,
  AuthContextUser,
  CreatedResponse,
  OkResponse,
} from 'src/common';
import { UserFollowService } from '../services/user-follow.service';
import { FollowerDto } from './dtos/follower.dto';
import { FollowCountsDto } from './dtos/follow-counts.dto';
import { userFollowErrorMap } from '../entities/user-follow-error.map';
import { IsFollowingDto } from './dtos/is-following.dto';

@ApiTags('User Follow')
@Controller({
  path: 'users',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(new RestExceptionFilter(userFollowErrorMap))
@ErrorResponse('common', userFollowErrorMap)
export class UserFollowController {
  constructor(private readonly userFollowService: UserFollowService) {}

  @Post(':targetUserId/following')
  @ApiOperation({ summary: 'Follow a user' })
  @ApiParam({ name: 'targetUserId', description: 'ID of the user to follow' })
  @CreatedResponse(null)
  @ErrorResponse('user-follow.followUser', userFollowErrorMap)
  async followUser(
    @AuthContextUser('id') currentUserId: string,
    @Param('targetUserId') targetUserId: string,
  ): Promise<void> {
    await this.userFollowService.followUser(currentUserId, targetUserId);
  }

  @Delete(':targetUserId/following')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiParam({ name: 'targetUserId', description: 'ID of the user to unfollow' })
  @OkResponse(null)
  @ErrorResponse('user-follow.unfollowUser', userFollowErrorMap)
  async unfollowUser(
    @AuthContextUser('id') currentUserId: string,
    @Param('targetUserId') targetUserId: string,
  ): Promise<void> {
    await this.userFollowService.unfollowUser(currentUserId, targetUserId);
  }

  @Get(':userId/following/:targetUserId')
  @ApiOperation({ summary: 'Check if a user is following another user' })
  @ApiParam({ name: 'userId', description: 'ID of the follower user' })
  @ApiParam({
    name: 'targetUserId',
    description: 'ID of the user being followed',
  })
  @OkResponse(IsFollowingDto)
  async isFollowing(
    @Param('userId') userId: string,
    @Param('targetUserId') targetUserId: string,
  ): Promise<IsFollowingDto> {
    const isFollowing = await this.userFollowService.isFollowing(
      userId,
      targetUserId,
    );
    return IsFollowingDto.create(isFollowing);
  }

  @Get(':userId/followers')
  @ApiOperation({ summary: 'Get followers of a user' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  @OkResponse(PagedResult)
  async getFollowers(
    @Param('userId') userId: string,
    @Query() pageOptions: PageOptionsDto,
  ): Promise<PagedResult<FollowerDto>> {
    const followers = await this.userFollowService.getFollowers(
      userId,
      pageOptions,
    );

    return PagedResult.transform(followers, FollowerDto.fromService);
  }

  @Get(':userId/following')
  @ApiOperation({ summary: 'Get users followed by a user' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  @OkResponse(PagedResult)
  async getFollowing(
    @Param('userId') userId: string,
    @Query() pageOptions: PageOptionsDto,
  ): Promise<PagedResult<FollowerDto>> {
    const following = await this.userFollowService.getFollowing(
      userId,
      pageOptions,
    );

    return PagedResult.transform(following, FollowerDto.fromService);
  }

  @Get(':userId/follow-counts')
  @ApiOperation({ summary: 'Get follower and following counts for a user' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  @OkResponse(FollowCountsDto)
  async getFollowCounts(
    @Param('userId') userId: string,
  ): Promise<FollowCountsDto> {
    const counts = await this.userFollowService.getFollowCounts(userId);
    return FollowCountsDto.fromService(counts);
  }
}
