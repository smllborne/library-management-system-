import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, DefaultValuePipe } from '@nestjs/common';
import { BooksService } from './books.service.js';
import { CreateBookDto } from './dto/create-book.dto.js';
import { UpdateBookDto } from './dto/update-book.dto.js';
import { UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ROLES } from '../auth/roles.decorator.js';


@Controller('books')
export class BooksController {
  constructor(private books: BooksService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ROLES(Role.LIBRARIAN)
  @Post()
  create(@Body() dto: CreateBookDto) {
    return this.books.create(dto);
  }

  @Get()
  findAll(
    @Query ('genreld', new ParseIntPipe({optional: true})) genreld?:number,
    @Query ('search') search?: string,
    @Query ('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query ('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
){
  return this.books.findAll(genreld, search, page, limit);
}

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: string) {
    return this.books.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: string, @Body() updateBookDto: UpdateBookDto) {
    return this.books.update(+id, updateBookDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: string) {
    return this.books.remove(+id);
  }
}
