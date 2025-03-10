import { PagedResult, PageOptionsDto } from 'src/common';
import { UserFollow } from '../../entities/user-follow.entity';
import { FollowerDto } from '../dtos/follower.dto';
import { FollowCountsDto } from '../dtos/follow-counts.dto';

export interface IUserFollowService {
  /**
   * Follow a user
   * @param followerId ID of the user who is following
   * @param followingId ID of the user being followed
   * @returns The created follow relationship
   */
  followUser(followerId: string, followingId: string): Promise<UserFollow>;

  /**
   * Unfollow a user
   * @param followerId ID of the user who is unfollowing
   * @param followingId ID of the user being unfollowed
   * @returns The deleted follow relationship
   */
  unfollowUser(followerId: string, followingId: string): Promise<UserFollow>;

  /**
   * Check if a user is following another user
   * @param followerId ID of the user who might be following
   * @param followingId ID of the user who might be followed
   * @returns True if the follow relationship exists, false otherwise
   */
  isFollowing(followerId: string, followingId: string): Promise<boolean>;

  /**
   * Get the followers of a user
   * @param userId ID of the user whose followers to get
   * @param pagination Pagination parameters
   * @returns PagedResult of followers
   */
  getFollowers(
    userId: string,
    pageOptions: PageOptionsDto,
  ): Promise<PagedResult<FollowerDto>>;

  /**
   * Get the users a user is following
   * @param userId ID of the user whose followings to get
   * @param pagination Pagination parameters
   * @returns PagedResult of followed users
   */
  getFollowing(
    userId: string,
    pageOptions: PageOptionsDto,
  ): Promise<PagedResult<FollowerDto>>;

  /**
   * Get the follower and following counts for a user
   * @param userId ID of the user whose counts to get
   * @returns Object with follower and following counts
   */
  getFollowCounts(userId: string): Promise<FollowCountsDto>;

  /**
   * Get IDs of users that the specified user is following
   * @param userId ID of the user
   * @returns Array of user IDs
   */
  getFollowingIds(userId: string): Promise<string[]>;
}
