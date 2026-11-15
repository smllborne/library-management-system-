import 'dotenv/config';
import 'dotenv/config';                                    // load .env; the seed runs outside Nest, so ConfigModule isn't available
import { PrismaPg } from '@prisma/adapter-pg';             // Prisma 7 needs a driver adapter here too
import * as bcrypt from 'bcrypt';
import { PrismaClient, Role } from '@prisma/client'; // generated client (add .js if your project is ESM)

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL }); // same connection setup as PrismaService
const prisma = new PrismaClient({ adapter });

// genre name → its books (sample data; ISBNs only need to be unique)
const catalog: Record<string, { title: string; author: string; isbn: string; totalCopies: number }[]> = {
  Fantasy: [
    { title: 'The Hobbit', author: 'J.R.R. Tolkien', isbn: '9780547928227', totalCopies: 4 },
    { title: 'The Fellowship of the Ring', author: 'J.R.R. Tolkien', isbn: '9780547928210', totalCopies: 3 },
    { title: 'A Wizard of Earthsea', author: 'Ursula K. Le Guin', isbn: '9780547773742', totalCopies: 2 },
    { title: 'The Name of the Wind', author: 'Patrick Rothfuss', isbn: '9780756404741', totalCopies: 3 },
  ],
  'Science Fiction': [
    { title: 'Dune', author: 'Frank Herbert', isbn: '9780441013593', totalCopies: 5 },
    { title: 'Neuromancer', author: 'William Gibson', isbn: '9780441569595', totalCopies: 2 },
    { title: 'Foundation', author: 'Isaac Asimov', isbn: '9780553293357', totalCopies: 3 },
    { title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', isbn: '9780441478125', totalCopies: 2 },
  ],
  Mystery: [
    { title: 'And Then There Were None', author: 'Agatha Christie', isbn: '9780062073488', totalCopies: 4 },
    { title: 'Gone Girl', author: 'Gillian Flynn', isbn: '9780307588371', totalCopies: 3 },
    { title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson', isbn: '9780307949486', totalCopies: 2 },
  ],
  'Non-Fiction': [
    { title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '9780062316110', totalCopies: 4 },
    { title: 'Educated', author: 'Tara Westover', isbn: '9780399590504', totalCopies: 3 },
    { title: 'Atomic Habits', author: 'James Clear', isbn: '9780735211292', totalCopies: 5 },
  ],
  Technology: [
    { title: 'The Pragmatic Programmer', author: 'Andrew Hunt', isbn: '9780135957059', totalCopies: 2 },
    { title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', totalCopies: 3 },
  ],
};

async function main() {
  for (const [genreName, books] of Object.entries(catalog)) {
    const genre = await prisma.genre.upsert({              // upsert = create if missing, otherwise reuse; makes the seed safe to run twice
      where: { name: genreName },                          // name is @unique, so we can look it up by it
      update: {},                                          // nothing to change if it already exists
      create: { name: genreName },
    });

    for (const book of books) {
      await prisma.book.upsert({
        where: { isbn: book.isbn },                        // isbn is @unique
        update: {},
        create: { ...book, genre: { connect: { id: genre.id } } },            // link the book to its genre by id
      });
    }
  }

  const passwordHash = await bcrypt.hash('Librarian123!', 10); // never store the raw password
  await prisma.user.upsert({
    where: { email: 'librarian@library.test' },
    update: {},
    create: { email: 'librarian@library.test', password: passwordHash, role: Role.LIBRARIAN },
  });

  console.log('Seed complete');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })    // show the error and exit non-zero so failures are visible
  .finally(() => prisma.$disconnect());                    // always close the connection pool, or the script hangs