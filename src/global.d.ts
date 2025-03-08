export {};

declare global {
  namespace PrismaJson {
    type SubjectObjectType = {
      id: string;
      firstName?: string;
      lastName?: string;
      fullName?: string;
      type: string;
      avatar?: string;
    };
    type NotificationObjectType = {
      id: string;
      name: string;
      type: string;
      thumbnail?: string;
    };
    type NotificationDecoratorType = {
      offset: number;
      length: number;
      class: string;
      type?: string;
      link?: string;
    };
    type EmotionMetadataType = {
      privacy?: 'public' | 'private' | 'friends';
    };
    type PostMetadataType = {
      privacy?: 'public' | 'private' | 'friends';
      lastViewedAt?: Date;
      lastEngagementAt?: Date;
    };
    type NotificationMetadataType = {
      [key: string]: unknown;
    };
  }
}
