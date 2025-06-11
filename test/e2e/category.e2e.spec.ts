import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  clearDatabase,
  createAdmin,
  createSuperAdmin,
  createTestApp,
  createUser,
  getAdminToken,
  getSuperAdminToken,
  getUserToken,
  graphqlRequest,
} from '../e2e.utils';

// GraphQL queries and mutations
const CREATE_CATEGORY = `
    mutation CreateCategory($input: CreateCategoryInput!) {
        createCategory(input: $input) {
            id
            name
            description
            image
            createdAt
            updatedAt
        }
    }
`;

const FIND_ALL_CATEGORIES = `
    query Categories {
        categories {
            id
            name
            description
            image
            createdAt
            updatedAt
        }
    }
`;

const FIND_ONE_CATEGORY = `
    query Category($id: String!) {
        category(id: $id) {
            id
            name
            description
            image
            createdAt
            updatedAt
        }
    }
`;

const UPDATE_CATEGORY = `
    mutation UpdateCategory($id: String!, $input: UpdateCategoryInput!) {
        updateCategory(id: $id, input: $input) {
            id
            name
            description
            image
            createdAt
            updatedAt
        }
    }
`;

const REMOVE_CATEGORY = `
  mutation RemoveCategory($id: String!) {
    removeCategory(id: $id) {
      id
      name
    }
  }
`;
describe('Category E2E Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;

    await app.init();
    await clearDatabase(prisma);
  });

  describe('Super Admin Category Actions', () => {
    let superAdminToken: string;
    beforeAll(async () => {
      await createSuperAdmin(prisma);
      superAdminToken = await getSuperAdminToken(app);
    });
    //test actions
    it('should create a new category', async () => {
      const categoryInput = {
        name: 'Electronics',
        description: 'Devices and gadgets',
        image: 'electronics.jpg',
      };
      const response = await graphqlRequest(app, CREATE_CATEGORY, { input: categoryInput })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.createCategory).toBeDefined();
      expect(response.body.data.createCategory).toMatchObject({
        name: categoryInput.name,
        description: categoryInput.description,
        image: categoryInput.image,
      });

      // Verify in database
      const categoryInDb = await prisma.category.findUnique({
        where: { name: categoryInput.name },
      });
      expect(categoryInDb).toMatchObject(categoryInput);
    });
    it('should retrieve all categories', async () => {
      await prisma.category.create({
        data: {
          name: 'Books',
          description: 'All kinds of books',
          image: 'books.jpg',
        },
      });

      const response = await graphqlRequest(app, FIND_ALL_CATEGORIES)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.categories).toBeInstanceOf(Array);
      expect(response.body.data.categories.length).toBeGreaterThan(0);
      expect(response.body.data.categories).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Books',
            description: 'All kinds of books',
            image: 'books.jpg',
          }),
        ]),
      );
    });
    it('should retrieve a category by ID', async () => {
      const category = await prisma.category.create({
        data: {
          name: 'Clothing',
          description: 'Apparel and accessories',
          image: 'clothing.jpg',
        },
      });

      const response = await graphqlRequest(app, FIND_ONE_CATEGORY, { id: category.id })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
      expect(response.body.data.category).toMatchObject({
        id: category.id,
        name: 'Clothing',
        description: 'Apparel and accessories',
        image: 'clothing.jpg',
      });
    });
    it('should update an existing category', async () => {
      const category = await prisma.category.create({
        data: {
          name: 'Furniture',
          description: 'Home furnishings',
          image: 'furniture.jpg',
        },
      });

      const updateInput = {
        name: 'Updated Furniture',
        description: 'Updated home furnishings',
        image: 'updated-furniture.jpg',
      };

      const response = await graphqlRequest(app, UPDATE_CATEGORY, { id: category.id, input: updateInput })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.updateCategory).toMatchObject({
        id: category.id,
        name: updateInput.name,
        description: updateInput.description,
        image: updateInput.image,
      });

      // Verify in database
      const updatedCategory = await prisma.category.findUnique({
        where: { id: category.id },
      });
      expect(updatedCategory).toMatchObject(updateInput);
    });
  });
  describe('Admin Category Actions', () => {
    let adminToken;
    beforeAll(async () => {
      await createAdmin(prisma);
      adminToken = await getAdminToken(app);
    });
    //test actions
    it('should create a new category', async () => {
      const categoryInput = {
        name: 'Appliances',
        description: 'Home appliances',
        image: 'appliances.jpg',
      };

      const response = await graphqlRequest(app, CREATE_CATEGORY, { input: categoryInput })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.createCategory).toMatchObject({
        name: categoryInput.name,
        description: categoryInput.description,
        image: categoryInput.image,
      });
      expect(response.body.data.createCategory.id).toBeDefined();

      // Verify in database
      const categoryInDb = await prisma.category.findUnique({
        where: { name: categoryInput.name },
      });
      expect(categoryInDb).toMatchObject(categoryInput);
    });
    it('should retrieve all categories', async () => {
      await prisma.category.create({
        data: {
          name: 'Sports',
          description: 'Sporting goods',
          image: 'sports.jpg',
        },
      });

      const response = await graphqlRequest(app, FIND_ALL_CATEGORIES)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.categories).toBeInstanceOf(Array);
      expect(response.body.data.categories.length).toBeGreaterThan(0);
      expect(response.body.data.categories).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Sports',
            description: 'Sporting goods',
            image: 'sports.jpg',
          }),
        ]),
      );
    });
    it('should retrieve a category by ID', async () => {
      const category = await prisma.category.create({
        data: {
          name: 'Jewelry',
          description: 'Fashion jewelry',
          image: 'jewelry.jpg',
        },
      });
      const response = await graphqlRequest(app, FIND_ONE_CATEGORY, { id: category.id })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.category).toMatchObject({
        id: category.id,
        name: 'Jewelry',
        description: 'Fashion jewelry',
        image: 'jewelry.jpg',
      });
    });
    it('should update an existing category', async () => {
      const category = await prisma.category.create({
        data: {
          name: 'Gadgets',
          description: 'Tech gadgets',
          image: 'gadgets.jpg',
        },
      });

      const updateInput = {
        name: 'Updated Gadgets',
        description: 'Updated tech gadgets',
        image: 'updated-gadgets.jpg',
      };

      const response = await graphqlRequest(app, UPDATE_CATEGORY, { id: category.id, input: updateInput })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.updateCategory).toMatchObject({
        id: category.id,
        name: updateInput.name,
        description: updateInput.description,
        image: updateInput.image,
      });

      // Verify in database
      const updatedCategory = await prisma.category.findUnique({
        where: { id: category.id },
      });
      expect(updatedCategory).toMatchObject(updateInput);
    });

    it('should delete a category', async () => {
      const category = await prisma.category.create({
        data: {
          name: 'Tools',
          description: 'Hardware tools',
          image: 'tools.jpg',
        },
      });

      const response = await graphqlRequest(app, REMOVE_CATEGORY, { id: category.id })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.removeCategory).toMatchObject({
        id: category.id,
        name: 'Tools',
      });

      // Verify in database
      const deletedCategory = await prisma.category.findUnique({
        where: { id: category.id },
      });
      expect(deletedCategory).toBeNull();
    });
  });
  describe('User Category Actions', () => {
    let userToken;
    beforeAll(async () => {
      await createUser(prisma);
      userToken = await getUserToken(app);
    });
    it('should retrieve all categories', async () => {
      await prisma.category.create({
        data: {
          name: 'Games',
          description: 'Video games',
          image: 'games.jpg',
        },
      });

      const response = await graphqlRequest(app, FIND_ALL_CATEGORIES)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.categories).toBeInstanceOf(Array);
      expect(response.body.data.categories.length).toBeGreaterThan(0);
      expect(response.body.data.categories).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Games',
            description: 'Video games',
            image: 'games.jpg',
          }),
        ]),
      );
    });

    it('should retrieve a category by ID', async () => {
      const category = await prisma.category.create({
        data: {
          name: 'Accessories',
          description: 'Fashion accessories',
          image: 'accessories.jpg',
        },
      });

      const response = await graphqlRequest(app, FIND_ONE_CATEGORY, { id: category.id })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.category).toMatchObject({
        id: category.id,
        name: 'Accessories',
        description: 'Fashion accessories',
        image: 'accessories.jpg',
      });
    });

    it('should not allow creating a category', async () => {
      const categoryInput = {
        name: 'Forbidden Category',
        description: 'Should not be created',
        image: 'forbidden.jpg',
      };

      const response = await graphqlRequest(app, CREATE_CATEGORY, { input: categoryInput })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');

      // Verify in database
      const categoryInDb = await prisma.category.findUnique({
        where: { name: categoryInput.name },
      });
      expect(categoryInDb).toBeNull();
    });

    it('should not allow updating a category', async () => {
      const category = await prisma.category.create({
        data: {
          name: 'Stationery',
          description: 'Office supplies',
          image: 'stationery.jpg',
        },
      });

      const updateInput = {
        name: 'Updated Stationery',
        description: 'Updated office supplies',
        image: 'updated-stationery.jpg',
      };

      const response = await graphqlRequest(app, UPDATE_CATEGORY, { id: category.id, input: updateInput })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');

      // Verify in database
      const categoryInDb = await prisma.category.findUnique({
        where: { id: category.id },
      });
      expect(categoryInDb.name).toBe('Stationery');
    });

    it('should not allow deleting a category', async () => {
      const category = await prisma.category.create({
        data: {
          name: 'Cosmetics',
          description: 'Beauty products',
          image: 'cosmetics.jpg',
        },
      });

      const response = await graphqlRequest(app, REMOVE_CATEGORY, { id: category.id })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');

      // Verify in database
      const categoryInDb = await prisma.category.findUnique({
        where: { id: category.id },
      });
      expect(categoryInDb).not.toBeNull();
    });
  });
});
