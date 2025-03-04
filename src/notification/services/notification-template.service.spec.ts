import { Test, TestingModule } from '@nestjs/testing';
import { IEventBus } from 'src/common';
import { AppError } from 'src/common/models';
import { NotificationTemplateService } from './notification-template.service';
import { INotificationTemplateRepository } from './interfaces/notification-template-repository.interface';
import {
  NotificationTemplateDomain,
  TemplateLanguage,
} from '../entities/notification-template.domain';

describe('NotificationTemplateService', () => {
  let service: NotificationTemplateService;
  let mockTemplateRepository: jest.Mocked<INotificationTemplateRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;

  const mockTemplate: jest.Mocked<NotificationTemplateDomain> = {
    id: 'template-id-1',
    name: 'Test Template',
    type: 'test-template',
    content: {
      [TemplateLanguage.EN]: 'Hello {{name}}!',
      [TemplateLanguage.VI]: 'Xin chào {{name}}!',
    },
    version: '1.0.0',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    getContent: jest.fn(),
    setContent: jest.fn(),
    validate: jest.fn(),
    checkRequiredVariables: jest.fn(),
    createNewVersion: jest.fn(),
  };

  beforeEach(async () => {
    mockTemplateRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByType: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getActiveTemplatesByTypes: jest.fn(),
    };

    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationTemplateService,
        {
          provide: 'INotificationTemplateRepository',
          useValue: mockTemplateRepository,
        },
        {
          provide: 'IEventBus',
          useValue: mockEventBus,
        },
      ],
    }).compile();

    service = module.get<NotificationTemplateService>(
      NotificationTemplateService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllTemplates', () => {
    it('should return all templates', async () => {
      mockTemplateRepository.findAll.mockResolvedValue([mockTemplate]);

      const result = await service.getAllTemplates();

      expect(result).toEqual([mockTemplate]);
      expect(mockTemplateRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('getTemplateById', () => {
    it('should return a template by id', async () => {
      mockTemplateRepository.findById.mockResolvedValue(mockTemplate);

      const result = await service.getTemplateById('template-id-1');

      expect(result).toEqual(mockTemplate);
      expect(mockTemplateRepository.findById).toHaveBeenCalledWith(
        'template-id-1',
      );
    });

    it('should throw an error if template not found', async () => {
      mockTemplateRepository.findById.mockResolvedValue(null);

      await expect(service.getTemplateById('non-existent-id')).rejects.toThrow(
        AppError,
      );
    });
  });

  describe('getTemplateByType', () => {
    it('should return a template by type', async () => {
      mockTemplateRepository.findByType.mockResolvedValue(mockTemplate);

      const result = await service.getTemplateByType('test-template');

      expect(result).toEqual(mockTemplate);
      expect(mockTemplateRepository.findByType).toHaveBeenCalledWith(
        'test-template',
      );
    });

    it('should throw an error if template not found', async () => {
      mockTemplateRepository.findByType.mockResolvedValue(null);

      await expect(
        service.getTemplateByType('non-existent-type'),
      ).rejects.toThrow(AppError);
    });
  });

  describe('renderTemplate', () => {
    it('should render a template with provided data', async () => {
      mockTemplateRepository.findByType.mockResolvedValue(mockTemplate);
      mockTemplate.getContent.mockReturnValue('Hello {{name}}!');

      const result = await service.renderTemplate(
        'test-template',
        { name: 'John' },
        TemplateLanguage.EN,
      );

      expect(result).toBe('Hello John!');
      expect(mockTemplateRepository.findByType).toHaveBeenCalledWith(
        'test-template',
      );
      expect(mockTemplate.getContent).toHaveBeenCalledWith(TemplateLanguage.EN);
    });

    it('should throw an error if template content not found for language', async () => {
      mockTemplateRepository.findByType.mockResolvedValue(mockTemplate);
      mockTemplate.getContent.mockReturnValue(undefined);

      await expect(
        service.renderTemplate(
          'test-template',
          { name: 'John' },
          TemplateLanguage.EN,
        ),
      ).rejects.toThrow(AppError);
    });
  });

  describe('hotReloadTemplate', () => {
    it('should reload a template and clear cache', async () => {
      mockTemplateRepository.findByType.mockResolvedValue(mockTemplate);
      mockTemplate.content = {
        [TemplateLanguage.EN]: 'Hello {{name}}!',
        [TemplateLanguage.VI]: 'Xin chào {{name}}!',
      };

      const result = await service.hotReloadTemplate('test-template');

      expect(result).toBe(true);
      expect(mockTemplateRepository.findByType).toHaveBeenCalledWith(
        'test-template',
      );
    });

    it('should throw an error if template compilation fails', async () => {
      mockTemplateRepository.findByType.mockResolvedValue(mockTemplate);
      mockTemplate.content = {
        [TemplateLanguage.EN]: 'Hello {{name!', // Invalid Handlebars syntax
        [TemplateLanguage.VI]: 'Xin chào {{name}}!',
      };

      await expect(service.hotReloadTemplate('test-template')).rejects.toThrow(
        AppError,
      );
    });
  });

  describe('validateTemplateVariables', () => {
    it('should validate template variables', () => {
      mockTemplate.checkRequiredVariables.mockReturnValue({
        [TemplateLanguage.EN]: [],
        [TemplateLanguage.VI]: [],
      });

      const result = service.validateTemplateVariables(mockTemplate, ['name']);

      expect(result.isValid).toBe(true);
      expect(result.missingVariables).toBeUndefined();
      expect(mockTemplate.checkRequiredVariables).toHaveBeenCalledWith([
        'name',
      ]);
    });

    it('should return missing variables if validation fails', () => {
      const missingVars = {
        [TemplateLanguage.EN]: ['age'],
        [TemplateLanguage.VI]: ['age'],
      };
      mockTemplate.checkRequiredVariables.mockReturnValue(missingVars);

      const result = service.validateTemplateVariables(mockTemplate, [
        'name',
        'age',
      ]);

      expect(result.isValid).toBe(false);
      expect(result.missingVariables).toEqual(missingVars);
      expect(mockTemplate.checkRequiredVariables).toHaveBeenCalledWith([
        'name',
        'age',
      ]);
    });
  });
});
