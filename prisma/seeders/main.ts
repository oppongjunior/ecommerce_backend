import { faker, prisma } from './seed-context';
import { Prisma } from '@prisma/client';

const categories = [
  { name: 'Accessories', subcategories: ['Phone Accessories', 'Computer Accessories', 'Home Appliances Accessories'] },
  { name: 'Air Conditioners', subcategories: ['Wall-Mounted AC', 'Portable AC', 'Split AC'] },
  { name: 'Computers', subcategories: ['Laptops', 'Desktops', 'Tablets'] },
  { name: 'Fridges', subcategories: ['Single Door', 'Double Door', 'Mini Fridges'] },
  { name: 'Home Appliances', subcategories: ['Kitchen Appliances', 'Laundry Appliances', 'Cleaning Appliances'] },
  {
    name: 'Phones',
    subcategories: ['Smartphones', 'Feature Phones', 'Phone Accessories', 'Tablets', 'Foldable', 'Yam'],
  },
  { name: 'Generator', subcategories: ['Portable Generators', 'Inverter Generators', 'Standby Generators'] },
  { name: 'Television', subcategories: ['LED TVs', 'OLED TVs', 'Smart TVs'] },
  { name: 'Fans', subcategories: ['Ceiling Fans', 'Pedestal Fans', 'Table Fans'] },
  { name: 'Combos', subcategories: ['Home Theater Combos', 'Appliance Bundles', 'Tech Combos'] },
  { name: 'Speakers', subcategories: ['Bluetooth Speakers', 'Home Audio Speakers', 'Portable Speakers'] },
];

const popularBrands = [
  {
    name: 'Apple',
    description: 'Premium smartphones, laptops, and accessories',
    logo: 'https://example.com/apple-logo.png',
  },
  {
    name: 'Samsung',
    description: 'Innovative phones, TVs, and home appliances',
    logo: 'https://example.com/samsung-logo.png',
  },
  { name: 'Dell', description: 'Reliable laptops and desktop computers', logo: 'https://example.com/dell-logo.png' },
  {
    name: 'LG',
    description: 'High-quality TVs, fridges, and air conditioners',
    logo: 'https://example.com/lg-logo.png',
  },
  { name: 'Sony', description: 'Advanced TVs, speakers, and electronics', logo: 'https://example.com/sony-logo.png' },
  {
    name: 'Bosch',
    description: 'Durable home appliances and kitchen equipment',
    logo: 'https://example.com/bosch-logo.png',
  },
  {
    name: 'Dyson',
    description: 'Innovative fans, vacuums, and home appliances',
    logo: 'https://example.com/dyson-logo.png',
  },
  {
    name: 'Panasonic',
    description: 'Versatile electronics and air conditioners',
    logo: 'https://example.com/panasonic-logo.png',
  },
  {
    name: 'Generac',
    description: 'Reliable generators for home and business',
    logo: 'https://example.com/generac-logo.png',
  },
  { name: 'Bose', description: 'Premium audio speakers and sound systems', logo: 'https://example.com/bose-logo.png' },
];

async function createBrands() {
  const brands = popularBrands.map((brand) => ({
    name: brand.name,
    description: brand.description,
    logo: brand.logo,
  }));

  return prisma.brand.createMany({
    data: brands,
    skipDuplicates: true,
  });
}

async function createCategories() {
  const categoryData: Prisma.CategoryCreateManyInput[] = categories.map((category) => ({
    name: category.name,
    description: faker.lorem.paragraph({ min: 3, max: 10 }),
    image: faker.image.url(),
  }));

  return prisma.category.createMany({
    data: categoryData,
    skipDuplicates: true,
  });
}

async function createSubCategories() {
  const createdCategories = await prisma.category.findMany({ select: { id: true, name: true } });
  const categoryMap = new Map(createdCategories.map((cat) => [cat.name, cat.id]));

  const subCategoryData: Prisma.SubCategoryCreateManyInput[] = [];

  categories.forEach((category) => {
    const categoryId = categoryMap.get(category.name);
    if (categoryId) {
      category.subcategories.forEach((subCat) => {
        subCategoryData.push({
          name: subCat,
          description: faker.lorem.paragraph({ min: 3, max: 10 }),
          categoryId,
          image: faker.image.url(),
        });
      });
    }
  });

  return prisma.subCategory.createMany({
    data: subCategoryData,
    skipDuplicates: true,
  });
}

async function createProducts() {
  const categories = await prisma.category.findMany({ select: { id: true } });
  const categoryIds = categories.map((item) => item.id);

  const subCategories = await prisma.subCategory.findMany({ select: { id: true, categoryId: true } });
  const brandIds = (await prisma.brand.findMany({ select: { id: true } })).map((item) => item.id);

  const products: Prisma.ProductCreateManyInput[] = Array.from({ length: 500 }, () => {
    const categoryId = categoryIds[Math.floor(Math.random() * categoryIds.length)];
    const validSubCategoryIds = subCategories.filter((sub) => sub.categoryId === categoryId).map((sub) => sub.id);

    return {
      name: faker.commerce.productName(),
      sku: faker.string.uuid(),
      price: new Prisma.Decimal(faker.number.int({ min: 10, max: 1000 })),
      quantity: faker.number.int({ max: 1000 }),
      isActive: true,
      description: faker.lorem.paragraph({ min: 3, max: 10 }),
      categoryId,
      subcategoryId:
        validSubCategoryIds.length > 0
          ? validSubCategoryIds[Math.floor(Math.random() * validSubCategoryIds.length)]
          : null,
      brandId: brandIds[Math.floor(Math.random() * brandIds.length)],
      images: Array.from({ length: 3 }, () => faker.image.url()),
    };
  });

  return prisma.product.createMany({
    data: products,
    skipDuplicates: true,
  });
}

async function main() {
  try {
    console.log('Starting database seeding...');

    const brands = await createBrands();
    console.log(`Created ${brands.count} brands`);

    const categoriesResult = await createCategories();
    console.log(`Created ${categoriesResult.count} categories`);

    const subCategories = await createSubCategories();
    console.log(`Created ${subCategories.count} subcategories`);

    const products = await createProducts();
    console.log(`Created ${products.count} products`);

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
