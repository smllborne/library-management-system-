# NestJS + Prisma + PostgreSQL Cheat Sheet

This is a quick reference for this project.

## 1) Project setup

### Install dependencies

```bash
npm install
```

If Prisma is not already installed:

```bash
npm install prisma @prisma/client @prisma/adapter-pg
```

If Nest config is not installed:

```bash
npm install @nestjs/config
```

## 2) Environment variables

Create a `.env` file in the `api/` folder:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
```

Example:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/library_db"
```

## 3) Prisma schema

File: `prisma/schema.prisma`

Example pattern:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Genre {
  id   Int    @id @default(autoincrement())
  name String @unique
}
```

## 4) Prisma client generation

Run:

```bash
npx prisma generate
```

If you change the schema and need migrations:

```bash
npx prisma migrate dev --name init
```

## 5) App module setup

File: `src/app.module.ts`

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { GenresModule } from './genres/genres.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GenresModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

## 6) Prisma module

File: `src/prisma/prisma.module.ts`

```ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

## 7) Prisma service

File: `src/prisma/prisma.service.ts`

```ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: config.getOrThrow<string>('DATABASE_URL'),
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

## 8) Service injection pattern

File: `src/genres/genres.service.ts`

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class GenresService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.genre.findMany({ orderBy: { name: 'asc' } });
  }
}
```

## 9) ESM import rule for this project

This project uses NodeNext/ESM, so relative imports must include `.js` in TypeScript source files.

Good:

```ts
import { PrismaService } from './prisma.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
```

Bad:

```ts
import { PrismaService } from './prisma.service';
import { PrismaService } from '../prisma/prisma.service';
```

## 10) Common commands

Start app:

```bash
npm run start:dev
```

Build app:

```bash
npm run build
```

Run tests:

```bash
npm test
```

Generate Prisma client:

```bash
npx prisma generate
```

Create migration:

```bash
npx prisma migrate dev --name <migration_name>
```

Reset database migration history (use carefully):

```bash
npx prisma migrate reset
```

## 11) Common error checklist

- `Cannot find module './prisma.service'` -> add `.js` in relative imports
- `Cannot find module '../prisma/prisma.service'` -> same issue
- `Cannot find module '../generated/prisma/client'` -> import from `@prisma/client` instead
- `ConfigService is not available` -> add `ConfigModule.forRoot({ isGlobal: true })`
- `DATABASE_URL is undefined` -> check `.env` file and variable name
- Prisma client methods missing -> import from `@prisma/client`, not a custom generated path

## 12) Useful Prisma patterns

Create:

```ts
await prisma.genre.create({ data: { name: 'Fantasy' } });
```

Read all:

```ts
await prisma.genre.findMany();
```

Find by id:

```ts
await prisma.genre.findUnique({ where: { id: 1 } });
```

Update:

```ts
await prisma.genre.update({
  where: { id: 1 },
  data: { name: 'Science Fiction' },
});
```

Delete:

```ts
await prisma.genre.delete({ where: { id: 1 } });
```

## 13) Notes for this project

- The Nest app expects a PostgreSQL database.
- Do not import Prisma client from a generated local path unless the generated folder actually exists.
- Keep `.env` in the `api/` folder.
- Use NodeNext/ESM-safe imports everywhere.

## 14) Quick sanity check

Before running the app, verify:

```bash
ls
cat .env
npx prisma generate
npm run build
```

If `npm run build` passes, the app wiring is usually correct.
