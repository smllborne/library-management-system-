# Beginner's Cheat Sheet: TypeScript, NestJS, Prisma, and the Library API

This guide explains the building blocks of this project in simple language. Imagine the app is a library:

- The **database** is the library's filing cabinet.
- The **API** is the front desk where people make requests.
- The **server** is the librarian who handles those requests.

## 1. TypeScript: JavaScript with labels

TypeScript is a programming language that adds labels, called **types**, to JavaScript values. A type tells us what kind of thing a value should be. It is like putting a name tag on a lunch box so we know what belongs inside.

```ts
const title: string = 'The Hobbit';
const numberOfBooks: number = 3;
const isAvailable: boolean = true;
```

- `string` means text.
- `number` means a number.
- `boolean` means `true` or `false`.

Types help catch mistakes while writing code. For example, TypeScript can warn us if we try to use a number as if it were a book title.

### Classes and objects

A **class** is a recipe for making objects. An **object** is one thing made from that recipe.

```ts
class Book {
  constructor(
    public title: string,
    public author: string,
  ) {}
}

const book = new Book('The Hobbit', 'J.R.R. Tolkien');
```

In this app, DTOs and services are classes. A DTO is a recipe for what data an incoming request should contain.

## 2. NestJS: the library's front desk

NestJS is the framework this app uses to receive web requests and decide what to do with them. A request might say, “Please show me all the books.”

NestJS organizes work into three common parts:

- **Module:** a department that groups related work, such as books or sign-in.
- **Controller:** the front desk that receives a request and chooses the right action.
- **Service:** the worker that performs the task, such as looking up a book.

For example, the books controller receives a request for `/books`, then calls the books service. The service uses Prisma to get the books from the database.

### The request's journey

```text
Person -> Controller -> Service -> Prisma -> Database
Person <- Controller <- Service <- Prisma <- Database
```

The controller speaks HTTP, the language of web requests. The service handles the app's work. Prisma speaks to the database.

## 3. Prisma: describing the filing cabinet

Prisma is the tool this app uses to describe database tables and work with the database from TypeScript.

The file `prisma/schema.prisma` is the plan for the filing cabinet. A `model` describes a table, and each field describes information stored for one row. The following example uses Prisma 7's current `prisma-client` generator. The existing API in this repository still uses the older `prisma-client-js` generator, so do not mix the two client import styles.

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum Role {
  PATRON
  LIBRARIAN
}

model Genre {
  id    Int    @id @default(autoincrement())
  name  String @unique
  books Book[]
}

model Book {
  id           Int    @id @default(autoincrement())
  title        String
  author       String
  isbn         String @unique
  totalCopies  Int
  genreId      Int
  genre        Genre  @relation(fields: [genreId], references: [id])
}

model User {
  id       Int    @id @default(autoincrement())
  email    String @unique
  password String
  role     Role   @default(PATRON)
}
```

This plan says each genre can have many books, each book belongs to one genre, and each user has a role. Store a password hash in `password`, never the original password. The Prisma field is `genreId`, mapped to the existing database column `genreld` so current data remains compatible. Book details also include a description and an optional cover image.

### What the Prisma labels mean

- `Int` means a whole number; `String` means text.
- `@id` marks the main identifier for a row, like a library card number.
- `@default(autoincrement())` asks the database to choose the next number.
- `@unique` means no two rows may use the same value.
- `@relation` connects information in one table to information in another.
- `[]` means “many”; `Book[]` means one genre can have many books.
- `Role` is an `enum`: a list of allowed choices. This project's roles are `PATRON` and `LIBRARIAN`.

### How the tables connect in this app

- A **Genre** can have many **Books**.
- Each **Book** points to one **Genre** using the `genreId` field in TypeScript/Prisma.
- Each **User** has an email, a password hash, and a role.
- A new user gets the `PATRON` role by default.

The existing database column is spelled `genreld` (the character after `genre` is a lowercase “l”). Prisma maps its `genreId` field to that column.

### Schema, migration, and generated client

Think of a **migration** as a careful instruction sheet that changes the real filing cabinet to match the plan. After changing the schema, make a migration and regenerate Prisma's TypeScript client:

```bash
npx prisma migrate dev --name describe_your_change
npx prisma generate
```

This project uses Prisma 7. Its database connection URL is read from `DATABASE_URL` in `prisma7.config.ts`, rather than from the `datasource` block in `schema.prisma`.

## 4. CRUD: the four things we do with records

CRUD is a short name for four basic actions:

- **Create:** put a new record in the filing cabinet.
- **Read:** look at one or more records.
- **Update:** change information in a record.
- **Delete:** remove a record.

For books, the API has these routes:

| Action | Request | What it does |
| --- | --- | --- |
| Create | `POST /books` | Add a book |
| Read many | `GET /books` | List books; can also search, filter, and paginate |
| Read one | `GET /books/1` | Get the book with ID `1` |
| Update | `PATCH /books/1` | Change some information about book `1` |
| Delete | `DELETE /books/1` | Remove book `1` |

Prisma's matching database actions look like this:

```ts
// Create
await prisma.genre.create({ data: { name: 'Fantasy' } });

// Read
await prisma.genre.findMany();
await prisma.genre.findUnique({ where: { id: 1 } });

// Update
await prisma.genre.update({
  where: { id: 1 },
  data: { name: 'Science Fiction' },
});

// Delete
await prisma.genre.delete({ where: { id: 1 } });
```

The controller receives the route and request data. The service calls Prisma to do the database action. If a requested book does not exist, the books service returns a “not found” response.

## 5. DTOs and validation: checking the form

When someone sends a request, its body is like a paper form. A **DTO** (Data Transfer Object) describes which boxes are expected on that form. **Validation** checks whether the person filled them in correctly.

For example, `CreateBookDto` says that a new book needs:

- Text title, author, ISBN, and description.
- An optional text cover image.
- A whole-number copy count of at least 1.
- A whole-number `genreId`.

Decorators such as `@IsString()` and `@Min(1)` are the checkboxes that describe these rules:

```ts
@IsString()
@IsNotEmpty()
title: string;

@IsInt()
@Min(1)
totalCopies: number;
```

The app turns on a global NestJS `ValidationPipe` in `src/main.ts`. Its `whitelist: true` setting removes request fields that do not have validation rules on the DTO. Validation helps reject or clean up incorrect input before it reaches the service; it does not replace database rules such as `@unique`.

`UpdateBookDto` is based on `CreateBookDto`, but its fields are optional. That makes sense for `PATCH`: the caller can send just the field they want to change.

## 6. Authentication: checking who someone is

**Authentication** asks, “Who are you?” In this app, people can register and log in using an email and password.

### Registering

1. The app checks whether the email is already in use.
2. It turns the password into a one-way scrambled version called a **hash** using bcrypt.
3. It saves the hash, not the original password.

The hash is like a lock that can be checked later, but it is not the original key. Never store or return a user's plain-text password.

### Logging in

1. The app finds the user by email.
2. Bcrypt checks the submitted password against the saved hash.
3. If they match, the app gives the user a signed **JWT** (a token).

The token is like a temporary pass. The user sends it on later requests in an HTTP header:

```text
Authorization: Bearer <access_token>
```

The JWT guard and strategy check the token and make the user's ID, email, and role available to the request.

## 7. Roles: checking what someone may do

**Authorization** asks, “Are you allowed to do this?” It is different from authentication: knowing who someone is does not automatically mean they may do every task.

This app has two roles:

- `PATRON`: a library member.
- `LIBRARIAN`: a staff member.

The books controller currently requires a valid JWT and the `LIBRARIAN` role to **create** a book (`POST /books`). Do not assume every book action is protected: the other book routes do not currently have those guards applied.

## 8. Where to look in this project

- Prisma table plan: `prisma/schema.prisma`
- Prisma 7 database URL setup: `prisma7.config.ts`
- App-wide request validation: `src/main.ts`
- Book routes: `src/books/books.controller.ts`
- Book database work: `src/books/books.service.ts`
- Book request forms: `src/books/dto/`
- Registration and login routes: `src/auth/auth.controller.ts`
- Password and token work: `src/auth/auth.service.ts`
- Token checking: `src/auth/jwt-auth.guard.ts` and `src/auth/jwt.strategy.ts`
- Role checking: `src/auth/roles.guard.ts`
- Database connection service: `src/prisma/prisma.service.ts`

## 9. Commands: start a similar project from zero

Follow the steps in order: create the app, design and migrate the database, build CRUD, add validation, then add authentication and permissions. These steps use Prisma 7's current `prisma-client` generator, which writes the client to a folder in your source tree. When Nest asks questions, choose **npm** as the package manager.

### Step 1: Create a NestJS project

Run each command in PowerShell:

```powershell
npm install --global @nestjs/cli
nest new library-api
cd library-api
```

- `npm install --global @nestjs/cli` installs the Nest command-line tool.
- `nest new library-api` creates a TypeScript app and installs its starter packages.
- `cd library-api` moves the terminal into the new project folder.

The existing API here uses NodeNext/ESM, where relative TypeScript imports include `.js`. A new Nest starter may use a different module format; keep its TypeScript settings and import style consistent unless you deliberately switch it to NodeNext/ESM.

### Step 2: Install project packages

```powershell
npm install @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer @prisma/client @prisma/adapter-pg pg
npm install --save-dev prisma @types/bcrypt @types/passport-jwt @types/pg
```

- The first command adds the app's runtime tools: configuration, JWT login, password hashing, request validation, and PostgreSQL/Prisma access.
- The second command adds the Prisma command-line tool and TypeScript type definitions used while developing.

### Step 3: Initialize Prisma 7

```powershell
npx prisma init --datasource-provider postgresql
```

`npx` runs the Prisma CLI installed in this project. `prisma init` creates the Prisma schema and config files; the option selects PostgreSQL. Prisma 7 uses `prisma-client` by default.

### Step 4: Create the database and set local environment values

If PostgreSQL's command-line tools are installed and on your PATH, create the database with:

```powershell
createdb -U postgres library_db
```

`createdb` asks PostgreSQL to make an empty database named `library_db`. Replace `postgres` with your PostgreSQL username if needed. If `createdb` is unavailable, create the database named `library_db` in a database app such as pgAdmin instead.

Edit the `.env` file created by Prisma. Replace `USER` and `PASSWORD` with your local PostgreSQL username and password:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/library_db?schema=public"
JWT_SECRET="replace-this-with-a-long-random-secret"
```

`DATABASE_URL` tells Prisma where the database is. `JWT_SECRET` is used to sign login tokens. Keep real values private and out of source control.

Prisma 7 reads the database URL from `prisma.config.ts`. Check that the config points to `prisma/schema.prisma` and reads `DATABASE_URL`; keep the URL in the config, not in the schema's `datasource` block.

### Step 5: Design the schema

Edit `prisma/schema.prisma` using the library example in the Prisma section above. It defines the `Role`, `Genre`, `Book`, and `User` models and how a book relates to its genre. Keep the `prisma-client` generator and its `output = "../src/generated/prisma"` setting; Prisma 7 requires an output folder.

Before moving on, decide which details belong in each model, which values must be unique, and how the models connect. For passwords, the database field will hold a bcrypt hash, never a plain password. Prisma 7's datasource should name the provider (`postgresql`) but leave the URL to `prisma.config.ts`.

### Step 6: Validate, migrate, and generate the client

```powershell
npx prisma validate
npx prisma migrate dev --name init
npx prisma generate
```

- `npx prisma validate` checks that the schema is written correctly.
- `npx prisma migrate dev --name init` creates the first migration and applies it to your development database.
- `npx prisma generate` creates the TypeScript database client that your services import.

If the migration cannot connect, check that PostgreSQL is running, the database exists, and `DATABASE_URL` is correct. Whenever you later change the schema, make and apply a new migration, then regenerate the client:

```powershell
npx prisma migrate dev --name add_new_field
npx prisma generate
```

Replace `add_new_field` with a new short name describing the change.

### Step 7: Generate NestJS feature files

```powershell
npx nest g module prisma
npx nest g service prisma
npx nest g resource books
npx nest g resource genres
npx nest g module auth
npx nest g controller auth
npx nest g service auth
```

`npx nest g` means “use Nest's generator to create files.” These commands create the database module/service, book and genre CRUD scaffolds, and the auth module/controller/service. For each `resource` prompt, choose **REST API** and **Yes** to CRUD entry points. The generator creates starter code, not your database logic or security rules.

### Step 8: Connect Prisma and implement CRUD

Write the database connection in the Prisma service using `PrismaClient` and `PrismaPg`, then provide that service from the Prisma module. Import `PrismaClient` from the generated client folder (for this example, `../generated/prisma/client.js` from `src/prisma/prisma.service.ts`). Import the Prisma and feature modules into the app module, and configure `ConfigModule` so the app can read `.env`.

In the books service, implement these database actions. Have the controller receive each HTTP request and pass its information to the service:

| Action | Route | Prisma action |
| --- | --- | --- |
| Create | `POST /books` | `prisma.book.create(...)` |
| Read all | `GET /books` | `prisma.book.findMany(...)` |
| Read one | `GET /books/:id` | `prisma.book.findUnique(...)` |
| Update | `PATCH /books/:id` | `prisma.book.update(...)` |
| Delete | `DELETE /books/:id` | `prisma.book.delete(...)` |

Check that a book exists before updating or deleting it. If it does not, return a “not found” response.

### Step 9: Add request validation

Create DTO classes for creating and updating books. Add `class-validator` decorators that describe good input: for example, a title must be text and not empty, and the number of copies must be a whole number greater than zero. Make update fields optional because a `PATCH` request may change only one field.

In `src/main.ts`, turn on Nest's global `ValidationPipe` with `whitelist: true`. This checks incoming request forms against their DTOs and removes fields that have no validation rules. Try a valid and invalid request; the invalid one should receive a client error instead of being saved.

### Step 10: Add authentication and role permissions

Implement registration and login in the auth service:

1. Registration checks for an existing email, hashes the password with bcrypt, and saves the user.
2. Login finds the user and compares the submitted password with the saved hash.
3. If the password is correct, the app signs a JWT using `JWT_SECRET`.
4. Configure the JWT strategy and guard to check tokens in `Authorization: Bearer <access_token>`.
5. Add a role guard to routes that only librarians may use.

Authentication checks who the person is; authorization checks what they may do. Test a successful registration and login, a wrong password, a request without a token, and a request from a user with the wrong role. The generator does not implement these steps for you; they require code in the auth service, DTOs, JWT strategy, and guards.

### Step 11: Check and run the finished app

```powershell
npx prisma generate
npm run build
npm test
npm run test:e2e
npm run start:dev
```

- `npx prisma generate` refreshes the database client after schema changes.
- `npm run build` checks that the TypeScript app compiles.
- `npm test` runs unit tests.
- `npm run test:e2e` runs end-to-end API tests.
- `npm run start:dev` starts the app in development mode; stop it with `Ctrl+C`.

To open Prisma's visual database browser, stop the app if needed and run:

```powershell
npx prisma studio
```

`prisma studio` lets you view and edit development database records in a browser.

## 10. Handy commands

Run these from the `api` folder:

```bash
npm install             # Install the packages listed by the project
npx prisma generate     # Create/update Prisma's TypeScript client
npm run start:dev       # Run the app while developing
npm run build           # Check that the app compiles
npm test                # Run unit tests
npm run test:e2e        # Run end-to-end tests
```

The app needs a PostgreSQL connection in `DATABASE_URL`. Authentication also needs `JWT_SECRET`. Keep these values in your local `.env` file and do not share or commit real secrets.

## 11. A simple way to remember it

```text
TypeScript labels the data.
NestJS receives the request and organizes the work.
DTO validation checks the request form.
The service decides what work to do.
Prisma reads or changes the database.
Authentication checks identity; roles check permission.
```
