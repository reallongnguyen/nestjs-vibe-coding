export {};

declare global {
  namespace PrismaJson {
    type NotificationObjectType = {
      id: string;
      name: string;
      type: string;
      image?: string;
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
