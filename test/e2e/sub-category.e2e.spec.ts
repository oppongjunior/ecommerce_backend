import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  clearDatabase,
  createAdmin,
  createTestApp,
  createUser,
  getAdminToken,
  getUserToken,
  graphqlRequest,
} from '../e2e.utils';

// GraphQL queries and mutations
const CREATE_SUBCATEGORY = `
  mutation CreateSubCategory($input: CreateSubCategoryInput!) {
    createSubCategory(input: $input) {
      id
      name
      description
      image
      categoryId
      createdAt
      updatedAt
    }
  }
`;

const FIND_ALL_SUBCATEGORIES = `
  query SubCategories {
    subCategories {
      id
      name
      description
      image
      categoryId
      createdAt
      updatedAt
    }
  }
`;

const FIND_ONE_SUBCATEGORY = `
  query SubCategory($id: String!) {
    subCategory(id: $id) {
      id
      name
      description
      image
      categoryId
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_SUBCATEGORY = `
  mutation UpdateSubCategory($id: String!, $input: UpdateSubCategoryInput!) {
    updateSubCategory(id: $id, input: $input) {
      id
      name
      description
      image
      categoryId
      createdAt
      updatedAt
    }
  }
`;

const REMOVE_SUBCATEGORY = `
  mutation RemoveSubCategory($id: String!) {
    removeSubCategory(id: $id) {
      id
      name
    }
  }
`;

describe('SubCategory E2E Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;

    await app.init();
    await clearDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });
  describe('Admin SubCategory Actions', () => {
    let adminToken: string;

    beforeAll(async () => {
      await createAdmin(prisma);
      adminToken = await getAdminToken(app);
    });

    it('should create a new subcategory', async () => {
      const category = await prisma.category.create({
        data: {
          name: 'Electronics',
          description: 'Devices and gadgets',
          image: 'electronics.jpg',
        },
      });

      const subCategoryInput = {
        name: 'Smartphones',
        description: 'Mobile phones and accessories',
        image: 'smartphones.jpg',
        categoryId: category.id,
      };

      const response = await graphqlRequest(app, CREATE_SUBCATEGORY, { input: subCategoryInput })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.createSubCategory).toBeDefined();
      expect(response.body.data.createSubCategory).toMatchObject({
        name: subCategoryInput.name,
        description: subCategoryInput.description,
        image: subCategoryInput.image,
        categoryId: subCategoryInput.categoryId,
      });
      expect(response.body.data.createSubCategory.id).toBeDefined();
      expect(response.body.data.createSubCategory.createdAt).toBeDefined();
      expect(response.body.data.createSubCategory.updatedAt).toBeDefined();

      // Verify in database
      const subCategoryInDb = await prisma.subCategory.findUnique({
        where: { id: response.body.data.createSubCategory.id },
      });
      expect(subCategoryInDb).toMatchObject(subCategoryInput);
    });

    it('should retrieve all subcategories', async () => {
      const category = await prisma.category.create({
        data: {
          name: 'Books',
          description: 'All kinds of books',
          image: 'books.jpg',
        },
      });

      await prisma.subCategory.create({
        data: {
          name: 'Fiction',
          description: 'Fictional books',
          image: 'fiction.jpg',
          categoryId: category.id,
        },
      });

      const response = await graphqlRequest(app, FIND_ALL_SUBCATEGORIES)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.subCategories).toBeInstanceOf(Array);
      expect(response.body.data.subCategories.length).toBeGreaterThan(0);
      expect(response.body.data.subCategories).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Fiction',
            description: 'Fictional books',
            image: 'fiction.jpg',
            categoryId: category.id,
          }),
        ]),
      );
    });

    it('should retrieve a subcategory by ID', async () => {
      const category = await prisma.category.create({
        data: {
          name: 'Clothing',
          description: 'Apparel and accessories',
          image: 'clothing.jpg',
        },
      });

      const subCategory = await prisma.subCategory.create({
        data: {
          name: 'Men’s Clothing',
          description: 'Men’s apparel',
          image: 'mens-clothing.jpg',
          categoryId: category.id,
        },
      });

      const response = await graphqlRequest(app, FIND_ONE_SUBCATEGORY, { id: subCategory.id })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.subCategory).toMatchObject({
        id: subCategory.id,
        name: 'Men’s Clothing',
        description: 'Men’s apparel',
        image: 'mens-clothing.jpg',
        categoryId: category.id,
      });
    });

    it('should update an existing subcategory', async () => {
      const category = await prisma.category.create({
        data: {
          name: 'Furniture',
          description: 'Home furnishings',
          image: 'furniture.jpg',
        },
      });

      const subCategory = await prisma.subCategory.create({
        data: {
          name: 'Chairs',
          description: 'Various chairs',
          image: 'chairs.jpg',
          categoryId: category.id,
        },
      });

      const updateInput = {
        name: 'Updated Chairs',
        description: 'Updated chair collection',
        image: 'updated-chairs.jpg',
        categoryId: category.id,
      };

      const response = await graphqlRequest(app, UPDATE_SUBCATEGORY, { id: subCategory.id, input: updateInput })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.updateSubCategory).toMatchObject({
        id: subCategory.id,
        name: updateInput.name,
        description: updateInput.description,
        image: updateInput.image,
        categoryId: updateInput.categoryId,
      });

      // Verify in database
      const updatedSubCategory = await prisma.subCategory.findUnique({
        where: { id: subCategory.id },
      });
      expect(updatedSubCategory).toMatchObject(updateInput);
    });

    it('should delete a subcategory', async () => {
      const category = await prisma.category.create({
        data: {
          name: 'Toys',
          description: 'Children toys',
          image: 'toys.jpg',
        },
      });

      const subCategory = await prisma.subCategory.create({
        data: {
          name: 'Action Figures',
          description: 'Collectible action figures',
          image: 'action-figures.jpg',
          categoryId: category.id,
        },
      });

      const response = await graphqlRequest(app, REMOVE_SUBCATEGORY, { id: subCategory.id })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.removeSubCategory).toMatchObject({
        id: subCategory.id,
        name: 'Action Figures',
      });

      // Verify in database
      const deletedSubCategory = await prisma.subCategory.findUnique({
        where: { id: subCategory.id },
      });
      expect(deletedSubCategory).toBeNull();
    });
  });

  describe('User SubCategory Actions', () => {
    let userToken: string;

    beforeAll(async () => {
      await createUser(prisma);
      userToken = await getUserToken(app);
    });

    it('should retrieve all subcategories', async () => {
      const category = await prisma.category.create({
        data: {
          name: 'Games',
          description: 'Video games',
          image: 'games.jpg',
        },
      });

      await prisma.subCategory.create({
        data: {
          name: 'Board Games',
          description: 'Tabletop board games',
          image: 'board-games.jpg',
          categoryId: category.id,
        },
      });

      const response = await graphqlRequest(app, FIND_ALL_SUBCATEGORIES)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.subCategories).toBeInstanceOf(Array);
      expect(response.body.data.subCategories.length).toBeGreaterThan(0);
      expect(response.body.data.subCategories).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Board Games',
            description: 'Tabletop board games',
            image: 'board-games.jpg',
            categoryId: category.id,
          }),
        ]),
      );
    });

    it('should retrieve a subcategory by ID', async () => {
      const category = await prisma.category.create({
        data: {
          name: 'Accessories',
          description: 'Fashion accessories',
          image: 'accessories.jpg',
        },
      });

      const subCategory = await prisma.subCategory.create({
        data: {
          name: 'Watches',
          description: 'Fashion watches',
          image: 'watches.jpg',
          categoryId: category.id,
        },
      });

      const response = await graphqlRequest(app, FIND_ONE_SUBCATEGORY, { id: subCategory.id })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.subCategory).toMatchObject({
        id: subCategory.id,
        name: 'Watches',
        description: 'Fashion watches',
        image: 'watches.jpg',
        categoryId: category.id,
      });
    });

    it('should not allow creating a subcategory', async () => {
      const category = await prisma.category.create({
        data: {
          name: 'Appliances',
          description: 'Home appliances',
          image: 'appliances.jpg',
        },
      });

      const subCategoryInput = {
        name: 'Forbidden SubCategory',
        description: 'Should not be created',
        image: 'forbidden.jpg',
        categoryId: category.id,
      };

      const response = await graphqlRequest(app, CREATE_SUBCATEGORY, { input: subCategoryInput })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');

      // Verify in database
      const subCategoryInDb = await prisma.subCategory.findFirst({
        where: { name: subCategoryInput.name },
      });
      expect(subCategoryInDb).toBeNull();
    });

    it('should not allow updating a subcategory', async () => {
      const category = await prisma.category.create({
        data: {
          name: 'Stationery',
          description: 'Office supplies',
          image: 'stationery.jpg',
        },
      });

      const subCategory = await prisma.subCategory.create({
        data: {
          name: 'Pens',
          description: 'Writing pens',
          image: 'pens.jpg',
          categoryId: category.id,
        },
      });

      const updateInput = {
        name: 'Updated Pens',
        description: 'Updated writing pens',
        image: 'updated-pens.jpg',
        categoryId: category.id,
      };

      const response = await graphqlRequest(app, UPDATE_SUBCATEGORY, { id: subCategory.id, input: updateInput })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');

      // Verify in database
      const subCategoryInDb = await prisma.subCategory.findUnique({
        where: { id: subCategory.id },
      });
      expect(subCategoryInDb.name).toBe('Pens');
    });

    it('should not allow deleting a subcategory', async () => {
      const category = await prisma.category.create({
        data: {
          name: 'Cosmetics',
          description: 'Beauty products',
          image: 'cosmetics.jpg',
        },
      });

      const subCategory = await prisma.subCategory.create({
        data: {
          name: 'Lipsticks',
          description: 'Lipstick products',
          image: 'lipsticks.jpg',
          categoryId: category.id,
        },
      });

      const response = await graphqlRequest(app, REMOVE_SUBCATEGORY, { id: subCategory.id })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');

      // Verify in database
      const subCategoryInDb = await prisma.subCategory.findUnique({
        where: { id: subCategory.id },
      });
      expect(subCategoryInDb).not.toBeNull();
    });
  });
});
