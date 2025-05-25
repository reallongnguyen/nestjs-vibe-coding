import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Story } from '../entities/story.entity';
import { StoryErrorFactory } from '../entities/errors';
import {
  FindChainOptions,
  FindStoriesOptions,
  StoryRepository,
} from './story.repository';

@Injectable()
export class PrismaStoryRepository implements StoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(story: {
    content: string;
    images: string[];
    userId: string;
    parentId?: string | null;
    rootId?: string | null;
    chainPosition?: number;
  }): Promise<Story> {
    const { content, images, userId, parentId, rootId, chainPosition } = story;

    const createdStory = await this.prisma.story.create({
      data: {
        content,
        images,
        userId,
        parentId: parentId || null,
        rootId: rootId || null,
        chainPosition: chainPosition || 0,
      },
    });

    return Story.create({
      id: createdStory.id,
      content: createdStory.content,
      images: createdStory.images,
      userId: createdStory.userId,
      parentId: createdStory.parentId,
      rootId: createdStory.rootId,
      chainPosition: createdStory.chainPosition,
      isArchived: createdStory.isArchived,
      version: createdStory.version,
      createdAt: createdStory.createdAt,
      updatedAt: createdStory.updatedAt,
    });
  }

  async findById(id: string): Promise<Story | null> {
    const story = await this.prisma.story.findUnique({
      where: { id },
    });

    if (!story) {
      return null;
    }

    return Story.create({
      id: story.id,
      content: story.content,
      images: story.images,
      userId: story.userId,
      parentId: story.parentId,
      rootId: story.rootId,
      chainPosition: story.chainPosition,
      isArchived: story.isArchived,
      version: story.version,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
    });
  }

  async findByUserId(
    userId: string,
    options?: FindStoriesOptions,
  ): Promise<Story[]> {
    const { limit = 10, offset = 0, includeArchived = false } = options || {};

    const stories = await this.prisma.story.findMany({
      where: {
        userId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return stories.map((story) =>
      Story.create({
        id: story.id,
        content: story.content,
        images: story.images,
        userId: story.userId,
        parentId: story.parentId,
        rootId: story.rootId,
        chainPosition: story.chainPosition,
        isArchived: story.isArchived,
        version: story.version,
        createdAt: story.createdAt,
        updatedAt: story.updatedAt,
      }),
    );
  }

  async findByParentId(
    parentId: string,
    options?: FindStoriesOptions,
  ): Promise<Story[]> {
    const { limit = 10, offset = 0, includeArchived = false } = options || {};

    const stories = await this.prisma.story.findMany({
      where: {
        parentId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      orderBy: {
        chainPosition: 'asc',
      },
      take: limit,
      skip: offset,
    });

    return stories.map((story) =>
      Story.create({
        id: story.id,
        content: story.content,
        images: story.images,
        userId: story.userId,
        parentId: story.parentId,
        rootId: story.rootId,
        chainPosition: story.chainPosition,
        isArchived: story.isArchived,
        version: story.version,
        createdAt: story.createdAt,
        updatedAt: story.updatedAt,
      }),
    );
  }

  async findByRootId(
    rootId: string,
    options?: FindStoriesOptions,
  ): Promise<Story[]> {
    const { limit = 10, offset = 0, includeArchived = false } = options || {};

    const stories = await this.prisma.story.findMany({
      where: {
        rootId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      orderBy: {
        chainPosition: 'asc',
      },
      take: limit,
      skip: offset,
    });

    return stories.map((story) =>
      Story.create({
        id: story.id,
        content: story.content,
        images: story.images,
        userId: story.userId,
        parentId: story.parentId,
        rootId: story.rootId,
        chainPosition: story.chainPosition,
        isArchived: story.isArchived,
        version: story.version,
        createdAt: story.createdAt,
        updatedAt: story.updatedAt,
      }),
    );
  }

  async findChainById(
    rootId: string,
    options?: FindChainOptions,
  ): Promise<Story[]> {
    const { limit = 100, offset = 0, includeArchived = false } = options || {};

    // This is a simplified implementation using a flat query
    // In a production environment, this would likely use a recursive CTE or
    // other optimized query approach for tree traversal
    const stories = await this.prisma.story.findMany({
      where: {
        rootId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      orderBy: [{ chainPosition: 'asc' }, { createdAt: 'asc' }],
      take: limit,
      skip: offset,
    });

    return stories.map((story) =>
      Story.create({
        id: story.id,
        content: story.content,
        images: story.images,
        userId: story.userId,
        parentId: story.parentId,
        rootId: story.rootId,
        chainPosition: story.chainPosition,
        isArchived: story.isArchived,
        version: story.version,
        createdAt: story.createdAt,
        updatedAt: story.updatedAt,
      }),
    );
  }

  async update(story: Story): Promise<Story> {
    try {
      const updatedStory = await this.prisma.story.update({
        where: {
          id: story.id,
          version: story.version,
        },
        data: {
          content: story.content,
          images: story.images,
          isArchived: story.isArchived,
          version: story.version + 1,
          updatedAt: story.updatedAt,
        },
      });

      return Story.create({
        id: updatedStory.id,
        content: updatedStory.content,
        images: updatedStory.images,
        userId: updatedStory.userId,
        parentId: updatedStory.parentId,
        rootId: updatedStory.rootId,
        chainPosition: updatedStory.chainPosition,
        isArchived: updatedStory.isArchived,
        version: updatedStory.version,
        createdAt: updatedStory.createdAt,
        updatedAt: updatedStory.updatedAt,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw StoryErrorFactory.concurrentUpdate();
      }
      throw error;
    }
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx || this.prisma;
    await client.story.delete({
      where: { id },
    });
  }

  async countByUserId(
    userId: string,
    includeArchived = false,
  ): Promise<number> {
    return this.prisma.story.count({
      where: {
        userId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
    });
  }

  async countByChainId(
    rootId: string,
    includeArchived = false,
  ): Promise<number> {
    return this.prisma.story.count({
      where: {
        rootId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
    });
  }
}
