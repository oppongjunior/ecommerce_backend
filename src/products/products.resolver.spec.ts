import { Test, TestingModule } from '@nestjs/testing';
import { ProductsResolver } from './products.resolver';
import { ProductsService } from './products.service';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { ProductFilterArgs } from './dto/product-filter.args';
import { Product } from './entities/product.entity';
import { PaginationArgs } from '../commons/dto/paginate.args';
import { DiscountService } from '../discount/discount.service';
import { Prisma } from '@prisma/client';
import { DiscountType } from '../discount/enums/discount-type.enum';

const mockProductsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  archiveProduct: jest.fn(),
  restoreProduct: jest.fn(),
};
const mockDiscountService = {
  getDiscountedPriceForProduct: jest.fn(),
  findOneDiscount: jest.fn(),
};
const mockProduct = {
  id: 'prod1',
  name: 'T-Shirt',
  price: 19.99,
  quantity: 100,
  categoryId: 'cat1',
  isActive: true,
  images: [],
};
jest.mock('../commons/useful-functions', () => ({
  extractRequestedFieldsFromQuery: jest.fn().mockReturnValue({ id: true }),
}));

describe('ProductsResolver', () => {
  let resolver: ProductsResolver;
  let service: ProductsService;
  let discountService: DiscountService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsResolver,
        { provide: ProductsService, useValue: mockProductsService },
        { provide: DiscountService, useValue: mockDiscountService },
      ],
    }).compile();

    resolver = module.get<ProductsResolver>(ProductsResolver);
    service = module.get<ProductsService>(ProductsService);
    discountService = module.get<DiscountService>(DiscountService);
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
      const product: Product = { id: 'prod1', ...input, images: [] } as unknown as Product;
      mockProductsService.create.mockResolvedValue(product);

      const result = await resolver.createProduct(input);

      expect(service.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(product);
    });
  });

  describe('updateProduct', () => {
    it('should update a product', async () => {
      const input: UpdateProductInput = {
        name: 'Updated T-Shirt',
        price: 29.99,
      };
      const product: Product = {
        ...mockProduct,
        name: 'Updated T-Shirt',
        price: 29.99,
      } as unknown as Product;
      mockProductsService.update.mockResolvedValue(product);

      const result = await resolver.updateProduct('prod1', input);

      expect(service.update).toHaveBeenCalledWith('prod1', input);
      expect(result).toEqual(product);
    });
  });

  describe('removeProduct', () => {
    it('should remove a product', async () => {
      mockProductsService.remove.mockResolvedValue(mockProduct);
      const result = await resolver.permanentlyDeleteProduct('prod1');
      expect(service.remove).toHaveBeenCalledWith('prod1');
      expect(result).toEqual(mockProduct);
    });
  });

  describe('archiveProduct', () => {
    it('should archive a product', async () => {
      const product: Product = { ...mockProduct, isActive: false } as unknown as Product;
      mockProductsService.archiveProduct.mockResolvedValue(product);
      const result = await resolver.archiveProduct('prod1');
      expect(service.archiveProduct).toHaveBeenCalledWith('prod1');
      expect(result).toEqual(product);
    });
  });

  describe('restoreProduct', () => {
    it('should restore a product', async () => {
      mockProductsService.restoreProduct.mockResolvedValue(mockProduct);
      const result = await resolver.restoreProduct('prod1');
      expect(service.restoreProduct).toHaveBeenCalledWith('prod1');
      expect(result).toEqual(mockProduct);
    });
  });
  describe('findAll', () => {
    it('should return paginated products', async () => {
      const paginate: PaginationArgs = { first: 2 };
      const filter: ProductFilterArgs = { categoryId: 'cat1' };
      const response = {
        edges: [
          {
            cursor: 'prod1',
            node: {
              ...mockProduct,
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

      expect(service.findAll).toHaveBeenCalledWith(paginate, filter, { id: true });
      expect(result).toEqual(response);
    });

    it('should use defaults if paginate is omitted', async () => {
      const response = {
        edges: [],
        pageInfo: { hasNextPage: false, hasPreviousPage: false, pageSize: 10 },
      };
      mockProductsService.findAll.mockResolvedValue(response);
      await resolver.findAll(undefined, {});
      expect(service.findAll).toHaveBeenCalledWith({ first: 10 }, {}, { id: true });
    });
  });

  describe('findOne', () => {
    it('should return a product by ID', async () => {
      mockProductsService.findOne.mockResolvedValue(mockProduct);
      const result = await resolver.findOne('prod1');
      expect(service.findOne).toHaveBeenCalledWith('prod1', { id: true });
      expect(result).toEqual(mockProduct);
    });
  });
  describe('discountedPrice', () => {
    it('should return discounted price', async () => {
      mockDiscountService.getDiscountedPriceForProduct.mockResolvedValue({ discountedPrice: 5 });
      const result = await resolver.discountedPrice(mockProduct as unknown as Product);
      expect(discountService.getDiscountedPriceForProduct).toHaveBeenCalled();
      expect(result).toEqual(5);
    });
    it('should return null if discounted price is equal to price', async () => {
      mockDiscountService.getDiscountedPriceForProduct.mockResolvedValue({ discountedPrice: 19.99 });
      const result = await resolver.discountedPrice(mockProduct as unknown as Product);
      expect(discountService.getDiscountedPriceForProduct).toHaveBeenCalled();
      expect(result).toEqual(null);
    });
  });
  describe('appliedDiscount', () => {
    it('should return applied discount', async () => {
      const mockDiscount = {
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
      mockDiscountService.getDiscountedPriceForProduct.mockResolvedValue({ discountId: mockDiscount.id });
      mockDiscountService.findOneDiscount.mockResolvedValueOnce(mockDiscount);
      const result = await resolver.appliedDiscount(mockProduct as unknown as Product);
      expect(discountService.getDiscountedPriceForProduct).toHaveBeenCalled();
      expect(discountService.findOneDiscount).toHaveBeenCalledWith(mockDiscount.id);
      expect(result).toEqual(result);
    });
  });
});
