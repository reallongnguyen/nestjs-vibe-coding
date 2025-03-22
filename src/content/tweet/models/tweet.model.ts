export class Tweet {
  constructor(
    public readonly id: string,
    public readonly content: string,
    public readonly images: string[],
    public readonly userId: string,
    public readonly isArchived: boolean,
    public readonly version: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  isOwner(userId: string): boolean {
    return this.userId === userId;
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
}
