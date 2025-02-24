import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { DraftPostRepository } from '../draft-post.repository';
import { CreateDraftPostData } from '../../services/dtos/create-daft-post.dto';

describe('DraftPostRepository', () => {
  let repository: DraftPostRepository;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DraftPostRepository,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
      ],
    }).compile();

    repository = module.get(DraftPostRepository);
    prisma = module.get(PrismaService);
  });

  describe('findById', () => {
    it('should find a draft post by id', async () => {
      const expected = {
        id: 'draft-1',
        title: 'Test Post',
        content: { blocks: [] },
        topics: ['topic-1'],
        userId: 'user-1',
        subtitle: null,
        cover: null,
        publishedId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.draftPost.findUnique.mockResolvedValue(expected);

      const result = await repository.findById('draft-1');

      expect(prisma.draftPost.findUnique).toHaveBeenCalledWith({
        where: { id: 'draft-1' },
      });
      expect(result).toEqual(expected);
    });
  });

  describe('update', () => {
    it('should update a draft post', async () => {
      const input: Partial<CreateDraftPostData> = {
        title: 'Updated Title',
        content: { blocks: [] },
      };

      const expected = {
        id: 'draft-1',
        ...input,
        subtitle: null,
        cover: null,
        topics: ['topic-1'],
        userId: 'user-1',
        publishedId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.draftPost.update.mockResolvedValue(expected as any);

      const result = await repository.update('draft-1', input);

      expect(prisma.draftPost.update).toHaveBeenCalledWith({
        where: { id: 'draft-1' },
        data: input,
      });
      expect(result).toEqual(expected);
    });
  });
});
