import { v4 as uuid } from 'uuid';
import { ContentEventSchemas } from '../schemas';
import { BaseEvent } from '../base.event';

/**
 * Command to delete an image
 */
export class DeleteImageCommand extends BaseEvent<{ imageUrl: string }> {
  /**
   * Internal storage for image URL
   */
  private readonly imageUrlData: string;

  /**
   * Create a new DeleteImageCommand
   * @param imageUrl URL of the image to delete
   */
  constructor(imageUrl: string) {
    super(ContentEventSchemas.DELETE_IMAGE, {
      correlationId: uuid(),
    });
    this.imageUrlData = imageUrl;
  }

  /**
   * Convert to JSON
   * @returns JSON representation
   */
  toJSON(): { imageUrl: string } {
    return {
      imageUrl: this.imageUrlData,
    };
  }
}
