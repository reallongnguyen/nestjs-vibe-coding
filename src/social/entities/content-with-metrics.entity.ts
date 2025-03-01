export interface ContentWithMetrics {
  id: string;
  type: 'POST' | 'USER_EMOTION';
  contentId: string;
  title?: string;
  content: any;
  emotion?: string;
  intensity?: number;
  createdAt: Date;
  authorId: string;
  authorFirstName: string;
  authorLastName?: string | null;
  authorAvatar?: string | null;
  likeCount: number;
  commentCount: number;
  viewCount: number;
}
