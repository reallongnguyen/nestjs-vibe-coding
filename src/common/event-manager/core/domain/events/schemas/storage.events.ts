import { EventSchema } from '../event.interface';

/**
 * Schema for delete image command
 */
interface DeleteImageSchema {
  imageUrl: string;
  timestamp: number;
}

/**
 * All storage related event schemas
 */
export const StorageEventSchemas = {
  DELETE_IMAGE: {
    eventName: 'storage.image.delete',
    schema: {} as DeleteImageSchema,
    version: '1.0.0',
    module: 'storage',
    description: 'Command to delete an image from storage',
  } as EventSchema<DeleteImageSchema>,
} as const;
