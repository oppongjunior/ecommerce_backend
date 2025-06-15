import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  clearDatabase,
  createCategory,
  createProducts,
  createTestApp,
  createUser,
  getUserToken,
  graphqlRequest,
} from '../e2e.utils';

// GraphQL queries and mutations
const GET_WISHLIST = `
  query GetWishlist {
    wishlist {
      id
      userId
      createdAt
      updatedAt
      products {
        id
        name
        price
      }
    }
  }
`;

const ADD_TO_WISHLIST = `
  mutation AddToWishlist($productId: String!) {
    addToWishlist(productId: $productId) {
      id
      userId
      createdAt
      updatedAt
      products {
        id
        name
        price
      }
    }
  }
`;

const REMOVE_FROM_WISHLIST = `
  mutation RemoveFromWishlist($productId: String!) {
    removeFromWishlist(productId: $productId) {
      id
      userId
      createdAt
      updatedAt
      products {
        id
        name
        price
      }
    }
  }
`;

const CLEAR_WISHLIST = `
  mutation ClearWishlist {
    clearWishlist {
      id
      userId
      createdAt
      updatedAt
      products {
        id
        name
        price
      }
    }
  }
`;

describe('Wishlist E2E Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userToken: string;
  let userId: string;
  let product1Id: string;
  let product2Id: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;

    await app.init();
    await clearDatabase(prisma);

    const user = await createUser(prisma);
    userId = user.id;
    userToken = await getUserToken(app);

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

  describe('User Wishlist Actions', () => {
    it('should retrieve an empty wishlist for a new user', async () => {
      const response = await graphqlRequest(app, GET_WISHLIST).set('Authorization', `Bearer ${userToken}`).expect(200);

      expect(response.body.data.wishlist).toBeDefined();
      expect(response.body.data.wishlist).toMatchObject({
        userId,
        products: [],
      });
      expect(response.body.data.wishlist.id).toBeDefined();
      expect(response.body.data.wishlist.createdAt).toBeDefined();
      expect(response.body.data.wishlist.updatedAt).toBeDefined();

      // Verify in database
      const wishlistInDb = await prisma.wishList.findUnique({
        where: { userId },
        include: { products: true },
      });
      expect(wishlistInDb).toBeDefined();
      expect(wishlistInDb.products).toHaveLength(0);
    });

    it('should add a product to the wishlist', async () => {
      const response = await graphqlRequest(app, ADD_TO_WISHLIST, { productId: product1Id })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.addToWishlist).toBeDefined();
      expect(response.body.data.addToWishlist).toMatchObject({
        userId,
        products: expect.arrayContaining([
          expect.objectContaining({
            id: product1Id,
          }),
        ]),
      });

      // Verify in database
      const wishlistInDb = await prisma.wishList.findUnique({
        where: { userId },
        include: { products: true },
      });
      expect(wishlistInDb.products).toHaveLength(1);
      expect(wishlistInDb.products[0]).toMatchObject({
        id: product1Id,
      });
    });

    it('should not add a duplicate product to the wishlist', async () => {
      // First, add a product to the wishlist
      await prisma.wishList.update({
        where: { userId },
        data: {
          products: {
            connect: { id: product1Id },
          },
        },
      });

      const response = await graphqlRequest(app, ADD_TO_WISHLIST, { productId: product1Id })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Assuming the service either silently ignores duplicates or returns the same wishlist
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Product "prod1" is already in your wishlist');

      // Verify in database
      const wishlistInDb = await prisma.wishList.findUnique({
        where: { userId },
        include: { products: true },
      });
      expect(wishlistInDb.products).toHaveLength(1); // Should still have only one instance of the product
      expect(wishlistInDb.products[0]).toMatchObject({
        id: product1Id,
      });
    });

    it('should remove a product from the wishlist', async () => {
      // First, add a product to the wishlist
      await prisma.wishList.update({
        where: { userId },
        data: {
          products: {
            connect: { id: product2Id },
          },
        },
      });

      const response = await graphqlRequest(app, REMOVE_FROM_WISHLIST, { productId: product2Id })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.removeFromWishlist).toBeDefined();
      expect(response.body.data.removeFromWishlist).toMatchObject({
        userId,
        products: expect.not.arrayContaining([
          expect.objectContaining({
            id: product2Id,
          }),
        ]),
      });

      // Verify in database
      const wishlistInDb = await prisma.wishList.findUnique({
        where: { userId },
        include: { products: true },
      });
      expect(wishlistInDb.products).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: product2Id,
          }),
        ]),
      );
    });

    it('should clear all products from the wishlist', async () => {
      // Add multiple products to the wishlist
      await prisma.wishList.update({
        where: { userId },
        data: {
          products: {
            connect: [{ id: product1Id }, { id: product2Id }],
          },
        },
      });

      const response = await graphqlRequest(app, CLEAR_WISHLIST)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.clearWishlist).toBeDefined();
      expect(response.body.data.clearWishlist).toMatchObject({
        userId,
        products: [],
      });

      // Verify in database
      const wishlistInDb = await prisma.wishList.findUnique({
        where: { userId },
        include: { products: true },
      });
      expect(wishlistInDb.products).toHaveLength(0);
    });

    it('should not allow adding an invalid product to the wishlist', async () => {
      const response = await graphqlRequest(app, ADD_TO_WISHLIST, { productId: 'invalid-product-id' })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain(`Product \"invalid-product-id\" not found`);

      // Verify in database
      const wishlistInDb = await prisma.wishList.findUnique({
        where: { userId },
        include: { products: true },
      });
      expect(wishlistInDb.products).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'invalid-product-id',
          }),
        ]),
      );
    });

    it('should not allow removing a non-existent product from the wishlist', async () => {
      const response = await graphqlRequest(app, REMOVE_FROM_WISHLIST, { productId: 'non-existent-product-id' })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain(
        `Product \"non-existent-product-id\" not found in your wishlist`,
      );
    });
  });
});
