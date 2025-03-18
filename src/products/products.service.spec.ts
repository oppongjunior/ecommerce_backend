import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProductInput } from './dto/update-product.input';
import { ProductFilterArgs } from './dto/product-filter.args';
import { PaginateArgs } from '../commons/entities/paginate.args';
import { ConflictException, NotFoundException } from '@nestjs/common';

const mockPrismaService = {
  product: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
  },
  category: {
    findUnique: jest.fn(),
  },
  subCategory: {
    findUnique: jest.fn(),
  },
  cartItem: {
    count: jest.fn(),
  },
  orderItem: {
    count: jest.fn(),
  },
};

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const input = {
      name: 'T-Shirt',
      price: 19.99,
      quantity: 100,
      categoryId: 'cat1',
      subcategoryId: 'sub1',
      sku: 'TSHIRT001',
      isActive: true,
      images: ['https://example.com/tshirt.jpg'],
    };

    it('should create a product successfully', async () => {
      const product = { id: 'prod1', ...input, createdAt: new Date(), updatedAt: new Date() };
      mockPrismaService.category.findUnique.mockResolvedValue({ id: 'cat1' });
      mockPrismaService.subCategory.findUnique.mockResolvedValue({ id: 'sub1', categoryId: 'cat1' });
      mockPrismaService.product.findFirst.mockResolvedValue(null);
      mockPrismaService.product.create.mockResolvedValue(product);

      const result = await service.create(input);

      expect(prisma.category.findUnique).toHaveBeenCalledWith({ where: { id: 'cat1' } });
      expect(prisma.subCategory.findUnique).toHaveBeenCalledWith({ where: { id: 'sub1' } });
      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: { sku: { equals: 'TSHIRT001', mode: 'insensitive' } },
      });
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: { ...input, isActive: true },
        include: { category: true, subcategory: true },
      });
      expect(result).toEqual(product);
    });

    it('should throw NotFoundException if category does not exist', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.create(input)).rejects.toThrow(new NotFoundException('Category ID "cat1" not found'));
    });

    it('should throw ConflictException if SKU is already in use', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue({ id: 'cat1' });
      mockPrismaService.subCategory.findUnique.mockResolvedValue({ id: 'sub1', categoryId: 'cat1' });
      mockPrismaService.product.findFirst.mockResolvedValue({ id: 'prod2', sku: 'TSHIRT001' });

      await expect(service.create(input)).rejects.toThrow(new ConflictException('SKU "TSHIRT001" is already in use'));
    });
  });

  describe('findAll', () => {
    const paginate: PaginateArgs = { first: 2, after: undefined };
    const filter: ProductFilterArgs = { categoryId: 'cat1', isActive: true };
    const products = [
      {
        id: 'prod1',
        name: 'T-Shirt',
        price: 19.99,
        quantity: 100,
        categoryId: 'cat1',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        images: [],
      },
      {
        id: 'prod2',
        name: 'Jeans',
        price: 49.99,
        quantity: 50,
        categoryId: 'cat1',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        images: [],
      },
    ];

    it('should return paginated products with filters', async () => {
      mockPrismaService.product.findMany.mockResolvedValue(products);
      mockPrismaService.product.count.mockResolvedValue(3);

      const result = await service.findAll(paginate, filter);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        take: 2,
        skip: 0,
        cursor: undefined,
        where: { categoryId: 'cat1', isActive: true },
        orderBy: { createdAt: 'desc' },
        include: { category: true, subcategory: true },
      });
      expect(prisma.product.count).toHaveBeenCalledWith({ where: { categoryId: 'cat1', isActive: true } });
      expect(result).toEqual({
        edges: products.map((p) => ({ cursor: p.id, node: p })),
        pageInfo: { pageSize: 2, hasPreviousPage: false, hasNextPage: true },
      });
    });

    it('should handle search filter across name and description', async () => {
      const searchFilter: ProductFilterArgs = { search: 'shirt' };
      mockPrismaService.product.findMany.mockResolvedValue([products[0]]);
      mockPrismaService.product.count.mockResolvedValue(1);

      await service.findAll(paginate, searchFilter);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'shirt', mode: 'insensitive' } },
              { description: { contains: 'shirt', mode: 'insensitive' } },
              { tags: { some: { name: { contains: 'shirt', mode: 'insensitive' } } } },
            ],
          },
        }),
      );
    });

    it('should respect pagination with after cursor', async () => {
      const paginateWithCursor: PaginateArgs = { first: 1, after: 'prod1' };
      mockPrismaService.product.findMany.mockResolvedValue([products[1]]);
      mockPrismaService.product.count.mockResolvedValue(2);

      await service.findAll(paginateWithCursor, {});

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1,
          skip: 1,
          cursor: { id: 'prod1' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a product by ID', async () => {
      const product = {
        id: 'prod1',
        name: 'T-Shirt',
        price: 19.99,
        quantity: 100,
        categoryId: 'cat1',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        images: [],
      };
      mockPrismaService.product.findUnique.mockResolvedValue(product);

      const result = await service.findOne('prod1');

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'prod1' },
        include: { category: true, subcategory: true },
      });
      expect(result).toEqual(product);
    });

    it('should return null if product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      const result = await service.findOne('prod999');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateInput = { name: 'Updated T-Shirt', price: 29.99, id: 'prod1' };

    it('should update a product successfully', async () => {
      const product = {
        id: 'prod1',
        name: 'T-Shirt',
        price: 19.99,
        quantity: 100,
        categoryId: 'cat1',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        images: [],
      };
      const updatedProduct = { ...product, ...updateInput, updatedAt: new Date() };
      mockPrismaService.product.findUnique.mockResolvedValue(product);
      mockPrismaService.product.findFirst.mockResolvedValue(null);
      mockPrismaService.product.update.mockResolvedValue(updatedProduct);

      const result = await service.update('prod1', updateInput);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod1' },
        data: updateInput,
        include: { category: true, subcategory: true },
      });
      expect(result).toEqual(updatedProduct);
    });

    it('should throw NotFoundException if product does not exist', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.update('prod999', updateInput)).rejects.toThrow(new NotFoundException('Product not found'));
    });

    it('should throw ConflictException if SKU conflicts', async () => {
      const skuInput: UpdateProductInput = { sku: 'TSHIRT002', id: 'prod1' };
      mockPrismaService.product.findUnique.mockResolvedValue({ id: 'prod1', categoryId: 'cat1' });
      mockPrismaService.product.findFirst.mockResolvedValue({ id: 'prod2', sku: 'TSHIRT002' });

      await expect(service.update('prod1', skuInput)).rejects.toThrow(
        new ConflictException('SKU "TSHIRT002" is already in use by another product'),
      );
    });
  });

  describe('remove', () => {
    it('should remove a product successfully', async () => {
      const product = {
        id: 'prod1',
        name: 'T-Shirt',
        price: 19.99,
        quantity: 100,
        categoryId: 'cat1',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        images: [],
      };
      mockPrismaService.product.findUnique.mockResolvedValue(product);
      mockPrismaService.cartItem.count.mockResolvedValue(0);
      mockPrismaService.orderItem.count.mockResolvedValue(0);
      mockPrismaService.product.delete.mockResolvedValue(product);

      const result = await service.remove('prod1');

      expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: 'prod1' } });
      expect(result).toEqual(product);
    });

    it('should throw ConflictException if product has dependencies', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ id: 'prod1' });
      mockPrismaService.cartItem.count.mockResolvedValue(1);

      await expect(service.remove('prod1')).rejects.toThrow(
        new ConflictException('Cannot delete product referenced in active carts or orders'),
      );
    });
  });

  describe('archiveProduct', () => {
    it('should archive a product successfully', async () => {
      const product = {
        id: 'prod1',
        name: 'T-Shirt',
        isActive: true,
        price: 19.99,
        quantity: 100,
        categoryId: 'cat1',
        createdAt: new Date(),
        updatedAt: new Date(),
        images: [],
      };
      const archivedProduct = { ...product, isActive: false };
      mockPrismaService.product.findUnique.mockResolvedValue(product);
      mockPrismaService.product.update.mockResolvedValue(archivedProduct);

      const result = await service.archiveProduct('prod1');

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod1' },
        data: { isActive: false },
      });
      expect(result).toEqual(archivedProduct);
    });

    it('should throw NotFoundException if product does not exist', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.archiveProduct('prod999')).rejects.toThrow(new NotFoundException('Product not found'));
    });
  });

  describe('restoreProduct', () => {
    it('should restore a product successfully', async () => {
      const product = {
        id: 'prod1',
        name: 'T-Shirt',
        isActive: false,
        price: 19.99,
        quantity: 100,
        categoryId: 'cat1',
        createdAt: new Date(),
        updatedAt: new Date(),
        images: [],
      };
      const restoredProduct = { ...product, isActive: true };
      mockPrismaService.product.findUnique.mockResolvedValue(product);
      mockPrismaService.product.update.mockResolvedValue(restoredProduct);

      const result = await service.restoreProduct('prod1');

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod1' },
        data: { isActive: true },
      });
      expect(result).toEqual(restoredProduct);
    });

    it('should throw NotFoundException if product does not exist', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);
      await expect(service.restoreProduct('prod999')).rejects.toThrow(new NotFoundException('Product not found'));
    });
  });
});
