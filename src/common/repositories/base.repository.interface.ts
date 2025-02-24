import { PrismaService } from '../prisma/prisma.service';

export interface IBaseRepository {
  withTransaction(tx: Omit<PrismaService, '$transaction'>): this;
}
