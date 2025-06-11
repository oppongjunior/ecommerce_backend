import { Test, TestingModule } from '@nestjs/testing';
import { VariantService } from './variant.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { CreateVariantInput } from './dto/create-variant.input';

describe('VariantService', () => {
  let service: VariantService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    product: {
      findUnique: jest.fn(),
    },
    variant: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockProductId = 'prod1';
  const fixedDate = new Date('2025-03-18T00:00:00.000Z');
  const mockVariant = {
    id: 'var1',
    size: 'M',
    color: 'Blue',
    quantity: 50,
    price: 29.99,
    productId: mockProductId,
    discountId: null,
  };
  const mockVariantWithProduct = {
    ...mockVariant,
    product: { id: mockProductId, name: 'T-Shirt' },
  };
  const mockCreateVariantInput: CreateVariantInput = {
    size: 'M',
    color: 'Blue',
    quantity: 50,
    price: 29.99,
    productId: mockProductId,
    discountId: null,
  };
  const mockUpdateVariantInput = {
    size: 'L',
    id: 'var1',
  };
  const mockProduct = {
    id: mockProductId,
    name: 'T-Shirt',
    price: 19.99,
    quantity: 100,
    isActive: true,
    categoryId: 'cat1',
    createdAt: fixedDate,
    updatedAt: fixedDate,
    images: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VariantService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<VariantService>(VariantService);
    prismaService = module.get<PrismaService>(PrismaService);
    jest.resetAllMocks();
  });

  describe('createVariant', () => {
    it('should create a variant successfully', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.variant.create.mockResolvedValue(mockVariantWithProduct);

      const result = await service.createVariant(mockCreateVariantInput);

      expect(prismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: mockProductId },
      });
      expect(prismaService.variant.create).toHaveBeenCalledWith({
        data: mockCreateVariantInput,
        include: { product: { select: { id: true, name: true } } },
      });
      expect(result).toEqual(mockVariantWithProduct);
    });

    it('should throw NotFoundException if product doesn’t exist', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.createVariant(mockCreateVariantInput)).rejects.toThrow(
        new NotFoundException(`Product "${mockProductId}" not found`),
      );
      expect(prismaService.variant.create).not.toHaveBeenCalled();
    });
  });

  describe('getVariant', () => {
    it('should retrieve a variant with its product', async () => {
      mockPrismaService.variant.findUnique.mockResolvedValue(mockVariantWithProduct);

      const result = await service.getVariant('var1');

      expect(prismaService.variant.findUnique).toHaveBeenCalledWith({
        where: { id: 'var1' },
        include: { product: { select: { id: true, name: true } } },
      });
      expect(result).toEqual(mockVariantWithProduct);
    });

    it('should throw NotFoundException if variant doesn’t exist', async () => {
      mockPrismaService.variant.findUnique.mockResolvedValue(null);

      await expect(service.getVariant('var1')).rejects.toThrow(new NotFoundException(`Variant "var1" not found`));
    });
  });

  describe('getProductVariants', () => {
    it('should retrieve all variants for a product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.variant.findMany.mockResolvedValue([mockVariantWithProduct]);

      const result = await service.getProductVariants(mockProductId);

      expect(prismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: mockProductId },
      });
      expect(prismaService.variant.findMany).toHaveBeenCalledWith({
        where: { productId: mockProductId },
        include: { product: { select: { id: true, name: true } } },
        orderBy: { id: 'asc' },
      });
      expect(result).toEqual([mockVariantWithProduct]);
    });

    it('should throw NotFoundException if product doesn’t exist', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.getProductVariants(mockProductId)).rejects.toThrow(
        new NotFoundException(`Product "${mockProductId}" not found`),
      );
      expect(prismaService.variant.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getAllVariants', () => {
    it('should retrieve all variants', async () => {
      mockPrismaService.variant.findMany.mockResolvedValue([mockVariant]);

      const result = await service.getAllVariants();

      expect(prismaService.variant.findMany).toHaveBeenCalledWith({
        orderBy: { id: 'asc' },
      });
      expect(result).toEqual([mockVariant]);
    });

    it('should return an empty array if no variants exist', async () => {
      mockPrismaService.variant.findMany.mockResolvedValue([]);

      const result = await service.getAllVariants();

      expect(result).toEqual([]);
    });
  });

  describe('updateVariant', () => {
    it('should update a variant successfully', async () => {
      const updatedVariant = { ...mockVariantWithProduct, size: 'L' };
      mockPrismaService.variant.findUnique.mockResolvedValue(mockVariantWithProduct);
      mockPrismaService.variant.update.mockResolvedValue(updatedVariant);

      const result = await service.updateVariant('var1', mockUpdateVariantInput);

      expect(prismaService.variant.findUnique).toHaveBeenCalledWith({
        where: { id: 'var1' },
        include: { product: { select: { id: true, name: true } } },
      });
      expect(prismaService.variant.update).toHaveBeenCalledWith({
        where: { id: 'var1' },
        data: mockUpdateVariantInput,
        include: { product: { select: { id: true, name: true } } },
      });
      expect(result).toEqual(updatedVariant);
    });

    it('should throw NotFoundException if variant doesn’t exist', async () => {
      mockPrismaService.variant.findUnique.mockResolvedValue(null);

      await expect(service.updateVariant('var1', mockUpdateVariantInput)).rejects.toThrow(
        new NotFoundException(`Variant "var1" not found`),
      );
      expect(prismaService.variant.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteVariant', () => {
    it('should delete a variant successfully', async () => {
      mockPrismaService.variant.findUnique.mockResolvedValue(mockVariantWithProduct);
      mockPrismaService.variant.delete.mockResolvedValue(mockVariant);

      const result = await service.deleteVariant('var1');

      expect(prismaService.variant.findUnique).toHaveBeenCalledWith({
        where: { id: 'var1' },
        include: { product: { select: { id: true, name: true } } },
      });
      expect(prismaService.variant.delete).toHaveBeenCalledWith({
        where: { id: 'var1' },
      });
      expect(result).toEqual(mockVariant);
    });

    it('should throw NotFoundException if variant doesn’t exist', async () => {
      mockPrismaService.variant.findUnique.mockResolvedValue(null);

      await expect(service.deleteVariant('var1')).rejects.toThrow(new NotFoundException(`Variant "var1" not found`));
      expect(prismaService.variant.delete).not.toHaveBeenCalled();
    });
  });
});
