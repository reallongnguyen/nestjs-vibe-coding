import { Injectable } from '@nestjs/common';
import { PrismaService, PaginationQueryDto } from 'src/common';
import { UserFollow, UserFollowWithUser } from '../entities/user-follow.entity';
import { IUserFollowRepository } from '../services/interfaces/user-follow-repository.interface';

@Injectable()
export class UserFollowRepository implements IUserFollowRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(followerId: string, followingId: string): Promise<UserFollow> {
    return this.prisma.userFollow.create({
      data: {
        followerId,
        followingId,
      },
    });
  }

  async delete(followerId: string, followingId: string): Promise<UserFollow> {
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
    pagination: PaginationQueryDto,
  ): Promise<[UserFollowWithUser[], number]> {
    const { limit, offset } = pagination;

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
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await this.prisma.userFollow.count({
      where: {
        followingId: userId,
      },
    });

    return [followers as UserFollowWithUser[], total];
  }

  async getFollowing(
    userId: string,
    pagination: PaginationQueryDto,
  ): Promise<[UserFollowWithUser[], number]> {
    const { limit, offset } = pagination;

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
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await this.prisma.userFollow.count({
      where: {
        followerId: userId,
      },
    });

    return [following as UserFollowWithUser[], total];
  }

  async getFollowersCount(userId: string): Promise<number> {
    return this.prisma.userFollow.count({
      where: {
        followingId: userId,
      },
    });
  }

  async getFollowingCount(userId: string): Promise<number> {
    return this.prisma.userFollow.count({
      where: {
        followerId: userId,
      },
    });
  }

  async getFollowerDetails(userId: string): Promise<{
    firstName: string;
    lastName: string | null;
    avatar: string | null;
  } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        avatar: true,
      },
    });

    return user;
  }

  async getFollowingIds(userId: string): Promise<string[]> {
    const follows = await this.prisma.userFollow.findMany({
      where: {
        followerId: userId,
      },
      select: {
        followingId: true,
      },
    });

    return follows.map((follow) => follow.followingId);
  }
}
