import { Test, TestingModule } from '@nestjs/testing';
import { BrandService } from './brand.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandInput } from './dto/create-brand.input';
import { UpdateBrandInput } from './dto/update-brand.input';
import { NotFoundException } from '@nestjs/common';
import { Brand } from '@prisma/client';

const mockPrismaService = {
  brand: {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
};

describe('BrandService', () => {
  let brandService: BrandService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockBrand: Brand = {
    id: 'brand1',
    name: 'Test Brand',
    description: 'Test Description',
    logo: 'test-logo.png',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCreateBrandInput: CreateBrandInput = {
    name: 'Test Brand',
    description: 'Test Description',
    logo: 'test-logo.png',
  };

  const mockUpdateBrandInput: UpdateBrandInput = {
    name: 'Updated Brand',
    description: 'Updated Description',
    logo: 'updated-logo.png',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    brandService = module.get<BrandService>(BrandService);
    prismaService = module.get<PrismaService>(PrismaService) as jest.Mocked<PrismaService>;
    jest.clearAllMocks();
  });

  describe('createBrand', () => {
    it('should create a new brand and return it', async () => {
      mockPrismaService.brand.create.mockResolvedValue(mockBrand);
      const result = await brandService.createBrand(mockCreateBrandInput);
      expect(result).toEqual(mockBrand);
      expect(prismaService.brand.create).toHaveBeenCalledWith({
        data: mockCreateBrandInput,
      });
    });
  });

  describe('updateBrand', () => {
    const id = 'brand1';
    it('should update an existing brand and return it', async () => {
      mockPrismaService.brand.findUnique.mockResolvedValue(mockBrand);
      mockPrismaService.brand.update.mockResolvedValue({
        ...mockBrand,
        name: mockUpdateBrandInput.name,
        description: mockUpdateBrandInput.description,
        logo: mockUpdateBrandInput.logo,
      });
      const result = await brandService.updateBrand('brand1', mockUpdateBrandInput);

      expect(result).toEqual({
        ...mockBrand,
        name: mockUpdateBrandInput.name,
        description: mockUpdateBrandInput.description,
        logo: mockUpdateBrandInput.logo,
      });
      expect(prismaService.brand.findUnique).toHaveBeenCalledWith({ where: { id } });
      expect(prismaService.brand.update).toHaveBeenCalledWith({
        where: { id: 'brand1' },
        data: mockUpdateBrandInput,
      });
    });

    it('should throw NotFoundException if brand does not exist', async () => {
      mockPrismaService.brand.findUnique.mockResolvedValue(null);

      await expect(brandService.updateBrand(id, mockUpdateBrandInput)).rejects.toThrow(
        new NotFoundException(`Brand with ID ${id} not found`),
      );
      expect(prismaService.brand.update).not.toHaveBeenCalled();
    });
  });

  describe('getBrandById', () => {
    it('should return a brand by ID', async () => {
      mockPrismaService.brand.findUnique.mockResolvedValue(mockBrand);
      const result = await brandService.getBrandById(mockBrand.id);
      expect(result).toEqual(mockBrand);
      expect(prismaService.brand.findUnique).toHaveBeenCalledWith({ where: { id: mockBrand.id } });
    });

    it('should return null if brand does not exist', async () => {
      mockPrismaService.brand.findUnique.mockResolvedValue(null);
      const result = await brandService.getBrandById('nonexistent');
      expect(result).toBeNull();
      expect(prismaService.brand.findUnique).toHaveBeenCalledWith({ where: { id: 'nonexistent' } });
    });
  });

  describe('getAllBrands', () => {
    it('should return a list of brands with default query options', async () => {
      const mockBrands = [mockBrand];
      mockPrismaService.brand.findMany.mockResolvedValue(mockBrands);
      const result = await brandService.getAllBrands();

      expect(result).toEqual(mockBrands);
      expect(prismaService.brand.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return a list of brands with requested fields', async () => {
      const mockBrands = [mockBrand];
      const requestedField = { name: true, description: true };
      mockPrismaService.brand.findMany.mockResolvedValue(mockBrands);

      const result = await brandService.getAllBrands(requestedField);

      expect(result).toEqual(mockBrands);
      expect(prismaService.brand.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        select: { ...requestedField, id: true },
      });
    });
  });

  describe('deleteBrand', () => {
    it('should delete a brand and return it', async () => {
      mockPrismaService.brand.findUnique.mockResolvedValue(mockBrand);
      mockPrismaService.brand.delete.mockResolvedValue(mockBrand);

      const result = await brandService.deleteBrand(mockBrand.id);

      expect(result).toEqual(mockBrand);
      expect(prismaService.brand.findUnique).toHaveBeenCalledWith({ where: { id: mockBrand.id } });
      expect(prismaService.brand.delete).toHaveBeenCalledWith({ where: { id: mockBrand.id } });
    });

    it('should throw NotFoundException if brand does not exist', async () => {
      mockPrismaService.brand.findUnique.mockResolvedValue(null);

      await expect(brandService.deleteBrand('nonexistent')).rejects.toThrow(
        new NotFoundException(`Brand with ID nonexistent not found`),
      );
      expect(prismaService.brand.delete).not.toHaveBeenCalled();
    });
  });

  describe('ensureBrandExists', () => {
    it('should not throw if brand exists', async () => {
      mockPrismaService.brand.findUnique.mockResolvedValue(mockBrand);

      await expect(brandService['ensureBrandExists'](mockBrand.id)).resolves.toBeUndefined();
      expect(prismaService.brand.findUnique).toHaveBeenCalledWith({ where: { id: mockBrand.id } });
    });

    it('should throw NotFoundException if brand does not exist', async () => {
      mockPrismaService.brand.findUnique.mockResolvedValue(null);

      await expect(brandService['ensureBrandExists']('nonexistent')).rejects.toThrow(
        new NotFoundException(`Brand with ID nonexistent not found`),
      );
      expect(prismaService.brand.findUnique).toHaveBeenCalledWith({ where: { id: 'nonexistent' } });
    });
  });
});
