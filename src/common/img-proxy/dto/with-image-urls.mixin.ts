import { ApiProperty } from '@nestjs/swagger';
import {
  ImageUrlService,
  ImageUrlSet,
  ImageSize,
  ImageProcessingOptions,
} from '../services/image-url.service';

export type WithImageUrlMap<T> = T & {
  imageUrlMap: { [key: string]: ImageUrlSet };
};

export class WithImageUrlMapClass {
  @ApiProperty({ type: Object, additionalProperties: true })
  imageUrlMap: { [key: string]: ImageUrlSet };
}

/**
 * Creates a mixin that adds an image URL map to an object
 */
export const withImageUrlMap = (imageUrlService: ImageUrlService) => {
  return async <T extends object>(
    entity: T,
    options: ImageProcessingOptions = {},
  ): Promise<WithImageUrlMap<T>> => {
    const imageUrlMap = await imageUrlService.generateImageUrlMap(
      entity,
      options,
    );
    return { ...entity, imageUrlMap };
  };
};

// Re-export types for convenience
export { ImageSize, ImageProcessingOptions, ImageUrlSet };
