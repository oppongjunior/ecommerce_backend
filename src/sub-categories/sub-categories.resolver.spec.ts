import { Test, TestingModule } from '@nestjs/testing';
import { SubCategoriesResolver } from './sub-categories.resolver';
import { SubCategoriesService } from './sub-categories.service';
import { CreateSubCategoryInput } from './dto/create-sub-category.input';
import { UpdateSubCategoryInput } from './dto/update-sub-category.input';
import { SubCategory } from '@prisma/client';

const mockSubCategoriesService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('SubCategoriesResolver', () => {
  let resolver: SubCategoriesResolver;
  let service: SubCategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubCategoriesResolver, { provide: SubCategoriesService, useValue: mockSubCategoriesService }],
    }).compile();

    resolver = module.get<SubCategoriesResolver>(SubCategoriesResolver);
    service = module.get<SubCategoriesService>(SubCategoriesService);
    jest.clearAllMocks();
  });

  describe('createSubCategory', () => {
    it('should create a new subcategory', async () => {
      const input: CreateSubCategoryInput = { name: 'Shirts', categoryId: 'cat1', description: 'Shirt subcategory' };
      const subcategory: SubCategory = {
        id: '1',
        name: 'Shirts',
        categoryId: 'cat1',
        description: 'Shirt subcategory',
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
      };

      mockSubCategoriesService.create.mockResolvedValue(subcategory);

      const result = await resolver.createSubCategory(input);

      expect(service.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(subcategory);
    });
  });

  describe('findAll', () => {
    it('should return all subcategories', async () => {
      const subcategories: SubCategory[] = [
        {
          id: '1',
          name: 'Shirts',
          categoryId: 'cat1',
          createdAt: new Date(),
          updatedAt: new Date(),
          image: null,
        } as SubCategory,
      ];

      mockSubCategoriesService.findAll.mockResolvedValue(subcategories);

      const result = await resolver.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(subcategories);
    });
  });

  describe('findOne', () => {
    it('should return a subcategory by ID', async () => {
      const subcategory: SubCategory = {
        id: '1',
        name: 'Shirts',
        categoryId: 'cat1',
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
      } as SubCategory;
      mockSubCategoriesService.findOne.mockResolvedValue(subcategory);

      const result = await resolver.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(subcategory);
    });

    it('should return null if subcategory not found', async () => {
      mockSubCategoriesService.findOne.mockResolvedValue(null);

      const result = await resolver.findOne('999');

      expect(service.findOne).toHaveBeenCalledWith('999');
      expect(result).toBeNull();
    });
  });

  describe('updateSubCategory', () => {
    it('should update an existing subcategory', async () => {
      const id = '1';
      const input: UpdateSubCategoryInput = {
        name: 'Updated Shirts',
        description: 'Updated',
      } as UpdateSubCategoryInput;
      const updatedSubcategory: SubCategory = {
        id,
        name: 'Updated Shirts',
        categoryId: 'cat1',
        description: 'Updated',
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
      };

      mockSubCategoriesService.update.mockResolvedValue(updatedSubcategory);

      const result = await resolver.updateSubCategory(id, input);

      expect(service.update).toHaveBeenCalledWith(id, input);
      expect(result).toEqual(updatedSubcategory);
    });
  });

  describe('removeSubCategory', () => {
    it('should remove a subcategory by ID', async () => {
      const id = '1';
      const subcategory: SubCategory = {
        id,
        name: 'Shirts',
        categoryId: 'cat1',
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
      } as SubCategory;

      mockSubCategoriesService.remove.mockResolvedValue(subcategory);

      const result = await resolver.removeSubCategory(id);

      expect(service.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(subcategory);
    });
  });
});
