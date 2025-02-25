import { PostView as PrismaPostView } from '@prisma/client';

export class PostView implements PrismaPostView {
  id: string;
  postId: string;
  viewerId: string | null;
  viewerHash: string;
  timestamp: Date;
}
