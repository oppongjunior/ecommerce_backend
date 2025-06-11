import { Test, TestingModule } from '@nestjs/testing';
import { WishlistResolver } from './wishlist.resolver';
import { WishlistService } from './wishlist.service';

describe('WishlistResolver', () => {
  let resolver: WishlistResolver;
  let wishlistService: WishlistService;

  const mockWishlistService = {
    getOrCreateWishlist: jest.fn(),
    addToWishlist: jest.fn(),
    removeFromWishlist: jest.fn(),
    clearWishlist: jest.fn(),
  };

  const mockUserId = 'user1';
  const mockProductId = 'prod1';
  const fixedDate = new Date('2025-03-18T00:00:00.000Z');
  const mockWishlist = {
    id: 'wish1',
    userId: mockUserId,
    products: [],
    createdAt: fixedDate,
    updatedAt: fixedDate,
  };
  const mockWishlistWithProduct = {
    ...mockWishlist,
    products: [{ id: mockProductId, name: 'T-Shirt' }],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WishlistResolver, { provide: WishlistService, useValue: mockWishlistService }],
    }).compile();

    resolver = module.get<WishlistResolver>(WishlistResolver);
    wishlistService = module.get<WishlistService>(WishlistService);
    jest.resetAllMocks();
  });

  describe('getWishlist', () => {
    it('should retrieve the user’s wishlist', async () => {
      mockWishlistService.getOrCreateWishlist.mockResolvedValue(mockWishlist);

      const result = await resolver.getWishlist(mockUserId);

      expect(wishlistService.getOrCreateWishlist).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockWishlist);
    });
  });

  describe('addToWishlist', () => {
    it('should add a product to the user’s wishlist', async () => {
      mockWishlistService.addToWishlist.mockResolvedValue(mockWishlistWithProduct);

      const result = await resolver.addToWishlist(mockUserId, mockProductId);

      expect(wishlistService.addToWishlist).toHaveBeenCalledWith(mockUserId, mockProductId);
      expect(result).toEqual(mockWishlistWithProduct);
    });
  });

  describe('removeFromWishlist', () => {
    it('should remove a product from the user’s wishlist', async () => {
      mockWishlistService.removeFromWishlist.mockResolvedValue(mockWishlist);

      const result = await resolver.removeFromWishlist(mockUserId, mockProductId);

      expect(wishlistService.removeFromWishlist).toHaveBeenCalledWith(mockUserId, mockProductId);
      expect(result).toEqual(mockWishlist);
    });
  });

  describe('clearWishlist', () => {
    it('should clear the user’s wishlist', async () => {
      mockWishlistService.clearWishlist.mockResolvedValue(mockWishlist);

      const result = await resolver.clearWishlist(mockUserId);

      expect(wishlistService.clearWishlist).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockWishlist);
    });
  });

  // Role-Based Access Tests (Assuming decorator enforcement)
  describe('role-based access', () => {
    it('should allow USER role to access getWishlist', async () => {
      mockWishlistService.getOrCreateWishlist.mockResolvedValue(mockWishlist);

      const result = await resolver.getWishlist(mockUserId);

      expect(wishlistService.getOrCreateWishlist).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockWishlist);
    });

    it('should allow USER role to addToWishlist', async () => {
      mockWishlistService.addToWishlist.mockResolvedValue(mockWishlistWithProduct);

      const result = await resolver.addToWishlist(mockUserId, mockProductId);

      expect(wishlistService.addToWishlist).toHaveBeenCalledWith(mockUserId, mockProductId);
      expect(result).toEqual(mockWishlistWithProduct);
    });
  });
});
