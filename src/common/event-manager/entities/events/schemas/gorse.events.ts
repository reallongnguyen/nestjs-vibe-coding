import { IsArray, IsDate, IsEnum, IsString } from 'class-validator';
import { EventSchema } from '../event.interface';

export enum GorseItemType {
  POST = 'POST',
  EMOTION = 'EMOTION',
}

export enum GorseFeedbackType {
  LIKE = 'LIKE',
  VIEW = 'VIEW',
  COMMENT = 'COMMENT',
  SHARE = 'SHARE',
}

export class UserSyncPayload {
  @IsString()
  userId: string;

  @IsArray()
  @IsString({ each: true })
  labels: string[];

  @IsDate()
  lastActiveAt: Date;
}

export class ItemSyncPayload {
  @IsString()
  itemId: string;

  @IsEnum(GorseItemType)
  itemType: GorseItemType;

  @IsDate()
  timestamp: Date;

  @IsArray()
  @IsString({ each: true })
  labels: string[];

  @IsArray()
  @IsString({ each: true })
  categories: string[];
}

export class FeedbackSyncPayload {
  @IsString()
  userId: string;

  @IsString()
  itemId: string;

  @IsEnum(GorseFeedbackType)
  feedbackType: GorseFeedbackType;

  @IsDate()
  timestamp: Date;
}

/**
 * All Gorse related event schemas
 */
export const GorseEventSchemas: Record<string, EventSchema> = {
  'gorse.user.sync': {
    eventName: 'gorse.user.sync',
    schema: UserSyncPayload,
    version: '1.0.0',
    module: 'gorse',
    description: 'Event for synchronizing user data with Gorse',
  },
  'gorse.item.sync': {
    eventName: 'gorse.item.sync',
    schema: ItemSyncPayload,
    version: '1.0.0',
    module: 'gorse',
    description: 'Event for synchronizing item data with Gorse',
  },
  'gorse.feedback.sync': {
    eventName: 'gorse.feedback.sync',
    schema: FeedbackSyncPayload,
    version: '1.0.0',
    module: 'gorse',
    description: 'Event for synchronizing feedback data with Gorse',
  },
};
