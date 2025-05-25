import { Test, TestingModule } from '@nestjs/testing';
import { InvitationStatus } from 'src/generated/client';
import { EventBusAdapter } from 'src/common/event-manager/services/event-bus.adapter';
import { EVENT_BUS_TOKEN } from 'src/common/event-manager/entities/tokens';
import { AppError } from 'src/common/errors/app.error';
import { PageOptionsDto } from 'src/common/presentation/dtos/page-options.dto';
import { Logger } from 'nestjs-pino';
import { Invitation } from '../entities/invitation.entity';
import { INVITATION_ERRORS } from '../entities/errors';
import { InvitationService } from './invitation.service';
import { IInvitationRepository } from './interfaces/invitation-repository.interface';

describe('InvitationService', () => {
  let service: InvitationService;
  let repository: jest.Mocked<IInvitationRepository>;
  let eventBus: jest.Mocked<EventBusAdapter>;

  const mockInvitation = {
    id: 'invitation-id',
    code: 'test-code',
    inviterId: 'inviter-id',
    inviter: {
      id: 'inviter-id',
      firstName: 'Test',
      lastName: 'User',
      avatar: null,
    },
    status: InvitationStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
    isValid: jest.fn().mockReturnValue(true),
    isExpired: jest.fn().mockReturnValue(false),
    isAccepted: jest.fn().mockReturnValue(false),
  } as unknown as Invitation;

  beforeEach(async () => {
    const repositoryMock = {
      create: jest.fn(),
      findByCode: jest.fn(),
      updateStatus: jest.fn(),
      findByInviterId: jest.fn(),
      getInvitationStats: jest.fn(),
    };

    const eventBusMock = {
      publish: jest.fn(),
    };

    const loggerMock = {
      setContext: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationService,
        {
          provide: 'IInvitationRepository',
          useValue: repositoryMock,
        },
        {
          provide: EVENT_BUS_TOKEN,
          useValue: eventBusMock,
        },
        {
          provide: Logger,
          useValue: loggerMock,
        },
      ],
    }).compile();

    service = module.get<InvitationService>(InvitationService);
    repository = module.get(
      'IInvitationRepository',
    ) as jest.Mocked<IInvitationRepository>;
    eventBus = module.get(EVENT_BUS_TOKEN) as jest.Mocked<EventBusAdapter>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createInvitation', () => {
    it('should create an invitation and publish an event', async () => {
      repository.create.mockResolvedValue(mockInvitation);

      const result = await service.createInvitation('inviter-id', {
        message: 'Test message',
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          inviterId: 'inviter-id',
          message: 'Test message',
        }),
      );
      expect(eventBus.publish).toHaveBeenCalled();
      expect(result).toEqual(mockInvitation);
    });
  });

  describe('verifyInvitation', () => {
    it('should return verification result for valid invitation', async () => {
      repository.findByCode.mockResolvedValue(mockInvitation);

      const result = await service.verifyInvitation('test-code');

      expect(repository.findByCode).toHaveBeenCalledWith('test-code');
      expect(result).toEqual({
        isValid: true,
        inviterId: 'inviter-id',
        inviterName: 'Test',
        message: undefined,
      });
    });

    it('should throw an error if invitation is not found', async () => {
      repository.findByCode.mockResolvedValue(null);

      await expect(service.verifyInvitation('invalid-code')).rejects.toThrow(
        new AppError(
          'invitation-not-found',
          INVITATION_ERRORS['invitation-not-found'],
          {
            params: { code: 'invalid-code' },
          },
        ),
      );
    });
  });

  describe('acceptInvitation', () => {
    it('should accept a valid invitation and publish an event', async () => {
      repository.findByCode.mockResolvedValue(mockInvitation);
      repository.updateStatus.mockResolvedValue({
        ...mockInvitation,
        status: InvitationStatus.ACCEPTED,
        acceptedBy: 'accepter-id',
        acceptedAt: new Date(),
      } as Invitation);

      const result = await service.acceptInvitation('test-code', 'accepter-id');

      expect(repository.findByCode).toHaveBeenCalledWith('test-code');
      expect(repository.updateStatus).toHaveBeenCalledWith(
        'invitation-id',
        InvitationStatus.ACCEPTED,
        'accepter-id',
      );
      expect(eventBus.publish).toHaveBeenCalled();
      expect(result.status).toBe(InvitationStatus.ACCEPTED);
    });

    it('should throw an error if user tries to accept their own invitation', async () => {
      repository.findByCode.mockResolvedValue(mockInvitation);

      await expect(
        service.acceptInvitation('test-code', 'inviter-id'),
      ).rejects.toThrow(
        new AppError('self-invitation', INVITATION_ERRORS['self-invitation']),
      );
    });
  });

  describe('getUserInvitations', () => {
    it('should return user invitations with pagination', async () => {
      const pageOptions = new PageOptionsDto();
      const mockInvitations = [mockInvitation];
      repository.findByInviterId.mockResolvedValue([mockInvitations, 1]);

      const result = await service.getUserInvitations(
        'inviter-id',
        pageOptions,
      );

      expect(repository.findByInviterId).toHaveBeenCalledWith(
        'inviter-id',
        pageOptions,
      );
      expect(result.data).toHaveLength(1);
      expect(result.meta.totalItems).toBe(1);
    });
  });

  describe('getUserInvitationStats', () => {
    it('should return user invitation statistics', async () => {
      repository.getInvitationStats.mockResolvedValue({
        sent: 10,
        accepted: 5,
      });

      const result = await service.getUserInvitationStats('inviter-id');

      expect(repository.getInvitationStats).toHaveBeenCalledWith('inviter-id');
      expect(result).toEqual({
        sent: 10,
        accepted: 5,
        conversionRate: 50,
      });
    });
  });
});
