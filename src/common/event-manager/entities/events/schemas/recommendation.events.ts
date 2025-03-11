import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { EventSchema } from '../event.interface';

/**
 * Sync operation types
 */
export enum SyncOperation {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

/**
 * Schema for user sync events
 */
export class UserSyncPayload {
  @IsString()
  @MinLength(1)
  userId: string;

  @IsArray()
  @IsString({ each: true })
  labels: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subscribe?: string[];

  @IsNumber()
  timestamp: number;

  @IsEnum(SyncOperation)
  operation: SyncOperation;
}

/**
 * Schema for item sync events
 */
export class ItemSyncPayload {
  @IsString()
  @MinLength(1)
  itemId: string;

  @IsArray()
  @IsString({ each: true })
  labels: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsNumber()
  timestamp: number;

  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;

  @IsEnum(SyncOperation)
  operation: SyncOperation;
}

/**
 * Schema for feedback sync events
 */
export class FeedbackSyncPayload {
  @IsString()
  @MinLength(1)
  feedbackType: string;

  @IsString()
  @MinLength(1)
  userId: string;

  @IsString()
  @MinLength(1)
  itemId: string;

  @IsNumber()
  timestamp: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

/**
 * All Gorse related event schemas
 */
export const GorseEventSchemas = {
  USER_SYNC: {
    eventName: 'gorse.user.sync',
    schema: new UserSyncPayload(),
    version: '1.0.0',
    module: 'recommendation',
    description: 'Emitted when a user needs to be synced with Gorse',
  } as EventSchema<UserSyncPayload>,

  ITEM_SYNC: {
    eventName: 'gorse.item.sync',
    schema: new ItemSyncPayload(),
    version: '1.0.0',
    module: 'recommendation',
    description: 'Emitted when an item needs to be synced with Gorse',
  } as EventSchema<ItemSyncPayload>,

  FEEDBACK_SYNC: {
    eventName: 'gorse.feedback.sync',
    schema: new FeedbackSyncPayload(),
    version: '1.0.0',
    module: 'recommendation',
    description: 'Emitted when user feedback needs to be synced with Gorse',
  } as EventSchema<FeedbackSyncPayload>,
} as const;
