import { OnEvent } from '@nestjs/event-emitter';
import { Injectable, Logger } from '@nestjs/common';
import { DeleteImageCommand } from 'src/common/event-manager/entities/events/commands/delete-image.command';
import { ContentEventSchemas } from 'src/common/event-manager/entities/events/schemas';
import { FileService } from '../../file.service';

@Injectable()
export class DeleteImageHandler {
  private readonly logger = new Logger(DeleteImageHandler.name);

  constructor(private readonly fileService: FileService) {}

  @OnEvent(ContentEventSchemas.DELETE_IMAGE.eventName)
  async execute(command: DeleteImageCommand): Promise<void> {
    try {
      const { imageUrl } = command.payload;
      this.logger.debug(`Deleting image: ${imageUrl}`);
      await this.fileService.deleteFile(imageUrl);
    } catch (error) {
      this.logger.error(`Failed to delete image: ${error.message}`, error);
      throw error;
    }
  }
}
