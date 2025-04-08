import { Story } from '../entities/story.entity';

export const STORY_REPOSITORY = 'STORY_REPOSITORY';

export interface FindStoriesOptions {
  limit?: number;
  offset?: number;
  includeArchived?: boolean;
}

export interface FindChainOptions extends FindStoriesOptions {
  maxDepth?: number;
}

export interface StoryRepository {
  create(data: {
    content: string;
    images: string[];
    userId: string;
    parentId: string | null;
    rootId: string | null;
    chainPosition: number;
  }): Promise<Story>;

  findById(id: string): Promise<Story | null>;

  findByUserId(userId: string, options?: FindStoriesOptions): Promise<Story[]>;

  findByParentId(
    parentId: string,
    options?: FindStoriesOptions,
  ): Promise<Story[]>;

  findByRootId(rootId: string): Promise<Story[]>;

  findChainById(rootId: string, options?: FindChainOptions): Promise<Story[]>;

  update(story: Story): Promise<Story>;

  delete(id: string): Promise<void>;

  countByUserId(userId: string, includeArchived?: boolean): Promise<number>;

  countByChainId(rootId: string, includeArchived?: boolean): Promise<number>;
}
