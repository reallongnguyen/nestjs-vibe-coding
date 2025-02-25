import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { PostLike } from '../entities/post-like.entity';
import { IPostLikeRepository } from '../services/interfaces/post-like.repository.interface';

@Injectable()
export class PostLikeRepository implements IPostLikeRepository {
  private readonly logger = new Logger(PostLikeRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(postId: string, userId: string): Promise<PostLike> {
    try {
      const like = await this.prisma.$transaction(async (tx) => {
        // Create the like
        const newLike = await tx.postLike.create({
          data: { postId, userId },
        });

        // Increment the like count
        await tx.publishedPost.update({
          where: { id: postId },
          data: { likeCount: { increment: 1 } },
        });

        return newLike;
      });

      return like;
    } catch (error) {
      this.logger.error(`Failed to create like: ${error.message}`);
      throw error;
    }
  }

  async delete(postId: string, userId: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Delete the like
        await tx.postLike.delete({
          where: {
            postId_userId: { postId, userId },
          },
        });

        // Decrement the like count
        await tx.publishedPost.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
        });
      });
    } catch (error) {
      this.logger.error(`Failed to delete like: ${error.message}`);
      throw error;
    }
  }

  async findByPostAndUser(
    postId: string,
    userId: string,
  ): Promise<PostLike | null> {
    return this.prisma.postLike.findUnique({
      where: {
        postId_userId: { postId, userId },
      },
    });
  }

  async countByPost(postId: string): Promise<number> {
    return this.prisma.postLike.count({
      where: { postId },
    });
  }
}
