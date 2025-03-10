import { PageOptionsDto } from 'src/common';
import {
  UserFollow,
  UserFollowWithUser,
} from '../../entities/user-follow.entity';

export interface IUserFollowRepository {
  /**
   * Create a follow relationship between two users
   * @param followerId ID of the user who is following
   * @param followingId ID of the user being followed
   * @returns The created follow relationship
   */
  create(followerId: string, followingId: string): Promise<UserFollow>;

  /**
   * Delete a follow relationship between two users
   * @param followerId ID of the user who is following
   * @param followingId ID of the user being followed
   * @returns The deleted follow relationship
   */
  delete(followerId: string, followingId: string): Promise<UserFollow>;

  /**
   * Check if a user is following another user
   * @param followerId ID of the user who might be following
   * @param followingId ID of the user who might be followed
   * @returns True if the follow relationship exists, false otherwise
   */
  exists(followerId: string, followingId: string): Promise<boolean>;

  /**
   * Get the followers of a user
   * @param userId ID of the user whose followers to get
   * @param pagination Pagination parameters
   * @returns Array of follow relationships with follower user details
   */
  getFollowers(
    userId: string,
    pageOptions: PageOptionsDto,
  ): Promise<[UserFollowWithUser[], number]>;

  /**
   * Get the users a user is following
   * @param userId ID of the user whose followings to get
   * @param pagination Pagination parameters
   * @returns Array of follow relationships with following user details
   */
  getFollowing(
    userId: string,
    pageOptions: PageOptionsDto,
  ): Promise<[UserFollowWithUser[], number]>;

  /**
   * Get the count of followers for a user
   * @param userId ID of the user whose follower count to get
   * @returns Number of followers
   */
  getFollowersCount(userId: string): Promise<number>;

  /**
   * Get the count of users a user is following
   * @param userId ID of the user whose following count to get
   * @returns Number of users being followed
   */
  getFollowingCount(userId: string): Promise<number>;

  /**
   * Get basic details of a follower for event publishing
   * @param userId ID of the user to get details for
   * @returns Basic user details or null if not found
   */
  getFollowerDetails(userId: string): Promise<{
    firstName: string;
    lastName: string | null;
    avatar: string | null;
  } | null>;

  /**
   * Get IDs of users that the specified user is following
   * @param userId ID of the user
   * @returns Array of user IDs
   */
  getFollowingIds(userId: string): Promise<string[]>;
}
