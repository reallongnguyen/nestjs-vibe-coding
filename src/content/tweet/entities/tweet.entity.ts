export class Tweet {
  constructor(
    readonly id: string,
    readonly content: string,
    readonly images: string[],
    readonly userId: string,
    readonly isArchived: boolean,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  static create(params: {
    id: string;
    content: string;
    images: string[];
    userId: string;
    isArchived?: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Tweet {
    const {
      id,
      content,
      images,
      userId,
      isArchived = false,
      createdAt,
      updatedAt,
    } = params;

    return new Tweet(
      id,
      content,
      images,
      userId,
      isArchived,
      createdAt,
      updatedAt,
    );
  }

  archive(): Tweet {
    return new Tweet(
      this.id,
      this.content,
      this.images,
      this.userId,
      true,
      this.createdAt,
      new Date(),
    );
  }

  isOwner(userId: string): boolean {
    return this.userId === userId;
  }
}
