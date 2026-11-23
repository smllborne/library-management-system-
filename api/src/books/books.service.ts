import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBookDto } from './dto/create-book.dto.js';
import { UpdateBookDto } from './dto/update-book.dto.js';

@Injectable()
export class BooksService {
  constructor(private prisma: PrismaService) {}
 
  create(dto: CreateBookDto) {
    const { genreId, ...bookData } = dto;
    return this.prisma.book.create({
      data: {
        ...bookData,
        genre: { connect: { id: genreId } },
      },
    });
  }

  findAll(genreId?: string, search?: string, page = 1, limit = 20) {
    return this.prisma.book.findMany({
      where: {
        ...(genreId && { genreId: Number(genreId) }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { author: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: { genre: true },
      skip: (page - 1) * limit,
      take: Number(limit),
    });
  }
 
  async findOne(id: number) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: { genre: true },
    });
    if (!book) throw new NotFoundException(`Book ${id} not found`);
    return book;
  }

  async update(id: number, dto: UpdateBookDto) {
    await this.findOne(id);
    if (!dto || Object.keys(dto).length === 0) {
      throw new BadRequestException('Provide at least one field to update');
    }
    const { genreId, ...bookData } = dto;
    return this.prisma.book.update({
      where: { id },
      data: {
        ...bookData,
        ...(genreId !== undefined && { genre: { connect: { id: genreId } } }),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.book.delete({ where: { id } });
  }
}