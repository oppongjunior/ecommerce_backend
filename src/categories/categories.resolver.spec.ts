import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesResolver } from './categories.resolver';
import { CategoriesService } from './categories.service';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';

const mockCategoriesService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('CategoriesResolver', () => {
  let resolver: CategoriesResolver;
  let service: CategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoriesResolver, { provide: CategoriesService, useValue: mockCategoriesService }],
    }).compile();

    resolver = module.get<CategoriesResolver>(CategoriesResolver);
    service = module.get<CategoriesService>(CategoriesService);
    jest.clearAllMocks();
  });

  describe('createCategory', () => {
    it('should create a new category', async () => {
      const input: CreateCategoryInput = { name: 'Clothing', description: 'Clothing items' };
      const category = {
        id: '1',
        name: 'Clothing',
        description: 'Clothing items',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCategoriesService.create.mockResolvedValue(category);

      const result = await resolver.createCategory(input);

      expect(service.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(category);
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      const categories = [
        { id: '1', name: 'Clothing', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'Electronics', createdAt: new Date(), updatedAt: new Date() },
      ];

      mockCategoriesService.findAll.mockResolvedValue(categories);

      const result = await resolver.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(categories);
    });
  });

  describe('findOne', () => {
    it('should return a category by ID', async () => {
      const category = { id: '1', name: 'Clothing', createdAt: new Date(), updatedAt: new Date() };
      mockCategoriesService.findOne.mockResolvedValue(category);

      const result = await resolver.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(category);
    });

    it('should return null if category not found', async () => {
      mockCategoriesService.findOne.mockResolvedValue(null);

      const result = await resolver.findOne('999');

      expect(service.findOne).toHaveBeenCalledWith('999');
      expect(result).toBeNull();
    });
  });

  describe('updateCategory', () => {
    it('should update an existing category', async () => {
      const id = '1';
      const input: UpdateCategoryInput = { name: 'Updated Clothing', description: 'Updated description', id };
      const updatedCategory = {
        id,
        name: 'Updated Clothing',
        description: 'Updated description',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCategoriesService.update.mockResolvedValue(updatedCategory);

      const result = await resolver.updateCategory(id, input);

      expect(service.update).toHaveBeenCalledWith(id, input);
      expect(result).toEqual(updatedCategory);
    });
  });

  describe('removeCategory', () => {
    it('should remove a category by ID', async () => {
      const id = '1';
      const category = { id, name: 'Clothing', createdAt: new Date(), updatedAt: new Date() };

      mockCategoriesService.remove.mockResolvedValue(category);

      const result = await resolver.removeCategory(id);

      expect(service.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(category);
    });
  });
});
