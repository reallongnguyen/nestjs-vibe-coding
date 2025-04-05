import { Injectable, Inject } from '@nestjs/common';
import { PrismaService, PageOptionsDto } from 'src/common';
import { LOGGER_TOKEN } from 'src/common/logger/logger.token';
import { Logger } from 'nestjs-pino';
import { UserFollow, UserFollowWithUser } from '../entities/user-follow.entity';
import { IUserFollowRepository } from '../services/interfaces/user-follow-repository.interface';

@Injectable()
export class UserFollowRepository implements IUserFollowRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(LOGGER_TOKEN) private readonly logger: Logger,
  ) {}

  async create(followerId: string, followingId: string): Promise<UserFollow> {
    this.logger.debug(
      `Creating follow relationship: ${followerId} -> ${followingId}`,
    );
    return this.prisma.userFollow.create({
      data: {
        followerId,
        followingId,
      },
    });
  }

  async delete(followerId: string, followingId: string): Promise<UserFollow> {
    this.logger.debug(
      `Deleting follow relationship: ${followerId} -> ${followingId}`,
    );
    return this.prisma.userFollow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
  }

  async exists(followerId: string, followingId: string): Promise<boolean> {
    this.logger.debug(
      `Checking if follow relationship exists: ${followerId} -> ${followingId}`,
    );
    const count = await this.prisma.userFollow.count({
      where: {
        followerId,
        followingId,
      },
    });
    return count > 0;
  }

  async getFollowers(
    userId: string,
    pageOptions: PageOptionsDto,
  ): Promise<[UserFollowWithUser[], number]> {
    this.logger.debug(
      `Fetching followers for user ${userId} with options: ${JSON.stringify(pageOptions)}`,
    );
    const { skip, take } = pageOptions.toDatabaseQuery();

    const followers = await this.prisma.userFollow.findMany({
      where: {
        followingId: userId,
      },
      include: {
        follower: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await this.prisma.userFollow.count({
      where: {
        followingId: userId,
      },
    });

    this.logger.debug(
      `Found ${followers.length} followers for user ${userId} (total: ${total})`,
    );
    return [followers as UserFollowWithUser[], total];
  }

  async getFollowing(
    userId: string,
    pageOptions: PageOptionsDto,
  ): Promise<[UserFollowWithUser[], number]> {
    this.logger.debug(
      `Fetching following for user ${userId} with options: ${JSON.stringify(pageOptions)}`,
    );
    const { skip, take } = pageOptions.toDatabaseQuery();

    const following = await this.prisma.userFollow.findMany({
      where: {
        followerId: userId,
      },
      include: {
        following: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await this.prisma.userFollow.count({
      where: {
        followerId: userId,
      },
    });

    this.logger.debug(
      `Found ${following.length} following for user ${userId} (total: ${total})`,
    );
    return [following as UserFollowWithUser[], total];
  }

  async getFollowersCount(userId: string): Promise<number> {
    this.logger.debug(`Getting followers count for user ${userId}`);
    const count = await this.prisma.userFollow.count({
      where: {
        followingId: userId,
      },
    });
    this.logger.debug(`User ${userId} has ${count} followers`);
    return count;
  }

  async getFollowingCount(userId: string): Promise<number> {
    this.logger.debug(`Getting following count for user ${userId}`);
    const count = await this.prisma.userFollow.count({
      where: {
        followerId: userId,
      },
    });
    this.logger.debug(`User ${userId} is following ${count} users`);
    return count;
  }

  async getFollowerDetails(userId: string): Promise<{
    firstName: string;
    lastName: string | null;
    avatar: string | null;
  } | null> {
    this.logger.debug(`Getting follower details for user ${userId}`);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        avatar: true,
      },
    });

    if (!user) {
      this.logger.debug(`No user found with id ${userId}`);
    }

    return user;
  }

  async getFollowingIds(userId: string): Promise<string[]> {
    this.logger.debug(`Getting following IDs for user ${userId}`);
    const follows = await this.prisma.userFollow.findMany({
      where: {
        followerId: userId,
      },
      select: {
        followingId: true,
      },
    });

    const followingIds = follows.map((follow) => follow.followingId);
    this.logger.debug(
      `User ${userId} is following ${followingIds.length} users`,
    );
    return followingIds;
  }
}
