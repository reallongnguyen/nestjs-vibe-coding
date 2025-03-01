import { Inject, Injectable } from '@nestjs/common';
import { Collection, PaginationQueryDto } from 'src/common';
import { ContentDto } from '../presentation/dtos/content.dto';
import { ISocialRepository } from './interfaces/social-repository.interface';
import { IFollowingFeedService } from './interfaces/following-feed-service.interface';

@Injectable()
export class FollowingFeedService implements IFollowingFeedService {
  constructor(
    @Inject('ISocialRepository')
    private readonly socialRepository: ISocialRepository,
  ) {}

  async getFollowingFeed(
    userId: string,
    pagination: PaginationQueryDto,
    sortBy: string = 'recent',
  ): Promise<Collection<ContentDto>> {
    // Get content from followed users
    const [contents, total] =
      await this.socialRepository.getContentFromFollowedUsers(
        userId,
        pagination,
        sortBy,
      );

    // If no content found, return empty collection
    if (contents.length === 0) {
      return new Collection<ContentDto>([], {
        total: 0,
        limit: pagination.limit,
        offset: pagination.offset,
      });
    }

    // Map to DTOs
    const contentDtos = contents.map((content) => ({
      id: content.id,
      type: content.type,
      content: {
        id: content.contentId,
        title: content.title,
        content: content.content,
        emotion: content.emotion,
        intensity: content.intensity,
        createdAt: content.createdAt,
        author: {
          id: content.authorId,
          firstName: content.authorFirstName,
          lastName: content.authorLastName,
          avatar: content.authorAvatar,
        },
      },
      metrics: {
        likeCount: content.likeCount,
        commentCount: content.commentCount,
        viewCount: content.viewCount,
      },
    }));

    return new Collection<ContentDto>(contentDtos, {
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }
}
