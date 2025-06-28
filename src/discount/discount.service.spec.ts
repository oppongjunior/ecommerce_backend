import { Test, TestingModule } from '@nestjs/testing';
import { DiscountService } from './discount.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiscountInput } from './dto/create-discount.input';
import { UpdateDiscountInput } from './dto/update-discount.input';
import { Discount, Prisma, Product, Variant } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DiscountType } from './enums/discount-type.enum';

describe('DiscountService', () => {
  let service: DiscountService;
  let prisma: PrismaService;

  // Mock PrismaService
  const mockPrismaService = {
    discount: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    variant: {
      findUnique: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    category: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    cart: {
      findUnique: jest.fn(),
    },
    cartItem: {
      update: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    orderItem: {
      update: jest.fn(),
    },
  };

  // Mock data
  const mockDiscount: Discount = {
    id: 'discount1',
    name: 'Summer Sale',
    description: '20% off',
    type: DiscountType.PERCENTAGE,
    value: new Prisma.Decimal(20),
    startDate: new Date('2025-06-01'),
    endDate: new Date('2025-06-30'),
    isActive: true,
    minimumPurchase: null,
  };

  const mockProduct: Product = {
    id: 'product1',
    name: 'T-Shirt',
    price: new Prisma.Decimal(100),
    description: null,
    sku: 'TSHIRT001',
    quantity: 10,
    images: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    categoryId: 'category1',
    subcategoryId: null,
    brand: null,
  };

  const mockVariant: Variant = {
    id: 'variant1',
    productId: 'product1',
    size: 'Large',
    price: new Prisma.Decimal(120),
    quantity: 5,
  } as Variant;

  const mockCartItem = {
    id: 'cartItem1',
    cartId: 'cart1',
    productId: 'product1',
    variantId: null,
    quantity: 2,
    originalPrice: 100,
    discountedPrice: null,
    discountId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    product: mockProduct,
    variant: null,
  };

  const mockCart = {
    id: 'cart1',
    userId: 'user1',
    items: [mockCartItem],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrderItem = {
    id: 'orderItem1',
    orderId: 'order1',
    productId: 'product1',
    variantId: null,
    quantity: 2,
    originalPrice: 100,
    discountAmount: null,
    discountId: null,
    createdAt: new Date(),
  };

  const mockOrder = {
    id: 'order1',
    userId: 'user1',
    items: [mockOrderItem],
    total: 200,
    discountTotal: null,
    finalTotal: 200,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiscountService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<DiscountService>(DiscountService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDiscount', () => {
    const input: CreateDiscountInput = {
      name: 'Summer Sale',
      type: DiscountType.PERCENTAGE,
      value: 20,
      startDate: new Date('2025-06-01'),
      endDate: new Date('2025-06-30'),
      isActive: true,
      products: ['product1'],
      variants: [],
      categories: [],
    };

    it('should create a discount successfully', async () => {
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.discount.create.mockResolvedValue(mockDiscount);

      const result = await service.createDiscount(input);
      expect(result).toEqual(mockDiscount);
      expect(mockPrismaService.discount.create).toHaveBeenCalledWith({
        data: {
          name: input.name,
          description: input.description,
          type: input.type,
          value: input.value,
          startDate: input.startDate,
          endDate: input.endDate,
          isActive: true,
          minimumPurchase: undefined,
          products: { connect: [{ id: 'product1' }] },
          variants: undefined,
          categories: undefined,
        },
      });
    });

    it('should throw BadRequestException for invalid product IDs', async () => {
      mockPrismaService.product.count.mockResolvedValue(0);
      mockPrismaService.product.findMany.mockResolvedValue([]);

      await expect(service.createDiscount(input)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.product.count).toHaveBeenCalledWith({ where: { id: { in: ['product1'] } } });
    });

    it('should throw BadRequestException for endDate before startDate', async () => {
      const invalidInput = { ...input, endDate: new Date('2025-05-01') };
      await expect(service.createDiscount(invalidInput)).rejects.toThrow('End date must be after start date');
    });
  });

  describe('updateDiscount', () => {
    const input: UpdateDiscountInput = {
      id: 'discount1',
      name: 'Updated Sale',
      isActive: false,
    };

    it('should update a discount successfully', async () => {
      mockPrismaService.discount.findUnique.mockResolvedValue(mockDiscount);
      mockPrismaService.discount.update.mockResolvedValue({ ...mockDiscount, name: 'Updated Sale', isActive: false });

      const result = await service.updateDiscount(input.id, input);
      expect(result).toEqual({ ...mockDiscount, name: 'Updated Sale', isActive: false });
      expect(mockPrismaService.discount.update).toHaveBeenCalledWith({
        where: { id: input.id },
        data: {
          name: input.name,
          description: undefined,
          type: undefined,
          value: undefined,
          startDate: undefined,
          endDate: undefined,
          isActive: false,
          minimumPurchase: undefined,
          products: undefined,
          variants: undefined,
          categories: undefined,
        },
      });
    });

    it('should throw NotFoundException for non-existent discount', async () => {
      mockPrismaService.discount.findUnique.mockResolvedValue(null);
      await expect(service.updateDiscount(input.id, input)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for empty update', async () => {
      mockPrismaService.discount.findUnique.mockResolvedValue(mockDiscount);
      await expect(service.updateDiscount(input.id, { id: input.id })).rejects.toThrow(
        'At least one field must be provided for update',
      );
    });
  });

  describe('findAllDiscounts', () => {
    it('should return all discounts', async () => {
      mockPrismaService.discount.findMany.mockResolvedValue([mockDiscount]);
      const result = await service.findAllDiscounts();
      expect(result).toEqual([mockDiscount]);
      expect(mockPrismaService.discount.findMany).toHaveBeenCalled();
    });
  });

  describe('findOneDiscount', () => {
    it('should return a discount by ID', async () => {
      mockPrismaService.discount.findUnique.mockResolvedValue(mockDiscount);
      const result = await service.findOneDiscount('discount1');
      expect(result).toEqual(mockDiscount);
    });

    it('should return null for non-existent discount', async () => {
      mockPrismaService.discount.findUnique.mockResolvedValue(null);
      const result = await service.findOneDiscount('discount2');
      expect(result).toBeNull();
    });
  });

  describe('deleteDiscount', () => {
    it('should delete a discount successfully', async () => {
      mockPrismaService.discount.findUnique.mockResolvedValue(mockDiscount);
      mockPrismaService.discount.delete.mockResolvedValue(mockDiscount);
      const result = await service.deleteDiscount('discount1');
      expect(result).toEqual(mockDiscount);
      expect(mockPrismaService.discount.delete).toHaveBeenCalledWith({ where: { id: 'discount1' } });
    });

    it('should throw NotFoundException for non-existent discount', async () => {
      mockPrismaService.discount.findUnique.mockResolvedValue(null);
      await expect(service.deleteDiscount('discount2')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDiscountedPriceForProduct', () => {
    it('should calculate discounted price for a product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValueOnce(mockProduct).mockResolvedValueOnce({
        categoryId: 'category1',
        discounts: [mockDiscount],
      });
      mockPrismaService.discount.findMany.mockResolvedValue([]);

      const result = await service.getDiscountedPriceForProduct('product1');
      expect(result).toEqual({ discountedPrice: 80, discountAmount: 20, discountId: 'discount1' });
    });

    it('should calculate discounted price for a variant', async () => {
      mockPrismaService.product.findUnique
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce({ categoryId: 'category1', discounts: [] });
      mockPrismaService.variant.findUnique.mockResolvedValue(mockVariant);

      mockPrismaService.discount.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([mockDiscount]);
      const result = await service.getDiscountedPriceForProduct('product1', 'variant1');
      expect(result).toEqual({ discountedPrice: 96, discountAmount: 24, discountId: 'discount1' });
    });

    it('should return original price if no discounts apply', async () => {
      mockPrismaService.product.findUnique
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce({ categoryId: 'category1', discounts: [] });
      mockPrismaService.discount.findMany.mockResolvedValue([]);

      const result = await service.getDiscountedPriceForProduct('product1');
      expect(result).toEqual({ discountedPrice: 100, discountAmount: 0 });
    });

    it('should throw NotFoundException for non-existent product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);
      await expect(service.getDiscountedPriceForProduct('product2')).rejects.toThrow(NotFoundException);
    });
  });

  describe('applyDiscountsToCart', () => {
    it('should apply discounts to cart items and compute totals', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue(mockCart);
      mockPrismaService.product.findUnique
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce({
          categoryId: 'category1',
          discounts: [mockDiscount],
        })
        .mockResolvedValueOnce({
          categoryId: 'category1',
          discounts: [mockDiscount],
        });
      mockPrismaService.discount.findMany.mockResolvedValue([]);
      mockPrismaService.cartItem.update.mockResolvedValue({
        ...mockCartItem,
        discountedPrice: 80,
        discountId: 'discount1',
      });

      const result = await service.applyDiscountsToCart('cart1');
      expect(result).toEqual({
        ...mockCart,
        items: [{ ...mockCartItem, discountedPrice: 80, discountId: 'discount1' }],
        total: 200,
        discountTotal: 40,
        finalTotal: 160,
      });
      expect(mockPrismaService.cartItem.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent cart', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue(null);
      await expect(service.applyDiscountsToCart('cart2')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for minimum purchase not met', async () => {
      const discountWithMinPurchase = { ...mockDiscount, minimumPurchase: 300 };
      mockPrismaService.cart.findUnique.mockResolvedValue(mockCart);
      mockPrismaService.product.findUnique
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce({
          categoryId: 'category1',
          discounts: [discountWithMinPurchase],
        })
        .mockResolvedValueOnce({
          categoryId: 'category1',
          discounts: [discountWithMinPurchase],
        });

      mockPrismaService.discount.findMany.mockResolvedValue([]);
      mockPrismaService.cartItem.update.mockResolvedValue({
        ...mockCartItem,
        discountedPrice: 80,
        discountId: 'discount1',
      });

      await expect(service.applyDiscountsToCart('cart1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('finalizeDiscountsForOrder', () => {
    // it('should finalize discounts for order items and update totals', async () => {
    //   mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
    //   mockPrismaService.product.findUnique.mockResolvedValueOnce(mockProduct).mockResolvedValueOnce({
    //     categoryId: 'category1',
    //     discounts: [mockDiscount],
    //   });
    //
    //   mockPrismaService.discount.findMany.mockResolvedValue([]);
    //   mockPrismaService.orderItem.update.mockResolvedValue({
    //     ...mockOrderItem,
    //     discountAmount: 20,
    //     discountId: 'discount1',
    //   });
    //   mockPrismaService.order.update.mockResolvedValue({
    //     ...mockOrder,
    //     total: 200,
    //     discountTotal: 40,
    //     finalTotal: 160,
    //   });
    //
    //   const result = await service.finalizeDiscountsForOrder('order1');
    //   expect(result).toEqual({
    //     ...mockOrder,
    //     total: 200,
    //     discountTotal: 40,
    //     finalTotal: 160,
    //   });
    //   expect(mockPrismaService.order.update).toHaveBeenCalledWith({
    //     where: { id: 'order1' },
    //     data: { total: 200, discountTotal: 40, finalTotal: 160 },
    //     include: { items: true },
    //   });
    // });

    it('should throw NotFoundException for non-existent order', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);
      await expect(service.finalizeDiscountsForOrder('order2')).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateDiscountInput', () => {
    it('should throw BadRequestException for negative discount value', async () => {
      const input = {
        name: 'Test',
        type: DiscountType.PERCENTAGE,
        value: -10,
        startDate: new Date(),
        endDate: new Date(),
      } as CreateDiscountInput;
      await expect(service['validateDiscountInput'](input)).rejects.toThrow('Discount value must be non-negative');
    });

    it('should throw BadRequestException for percentage > 100', async () => {
      const input = {
        name: 'Test',
        type: DiscountType.PERCENTAGE,
        value: 150,
        startDate: new Date(),
        endDate: new Date(),
      } as CreateDiscountInput;
      await expect(service['validateDiscountInput'](input)).rejects.toThrow(
        'Percentage discount value cannot exceed 100',
      );
    });
  });

  describe('selectBestDiscount', () => {
    it('should select the highest-value discount', () => {
      const discounts = [
        { ...mockDiscount, id: 'd1', value: 10 },
        { ...mockDiscount, id: 'd2', value: 20 },
      ] as unknown as Discount[];
      const result = service['selectBestDiscount'](discounts);
      expect(result?.id).toBe('d2');
    });

    it('should prefer percentage discount for equal values', () => {
      const discounts = [
        { ...mockDiscount, id: 'd1', type: DiscountType.FLAT, value: 20 },
        { ...mockDiscount, id: 'd2', type: DiscountType.PERCENTAGE, value: 20 },
      ] as unknown as Discount[];
      const result = service['selectBestDiscount'](discounts);
      expect(result?.id).toBe('d2');
    });

    it('should return null for empty discounts', () => {
      const result = service['selectBestDiscount']([]);
      expect(result).toBeNull();
    });
  });

  describe('calculateDiscountAmount', () => {
    it('should calculate percentage discount', () => {
      const result = service['calculateDiscountAmount'](100, {
        ...mockDiscount,
        type: DiscountType.PERCENTAGE,
        value: new Prisma.Decimal(20),
      });
      expect(result).toBe(20);
    });

    it('should calculate fixed amount discount', () => {
      const result = service['calculateDiscountAmount'](100, {
        ...mockDiscount,
        type: DiscountType.FLAT,
        value: new Prisma.Decimal(15),
      });
      expect(result).toBe(15);
    });
  });
});
