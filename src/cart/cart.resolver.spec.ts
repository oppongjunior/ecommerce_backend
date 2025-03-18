import { Test, TestingModule } from '@nestjs/testing';
import { CartResolver } from './cart.resolver';
import { CartService } from './cart.service';
import { AddToCartInput } from './dto/add-to-cart.input';
import { UpdateCartItemInput } from './dto/update-cart.input';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CartResolver', () => {
  let resolver: CartResolver;
  let cartService: CartService;

  const mockCartService = {
    getCart: jest.fn(),
    addToCart: jest.fn(),
    updateCartItem: jest.fn(),
    removeFromCart: jest.fn(),
    clearCart: jest.fn(),
  };

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CartResolver, { provide: CartService, useValue: mockCartService }],
    }).compile();

    resolver = module.get<CartResolver>(CartResolver);
    cartService = module.get<CartService>(CartService);
    jest.resetAllMocks();
  });

  describe('cart', () => {
    it('should return the user’s cart when it exists', async () => {
      mockCartService.getCart.mockResolvedValueOnce(mockCart);

      const result = await resolver.cart(mockUserId);

      expect(cartService.getCart).toHaveBeenCalledWith(mockUserId);
      expect(cartService.getCart).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCart);
    });

    it('should return null when no cart exists', async () => {
      mockCartService.getCart.mockResolvedValueOnce(null);

      const result = await resolver.cart(mockUserId);

      expect(cartService.getCart).toHaveBeenCalledWith(mockUserId);
      expect(cartService.getCart).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
  });

  describe('addToCart', () => {
    const input: AddToCartInput = { productId: 'prod1', quantity: 3 };

    it('should add a product to the cart successfully', async () => {
      mockCartService.addToCart.mockResolvedValueOnce(mockCart);

      const result = await resolver.addToCart(mockUserId, input);

      expect(cartService.addToCart).toHaveBeenCalledWith(mockUserId, input);
      expect(cartService.addToCart).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCart);
    });

    it('should throw NotFoundException when product does not exist', async () => {
      mockCartService.addToCart.mockRejectedValueOnce(new NotFoundException('Product "prod1" not found'));

      await expect(resolver.addToCart(mockUserId, input)).rejects.toThrow(
        new NotFoundException('Product "prod1" not found'),
      );
      expect(cartService.addToCart).toHaveBeenCalledWith(mockUserId, input);
      expect(cartService.addToCart).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when quantity exceeds stock', async () => {
      const highQuantityInput: AddToCartInput = { productId: 'prod1', quantity: 101 };
      mockCartService.addToCart.mockRejectedValueOnce(
        new BadRequestException('Cannot add 101 of "T-Shirt" to cart; only 100 in stock'),
      );

      await expect(resolver.addToCart(mockUserId, highQuantityInput)).rejects.toThrow(
        new BadRequestException('Cannot add 101 of "T-Shirt" to cart; only 100 in stock'),
      );
      expect(cartService.addToCart).toHaveBeenCalledWith(mockUserId, highQuantityInput);
      expect(cartService.addToCart).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when product is inactive', async () => {
      mockCartService.addToCart.mockRejectedValueOnce(new BadRequestException('Product "prod1" is not active'));

      await expect(resolver.addToCart(mockUserId, input)).rejects.toThrow(
        new BadRequestException('Product "prod1" is not active'),
      );
      expect(cartService.addToCart).toHaveBeenCalledWith(mockUserId, input);
      expect(cartService.addToCart).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateCartItem', () => {
    const input: UpdateCartItemInput = { cartItemId: 'item1', quantity: 5 };

    it('should update a cart item successfully', async () => {
      mockCartService.updateCartItem.mockResolvedValueOnce(mockCart);

      const result = await resolver.updateCartItem(mockUserId, input);

      expect(cartService.updateCartItem).toHaveBeenCalledWith(mockUserId, input);
      expect(cartService.updateCartItem).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCart);
    });

    it('should clear a cart item when quantity is 0', async () => {
      const zeroInput: UpdateCartItemInput = { cartItemId: 'item1', quantity: 0 };
      const clearedCart = { ...mockCart, items: [] };
      mockCartService.updateCartItem.mockResolvedValueOnce(clearedCart);

      const result = await resolver.updateCartItem(mockUserId, zeroInput);

      expect(cartService.updateCartItem).toHaveBeenCalledWith(mockUserId, zeroInput);
      expect(cartService.updateCartItem).toHaveBeenCalledTimes(1);
      expect(result).toEqual(clearedCart);
    });

    it('should throw NotFoundException when cart does not exist', async () => {
      mockCartService.updateCartItem.mockRejectedValueOnce(
        new NotFoundException(`Cart for user "${mockUserId}" not found`),
      );

      await expect(resolver.updateCartItem(mockUserId, input)).rejects.toThrow(
        new NotFoundException(`Cart for user "${mockUserId}" not found`),
      );
      expect(cartService.updateCartItem).toHaveBeenCalledWith(mockUserId, input);
      expect(cartService.updateCartItem).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when cart item does not exist', async () => {
      mockCartService.updateCartItem.mockRejectedValueOnce(
        new NotFoundException(`Cart item "item1" not found in user's cart`),
      );

      await expect(resolver.updateCartItem(mockUserId, input)).rejects.toThrow(
        new NotFoundException(`Cart item "item1" not found in user's cart`),
      );
      expect(cartService.updateCartItem).toHaveBeenCalledWith(mockUserId, input);
      expect(cartService.updateCartItem).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when quantity exceeds stock', async () => {
      const highQuantityInput: UpdateCartItemInput = { cartItemId: 'item1', quantity: 101 };
      mockCartService.updateCartItem.mockRejectedValueOnce(
        new BadRequestException('Cannot add 101 of "T-Shirt" to cart; only 100 in stock'),
      );

      await expect(resolver.updateCartItem(mockUserId, highQuantityInput)).rejects.toThrow(
        new BadRequestException('Cannot add 101 of "T-Shirt" to cart; only 100 in stock'),
      );
      expect(cartService.updateCartItem).toHaveBeenCalledWith(mockUserId, highQuantityInput);
      expect(cartService.updateCartItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeFromCart', () => {
    it('should remove a cart item successfully', async () => {
      const clearedCart = { ...mockCart, items: [] };
      mockCartService.removeFromCart.mockResolvedValueOnce(clearedCart);

      const result = await resolver.removeFromCart(mockUserId, 'item1');

      expect(cartService.removeFromCart).toHaveBeenCalledWith(mockUserId, 'item1');
      expect(cartService.removeFromCart).toHaveBeenCalledTimes(1);
      expect(result).toEqual(clearedCart);
    });

    it('should throw NotFoundException when cart does not exist', async () => {
      mockCartService.removeFromCart.mockRejectedValueOnce(
        new NotFoundException(`Cart for user "${mockUserId}" not found`),
      );

      await expect(resolver.removeFromCart(mockUserId, 'item1')).rejects.toThrow(
        new NotFoundException(`Cart for user "${mockUserId}" not found`),
      );
      expect(cartService.removeFromCart).toHaveBeenCalledWith(mockUserId, 'item1');
      expect(cartService.removeFromCart).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when cart item does not exist', async () => {
      mockCartService.removeFromCart.mockRejectedValueOnce(
        new NotFoundException(`Cart item "item999" not found in user's cart`),
      );

      await expect(resolver.removeFromCart(mockUserId, 'item999')).rejects.toThrow(
        new NotFoundException(`Cart item "item999" not found in user's cart`),
      );
      expect(cartService.removeFromCart).toHaveBeenCalledWith(mockUserId, 'item999');
      expect(cartService.removeFromCart).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearCart', () => {
    it('should clear all items from the cart successfully', async () => {
      const clearedCart = { ...mockCart, items: [] };
      mockCartService.clearCart.mockResolvedValueOnce(clearedCart);

      const result = await resolver.clearCart(mockUserId);

      expect(cartService.clearCart).toHaveBeenCalledWith(mockUserId);
      expect(cartService.clearCart).toHaveBeenCalledTimes(1);
      expect(result).toEqual(clearedCart);
    });

    it('should throw NotFoundException when cart does not exist', async () => {
      mockCartService.clearCart.mockRejectedValueOnce(new NotFoundException(`Cart for user "${mockUserId}" not found`));

      await expect(resolver.clearCart(mockUserId)).rejects.toThrow(
        new NotFoundException(`Cart for user "${mockUserId}" not found`),
      );
      expect(cartService.clearCart).toHaveBeenCalledWith(mockUserId);
      expect(cartService.clearCart).toHaveBeenCalledTimes(1);
    });
  });
});
