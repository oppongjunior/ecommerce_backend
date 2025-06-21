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
const GET_VARIANT = `
  query GetVariant($variantId: String!) {
    variant(variantId: $variantId) {
      id
      size
      color
      quantity
      price
      productId
    }
  }
`;

const GET_PRODUCT_VARIANTS = `
  query GetProductVariants($productId: String!) {
    productVariants(productId: $productId) {
      id
      size
      color
      quantity
      price
      productId
    }
  }
`;

const GET_ALL_VARIANTS = `
  query GetAllVariants {
    variants {
      id
      size
      color
      quantity
      price
      productId
    }
  }
`;

const CREATE_VARIANT = `
  mutation CreateVariant($input: CreateVariantInput!) {
    createVariant(input: $input) {
      id
      size
      color
      quantity
      price
      productId
    }
  }
`;

const UPDATE_VARIANT = `
  mutation UpdateVariant($input: UpdateVariantInput!) {
    updateVariant(input: $input) {
      id
      size
      color
      quantity
      price
      productId
    }
  }
`;

const DELETE_VARIANT = `
  mutation DeleteVariant($variantId: String!) {
    deleteVariant(variantId: $variantId) {
      id
      size
      color
      quantity
      price
      productId
    }
  }
`;

describe('Variant E2E Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userToken: string;
  let adminToken: string;
  let superAdminToken: string;
  let product1Id: string;
  let product2Id: string;

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
    const product1 = await prisma.product.findUnique({ where: { id: 'prod1' } });
    product1Id = product1.id;
    const product2 = await prisma.product.findUnique({ where: { id: 'prod2' } });
    product2Id = product2.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User Variant Actions', () => {
    it('should retrieve all variants', async () => {
      await prisma.variant.create({
        data: {
          productId: product1Id,
          size: 'Medium',
          color: 'Blue',
          quantity: 10,
          price: 29.99,
        },
      });

      const response = await graphqlRequest(app, GET_ALL_VARIANTS)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.variants).toBeInstanceOf(Array);
      expect(response.body.data.variants.length).toBeGreaterThan(0);
      expect(response.body.data.variants).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            productId: product1Id,
            size: 'Medium',
            color: 'Blue',
            quantity: 10,
            price: 29.99,
          }),
        ]),
      );
    });

    it('should retrieve variants for a specific product', async () => {
      await prisma.variant.create({
        data: {
          productId: product1Id,
          size: 'Large',
          color: 'Red',
          quantity: 5,
          price: 34.99,
        },
      });

      const response = await graphqlRequest(app, GET_PRODUCT_VARIANTS, { productId: product1Id })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.productVariants).toBeInstanceOf(Array);
      expect(response.body.data.productVariants.length).toBeGreaterThan(0);
      expect(response.body.data.productVariants).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            productId: product1Id,
            size: 'Large',
            color: 'Red',
            quantity: 5,
            price: 34.99,
          }),
        ]),
      );
    });

    it('should retrieve a specific variant by ID', async () => {
      const variant = await prisma.variant.create({
        data: {
          productId: product1Id,
          size: 'Small',
          color: 'Green',
          quantity: 8,
          price: 24.99,
        },
      });

      const response = await graphqlRequest(app, GET_VARIANT, { variantId: variant.id })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.variant).toMatchObject({
        id: variant.id,
        productId: product1Id,
        size: 'Small',
        color: 'Green',
        quantity: 8,
        price: 24.99,
      });
    });

    it('should not allow creating a variant', async () => {
      const createVariantInput = {
        productId: product1Id,
        size: 'Medium',
        color: 'Black',
        quantity: 15,
        price: 39.99,
      };

      const response = await graphqlRequest(app, CREATE_VARIANT, { input: createVariantInput })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');

      // Verify in database
      const variantInDb = await prisma.variant.findFirst({
        where: { productId: product1Id, size: 'Medium', color: 'Black' },
      });
      expect(variantInDb).toBeNull();
    });

    it('should not allow updating a variant', async () => {
      const variant = await prisma.variant.create({
        data: {
          productId: product1Id,
          size: 'Large',
          color: 'White',
          quantity: 20,
          price: 49.99,
        },
      });

      const updateVariantInput = {
        id: variant.id,
        size: 'Large',
        color: 'White',
        quantity: 25,
        price: 59.99,
      };

      const response = await graphqlRequest(app, UPDATE_VARIANT, { input: updateVariantInput })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');

      // Verify in database
      const variantInDb = await prisma.variant.findUnique({
        where: { id: variant.id },
      });
      expect(variantInDb.quantity).toBe(20);
    });

    it('should not allow deleting a variant', async () => {
      const variant = await prisma.variant.create({
        data: {
          productId: product1Id,
          size: 'Small',
          color: 'Yellow',
          quantity: 12,
          price: 19.99,
        },
      });

      const response = await graphqlRequest(app, DELETE_VARIANT, { variantId: variant.id })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');

      // Verify in database
      const variantInDb = await prisma.variant.findUnique({
        where: { id: variant.id },
      });
      expect(variantInDb).not.toBeNull();
    });
  });

  describe('Admin Variant Actions', () => {
    it('should retrieve all variants', async () => {
      await prisma.variant.create({
        data: {
          productId: product2Id,
          size: 'Medium',
          color: 'Blue',
          quantity: 15,
          price: 29.99,
        },
      });

      const response = await graphqlRequest(app, GET_ALL_VARIANTS)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.variants).toBeInstanceOf(Array);
      expect(response.body.data.variants.length).toBeGreaterThan(0);
      expect(response.body.data.variants).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            productId: product2Id,
            size: 'Medium',
            color: 'Blue',
            quantity: 15,
            price: 29.99,
          }),
        ]),
      );
    });

    it('should retrieve variants for a specific product', async () => {
      await prisma.variant.create({
        data: {
          productId: product2Id,
          size: 'Large',
          color: 'Red',
          quantity: 10,
          price: 34.99,
        },
      });

      const response = await graphqlRequest(app, GET_PRODUCT_VARIANTS, { productId: product2Id })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.productVariants).toBeInstanceOf(Array);
      expect(response.body.data.productVariants.length).toBeGreaterThan(0);
      expect(response.body.data.productVariants).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            productId: product2Id,
            size: 'Large',
            color: 'Red',
            quantity: 10,
            price: 34.99,
          }),
        ]),
      );
    });

    it('should retrieve a specific variant by ID', async () => {
      const variant = await prisma.variant.create({
        data: {
          productId: product2Id,
          size: 'Small',
          color: 'Green',
          quantity: 8,
          price: 24.99,
        },
      });

      const response = await graphqlRequest(app, GET_VARIANT, { variantId: variant.id })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.variant).toMatchObject({
        id: variant.id,
        productId: product2Id,
        size: 'Small',
        color: 'Green',
        quantity: 8,
        price: 24.99,
      });
    });

    it('should create a new variant', async () => {
      const createVariantInput = {
        productId: product1Id,
        size: 'Medium',
        color: 'Black',
        quantity: 15,
        price: 39.99,
      };

      const response = await graphqlRequest(app, CREATE_VARIANT, { input: createVariantInput })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.createVariant).toBeDefined();
      expect(response.body.data.createVariant).toMatchObject({
        productId: product1Id,
        size: 'Medium',
        color: 'Black',
        quantity: 15,
        price: createVariantInput.price,
      });
      expect(response.body.data.createVariant.id).toBeDefined();

      // Verify in database
      const variantInDb = await prisma.variant.findFirst({
        where: { productId: product1Id, size: 'Medium', color: 'Black' },
      });
      expect(variantInDb).toBeDefined();
    });

    it('should update an existing variant', async () => {
      const variant = await prisma.variant.create({
        data: {
          productId: product1Id,
          size: 'Large',
          color: 'White',
          quantity: 20,
          price: 49.99,
        },
      });

      const updateVariantInput = {
        id: variant.id,
        size: 'Large',
        color: 'White',
        quantity: 25,
        price: 59.99,
      };

      const response = await graphqlRequest(app, UPDATE_VARIANT, { input: updateVariantInput })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.updateVariant).toMatchObject({
        id: variant.id,
        productId: product1Id,
        size: 'Large',
        color: 'White',
        quantity: 25,
        price: 59.99,
      });

      // Verify in database
      const variantInDb = await prisma.variant.findUnique({
        where: { id: variant.id },
      });
      expect(variantInDb).toMatchObject({
        quantity: 25,
      });
    });

    it('should delete a variant', async () => {
      const variant = await prisma.variant.create({
        data: {
          productId: product1Id,
          size: 'Small',
          color: 'Yellow',
          quantity: 12,
          price: 19.99,
        },
      });

      const response = await graphqlRequest(app, DELETE_VARIANT, { variantId: variant.id })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.deleteVariant).toMatchObject({
        id: variant.id,
        productId: product1Id,
        size: 'Small',
        color: 'Yellow',
        quantity: 12,
        price: 19.99,
      });

      // Verify in database
      const variantInDb = await prisma.variant.findUnique({
        where: { id: variant.id },
      });
      expect(variantInDb).toBeNull();
    });

    it('should not allow creating a variant with an invalid product ID', async () => {
      const createVariantInput = {
        productId: 'invalid-product-id',
        size: 'Medium',
        color: 'Black',
        quantity: 15,
        price: 39.99,
      };

      const response = await graphqlRequest(app, CREATE_VARIANT, { input: createVariantInput })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Product \"invalid-product-id\" not found');

      // Verify in database
      const variantInDb = await prisma.variant.findFirst({
        where: { productId: 'invalid-product-id' },
      });
      expect(variantInDb).toBeNull();
    });

    it('should not allow updating a non-existent variant', async () => {
      const updateVariantInput = {
        id: 'non-existent-variant-id',
        size: 'Large',
        color: 'White',
        quantity: 25,
        price: 59.99,
      };

      const response = await graphqlRequest(app, UPDATE_VARIANT, { input: updateVariantInput })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Variant \"non-existent-variant-id\" not found');
    });

    it('should not allow deleting a non-existent variant', async () => {
      const response = await graphqlRequest(app, DELETE_VARIANT, { variantId: 'non-existent-variant-id' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Variant \"non-existent-variant-id\" not found');
    });
  });

  describe('Super Admin Variant Actions', () => {
    it('should retrieve all variants', async () => {
      await prisma.variant.create({
        data: {
          productId: product2Id,
          size: 'Medium',
          color: 'Green',
          quantity: 15,
          price: 29.99,
        },
      });

      const response = await graphqlRequest(app, GET_ALL_VARIANTS)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.variants).toBeInstanceOf(Array);
      expect(response.body.data.variants.length).toBeGreaterThan(0);
      expect(response.body.data.variants).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            productId: product2Id,
            size: 'Medium',
            color: 'Green',
            quantity: 15,
            price: 29.99,
          }),
        ]),
      );
    });

    it('should retrieve variants for a specific product', async () => {
      await prisma.variant.create({
        data: {
          productId: product2Id,
          size: 'Large',
          color: 'Blue',
          quantity: 10,
          price: 34.99,
        },
      });

      const response = await graphqlRequest(app, GET_PRODUCT_VARIANTS, { productId: product2Id })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.productVariants).toBeInstanceOf(Array);
      expect(response.body.data.productVariants.length).toBeGreaterThan(0);
      expect(response.body.data.productVariants).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            productId: product2Id,
            size: 'Large',
            color: 'Blue',
            quantity: 10,
            price: 34.99,
          }),
        ]),
      );
    });

    it('should retrieve a specific variant by ID', async () => {
      const variant = await prisma.variant.create({
        data: {
          productId: product2Id,
          size: 'Small',
          color: 'Red',
          quantity: 8,
          price: 24.99,
        },
      });

      const response = await graphqlRequest(app, GET_VARIANT, { variantId: variant.id })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.variant).toMatchObject({
        id: variant.id,
        productId: product2Id,
        size: 'Small',
        color: 'Red',
        quantity: 8,
        price: 24.99,
      });
    });

    it('should create a new variant', async () => {
      const createVariantInput = {
        productId: product2Id,
        size: 'Medium',
        color: 'Black',
        quantity: 15,
        price: 39.99,
      };

      const response = await graphqlRequest(app, CREATE_VARIANT, { input: createVariantInput })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.createVariant).toBeDefined();
      expect(response.body.data.createVariant).toMatchObject({
        productId: product2Id,
        size: 'Medium',
        color: 'Black',
        quantity: 15,
        price: 39.99,
      });
      expect(response.body.data.createVariant.id).toBeDefined();

      // Verify in database
      const variantInDb = await prisma.variant.findFirst({
        where: { productId: product2Id, size: 'Medium', color: 'Black' },
      });
      expect(variantInDb).toMatchObject({
        productId: product2Id,
        size: 'Medium',
        color: 'Black',
        quantity: 15,
      });
    });

    it('should update an existing variant', async () => {
      const variant = await prisma.variant.create({
        data: {
          productId: product2Id,
          size: 'Large',
          color: 'White',
          quantity: 20,
          price: 49.99,
        },
      });

      const updateVariantInput = {
        id: variant.id,
        size: 'Large',
        color: 'White',
        quantity: 25,
        price: 59.99,
      };

      const response = await graphqlRequest(app, UPDATE_VARIANT, { input: updateVariantInput })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.updateVariant).toMatchObject({
        id: variant.id,
        productId: product2Id,
        size: 'Large',
        color: 'White',
        quantity: 25,
      });

      // Verify in database
      const variantInDb = await prisma.variant.findUnique({
        where: { id: variant.id },
      });
      expect(variantInDb).toMatchObject({
        quantity: 25,
      });
    });

    it('should delete a variant', async () => {
      const variant = await prisma.variant.create({
        data: {
          productId: product2Id,
          size: 'Small',
          color: 'Yellow',
          quantity: 12,
          price: 19.99,
        },
      });

      const response = await graphqlRequest(app, DELETE_VARIANT, { variantId: variant.id })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.deleteVariant).toMatchObject({
        id: variant.id,
        productId: product2Id,
        size: 'Small',
        color: 'Yellow',
        quantity: 12,
        price: 19.99,
      });

      // Verify in database
      const variantInDb = await prisma.variant.findUnique({
        where: { id: variant.id },
      });
      expect(variantInDb).toBeNull();
    });

    it('should not allow creating a variant with an invalid product ID', async () => {
      const createVariantInput = {
        productId: 'invalid-product-id',
        size: 'Medium',
        color: 'Black',
        quantity: 15,
        price: 39.99,
      };

      const response = await graphqlRequest(app, CREATE_VARIANT, { input: createVariantInput })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Product \"invalid-product-id\" not found');

      // Verify in database
      const variantInDb = await prisma.variant.findFirst({
        where: { productId: 'invalid-product-id' },
      });
      expect(variantInDb).toBeNull();
    });

    it('should not allow updating a non-existent variant', async () => {
      const updateVariantInput = {
        id: 'non-existent-variant-id',
        size: 'Large',
        color: 'White',
        quantity: 25,
        price: 59.99,
      };

      const response = await graphqlRequest(app, UPDATE_VARIANT, { input: updateVariantInput })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Variant \"non-existent-variant-id\" not found');
    });

    it('should not allow deleting a non-existent variant', async () => {
      const response = await graphqlRequest(app, DELETE_VARIANT, { variantId: 'non-existent-variant-id' })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Variant \"non-existent-variant-id\" not found');
    });
  });
});
