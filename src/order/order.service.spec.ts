import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { OrdersService } from './order.service';

describe('OrdersService', () => {
  let ordersService: OrdersService;
  let prismaService: PrismaService;
  let cartService: CartService;

  const mockPrismaService = {
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    address: {
      findFirst: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    cartItem: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockCartService = {
    getCartOrThrow: jest.fn(),
  };

  const mockUserId = 'user1';
  const mockAddressId = 'addr1';
  const fixedDate = new Date('2025-03-18T00:00:00.000Z');
  const mockProduct = {
    id: 'prod1',
    name: 'T-Shirt',
    price: 19.99,
    quantity: 100,
    isActive: true,
    categoryId: 'cat1',
    createdAt: fixedDate,
    updatedAt: fixedDate,
    images: [],
  };
  const mockCartItem = {
    id: 'item1',
    cartId: 'cart1',
    productId: 'prod1',
    quantity: 2,
    createdAt: fixedDate,
    updatedAt: fixedDate,
  };
  const mockCart = {
    id: 'cart1',
    userId: mockUserId,
    items: [{ ...mockCartItem, product: mockProduct }],
    createdAt: fixedDate,
    updatedAt: fixedDate,
  };
  const mockOrderItem = {
    id: 'orderItem1',
    orderId: 'order1',
    productId: 'prod1',
    variantId: null,
    quantity: 2,
    priceAtOrder: 19.99,
    createdAt: fixedDate,
    updatedAt: fixedDate,
  };
  const mockOrder = {
    id: 'order1',
    userId: mockUserId,
    totalAmount: 44.978, // 2 * 19.99 + 10% tax + $5 shipping
    status: 'PENDING' as OrderStatus,
    shippingAddressId: mockAddressId,
    createdAt: fixedDate,
    updatedAt: fixedDate,
    items: [{ ...mockOrderItem, product: mockProduct }],
  };
  const mockUser = {
    id: mockUserId,
    isActive: true,
    createdAt: fixedDate,
    updatedAt: fixedDate,
    email: 'test@example.com',
    password: 'hashedPassword',
    role: 'USER',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CartService, useValue: mockCartService },
      ],
    }).compile();

    ordersService = module.get<OrdersService>(OrdersService);
    prismaService = module.get<PrismaService>(PrismaService);
    cartService = module.get<CartService>(CartService);
    // Reset mocks before each test
    jest.resetAllMocks();

    // Mock $transaction to call the callback with mocked Prisma client
    mockPrismaService.$transaction.mockImplementation(async (callback) => {
      return callback(mockPrismaService);
    });
  });

  describe('createOrderFromCart', () => {
    it('should create an order successfully', async () => {
      mockCartService.getCartOrThrow.mockResolvedValue(mockCart);
      mockPrismaService.address.findFirst.mockResolvedValue({ id: mockAddressId, userId: mockUserId });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.order.create.mockResolvedValue(mockOrder);
      mockPrismaService.product.update.mockResolvedValue(mockProduct);
      mockPrismaService.cartItem.deleteMany.mockResolvedValue({ count: 1 });

      const result = await ordersService.createOrderFromCart(mockUserId, mockAddressId);

      expect(cartService.getCartOrThrow).toHaveBeenCalledWith(mockUserId);
      expect(prismaService.address.findFirst).toHaveBeenCalledWith({
        where: { id: mockAddressId, userId: mockUserId },
      });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { id: mockUserId } });
      expect(prismaService.product.findUnique).toHaveBeenCalledWith({ where: { id: 'prod1' } });
      expect(prismaService.order.create).toHaveBeenCalled();
      expect(prismaService.product.update).toHaveBeenCalledWith({
        where: { id: 'prod1' },
        data: { quantity: { decrement: 2 } },
      });
      expect(prismaService.cartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: 'cart1' } });
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException if cart is empty', async () => {
      mockCartService.getCartOrThrow.mockResolvedValue({ ...mockCart, items: [] });

      await expect(ordersService.createOrderFromCart(mockUserId, mockAddressId)).rejects.toThrow(
        new NotFoundException(`Cart for user "${mockUserId}" is empty`),
      );
    });

    it('should throw NotFoundException if shipping address is invalid', async () => {
      mockCartService.getCartOrThrow.mockResolvedValue(mockCart);
      mockPrismaService.address.findFirst.mockResolvedValue(null);

      await expect(ordersService.createOrderFromCart(mockUserId, mockAddressId)).rejects.toThrow(
        new NotFoundException(`Shipping address "${mockAddressId}" not found for user "${mockUserId}"`),
      );
    });

    it('should throw BadRequestException if user is inactive', async () => {
      mockCartService.getCartOrThrow.mockResolvedValue(mockCart);
      mockPrismaService.address.findFirst.mockResolvedValue({ id: mockAddressId, userId: mockUserId });
      mockPrismaService.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(ordersService.createOrderFromCart(mockUserId, mockAddressId)).rejects.toThrow(
        new BadRequestException(`User "${mockUserId}" is not eligible to place an order`),
      );
    });

    it('should throw BadRequestException if stock is insufficient', async () => {
      mockCartService.getCartOrThrow.mockResolvedValue({
        ...mockCart,
        items: [{ ...mockCartItem, quantity: 101 }],
      });
      mockPrismaService.address.findFirst.mockResolvedValue({ id: mockAddressId, userId: mockUserId });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      await expect(ordersService.createOrderFromCart(mockUserId, mockAddressId)).rejects.toThrow(
        new BadRequestException('Insufficient stock for "T-Shirt": 100 available, 101 requested'),
      );
    });
  });

  describe('getOrder', () => {
    it('should retrieve a user’s order', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const result = await ordersService.getOrder(mockUserId, 'order1');

      expect(prismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order1' },
        include: { items: { include: { product: true } } },
      });
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException if order doesn’t exist', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(ordersService.getOrder(mockUserId, 'order1')).rejects.toThrow(
        new NotFoundException(`Order "order1" not found`),
      );
    });
  });

  describe('getUserOrders', () => {
    it('should retrieve all user orders', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([mockOrder]);

      const result = await ordersService.getUserOrders(mockUserId);

      expect(prismaService.order.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockOrder]);
    });
  });

  describe('getOrders', () => {
    it('should retrieve all orders', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([mockOrder]);

      const result = await ordersService.getOrders();

      expect(prismaService.order.findMany).toHaveBeenCalledWith();
      expect(result).toEqual([mockOrder]);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue({ ...mockOrder, status: 'SHIPPED' });

      const result = await ordersService.updateOrderStatus(mockUserId, 'order1', 'SHIPPED');

      expect(prismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'order1' },
        data: { status: 'SHIPPED' },
        include: { items: { include: { product: true } } },
      });
      expect(result).toEqual({ ...mockOrder, status: 'SHIPPED' });
    });

    it('should throw NotFoundException if order doesn’t exist', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(ordersService.updateOrderStatus(mockUserId, 'order1', 'SHIPPED')).rejects.toThrow(
        new NotFoundException(`Order "order1" not found`),
      );
    });
  });

  describe('cancelOrder', () => {
    it('should cancel an order and restore stock', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.product.update.mockResolvedValue(mockProduct);
      mockPrismaService.order.update.mockResolvedValue({ ...mockOrder, status: 'CANCELLED' });

      const result = await ordersService.cancelOrder(mockUserId, 'order1');

      expect(prismaService.product.update).toHaveBeenCalledWith({
        where: { id: 'prod1' },
        data: { quantity: { increment: 2 } },
      });
      expect(prismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'order1' },
        data: { status: 'CANCELLED' },
        include: { items: { include: { product: true } } },
      });
      expect(result).toEqual({ ...mockOrder, status: 'CANCELLED' });
    });

    it('should throw BadRequestException if order is already shipped', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({ ...mockOrder, status: 'SHIPPED' });

      await expect(ordersService.cancelOrder(mockUserId, 'order1')).rejects.toThrow(
        new BadRequestException(`Order "order1" cannot be cancelled; current status: SHIPPED`),
      );
    });
  });

  describe('markOrderAsPaid', () => {
    it('should mark order as paid and set status to PROCESSING', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue({ ...mockOrder, status: 'PROCESSING' });

      const result = await ordersService.markOrderAsPaid(mockUserId, 'order1');

      expect(prismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'order1' },
        data: { status: 'PROCESSING' },
        include: { items: { include: { product: true } } },
      });
      expect(result).toEqual({ ...mockOrder, status: 'PROCESSING' });
    });

    it('should throw BadRequestException if order is not PENDING', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({ ...mockOrder, status: 'SHIPPED' });

      await expect(ordersService.markOrderAsPaid(mockUserId, 'order1')).rejects.toThrow(
        new BadRequestException(`Order "order1" cannot be paid; current status: SHIPPED`),
      );
    });
  });

  describe('deleteOrder', () => {
    it('should delete an order and restore stock', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.product.update.mockResolvedValue(mockProduct);
      mockPrismaService.order.delete.mockResolvedValue(mockOrder);

      const result = await ordersService.deleteOrder('order1');

      expect(prismaService.product.update).toHaveBeenCalledWith({
        where: { id: 'prod1' },
        data: { quantity: { increment: 2 } },
      });
      expect(prismaService.order.delete).toHaveBeenCalledWith({
        where: { id: 'order1' },
        include: { items: { include: { product: true } } },
      });
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException if order doesn’t exist', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(ordersService.deleteOrder('order1')).rejects.toThrow(
        new NotFoundException(`Order "order1" not found`),
      );
    });
  });
});
