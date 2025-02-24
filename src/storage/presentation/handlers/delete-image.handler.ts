import { OnEvent } from '@nestjs/event-emitter';
import { Injectable, Logger } from '@nestjs/common';
import { DeleteImageCommand } from 'src/common/event-bus/core/domain/commands/delete-image.command';
import { FileService } from '../../file.service';

@Injectable()
export class DeleteImageHandler {
  private readonly logger = new Logger(DeleteImageHandler.name);

  constructor(private readonly fileService: FileService) {}

  @OnEvent(DeleteImageCommand.getEventName())
  async execute(command: DeleteImageCommand): Promise<void> {
    try {
      this.logger.debug(`Deleting image: ${command.imageUrl}`);
      await this.fileService.deleteFile(command.imageUrl);
    } catch (error) {
      this.logger.error(`Failed to delete image: ${command.imageUrl}`, error);
      throw error;
    }
  }
}
