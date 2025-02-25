import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppError } from 'src/common/models/AppError';
import { IPostLikeRepository } from './interfaces/post-like.repository.interface';
import { PostLikeResponseDto } from '../presentation/dtos/post-like.dto';

@Injectable()
export class PostLikeService {
  private readonly logger = new Logger(PostLikeService.name);

  constructor(
    @Inject('IPostLikeRepository')
    private readonly postLikeRepository: IPostLikeRepository,
  ) {}

  async toggleLike(
    postId: string,
    userId: string,
  ): Promise<PostLikeResponseDto> {
    const existingLike = await this.postLikeRepository.findByPostAndUser(
      postId,
      userId,
    );

    if (existingLike) {
      await this.postLikeRepository.delete(postId, userId);
      const count = await this.postLikeRepository.countByPost(postId);
      return { liked: false, likeCount: count };
    }

    try {
      await this.postLikeRepository.create(postId, userId);
      const count = await this.postLikeRepository.countByPost(postId);
      return { liked: true, likeCount: count };
    } catch (error) {
      if (error.code === 'P2003') {
        throw new AppError('post.like.notFound', {
          postId,
          userId,
        });
      }
      throw error;
    }
  }

  async getLikeStatus(
    postId: string,
    userId: string,
  ): Promise<PostLikeResponseDto> {
    const [like, count] = await Promise.all([
      this.postLikeRepository.findByPostAndUser(postId, userId),
      this.postLikeRepository.countByPost(postId),
    ]);

    return {
      liked: !!like,
      likeCount: count,
    };
  }
}
