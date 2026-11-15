import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GenresService } from './genres.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('GenresService', () => {
  const prisma = {
    genre: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  };
  const service = new GenresService(prisma as unknown as PrismaService);

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.genre.findUnique.mockResolvedValue({ id: 1, name: 'Poetry' });
  });

  it('returns a conflict when deleting a genre that still has books', async () => {
    prisma.genre.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Foreign key constraint violated', {
        code: 'P2003',
        clientVersion: '7.10.1',
      }),
    );

    await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictException);
  });

  it('rethrows unexpected errors from Prisma', async () => {
    const error = new Error('Database unavailable');
    prisma.genre.delete.mockRejectedValue(error);

    await expect(service.remove(1)).rejects.toBe(error);
  });
});
