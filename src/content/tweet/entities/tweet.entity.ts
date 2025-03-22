export class Tweet {
  constructor(
    readonly id: string,
    readonly content: string,
    readonly images: string[],
    readonly userId: string,
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
    isArchived?: boolean;
    version?: number;
    createdAt: Date;
    updatedAt: Date;
  }): Tweet {
    const {
      id,
      content,
      images,
      userId,
      isArchived = false,
      version = 0,
      createdAt,
      updatedAt,
    } = params;

    return new Tweet(
      id,
      content,
      images,
      userId,
      isArchived,
      version,
      createdAt,
      updatedAt,
    );
  }

  update(content: string, images: string[]): Tweet {
    return new Tweet(
      this.id,
      content,
      images,
      this.userId,
      this.isArchived,
      this.version + 1,
      this.createdAt,
      new Date(),
    );
  }

  archive(): Tweet {
    return new Tweet(
      this.id,
      this.content,
      this.images,
      this.userId,
      true,
      this.version + 1,
      this.createdAt,
      new Date(),
    );
  }

  isOwner(userId: string): boolean {
    return this.userId === userId;
  }
}
