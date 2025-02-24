import { PrismaService } from '../prisma/prisma.service';
import { IBaseRepository } from './base.repository.interface';

export abstract class BaseRepository implements IBaseRepository {
  protected prisma: PrismaService | Omit<PrismaService, '$transaction'>;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

  withTransaction(tx: Omit<PrismaService, '$transaction'>): this {
    const repo = Object.create(Object.getPrototypeOf(this));
    Object.assign(repo, this);
    repo.prisma = tx;
    return repo;
  }
}
