import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';

const mockPrismaService = {
  category: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  product: {
    count: jest.fn(),
  },
};

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoriesService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const input: CreateCategoryInput = {
        name: 'Clothing',
        image: 'https://example.com/clothing.jpg',
        description: 'Clothing category',
      };
      const category = { id: '1', ...input, createdAt: new Date(), updatedAt: new Date() };

      mockPrismaService.category.findFirst.mockResolvedValue(null);
      mockPrismaService.category.create.mockResolvedValue(category);

      const result = await service.create(input);

      expect(prisma.category.findFirst).toHaveBeenCalledWith({
        where: { name: { mode: 'insensitive', equals: 'Clothing' } },
      });
      expect(prisma.category.create).toHaveBeenCalledWith({ data: input });
      expect(result).toEqual(category);
    });

    it('should throw ConflictException if category name exists (case-insensitive)', async () => {
      const input: CreateCategoryInput = { name: 'Clothing' };
      const existing = { id: '1', name: 'clothing' };

      mockPrismaService.category.findFirst.mockResolvedValue(existing);

      await expect(service.create(input)).rejects.toThrow(
        new ConflictException('A category with the name "Clothing" already exists'),
      );
    });
  });

  describe('findAll', () => {
    it('should return all categories sorted by name', async () => {
      const categories = [
        { id: '1', name: 'Clothing', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'Electronics', createdAt: new Date(), updatedAt: new Date() },
      ];

      mockPrismaService.category.findMany.mockResolvedValue(categories);

      const result = await service.findAll();

      expect(prisma.category.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } });
      expect(result).toEqual(categories);
    });

    it('should return an empty array if no categories exist', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a category by ID', async () => {
      const category = { id: '1', name: 'Clothing', createdAt: new Date(), updatedAt: new Date() };
      mockPrismaService.category.findUnique.mockResolvedValue(category);

      const result = await service.findOne('1');

      expect(prisma.category.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual(category);
    });

    it('should return null if category not found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      const result = await service.findOne('999');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an existing category', async () => {
      const id = '1';
      const input: UpdateCategoryInput = { id, name: 'Updated Clothing', description: 'Updated description' };
      const existing = { id, name: 'Clothing', createdAt: new Date(), updatedAt: new Date() };
      const updated = { ...existing, ...input, updatedAt: new Date() };

      mockPrismaService.category.findUnique.mockResolvedValue(existing);
      mockPrismaService.category.update.mockResolvedValue(updated);

      const result = await service.update(id, input);

      expect(prisma.category.findUnique).toHaveBeenCalledWith({ where: { id } });
      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id },
        data: { name: input.name, description: input.description },
      });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException if category does not exist', async () => {
      const id = '999';
      const input: UpdateCategoryInput = { id, name: 'Updated' };
      mockPrismaService.category.findUnique.mockResolvedValue(null);
      await expect(service.update(id, input)).rejects.toThrow(new NotFoundException('Category not found'));
    });
    it('should throw ConflictException if updating to an existing name', async () => {
      const id = '1';
      const input: UpdateCategoryInput = { name: 'Electronics', id };
      const existingCategory = { id, name: 'Clothing', createdAt: new Date(), updatedAt: new Date() };
      const conflictingCategory = { id: '2', name: 'electronics' };

      mockPrismaService.category.findUnique.mockResolvedValue(existingCategory);
      mockPrismaService.category.findFirst.mockResolvedValue(conflictingCategory);

      await expect(service.update(id, input)).rejects.toThrow(
        new ConflictException('A category with the name "Electronics" already exists'),
      );
    });
  });

  describe('remove', () => {
    it('should remove an existing category', async () => {
      const id = '1';
      const category = { id, name: 'Clothing', createdAt: new Date(), updatedAt: new Date() };
      mockPrismaService.category.findUnique.mockResolvedValue(category);
      mockPrismaService.category.delete.mockResolvedValue(category);
      const result = await service.remove(id);
      expect(prisma.category.findUnique).toHaveBeenCalledWith({ where: { id } });
      expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id } });
      expect(result).toEqual(category);
    });

    it('should throw NotFoundException if category does not exist', async () => {
      const id = '999';
      mockPrismaService.category.findUnique.mockResolvedValue(null);
      await expect(service.remove(id)).rejects.toThrow(new NotFoundException('Category not found'));
    });
    it('should throw ConflictException if category has products', async () => {
      const id = '1';
      const category = { id, name: 'Clothing' };
      mockPrismaService.category.findUnique.mockResolvedValue(category);
      mockPrismaService.product.count.mockResolvedValue(1);

      await expect(service.remove(id)).rejects.toThrow(
        new ConflictException('Cannot delete category with associated products'),
      );
    });
  });

  describe('findCategoryByName', () => {
    it('should find a category by name (case-insensitive)', async () => {
      const category = { id: '1', name: 'clothing', createdAt: new Date(), updatedAt: new Date() };
      mockPrismaService.category.findFirst.mockResolvedValue(category);

      const result = await service.findCategoryByName('Clothing');

      expect(prisma.category.findFirst).toHaveBeenCalledWith({
        where: { name: { mode: 'insensitive', equals: 'Clothing' } },
      });
      expect(result).toEqual(category);
    });

    it('should return null if no category is found', async () => {
      mockPrismaService.category.findFirst.mockResolvedValue(null);
      const result = await service.findCategoryByName('Nonexistent');
      expect(result).toBeNull();
    });
  });
});
