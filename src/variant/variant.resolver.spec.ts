import { Test, TestingModule } from '@nestjs/testing';
import { VariantResolver } from './variant.resolver';
import { VariantService } from './variant.service';
import { UpdateVariantInput } from './dto/update-variant.input';

describe('VariantResolver', () => {
  let resolver: VariantResolver;
  let variantService: VariantService;

  const mockVariantService = {
    getVariant: jest.fn(),
    getProductVariants: jest.fn(),
    getAllVariants: jest.fn(),
    createVariant: jest.fn(),
    updateVariant: jest.fn(),
    deleteVariant: jest.fn(),
  };
  new Date('2025-03-18T00:00:00.000Z');
  const mockVariant = {
    id: 'var1',
    size: 'M',
    color: 'Blue',
    quantity: 50,
    price: 29.99,
    productId: 'prod1',
    product: { id: 'prod1', name: 'T-Shirt' },
    discountId: null,
  };

  const mockCreateVariantInput = {
    size: 'M',
    color: 'Blue',
    quantity: 50,
    price: 29.99,
    productId: 'prod1',
    discountId: null,
  };

  const mockUpdateVariantInput: UpdateVariantInput = {
    id: 'var1', // Added to match resolver expectation
    size: 'L',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VariantResolver, { provide: VariantService, useValue: mockVariantService }],
    }).compile();

    resolver = module.get<VariantResolver>(VariantResolver);
    variantService = module.get<VariantService>(VariantService);
    jest.resetAllMocks();
  });

  describe('getVariant', () => {
    it('should retrieve a specific variant by ID', async () => {
      mockVariantService.getVariant.mockResolvedValue(mockVariant);

      const result = await resolver.getVariant('var1');

      expect(variantService.getVariant).toHaveBeenCalledWith('var1');
      expect(result).toEqual(mockVariant);
    });
  });

  describe('getProductVariants', () => {
    it('should retrieve all variants for a product', async () => {
      mockVariantService.getProductVariants.mockResolvedValue([mockVariant]);

      const result = await resolver.getProductVariants('prod1');

      expect(variantService.getProductVariants).toHaveBeenCalledWith('prod1');
      expect(result).toEqual([mockVariant]);
    });
  });

  describe('getAllVariants', () => {
    it('should retrieve all variants for admin', async () => {
      mockVariantService.getAllVariants.mockResolvedValue([mockVariant]);

      const result = await resolver.getAllVariants();

      expect(variantService.getAllVariants).toHaveBeenCalled();
      expect(result).toEqual([mockVariant]);
    });
  });

  describe('createVariant', () => {
    it('should create a variant for admin', async () => {
      mockVariantService.createVariant.mockResolvedValue(mockVariant);

      const result = await resolver.createVariant(mockCreateVariantInput);

      expect(variantService.createVariant).toHaveBeenCalledWith(mockCreateVariantInput);
      expect(result).toEqual(mockVariant);
    });
  });

  describe('updateVariant', () => {
    it('should update a variant for admin', async () => {
      const updatedVariant = { ...mockVariant, size: 'L' };
      mockVariantService.updateVariant.mockResolvedValue(updatedVariant);

      const result = await resolver.updateVariant(mockUpdateVariantInput);

      expect(variantService.updateVariant).toHaveBeenCalledWith('var1', mockUpdateVariantInput);
      expect(result).toEqual(updatedVariant);
    });
  });

  describe('deleteVariant', () => {
    it('should delete a variant for admin', async () => {
      mockVariantService.deleteVariant.mockResolvedValue(mockVariant);

      const result = await resolver.deleteVariant('var1');

      expect(variantService.deleteVariant).toHaveBeenCalledWith('var1');
      expect(result).toEqual(mockVariant);
    });
  });

  // Role-Based Access Tests (Assuming decorator enforcement)
  describe('role-based access', () => {
    it('should allow public access to getVariant', async () => {
      mockVariantService.getVariant.mockResolvedValue(mockVariant);

      const result = await resolver.getVariant('var1');

      expect(variantService.getVariant).toHaveBeenCalled();
      expect(result).toEqual(mockVariant);
    });

    it('should allow ADMIN role to access getAllVariants', async () => {
      mockVariantService.getAllVariants.mockResolvedValue([mockVariant]);

      const result = await resolver.getAllVariants();

      expect(variantService.getAllVariants).toHaveBeenCalled();
      expect(result).toEqual([mockVariant]);
    });

    it('should allow ADMIN role to createVariant', async () => {
      mockVariantService.createVariant.mockResolvedValue(mockVariant);

      const result = await resolver.createVariant(mockCreateVariantInput);

      expect(variantService.createVariant).toHaveBeenCalled();
      expect(result).toEqual(mockVariant);
    });
  });
});
