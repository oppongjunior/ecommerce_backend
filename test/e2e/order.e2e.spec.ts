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
const GET_ORDER = `
  query GetOrder($orderId: String!) {
    order(orderId: $orderId) {
      id
      userId
      totalAmount
      status
      shippingAddressId
      createdAt
      updatedAt
      items {
        id
        productId
        quantity
        priceAtOrder
      }
    }
  }
`;

const GET_USER_ORDERS = `
  query GetUserOrders {
    userOrders {
      id
      userId
      totalAmount
      status
      shippingAddressId
      createdAt
      updatedAt
      items {
        id
        productId
        quantity
        priceAtOrder
      }
    }
  }
`;

const GET_ALL_ORDERS = `
  query GetOrders {
    orders {
      id
      userId
      totalAmount
      status
      shippingAddressId
      createdAt
      updatedAt
      items {
        id
        productId
        quantity
        priceAtOrder
      }
    }
  }
`;

const VIEW_ORDER = `
  query ViewOrder($id: String!) {
    viewOrder(id: $id) {
      id
      userId
      totalAmount
      status
      shippingAddressId
      createdAt
      updatedAt
      items {
        id
        productId
        quantity
        priceAtOrder
      }
    }
  }
`;

const CREATE_ORDER = `
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      userId
      totalAmount
      status
      shippingAddressId
      createdAt
      updatedAt
      items {
        id
        productId
        quantity
        priceAtOrder
      }
    }
  }
`;

const UPDATE_ORDER_STATUS = `
  mutation UpdateOrderStatus($input: UpdateOrderStatusInput!) {
    updateOrderStatus(input: $input) {
      id
      userId
      totalAmount
      status
      shippingAddressId
      createdAt
      updatedAt
      items {
        id
        productId
        quantity
        priceAtOrder
      }
    }
  }
`;

const CANCEL_ORDER = `
  mutation CancelOrder($orderId: String!) {
    cancelOrder(orderId: $orderId) {
      id
      userId
      totalAmount
      status
      shippingAddressId
      createdAt
      updatedAt
      items {
        id
        productId
        quantity
        priceAtOrder
      }
    }
  }
`;

const DELETE_ORDER = `
  mutation DeleteOrder($orderId: String!) {
    deleteOrder(orderId: $orderId) {
      id
      userId
      totalAmount
      status
      shippingAddressId
      createdAt
      updatedAt
      items {
        id
        productId
        quantity
        priceAtOrder
      }
    }
  }
`;

describe('Order E2E Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userToken: string;
  let userId: string;
  let adminToken: string;
  let superAdminToken: string;
  let product1Id: string;
  let product2Id: string;
  let shippingAddressId: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;

    await app.init();
    await clearDatabase(prisma);

    const user = await createUser(prisma);
    userId = user.id;
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

    const address = await prisma.address.create({
      data: {
        userId,
        street: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
        country: 'USA',
      },
    });
    shippingAddressId = address.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User Order Actions', () => {
    it('should retrieve an empty list of orders for a new user', async () => {
      const response = await graphqlRequest(app, GET_USER_ORDERS)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.userOrders).toBeInstanceOf(Array);
      expect(response.body.data.userOrders).toHaveLength(0);

      // Verify in database
      const ordersInDb = await prisma.order.findMany({
        where: { userId },
      });
      expect(ordersInDb).toHaveLength(0);
    });

    it('should create an order from the cart', async () => {
      // Add items to the cart
      await prisma.cart.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });
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
            quantity: 1,
          },
        ],
      });

      const createOrderInput = { shippingAddressId };
      const response = await graphqlRequest(app, CREATE_ORDER, { input: createOrderInput })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.createOrder).toBeDefined();
      expect(response.body.data.createOrder).toMatchObject({
        userId,
        status: 'PENDING',
        shippingAddressId,
        items: expect.arrayContaining([
          expect.objectContaining({ productId: product1Id, quantity: 2 }),
          expect.objectContaining({ productId: product2Id, quantity: 1 }),
        ]),
      });
      expect(response.body.data.createOrder.id).toBeDefined();
      expect(response.body.data.createOrder.totalAmount).toBeGreaterThan(0);
      expect(response.body.data.createOrder.createdAt).toBeDefined();
      expect(response.body.data.createOrder.updatedAt).toBeDefined();

      // Verify in database
      const orderInDb = await prisma.order.findUnique({
        where: { id: response.body.data.createOrder.id },
        include: { items: true },
      });
      expect(orderInDb).toMatchObject({
        userId,
        status: 'PENDING',
        shippingAddressId,
      });
      expect(orderInDb.items).toHaveLength(2);

      // Verify cart is cleared
      const cartInDb = await prisma.cart.findUnique({
        where: { userId },
        include: { items: true },
      });
      expect(cartInDb.items).toHaveLength(0);
    });

    it('should retrieve a specific order by ID', async () => {
      const cart = await prisma.cart.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product1Id,
          quantity: 1,
        },
      });

      const order = await prisma.order.create({
        data: {
          userId,
          totalAmount: 100.0,
          status: 'PENDING',
          shippingAddressId,
          items: {
            create: [{ productId: product1Id, quantity: 1, priceAtOrder: 100.0 }],
          },
        },
      });

      const response = await graphqlRequest(app, GET_ORDER, { orderId: order.id })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.order).toMatchObject({
        id: order.id,
        userId,
        totalAmount: 100.0,
        status: 'PENDING',
        shippingAddressId,
        items: expect.arrayContaining([
          expect.objectContaining({
            productId: product1Id,
            quantity: 1,
            priceAtOrder: 100.0,
          }),
        ]),
      });
    });

    it('should cancel an order', async () => {
      const order = await prisma.order.create({
        data: {
          userId,
          totalAmount: 75.0,
          status: 'PENDING',
          shippingAddressId,
          items: {
            create: [{ productId: product1Id, quantity: 1, priceAtOrder: 75.0 }],
          },
        },
      });

      const response = await graphqlRequest(app, CANCEL_ORDER, { orderId: order.id })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.cancelOrder).toMatchObject({
        id: order.id,
        userId,
        status: 'CANCELLED',
        shippingAddressId,
      });

      // Verify in database
      const orderInDb = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(orderInDb.status).toBe('CANCELLED');
    });

    it('should not allow creating an order with an empty cart', async () => {
      // Ensure cart is empty
      await prisma.cartItem.deleteMany({ where: { cart: { userId } } });

      const createOrderInput = { shippingAddressId };
      const response = await graphqlRequest(app, CREATE_ORDER, { input: createOrderInput })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain(`Cart for user \"user1\" is empty`);
    });

    it('should not allow creating an order with an invalid shipping address', async () => {
      // Add an item to the cart
      await prisma.cart.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });
      await prisma.cartItem.create({
        data: {
          cartId: (await prisma.cart.findUnique({ where: { userId } })).id,
          productId: product1Id,
          quantity: 1,
        },
      });

      const createOrderInput = { shippingAddressId: 'invalid-address-id' };
      const response = await graphqlRequest(app, CREATE_ORDER, { input: createOrderInput })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain(
        `Shipping address \"invalid-address-id\" not found for user \"user1\"`,
      );
    });

    it('should not allow retrieving another user’s order', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'otheruser@example.com',
          password: 'hashedpassword',
          role: 'USER',
        },
      });
      const otherAddress = await prisma.address.create({
        data: {
          userId: otherUser.id,
          street: '456 Oak St',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62702',
          country: 'USA',
        },
      });
      const otherOrder = await prisma.order.create({
        data: {
          userId: otherUser.id,
          totalAmount: 100.0,
          status: 'PENDING',
          shippingAddressId: otherAddress.id,
          items: {
            create: [{ productId: product1Id, quantity: 1, priceAtOrder: 100.0 }],
          },
        },
      });

      const response = await graphqlRequest(app, GET_ORDER, { orderId: otherOrder.id })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain(`not found`);
    });
  });

  describe('Admin Order Actions', () => {
    it('should retrieve all orders', async () => {
      const order = await prisma.order.create({
        data: {
          userId,
          totalAmount: 200.0,
          status: 'PENDING',
          shippingAddressId,
          items: {
            create: [{ productId: product1Id, quantity: 2, priceAtOrder: 100.0 }],
          },
        },
      });

      const response = await graphqlRequest(app, GET_ALL_ORDERS)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.orders).toBeInstanceOf(Array);
      expect(response.body.data.orders.length).toBeGreaterThan(0);
      expect(response.body.data.orders).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: order.id,
            userId,
            totalAmount: 200.0,
            status: 'PENDING',
            shippingAddressId,
          }),
        ]),
      );
    });

    it('should view a specific order', async () => {
      const order = await prisma.order.create({
        data: {
          userId,
          totalAmount: 150.0,
          status: 'PENDING',
          shippingAddressId,
          items: {
            create: [{ productId: product1Id, quantity: 1, priceAtOrder: 150.0 }],
          },
        },
      });

      const response = await graphqlRequest(app, VIEW_ORDER, { id: order.id })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(response.body.data.viewOrder).toMatchObject({
        id: order.id,
        userId,
        totalAmount: 150.0,
        status: 'PENDING',
        shippingAddressId,
      });
    });

    it('should delete an order', async () => {
      const order = await prisma.order.create({
        data: {
          userId,
          totalAmount: 300.0,
          status: 'PENDING',
          shippingAddressId,
          items: {
            create: [{ productId: product1Id, quantity: 3, priceAtOrder: 100.0 }],
          },
        },
      });

      const response = await graphqlRequest(app, DELETE_ORDER, { orderId: order.id })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.deleteOrder).toMatchObject({
        id: order.id,
        userId,
        totalAmount: 300.0,
        status: 'PENDING',
        shippingAddressId,
      });

      // Verify in database
      const orderInDb = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(orderInDb).toBeNull();
    });
    it('should update the order status', async () => {
      const order = await prisma.order.create({
        data: {
          userId,
          totalAmount: 50.0,
          status: 'PENDING',
          shippingAddressId,
          items: {
            create: [{ productId: product1Id, quantity: 1, priceAtOrder: 50.0 }],
          },
        },
      });

      const updateOrderStatusInput = { orderId: order.id, status: 'PROCESSING' };
      const response = await graphqlRequest(app, UPDATE_ORDER_STATUS, { input: updateOrderStatusInput })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.updateOrderStatus).toMatchObject({
        id: order.id,
        userId,
        status: 'PROCESSING',
        shippingAddressId,
      });

      // Verify in database
      const orderInDb = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(orderInDb.status).toBe('PROCESSING');
    });
  });

  describe('Super Admin Order Actions', () => {
    it('should retrieve all orders', async () => {
      const order = await prisma.order.create({
        data: {
          userId,
          totalAmount: 250.0,
          status: 'PENDING',
          shippingAddressId,
          items: {
            create: [{ productId: product1Id, quantity: 2, priceAtOrder: 125.0 }],
          },
        },
      });

      const response = await graphqlRequest(app, GET_ALL_ORDERS)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.orders).toBeInstanceOf(Array);
      expect(response.body.data.orders.length).toBeGreaterThan(0);
      expect(response.body.data.orders).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: order.id,
            userId,
            totalAmount: 250.0,
            status: 'PENDING',
            shippingAddressId,
          }),
        ]),
      );
    });

    it('should view a specific order', async () => {
      const order = await prisma.order.create({
        data: {
          userId,
          totalAmount: 175.0,
          status: 'PENDING',
          shippingAddressId,
          items: {
            create: [{ productId: product1Id, quantity: 1, priceAtOrder: 175.0 }],
          },
        },
      });

      const response = await graphqlRequest(app, VIEW_ORDER, { id: order.id })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.viewOrder).toMatchObject({
        id: order.id,
        userId,
        totalAmount: 175.0,
        status: 'PENDING',
        shippingAddressId,
      });
    });

    it('should delete an order', async () => {
      const order = await prisma.order.create({
        data: {
          userId,
          totalAmount: 400.0,
          status: 'PENDING',
          shippingAddressId,
          items: {
            create: [{ productId: product1Id, quantity: 4, priceAtOrder: 100.0 }],
          },
        },
      });

      const response = await graphqlRequest(app, DELETE_ORDER, { orderId: order.id })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.deleteOrder).toMatchObject({
        id: order.id,
        userId,
        totalAmount: 400.0,
        status: 'PENDING',
        shippingAddressId,
      });

      // Verify in database
      const orderInDb = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(orderInDb).toBeNull();
    });
    it('should update the order status', async () => {
      const order = await prisma.order.create({
        data: {
          userId,
          totalAmount: 50.0,
          status: 'PENDING',
          shippingAddressId,
          items: {
            create: [{ productId: product1Id, quantity: 1, priceAtOrder: 50.0 }],
          },
        },
      });

      const updateOrderStatusInput = { orderId: order.id, status: 'PROCESSING' };
      const response = await graphqlRequest(app, UPDATE_ORDER_STATUS, { input: updateOrderStatusInput })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.updateOrderStatus).toMatchObject({
        id: order.id,
        userId,
        status: 'PROCESSING',
        shippingAddressId,
      });

      // Verify in database
      const orderInDb = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(orderInDb.status).toBe('PROCESSING');
    });
  });
});
