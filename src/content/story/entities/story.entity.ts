export class Story {
  constructor(
    readonly id: string,
    readonly content: string,
    readonly images: string[],
    readonly userId: string,
    readonly parentId: string | null,
    readonly rootId: string | null,
    readonly chainPosition: number,
    readonly isArchived: boolean,
    readonly version: number,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  static create(params: {
    id: string;
    content: string;
    images: string[];
    userId: string;
    parentId?: string | null;
    rootId?: string | null;
    chainPosition?: number;
    isArchived?: boolean;
    version?: number;
    createdAt: Date;
    updatedAt: Date;
  }): Story {
    const {
      id,
      content,
      images,
      userId,
      parentId = null,
      rootId = null,
      chainPosition = 0,
      isArchived = false,
      version = 0,
      createdAt,
      updatedAt,
    } = params;

    return new Story(
      id,
      content,
      images,
      userId,
      parentId,
      rootId,
      chainPosition,
      isArchived,
      version,
      createdAt,
      updatedAt,
    );
  }

  update(content: string, images: string[]): Story {
    return new Story(
      this.id,
      content,
      images,
      this.userId,
      this.parentId,
      this.rootId,
      this.chainPosition,
      this.isArchived,
      this.version + 1,
      this.createdAt,
      new Date(),
    );
  }

  archive(): Story {
    return new Story(
      this.id,
      this.content,
      this.images,
      this.userId,
      this.parentId,
      this.rootId,
      this.chainPosition,
      true,
      this.version + 1,
      this.createdAt,
      new Date(),
    );
  }

  isOwner(userId: string): boolean {
    return this.userId === userId;
  }

  isRoot(): boolean {
    return this.parentId === null;
  }

  isContinuation(): boolean {
    return this.parentId !== null;
  }
}
