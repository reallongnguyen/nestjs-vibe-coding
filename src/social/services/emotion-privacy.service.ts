import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class EmotionPrivacyService {
  constructor(private readonly prisma: PrismaService) {}

  async canView(emotionId: string, viewerId?: string): Promise<boolean> {
    const emotion = await this.prisma.userEmotion.findUnique({
      where: { id: emotionId },
      select: { userId: true, metadata: true },
    });

    if (!emotion) {
      return false;
    }

    // If viewer is the owner, always allow
    if (viewerId && viewerId === emotion.userId) {
      return true;
    }

    // Check privacy settings in metadata
    const privacy = emotion.metadata?.privacy || 'public';

    switch (privacy) {
      case 'public':
        return true;
      case 'private':
        return false;
      case 'friends':
        // Check if viewer is a friend of the emotion owner
        if (!viewerId) {
          return false;
        }

        // This is a placeholder for friend check logic
        // In a real implementation, you would check if the viewer is a friend of the emotion owner
        return false;
      default:
        return true;
    }
  }

  async canLike(emotionId: string, userId: string): Promise<boolean> {
    return this.canView(emotionId, userId);
  }

  async canComment(emotionId: string, userId: string): Promise<boolean> {
    return this.canView(emotionId, userId);
  }

  async canViewLikes(emotionId: string, userId?: string): Promise<boolean> {
    return this.canView(emotionId, userId);
  }

  async canViewComments(emotionId: string, userId?: string): Promise<boolean> {
    return this.canView(emotionId, userId);
  }

  async canViewStats(emotionId: string, userId?: string): Promise<boolean> {
    return this.canView(emotionId, userId);
  }
}
