import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { AppError } from 'src/common';
import { ContentService } from '../../services/content.service';
import { GetContentsCommand } from '../../../feed/entities/commands/get-contents.command';

@Injectable()
@CommandHandler(GetContentsCommand)
export class GetContentsHandler implements ICommandHandler<GetContentsCommand> {
  private readonly logger = new Logger(GetContentsHandler.name);

  constructor(private readonly contentService: ContentService) {}

  async execute(command: GetContentsCommand) {
    const { contentIds } = command;

    try {
      this.logger.debug(`Getting contents for IDs: ${contentIds.join(', ')}`);

      const contents = await this.contentService.getContentByIds(contentIds);

      this.logger.debug(`Found ${contents.length} contents`);

      return contents;
    } catch (error) {
      this.logger.error(
        `Failed to get contents: ${error.message}`,
        error.stack,
      );
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('content.get_failed', error.message);
    }
  }
}
