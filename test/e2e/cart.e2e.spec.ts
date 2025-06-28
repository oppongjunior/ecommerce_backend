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
const GET_CART = `
  query GetCart {
    cart {
      id
      userId
      createdAt
      updatedAt
      items {
        id
        productId
        quantity
        createdAt
        updatedAt
      }
    }
  }
`;

const ADD_TO_CART = `
  mutation AddToCart($input: AddToCartInput!) {
    addToCart(input: $input) {
      id
      userId
      createdAt
      updatedAt
      items {
        id
        productId
        quantity
        createdAt
        updatedAt
      }
    }
  }
`;

const UPDATE_CART_ITEM = `
  mutation UpdateCartItem($input: UpdateCartItemInput!) {
    updateCartItem(input: $input) {
      id
      userId
      createdAt
      updatedAt
      items {
        id
        productId
        quantity
        createdAt
        updatedAt
      }
    }
  }
`;

const REMOVE_FROM_CART = `
  mutation RemoveFromCart($cartItemId: String!) {
    removeFromCart(cartItemId: $cartItemId) {
      id
      userId
      createdAt
      updatedAt
      items {
        id
        productId
        quantity
        createdAt
        updatedAt
      }
    }
  }
`;

const CLEAR_CART = `
  mutation ClearCart {
    clearCart {
      id
      userId
      createdAt
      updatedAt
      items {
        id
        productId
        quantity
        createdAt
        updatedAt
      }
    }
  }
`;

describe('Cart E2E Test', () => {
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
    await createProducts(prisma, category.id);
    const product1 = await prisma.product.findUnique({ where: { id: 'prod1' } });
    product1Id = product1.id;
    const product2 = await prisma.product.findUnique({ where: { id: 'prod2' } });
    product2Id = product2.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User Cart Actions', () => {
    it('should retrieve an empty cart for a new user', async () => {
      const response = await graphqlRequest(app, GET_CART).set('Authorization', `Bearer ${userToken}`).expect(200);
      expect(response.body.data.cart).toBeDefined();
      expect(response.body.data.cart).toBeNull();

      // Verify in database
      const cartInDb = await prisma.cart.findUnique({
        where: { userId },
        include: { items: true },
      });
      expect(cartInDb).toBeNull();
    });

    it('should add a product to the cart', async () => {
      const addToCartInput = {
        productId: product1Id,
        quantity: 2,
      };

      const response = await graphqlRequest(app, ADD_TO_CART, { input: addToCartInput })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.addToCart).toBeDefined();
      expect(response.body.data.addToCart).toMatchObject({
        userId,
        items: expect.arrayContaining([
          expect.objectContaining({
            productId: product1Id,
            quantity: 2,
          }),
        ]),
      });
      expect(response.body.data.addToCart.items[0].id).toBeDefined();
      expect(response.body.data.addToCart.items[0].createdAt).toBeDefined();
      expect(response.body.data.addToCart.items[0].updatedAt).toBeDefined();

      // Verify in database
      const cartInDb = await prisma.cart.findUnique({
        where: { userId },
        include: { items: true },
      });
      expect(cartInDb.items).toHaveLength(1);
      expect(cartInDb.items[0]).toMatchObject({
        productId: product1Id,
        quantity: 2,
      });
    });
    it('should retrieve user cart with one item', async () => {
      const response = await graphqlRequest(app, GET_CART).set('Authorization', `Bearer ${userToken}`).expect(200);
      expect(response.body.data.cart).toBeDefined();
      expect(response.body.data.cart.items).toHaveLength(1);
      expect(response.body.data.cart.id).toBeDefined();
      expect(response.body.data.cart.createdAt).toBeDefined();
      expect(response.body.data.cart.updatedAt).toBeDefined();

      // Verify in database
      const cartInDb = await prisma.cart.findUnique({
        where: { userId },
        include: { items: true },
      });
      expect(cartInDb).toBeDefined();
      expect(cartInDb.items).toHaveLength(1);
    });

    it('should update the quantity of an item in the cart', async () => {
      // First, add an item to the cart
      const cartItem = await prisma.cartItem.create({
        data: {
          cart: { connect: { userId } },
          product: { connect: { id: product2Id } },
          quantity: 1,
        },
      });

      const updateCartItemInput = {
        cartItemId: cartItem.id,
        quantity: 5,
      };

      const response = await graphqlRequest(app, UPDATE_CART_ITEM, { input: updateCartItemInput })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.updateCartItem).toBeDefined();
      expect(response.body.data.updateCartItem).toMatchObject({
        userId,
        items: expect.arrayContaining([
          expect.objectContaining({
            id: cartItem.id,
            productId: product2Id,
            quantity: 5,
          }),
        ]),
      });

      // Verify in database
      const cartInDb = await prisma.cart.findUnique({
        where: { userId },
        include: { items: true },
      });
      expect(cartInDb.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: cartItem.id,
            productId: product2Id,
            quantity: 5,
          }),
        ]),
      );
    });

    it('should remove an item from the cart', async () => {
      // First, add an item to the cart
      const cartItem = await prisma.cartItem.create({
        data: {
          cart: { connect: { userId } },
          product: { connect: { id: product1Id } },
          quantity: 3,
        },
      });

      const response = await graphqlRequest(app, REMOVE_FROM_CART, { cartItemId: cartItem.id })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.removeFromCart).toBeDefined();
      expect(response.body.data.removeFromCart).toMatchObject({
        userId,
        items: expect.not.arrayContaining([
          expect.objectContaining({
            id: cartItem.id,
          }),
        ]),
      });

      // Verify in database
      const cartItemInDb = await prisma.cartItem.findUnique({
        where: { id: cartItem.id },
      });
      expect(cartItemInDb).toBeNull();
    });

    it('should clear all items from the cart', async () => {
      // Add multiple items to the cart
      await prisma.cartItem.createMany({
        data: [
          {
            cartId: (await prisma.cart.findUnique({ where: { userId } })).id,
            productId: product1Id,
            quantity: 2,
          },
          {
            cartId: (await prisma.cart.findUnique({ where: { userId } })).id,
            productId: product2Id,
            quantity: 4,
          },
        ],
      });

      const response = await graphqlRequest(app, CLEAR_CART).set('Authorization', `Bearer ${userToken}`).expect(200);

      expect(response.body.data.clearCart).toBeDefined();
      expect(response.body.data.clearCart).toMatchObject({
        userId,
        items: [],
      });

      // Verify in database
      const cartInDb = await prisma.cart.findUnique({
        where: { userId },
        include: { items: true },
      });
      expect(cartInDb.items).toHaveLength(0);
    });

    it('should not allow adding a product with invalid productId', async () => {
      const addToCartInput = {
        productId: 'invalid-product-id',
        quantity: 2,
      };

      const response = await graphqlRequest(app, ADD_TO_CART, { input: addToCartInput })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Product \"invalid-product-id\" not found');
    });

    it('should not allow updating a non-existent cart item', async () => {
      const updateCartItemInput = {
        cartItemId: 'non-existent-cart-item-id',
        quantity: 5,
      };

      const response = await graphqlRequest(app, UPDATE_CART_ITEM, { input: updateCartItemInput })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain(
        `Cart item \"non-existent-cart-item-id\" not found in user\'s cart`,
      );
    });

    it('should not allow removing a non-existent cart item', async () => {
      const response = await graphqlRequest(app, REMOVE_FROM_CART, { cartItemId: 'non-existent-cart-item-id' })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain(
        `Cart item \"non-existent-cart-item-id\" not found in user\'s cart`,
      );
    });
  });
});
