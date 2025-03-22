export interface TweetAuthorDto {
  firstName: string;
  lastName: string;
  avatar: string;
}

export interface TweetDto {
  id: string;
  content: string;
  images: string[];
  userId: string;
  isArchived: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  author?: TweetAuthorDto;
}
