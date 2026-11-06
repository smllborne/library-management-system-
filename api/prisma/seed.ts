import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const genreNames = ["Fantasy", "Football", "Crime", "Biology"];
  const genres = await Promise.all(
    genreNames.map((name) =>
      prisma.genre.create({
        data: {name, slug: name.toLocaleLowerCase().replace(/\s+/g, "-")},
      }),
    ),
  );

  const sampleBooks = [
    {title: "The new Day", author: "P.M. Kimani", genre: "Biology"},
    {title: "Dome", author: "Frankline Maina", genre: "Football"},
    {title: "Doomsday", author: "Benedict", genre: "Crime"},
    {title: "Legendary Site", author: "Wainaina", genre: "Fantasy"},
    {title: "Educated", author: " Maina", genre: "Crime"},
    {title: "Sedated", author: "Joy White", genre: "Biology"},
    {title: "The goat", author: "Frank lampard", genre: "Football"},
    {title: "Hobbit", author: "Frankline ", genre: "Crime"},
    {title: "Dawn", author: "Faith Maina", genre: "Biology"},
    {title: "Fire World", author: "Justin Brown", genre: "Fantasy"},
    {title: "Inheritance", author: "Gilbert Gilmour", genre: "Fantasy"},
    {title: "Daan", author: "Frank Maina", genre: "Football"},
    {title: "Killer", author: "Jeff Kimani", genre: "Crime"},
    {title: "Skin", author: "Winnfred", genre: "Biology"},
    {title: "Human system", author: "Nyairo", genre: "Biology"},
];

for (const book of sampleBooks){
  const genre = genres.find((g) => g.name === book.genre);
  if (!genre) throw new Error(`Genre not found: ${book.genre}`);

  await prisma.book.create({
    data: {
      title: book.title,
      author: book.author,
      isbn: `978${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      description: `${book.title} buy ${book.author}`,
      totalCopies: 3,
      genreld: genre.id,
     },
   });
 }
}

main()
.catch(console.error)
.finally(() => prisma.$disconnect());