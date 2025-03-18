import { Test, TestingModule } from '@nestjs/testing';
import { ProductsResolver } from './products.resolver';
import { ProductsService } from './products.service';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { PaginateArgs } from '../commons/entities/paginate.args';
import { ProductFilterArgs } from './dto/product-filter.args';
import { Product } from './entities/product.entity';

const mockProductsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  archiveProduct: jest.fn(),
  restoreProduct: jest.fn(),
};

describe('ProductsResolver', () => {
  let resolver: ProductsResolver;
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsResolver, { provide: ProductsService, useValue: mockProductsService }],
    }).compile();

    resolver = module.get<ProductsResolver>(ProductsResolver);
    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    it('should create a product', async () => {
      const input: CreateProductInput = {
        name: 'T-Shirt',
        price: 19.99,
        quantity: 100,
        categoryId: 'cat1',
        isActive: true,
      };
      const product: Product = { id: 'prod1', ...input, images: [] };
      mockProductsService.create.mockResolvedValue(product);

      const result = await resolver.createProduct(input);

      expect(service.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(product);
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const paginate: PaginateArgs = { first: 2 };
      const filter: ProductFilterArgs = { categoryId: 'cat1' };
      const response = {
        edges: [
          {
            cursor: 'prod1',
            node: {
              id: 'prod1',
              name: 'T-Shirt',
              price: 19.99,
              quantity: 100,
              categoryId: 'cat1',
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              images: [],
            },
          },
        ],
        pageInfo: { hasNextPage: false, hasPreviousPage: false, pageSize: 2 },
      };
      mockProductsService.findAll.mockResolvedValue(response);

      const result = await resolver.findAll(paginate, filter);

      expect(service.findAll).toHaveBeenCalledWith(paginate, filter);
      expect(result).toEqual(response);
    });

    it('should use defaults if paginate is omitted', async () => {
      const response = { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false, pageSize: 10 } };
      mockProductsService.findAll.mockResolvedValue(response);

      await resolver.findAll(undefined, {});

      expect(service.findAll).toHaveBeenCalledWith({ first: 10 }, {});
    });
  });

  describe('findOne', () => {
    it('should return a product by ID', async () => {
      const product: Product = {
        id: 'prod1',
        name: 'T-Shirt',
        price: 19.99,
        quantity: 100,
        categoryId: 'cat1',
        isActive: true,
        images: [],
      };
      mockProductsService.findOne.mockResolvedValue(product);

      const result = await resolver.findOne('prod1');

      expect(service.findOne).toHaveBeenCalledWith('prod1');
      expect(result).toEqual(product);
    });
  });

  describe('updateProduct', () => {
    it('should update a product', async () => {
      const input: UpdateProductInput = { name: 'Updated T-Shirt', price: 29.99, id: 'prod1' };
      const product: Product = {
        id: 'prod1',
        name: 'Updated T-Shirt',
        price: 29.99,
        quantity: 100,
        categoryId: 'cat1',
        isActive: true,
        images: [],
      };
      mockProductsService.update.mockResolvedValue(product);

      const result = await resolver.updateProduct('prod1', input);

      expect(service.update).toHaveBeenCalledWith('prod1', input);
      expect(result).toEqual(product);
    });
  });

  describe('removeProduct', () => {
    it('should remove a product', async () => {
      const product: Product = {
        id: 'prod1',
        name: 'T-Shirt',
        price: 19.99,
        quantity: 100,
        categoryId: 'cat1',
        isActive: true,
        images: [],
      };
      mockProductsService.remove.mockResolvedValue(product);

      const result = await resolver.removeProduct('prod1');

      expect(service.remove).toHaveBeenCalledWith('prod1');
      expect(result).toEqual(product);
    });
  });

  describe('archiveProduct', () => {
    it('should archive a product', async () => {
      const product: Product = {
        id: 'prod1',
        name: 'T-Shirt',
        price: 19.99,
        quantity: 100,
        categoryId: 'cat1',
        isActive: false,
        images: [],
      };
      mockProductsService.archiveProduct.mockResolvedValue(product);

      const result = await resolver.archiveProduct('prod1');

      expect(service.archiveProduct).toHaveBeenCalledWith('prod1');
      expect(result).toEqual(product);
    });
  });

  describe('restoreProduct', () => {
    it('should restore a product', async () => {
      const product: Product = {
        id: 'prod1',
        name: 'T-Shirt',
        price: 19.99,
        quantity: 100,
        categoryId: 'cat1',
        isActive: true,
        images: [],
      };
      mockProductsService.restoreProduct.mockResolvedValue(product);

      const result = await resolver.restoreProduct('prod1');

      expect(service.restoreProduct).toHaveBeenCalledWith('prod1');
      expect(result).toEqual(product);
    });
  });
});
