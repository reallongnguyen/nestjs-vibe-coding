import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Logger } from 'nestjs-pino';
import { ThrottlerModule } from '@nestjs/throttler';
import { InvitationStatus, UserRole } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { AuthGuard } from 'src/common/auth/adapter/presentation/nestjs/auth.guard';
import { JWTGuard } from 'src/common/auth/adapter/presentation/nestjs/jwt.guard';
import { RolesGuard } from 'src/common/auth/adapter/presentation/nestjs/role.guard';
import { JwtAuthCtxRepo } from 'src/common/auth/adapter/infrastructure/repositories/jwt-auth-ctx.repo';
import { PageOptionsDto } from 'src/common/presentation/dtos/page-options.dto';
import { InvitationController } from './invitation.controller';
import { CreateInvitationDto } from './dtos/create-invitation.dto';
import { VerifyInvitationDto } from './dtos/verify-invitation.dto';
import { AcceptInvitationDto } from './dtos/accept-invitation.dto';
import { InvitationResponseDto } from './dtos/invitation-response.dto';
import { InvitationVerificationResponseDto } from './dtos/invitation-verification-response.dto';
import { InvitationListResponseDto } from './dtos/invitation-list-response.dto';
import { Invitation } from '../entities/invitation.entity';
import { InvitationRateLimitGuard } from './middlewares/invitation-rate-limit.middleware';
import { IInvitationService } from '../services/interfaces/invitation-service.interface';

describe('InvitationController', () => {
  let controller: InvitationController;
  let invitationService: jest.Mocked<IInvitationService>;

  const mockUser = {
    id: 'test-user-id',
    authId: 'test-auth-id',
    email: 'test@example.com',
    phone: '+1234567890',
    firstName: 'Test',
    lastName: 'User',
    avatar: 'avatar.jpg',
    roles: [UserRole.USER],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    invitationService = {
      createInvitation: jest.fn(),
      verifyInvitation: jest.fn(),
      acceptInvitation: jest.fn(),
      getUserInvitations: jest.fn(),
      getUserInvitationStats: jest.fn(),
    } as jest.Mocked<IInvitationService>;

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            ttl: 3600,
            limit: 10,
          },
        ]),
      ],
      controllers: [InvitationController],
      providers: [
        {
          provide: 'IInvitationService',
          useValue: invitationService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            reset: jest.fn(),
          },
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            verbose: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-value'),
          },
        },
        {
          provide: JwtService,
          useValue: {
            decode: jest.fn().mockReturnValue({ sub: 'test-user-id' }),
            verify: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn().mockResolvedValue(mockUser),
            },
          },
        },
        JwtAuthCtxRepo,
        AuthGuard,
        JWTGuard,
        RolesGuard,
        InvitationRateLimitGuard,
      ],
    }).compile();

    controller = module.get<InvitationController>(InvitationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createInvitation', () => {
    it('should create an invitation', async () => {
      const createInvitationDto: CreateInvitationDto = {
        email: 'invited@example.com',
        message: 'Please join us!',
      };

      const mockInvitation = new Invitation({
        id: 'test-invitation-id',
        code: 'test-code',
        inviterId: mockUser.id,
        inviter: {
          id: mockUser.id,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          avatar: mockUser.avatar,
        },
        message: createInvitationDto.message,
        email: createInvitationDto.email,
        status: InvitationStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        acceptedBy: null,
        acceptedAt: null,
        expiresAt: null,
      });

      invitationService.createInvitation.mockResolvedValue(mockInvitation);

      const result = await controller.createInvitation(
        mockUser,
        createInvitationDto,
      );

      expect(result).toBeInstanceOf(InvitationResponseDto);
      expect(result).toEqual({
        id: mockInvitation.id,
        code: mockInvitation.code,
        inviterId: mockInvitation.inviterId,
        inviterName: mockInvitation.inviter?.firstName || 'Unknown',
        message: mockInvitation.message,
        email: mockInvitation.email,
        status: mockInvitation.status,
        expiresAt: undefined,
        acceptedAt: undefined,
        acceptedBy: undefined,
        createdAt: mockInvitation.createdAt,
        updatedAt: mockInvitation.updatedAt,
      });
    });
  });

  describe('verifyInvitation', () => {
    it('should verify an invitation', async () => {
      const verifyDto = { code: 'test-code' } as VerifyInvitationDto;
      const mockVerificationResult = {
        isValid: true,
        inviterId: mockUser.id,
        inviterName: `${mockUser.firstName} ${mockUser.lastName}`,
        message: 'Please join us!',
      };

      invitationService.verifyInvitation.mockResolvedValue(
        mockVerificationResult,
      );

      const result = await controller.verifyInvitation(verifyDto);

      expect(result).toBeInstanceOf(InvitationVerificationResponseDto);
      expect(result).toEqual(mockVerificationResult);
    });
  });

  describe('acceptInvitation', () => {
    it('should accept an invitation', async () => {
      const acceptDto = { code: 'test-code' } as AcceptInvitationDto;
      const mockInvitation = new Invitation({
        id: 'test-invitation-id',
        code: 'test-code',
        inviterId: mockUser.id,
        inviter: {
          id: mockUser.id,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          avatar: mockUser.avatar,
        },
        message: 'Please join us!',
        email: 'invited@example.com',
        status: InvitationStatus.ACCEPTED,
        createdAt: new Date(),
        updatedAt: new Date(),
        acceptedBy: 'test-user-id',
        acceptedAt: new Date(),
        expiresAt: null,
      });

      invitationService.acceptInvitation.mockResolvedValue(mockInvitation);

      const result = await controller.acceptInvitation(mockUser, acceptDto);

      expect(result).toBeInstanceOf(InvitationResponseDto);
      expect(result).toEqual({
        id: mockInvitation.id,
        code: mockInvitation.code,
        inviterId: mockInvitation.inviterId,
        inviterName: mockInvitation.inviter?.firstName || 'Unknown',
        message: mockInvitation.message,
        email: mockInvitation.email,
        status: mockInvitation.status,
        expiresAt: undefined,
        acceptedAt: mockInvitation.acceptedAt,
        acceptedBy: mockInvitation.acceptedBy,
        createdAt: mockInvitation.createdAt,
        updatedAt: mockInvitation.updatedAt,
      });
    });
  });

  describe('getUserInvitations', () => {
    it('should get user invitations', async () => {
      const mockInvitation = {
        id: 'test-invitation-id',
        code: 'test-code',
        inviterId: 'test-user-id',
        inviterName: 'Unknown',
        message: 'Please join us!',
        email: 'invited@example.com',
        status: 'PENDING',
        acceptedAt: undefined,
        acceptedBy: undefined,
        expiresAt: undefined,
        updatedAt: undefined,
        createdAt: new Date('2025-03-17T15:31:49.497Z'),
      };

      const mockInvitations = new InvitationListResponseDto({
        data: [mockInvitation],
        meta: {
          pageSize: 10,
          pageNumber: 1,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      invitationService.getUserInvitations.mockResolvedValue(mockInvitations);

      const pageOptionsDto = new PageOptionsDto();
      const result = await controller.getUserInvitations(
        mockUser,
        pageOptionsDto,
      );

      expect(result).toBeInstanceOf(InvitationListResponseDto);
      expect(result).toEqual(mockInvitations);
    });
  });

  describe('getUserInvitationStats', () => {
    it('should return user invitation statistics', async () => {
      const mockStats = {
        sent: 10,
        accepted: 5,
        conversionRate: 50,
      };

      invitationService.getUserInvitationStats.mockResolvedValue(mockStats);

      const result = await controller.getUserInvitationStats(mockUser);

      expect(result).toEqual(mockStats);
      expect(invitationService.getUserInvitationStats).toHaveBeenCalledWith(
        mockUser.id,
      );
    });
  });
});
