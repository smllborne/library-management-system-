# Library Management System

A NestJS REST API for a library catalog, with Prisma 7 and PostgreSQL. It supports
genre and book CRUD, filtering, search and pagination, and JWT authentication with
role-based access (PATRON and LIBRARIAN).

## Setup

1. `cd api`
2. `npm install`
3. Copy `.env.example` to `.env` and fill in `DATABASE_URL` and `JWT_SECRET`.
4. `npx prisma migrate dev`
5. `npx prisma generate`
6. `npx prisma db seed`
7. `npm run start:dev` (the API runs on http://localhost:3000)

## Endpoints

| Method | Path | Access |
| --- | --- | --- |
| POST | /auth/register | Public |
| POST | /auth/login | Public |
| GET | /genres, /genres/:id | Public |
| POST, PATCH, DELETE | /genres, /genres/:id | Librarian |
| GET | /books?genreId=&search=&page=&limit= | Public |
| GET | /books/:id | Public |
| POST, PATCH, DELETE | /books, /books/:id | Librarian |

A Postman collection with a request for every endpoint is in `docs/postman_collection.json`.

## Schema Decisions

**Why Book references Genre instead of embedding it.** Each Book stores only a
`genreId` foreign key that points to a row in the Genre table. A genre's name lives
in one place, so renaming "Sci-Fi" to "Science Fiction" is one update instead of
an edit to every book. It prevents typos and inconsistent spellings, makes
filtering by genre a cheap `WHERE genreId = ?`, and lets the database reject a
book whose genre doesn't exist. Embedding the genre name in each Book would
duplicate it across many rows and let the copies drift apart.

**Roles.** A `Role` enum (PATRON, LIBRARIAN) on User keeps the allowed values in the
database itself. New accounts default to PATRON, so librarians can only be created
by seeding or by editing the database, not through the public register endpoint.

**Passwords.** Passwords are hashed with bcrypt before saving, and the hash is never
returned in API responses.