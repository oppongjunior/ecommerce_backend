import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  clearDatabase,
  createAdmin,
  createCategory,
  createProducts,
  createSuperAdmin,
  createTestApp,
  createUser,
  getAdminToken,
  getSuperAdminToken,
  getUserToken,
  graphqlRequest,
} from '../e2e.utils';

// GraphQL queries and mutations
const GET_TAG = `
  query GetTag($tagId: String!) {
    tag(tagId: $tagId) {
      id
      name
      createdAt
      updatedAt
    }
  }
`;

const GET_ALL_TAGS = `
  query GetAllTags {
    tags {
      id
      name
      createdAt
      updatedAt
    }
  }
`;

const CREATE_TAG = `
  mutation CreateTag($name: String!) {
    createTag(name: $name) {
      id
      name
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_TAG = `
  mutation UpdateTag($tagId: String!, $name: String!) {
    updateTag(tagId: $tagId, name: $name) {
      id
      name
      createdAt
      updatedAt
    }
  }
`;

const DELETE_TAG = `
  mutation DeleteTag($tagId: String!) {
    deleteTag(tagId: $tagId) {
      id
      name
      createdAt
      updatedAt
    }
  }
`;

describe('Tag E2E Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userToken: string;

  let adminToken: string;
  let superAdminToken: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;

    await app.init();
    await clearDatabase(prisma);

    await createUser(prisma);
    userToken = await getUserToken(app);

    await createAdmin(prisma);
    adminToken = await getAdminToken(app);

    await createSuperAdmin(prisma);
    superAdminToken = await getSuperAdminToken(app);

    const category = await createCategory(prisma);
    await createProducts(prisma, category.id); // Assuming this creates products with IDs 'prod1' and 'prod2'
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User Tag Actions', () => {
    it('should retrieve all tags', async () => {
      await prisma.tag.create({
        data: {
          name: 'Electronics',
        },
      });

      const response = await graphqlRequest(app, GET_ALL_TAGS).set('Authorization', `Bearer ${userToken}`).expect(200);

      expect(response.body.data.tags).toBeInstanceOf(Array);
      expect(response.body.data.tags.length).toBeGreaterThan(0);
      expect(response.body.data.tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Electronics',
          }),
        ]),
      );
    });

    it('should retrieve a specific tag by ID', async () => {
      const tag = await prisma.tag.create({
        data: {
          name: 'Clothing',
        },
      });

      const response = await graphqlRequest(app, GET_TAG, { tagId: tag.id })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.tag).toMatchObject({
        id: tag.id,
        name: 'Clothing',
      });
      expect(response.body.data.tag.createdAt).toBeDefined();
      expect(response.body.data.tag.updatedAt).toBeDefined();
    });

    it('should not allow creating a tag', async () => {
      const response = await graphqlRequest(app, CREATE_TAG, { name: 'UserTag' })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');

      // Verify in database
      const tagInDb = await prisma.tag.findFirst({
        where: { name: 'UserTag' },
      });
      expect(tagInDb).toBeNull();
    });

    it('should not allow updating a tag', async () => {
      const tag = await prisma.tag.create({
        data: {
          name: 'Books',
        },
      });

      const response = await graphqlRequest(app, UPDATE_TAG, { tagId: tag.id, name: 'UpdatedBooks' })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');

      // Verify in database
      const tagInDb = await prisma.tag.findUnique({
        where: { id: tag.id },
      });
      expect(tagInDb.name).toBe('Books');
    });

    it('should not allow deleting a tag', async () => {
      const tag = await prisma.tag.create({
        data: {
          name: 'Toys',
        },
      });

      const response = await graphqlRequest(app, DELETE_TAG, { tagId: tag.id })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');

      // Verify in database
      const tagInDb = await prisma.tag.findUnique({
        where: { id: tag.id },
      });
      expect(tagInDb).not.toBeNull();
    });
  });

  describe('Admin Tag Actions', () => {
    it('should retrieve all tags', async () => {
      await prisma.tag.create({
        data: {
          name: 'Furniture',
        },
      });

      const response = await graphqlRequest(app, GET_ALL_TAGS).set('Authorization', `Bearer ${adminToken}`).expect(200);

      expect(response.body.data.tags).toBeInstanceOf(Array);
      expect(response.body.data.tags.length).toBeGreaterThan(0);
      expect(response.body.data.tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Furniture',
          }),
        ]),
      );
    });

    it('should retrieve a specific tag by ID', async () => {
      const tag = await prisma.tag.create({
        data: {
          name: 'Appliances',
        },
      });

      const response = await graphqlRequest(app, GET_TAG, { tagId: tag.id })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.tag).toMatchObject({
        id: tag.id,
        name: 'Appliances',
      });
      expect(response.body.data.tag.createdAt).toBeDefined();
      expect(response.body.data.tag.updatedAt).toBeDefined();
    });

    it('should create a new tag', async () => {
      const response = await graphqlRequest(app, CREATE_TAG, { name: 'Gadgets' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.createTag).toBeDefined();
      expect(response.body.data.createTag).toMatchObject({
        name: 'Gadgets',
      });
      expect(response.body.data.createTag.id).toBeDefined();
      expect(response.body.data.createTag.createdAt).toBeDefined();
      expect(response.body.data.createTag.updatedAt).toBeDefined();

      // Verify in database
      const tagInDb = await prisma.tag.findUnique({
        where: { name: 'Gadgets' },
      });
      expect(tagInDb).toMatchObject({
        name: 'Gadgets',
      });
    });

    it('should update an existing tag', async () => {
      const tag = await prisma.tag.create({
        data: {
          name: 'Accessories',
        },
      });

      const response = await graphqlRequest(app, UPDATE_TAG, { tagId: tag.id, name: 'UpdatedAccessories' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.updateTag).toMatchObject({
        id: tag.id,
        name: 'UpdatedAccessories',
      });

      // Verify in database
      const tagInDb = await prisma.tag.findUnique({
        where: { id: tag.id },
      });
      expect(tagInDb.name).toBe('UpdatedAccessories');
    });

    it('should delete a tag', async () => {
      const tag = await prisma.tag.create({
        data: {
          name: 'Sports',
        },
      });

      const response = await graphqlRequest(app, DELETE_TAG, { tagId: tag.id })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.deleteTag).toMatchObject({
        id: tag.id,
        name: 'Sports',
      });

      // Verify in database
      const tagInDb = await prisma.tag.findUnique({
        where: { id: tag.id },
      });
      expect(tagInDb).toBeNull();
    });

    it('should not allow creating a tag with a duplicate name', async () => {
      await prisma.tag.create({
        data: {
          name: 'HomeDecor',
        },
      });

      const response = await graphqlRequest(app, CREATE_TAG, { name: 'HomeDecor' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('already in use');
    });

    it('should not allow updating a tag with a duplicate name', async () => {
      await prisma.tag.createMany({
        data: [{ name: 'Tech' }, { name: 'Jogging' }],
      });

      const tag = await prisma.tag.findUnique({ where: { name: 'Tech' } });

      const response = await graphqlRequest(app, UPDATE_TAG, { tagId: tag.id, name: 'Jogging' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('already in use');

      // Verify in database
      const tagInDb = await prisma.tag.findUnique({
        where: { id: tag.id },
      });
      expect(tagInDb.name).toBe('Tech');
    });

    it('should not allow deleting a non-existent tag', async () => {
      const response = await graphqlRequest(app, DELETE_TAG, { tagId: 'non-existent-tag-id' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('not found');
    });
  });

  describe('Super Admin Tag Actions', () => {
    it('should retrieve all tags', async () => {
      await prisma.tag.create({
        data: {
          name: 'Beauty',
        },
      });

      const response = await graphqlRequest(app, GET_ALL_TAGS)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.tags).toBeInstanceOf(Array);
      expect(response.body.data.tags.length).toBeGreaterThan(0);
      expect(response.body.data.tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Beauty',
          }),
        ]),
      );
    });

    it('should retrieve a specific tag by ID', async () => {
      const tag = await prisma.tag.create({
        data: {
          name: 'Health',
        },
      });

      const response = await graphqlRequest(app, GET_TAG, { tagId: tag.id })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.tag).toMatchObject({
        id: tag.id,
        name: 'Health',
      });
      expect(response.body.data.tag.createdAt).toBeDefined();
      expect(response.body.data.tag.updatedAt).toBeDefined();
    });

    it('should create a new tag', async () => {
      const response = await graphqlRequest(app, CREATE_TAG, { name: 'Fitness' })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.createTag).toBeDefined();
      expect(response.body.data.createTag).toMatchObject({
        name: 'Fitness',
      });
      expect(response.body.data.createTag.id).toBeDefined();
      expect(response.body.data.createTag.createdAt).toBeDefined();
      expect(response.body.data.createTag.updatedAt).toBeDefined();

      // Verify in database
      const tagInDb = await prisma.tag.findUnique({
        where: { name: 'Fitness' },
      });
      expect(tagInDb).toMatchObject({
        name: 'Fitness',
      });
    });

    it('should update an existing tag', async () => {
      const tag = await prisma.tag.create({
        data: {
          name: 'Jewelry',
        },
      });

      const response = await graphqlRequest(app, UPDATE_TAG, { tagId: tag.id, name: 'UpdatedJewelry' })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.updateTag).toMatchObject({
        id: tag.id,
        name: 'UpdatedJewelry',
      });

      // Verify in database
      const tagInDb = await prisma.tag.findUnique({
        where: { id: tag.id },
      });
      expect(tagInDb.name).toBe('UpdatedJewelry');
    });

    it('should delete a tag', async () => {
      const tag = await prisma.tag.create({
        data: {
          name: 'Outdoor',
        },
      });

      const response = await graphqlRequest(app, DELETE_TAG, { tagId: tag.id })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.deleteTag).toMatchObject({
        id: tag.id,
        name: 'Outdoor',
      });

      // Verify in database
      const tagInDb = await prisma.tag.findUnique({
        where: { id: tag.id },
      });
      expect(tagInDb).toBeNull();
    });

    it('should not allow creating a tag with a duplicate name', async () => {
      await prisma.tag.create({
        data: {
          name: 'Kitchen',
        },
      });

      const response = await graphqlRequest(app, CREATE_TAG, {
        name: 'Kitchen',
      })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('already in use');
    });

    it('should not allow updating a tag with a duplicate name', async () => {
      await prisma.tag.createMany({
        data: [{ name: 'Pets' }],
      });

      const tag = await prisma.tag.findUnique({ where: { name: 'Pets' } });
      const response = await graphqlRequest(app, UPDATE_TAG, { tagId: tag.id, name: 'Toys' })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('already in use');

      // Verify in database
      const tagInDb = await prisma.tag.findUnique({
        where: { id: tag.id },
      });
      expect(tagInDb.name).toBe('Pets');
    });

    it('should not allow deleting a non-existent tag', async () => {
      const response = await graphqlRequest(app, DELETE_TAG, { tagId: 'non-existent-tag-id' })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('not found');
    });
  });
});
