import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { Topic } from '../entities/topic.entity';
import { ITopicRepository } from '../services/interfaces/topic.repository.interface';

@Injectable()
export class TopicRepository
  extends BaseRepository
  implements ITopicRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findManyByIds(ids: string[]): Promise<Topic[]> {
    return this.prisma.topic.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    }) as Promise<Topic[]>;
  }
}
