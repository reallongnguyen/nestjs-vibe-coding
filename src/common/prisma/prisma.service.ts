import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'nestjs-pino';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly logger: Logger) {
    super();
  }

  async onModuleInit() {
    await this.$connect();

    this.logger.log('prisma service: connect to database successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
