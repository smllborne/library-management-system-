import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';   // type for building the filter (add .js if your project is ESM)
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBookDto } from './dto/create-book.dto.js';
import { UpdateBookDto } from './dto/update-book.dto.js';

@Injectable()
export class BooksService {
  constructor(private prisma: PrismaService) {}        // Nest injects the database client

  // C: create a book
  create(dto: CreateBookDto) {
    return this.prisma.book.create({ data: dto });     // INSERT; genreId must point to an existing genre
  }

  // R: list books with filter, search and pagination
  async findAll(genreId?: number, search?: string, page = 1, limit = 10) {
    const where: Prisma.BookWhereInput = {};           // start with no conditions (returns everything)

    if (genreId) where.genreld = genreId;              // only filter by genre if one was sent

    if (search) {
      where.OR = [                                     // match the title OR the author
        { title: { contains: search, mode: 'insensitive' } },   // "includes this text", ignoring case
        { author: { contains: search, mode: 'insensitive' } },
      ];
    }

    const take = Math.min(limit, 100);                 // rows per page, capped at 100
    const skip = (page - 1) * take;                    // rows to jump over: page 3 of 10 → skip 20

    const [data, total] = await this.prisma.$transaction([   // run both queries together
      this.prisma.book.findMany({
        where,
        skip,
        take,
        include: { genre: true },                      // also load each book's genre
        orderBy: { title: 'asc' },                     // stable order so pages don't shift
      }),
      this.prisma.book.count({ where }),               // total matches, ignoring skip/take
    ]);

    return {
      data,
      meta: { total, page, limit: take, totalPages: Math.ceil(total / take) },
    };
  }

  // R: get one book
  async findOne(id: number) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: { genre: true },
    });
    if (!book) throw new NotFoundException(`Book ${id} not found`);  // becomes HTTP 404
    return book;
  }

  // U: update a book
  async update(id: number, dto: UpdateBookDto) {
    await this.findOne(id);        
    if (!dto || Object.keys(dto).length === 0) {
      throw new BadRequestException('Provide at least one field to update');
    }                    // clean 404 if it doesn't exist
    return this.prisma.book.update({ where: { id }, data: dto });    // changes only the fields sent
  }

  // D: delete a book
  async remove(id: number) {
    await this.findOne(id);                            // clean 404 if it doesn't exist
    return this.prisma.book.delete({ where: { id } });
  }
}