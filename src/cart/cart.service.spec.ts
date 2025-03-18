import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartInput } from './dto/add-to-cart.input';
import { UpdateCartItemInput } from './dto/update-cart.input';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Cart, CartItem } from '@prisma/client';

const mockPrismaService = {
  cart: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  cartItem: {
    findFirst: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  product: {
    findUnique: jest.fn(),
  },
};

describe('CartService', () => {
  let service: CartService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CartService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<CartService>(CartService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.resetAllMocks();
  });

  const mockUserId = 'user1';
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
  const mockCartItem: CartItem = {
    id: 'item1',
    cartId: 'cart1',
    productId: 'prod1',
    quantity: 2,
    createdAt: fixedDate,
    updatedAt: fixedDate,
  } as CartItem;
  const mockCart: Cart & { items: CartItem[] } = {
    id: 'cart1',
    userId: mockUserId,
    items: [{ ...mockCartItem, product: mockProduct }] as unknown as CartItem[],
    createdAt: fixedDate,
    updatedAt: fixedDate,
  };

  describe('getCart', () => {
    it('should retrieve the user’s cart successfully', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValueOnce(mockCart);

      const result = await service.getCart(mockUserId);

      expect(prisma.cart.findUnique).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        include: { items: { include: { product: true } } },
      });
      expect(result).toEqual(mockCart);
    });

    it('should return null if cart does not exist', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValueOnce(null);

      const result = await service.getCart(mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('addToCart', () => {
    const input: AddToCartInput = { productId: 'prod1', quantity: 3 };

    it('should add a new product to the cart successfully', async () => {
      mockPrismaService.product.findUnique.mockResolvedValueOnce(mockProduct);
      mockPrismaService.cart.findUnique.mockResolvedValueOnce(null); // findOrCreateCart
      mockPrismaService.cart.create.mockResolvedValueOnce({
        id: 'cart1',
        userId: mockUserId,
        createdAt: fixedDate,
        updatedAt: fixedDate,
      });
      mockPrismaService.cartItem.findFirst.mockResolvedValueOnce(null);
      mockPrismaService.cartItem.upsert.mockResolvedValueOnce(mockCartItem);
      mockPrismaService.cart.findUnique.mockResolvedValueOnce(mockCart); // getCart

      const result = await service.addToCart(mockUserId, input);

      expect(prisma.cart.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id: 'prod1' } });
      expect(prisma.cartItem.upsert).toHaveBeenCalledWith({
        where: { id: '' },
        update: { quantity: 3 },
        create: { cartId: 'cart1', productId: 'prod1', quantity: 3 },
      });
      expect(result).toEqual(mockCart);
    });

    it('should update quantity if product already exists in cart', async () => {
      const existingItem = { id: 'item1', quantity: 2 };
      mockPrismaService.product.findUnique.mockResolvedValueOnce(mockProduct);
      mockPrismaService.cart.findUnique.mockResolvedValueOnce(mockCart); // findOrCreateCart
      mockPrismaService.cartItem.findFirst.mockResolvedValueOnce(existingItem);
      mockPrismaService.cartItem.upsert.mockResolvedValueOnce({ ...mockCartItem, quantity: 5 });
      mockPrismaService.cart.findUnique.mockResolvedValueOnce(mockCart); // getCart

      const result = await service.addToCart(mockUserId, input);

      expect(prisma.cart.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.cartItem.upsert).toHaveBeenCalledWith({
        where: { id: 'item1' },
        update: { quantity: 5 },
        create: { cartId: 'cart1', productId: 'prod1', quantity: 3 },
      });
      expect(result).toEqual(mockCart);
    });

    it('should throw NotFoundException if product does not exist', async () => {
      mockPrismaService.product.findUnique.mockResolvedValueOnce(null);

      await expect(service.addToCart(mockUserId, input)).rejects.toThrow(
        new NotFoundException('Product "prod1" not found'),
      );
    });

    it('should throw BadRequestException if quantity exceeds stock', async () => {
      mockPrismaService.product.findUnique.mockResolvedValueOnce(mockProduct);
      mockPrismaService.cart.findUnique.mockResolvedValueOnce(mockCart); // findOrCreateCart

      await expect(service.addToCart(mockUserId, { productId: 'prod1', quantity: 101 })).rejects.toThrow(
        new BadRequestException('Cannot add 101 of "T-Shirt" to cart; only 100 in stock'),
      );
    });

    it('should throw BadRequestException if product is inactive', async () => {
      mockPrismaService.product.findUnique.mockResolvedValueOnce({ ...mockProduct, isActive: false });

      await expect(service.addToCart(mockUserId, input)).rejects.toThrow(
        new BadRequestException('Product "prod1" is not active'),
      );
    });
  });

  describe('updateCartItem', () => {
    const input: UpdateCartItemInput = { cartItemId: 'item1', quantity: 5 };

    it('should update cart item quantity successfully', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValueOnce(mockCart); // getCartOrThrow
      mockPrismaService.product.findUnique.mockResolvedValueOnce(mockProduct);
      mockPrismaService.cartItem.update.mockResolvedValueOnce({ ...mockCartItem, quantity: 5 });
      mockPrismaService.cart.findUnique.mockResolvedValueOnce(mockCart); // getCart

      const result = await service.updateCartItem(mockUserId, input);

      expect(prisma.cart.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id: 'prod1' } });
      expect(prisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'item1' },
        data: { quantity: 5 },
      });
      expect(result).toEqual(mockCart);
    });

    it('should remove cart item if quantity is 0', async () => {
      const zeroInput = { cartItemId: 'item1', quantity: 0 };
      mockPrismaService.cart.findUnique.mockResolvedValueOnce(mockCart); // getCartOrThrow
      mockPrismaService.cartItem.delete.mockResolvedValueOnce(mockCartItem);
      mockPrismaService.cart.findUnique.mockResolvedValueOnce({ ...mockCart, items: [] }); // getCart

      const result = await service.updateCartItem(mockUserId, zeroInput);

      expect(prisma.cart.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.cartItem.delete).toHaveBeenCalledWith({ where: { id: 'item1' } });
      expect(result).toEqual({ ...mockCart, items: [] });
    });

    it('should throw NotFoundException if cart does not exist', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValueOnce(null); // getCartOrThrow

      await expect(service.updateCartItem(mockUserId, input)).rejects.toThrow(
        new NotFoundException(`Cart for user "${mockUserId}" not found`),
      );
    });

    it('should throw NotFoundException if cart item does not exist', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValueOnce({ ...mockCart, items: [] }); // getCartOrThrow

      await expect(service.updateCartItem(mockUserId, input)).rejects.toThrow(
        new NotFoundException(`Cart item "item1" not found in user's cart`),
      );
    });

    it('should throw BadRequestException if quantity exceeds stock', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValueOnce(mockCart); // getCartOrThrow
      mockPrismaService.product.findUnique.mockResolvedValueOnce(mockProduct);

      await expect(service.updateCartItem(mockUserId, { cartItemId: 'item1', quantity: 101 })).rejects.toThrow(
        new BadRequestException('Cannot add 101 of "T-Shirt" to cart; only 100 in stock'),
      );
    });
  });

  describe('removeFromCart', () => {
    it('should remove a cart item successfully', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValueOnce(mockCart); // getCartOrThrow
      mockPrismaService.cartItem.delete.mockResolvedValueOnce(mockCartItem);
      mockPrismaService.cart.findUnique.mockResolvedValueOnce({ ...mockCart, items: [] }); // getCart

      const result = await service.removeFromCart(mockUserId, 'item1');

      expect(prisma.cart.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.cartItem.delete).toHaveBeenCalledWith({ where: { id: 'item1' } });
      expect(result).toEqual({ ...mockCart, items: [] });
    });

    it('should throw NotFoundException if cart does not exist', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValueOnce(null); // getCartOrThrow

      await expect(service.removeFromCart(mockUserId, 'item1')).rejects.toThrow(
        new NotFoundException(`Cart for user "${mockUserId}" not found`),
      );
    });

    it('should throw NotFoundException if cart item does not exist', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValueOnce({ ...mockCart, items: [] }); // getCartOrThrow

      await expect(service.removeFromCart(mockUserId, 'item999')).rejects.toThrow(
        new NotFoundException(`Cart item "item999" not found in user's cart`),
      );
    });
  });

  describe('clearCart', () => {
    it('should clear all items from the cart successfully', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValueOnce(mockCart); // getCartOrThrow
      mockPrismaService.cartItem.deleteMany.mockResolvedValueOnce({ count: 1 });
      mockPrismaService.cart.findUnique.mockResolvedValueOnce({ ...mockCart, items: [] }); // getCart

      const result = await service.clearCart(mockUserId);

      expect(prisma.cart.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: 'cart1' } });
      expect(result).toEqual({ ...mockCart, items: [] });
    });

    it('should throw NotFoundException if cart does not exist', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValueOnce(null);

      await expect(service.clearCart(mockUserId)).rejects.toThrow(
        new NotFoundException(`Cart for user "${mockUserId}" not found`),
      );
    });
  });
});
