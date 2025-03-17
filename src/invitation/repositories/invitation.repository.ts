import { Injectable, Inject } from '@nestjs/common';
import { InvitationStatus, PrismaClient } from '@prisma/client';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PageOptionsDto } from 'src/common/presentation/dtos/page-options.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  Invitation,
  InvitationWithInviter,
} from '../entities/invitation.entity';
import { IInvitationRepository } from '../services/interfaces/invitation-repository.interface';

@Injectable()
export class PrismaInvitationRepository implements IInvitationRepository {
  private readonly prisma: PrismaClient;
  private readonly CACHE_TTL = 3600; // 1 hour in seconds
  private readonly CACHE_PREFIX = 'invitation:';

  constructor(
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.prisma = prismaService;
  }

  private getCacheKey(code: string): string {
    return `${this.CACHE_PREFIX}${code}`;
  }

  async create(data: {
    inviterId: string;
    code: string;
    message?: string;
    email?: string;
    expiresAt?: Date;
  }): Promise<Invitation> {
    const invitation = await this.prisma.invitation.create({
      data: {
        ...data,
        status: InvitationStatus.PENDING,
      },
      include: {
        inviter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    const invitationEntity = new Invitation(
      invitation as InvitationWithInviter,
    );
    await this.cacheManager.set(
      this.getCacheKey(data.code),
      invitationEntity,
      this.CACHE_TTL,
    );

    return invitationEntity;
  }

  async findByCode(code: string): Promise<Invitation | null> {
    // Try to get from cache first
    const cached = await this.cacheManager.get<Invitation>(
      this.getCacheKey(code),
    );
    if (cached) {
      return new Invitation(cached as InvitationWithInviter);
    }

    // If not in cache, get from database
    const invitation = await this.prisma.invitation.findUnique({
      where: { code },
      include: {
        inviter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    if (!invitation) {
      return null;
    }

    const invitationEntity = new Invitation(
      invitation as InvitationWithInviter,
    );
    await this.cacheManager.set(
      this.getCacheKey(code),
      invitationEntity,
      this.CACHE_TTL,
    );

    return invitationEntity;
  }

  async updateStatus(
    id: string,
    status: InvitationStatus,
    acceptedBy?: string,
  ): Promise<Invitation> {
    const invitation = await this.prisma.invitation.update({
      where: { id },
      data: {
        status,
        acceptedAt: status === InvitationStatus.ACCEPTED ? new Date() : null,
        acceptedBy: status === InvitationStatus.ACCEPTED ? acceptedBy : null,
      },
      include: {
        inviter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    const invitationEntity = new Invitation(
      invitation as InvitationWithInviter,
    );
    // Invalidate cache when status changes
    await this.cacheManager.del(this.getCacheKey(invitation.code));

    return invitationEntity;
  }

  async findByInviterId(
    inviterId: string,
    pageOptions: PageOptionsDto,
  ): Promise<[Invitation[], number]> {
    const { skip, take } = pageOptions.toDatabaseQuery();
    const [invitations, total] = await Promise.all([
      this.prisma.invitation.findMany({
        where: { inviterId },
        skip,
        take,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          inviter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.invitation.count({
        where: { inviterId },
      }),
    ]);

    return [
      invitations.map((i) => new Invitation(i as InvitationWithInviter)),
      total,
    ];
  }

  async getInvitationStats(inviterId: string): Promise<{
    sent: number;
    accepted: number;
  }> {
    const [sent, accepted] = await Promise.all([
      this.prisma.invitation.count({
        where: { inviterId },
      }),
      this.prisma.invitation.count({
        where: {
          inviterId,
          status: InvitationStatus.ACCEPTED,
        },
      }),
    ]);

    return { sent, accepted };
  }
}
