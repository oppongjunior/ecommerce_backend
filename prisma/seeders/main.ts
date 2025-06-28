import { faker, prisma } from './seed-context';
import { Category, Prisma, Product, SubCategory } from '@prisma/client';

function getRandomElement(arr: string[]) {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

const creatCategories = async () => {
  const categories: Category[] = [];
  for (let i = 0; i < 5; i++) {
    const category: Category = {
      name: faker.string.uuid(),
      description: faker.word.words({ count: { min: 20, max: 200 } }),
      image: faker.image.url(),
    } as Category;
    categories.push(category);
  }
  await prisma.category.createMany({ data: categories });
};
const createSubCategories = async () => {
  const categories = await prisma.category.findMany({ select: { id: true } });
  const categoryIds = categories.map((item) => item.id);

  const subCategories: SubCategory[] = [];
  for (let i = 0; i < 5; i++) {
    const subCategory: SubCategory = {
      name: faker.string.uuid(),
      description: faker.word.words({ count: { min: 20, max: 200 } }),
      categoryId: getRandomElement(categoryIds),
      image: faker.image.url(),
    } as SubCategory;
    subCategories.push(subCategory);
  }
  await prisma.subCategory.createMany({ data: subCategories });
};
const createProducts = async () => {
  const categories = await prisma.category.findMany({ select: { id: true } });
  const categoryIds = categories.map((item) => item.id);

  const subCategories = await prisma.subCategory.findMany({ select: { id: true } });
  const subCategoryIds = subCategories.map((item) => item.id);

  const products: Product[] = [];
  for (let i = 0; i < 500; i++) {
    const product: Product = {
      name: faker.string.uuid(),
      sku: faker.string.uuid(),
      price: new Prisma.Decimal(faker.number.int({ min: 10, max: 1000 })),
      quantity: faker.number.int({ max: 1000 }),
      brand: faker.company.name(),
      isActive: true,
      description: faker.word.words({ count: { min: 20, max: 200 } }),
      categoryId: getRandomElement(categoryIds),
      subcategoryId: getRandomElement(subCategoryIds),
      images: [faker.image.url(), faker.image.url(), faker.image.url()],
    } as Product;
    products.push(product);
  }

  await prisma.product.createMany({ data: products });
};

async function main() {}

main()
  .then(async () => {
    await creatCategories();
    await createSubCategories();
    await createProducts();
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
