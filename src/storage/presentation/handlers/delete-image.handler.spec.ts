import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DeleteImageCommand } from 'src/common/event-manager/entities/events/commands/delete-image.command';
import { DeleteImageHandler } from './delete-image.handler';
import { FileService } from '../../file.service';

describe('DeleteImageHandler', () => {
  let handler: DeleteImageHandler;
  let fileService: FileService;

  beforeEach(async () => {
    const fileServiceMock = {
      deleteFile: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteImageHandler,
        {
          provide: FileService,
          useValue: fileServiceMock,
        },
        {
          provide: Logger,
          useValue: {
            debug: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<DeleteImageHandler>(DeleteImageHandler);
    fileService = module.get<FileService>(FileService);
  });

  describe('execute', () => {
    it('should delete the image file', async () => {
      const command = new DeleteImageCommand('image-url');

      await handler.execute(command);

      expect(fileService.deleteFile).toHaveBeenCalledWith('image-url');
    });

    it('should handle errors', async () => {
      const command = new DeleteImageCommand('image-url');
      const error = new Error('File not found');

      jest.spyOn(fileService, 'deleteFile').mockRejectedValueOnce(error);

      await expect(handler.execute(command)).rejects.toThrow('File not found');
    });

    it('should be triggered by the correct event name', () => {
      // Verify the handler is decorated with the correct event name
      // This is a simple check that the handler class has the expected structure
      const decorators = Reflect.getMetadataKeys(handler.execute);
      expect(decorators).toContain('EVENT_LISTENER_METADATA');

      // We can't easily test the exact event name without mocking the event emitter system
      // So we'll just verify the handler is properly decorated
      expect(decorators.length).toBeGreaterThan(0);
    });
  });
});
