import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandInput } from './dto/create-brand.input';
import { UpdateBrandInput } from './dto/update-brand.input';
import { Brand, Prisma } from '@prisma/client';

@Injectable()
export class BrandService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new brand in the database.
   * @returns The created brand.
   * @param createBrandInput
   */
  async createBrand(createBrandInput: CreateBrandInput): Promise<Brand> {
    return this.prisma.brand.create({
      data: createBrandInput,
    });
  }

  /**
   * Updates an existing brand by ID.
   * @param id
   * @param updateBrandInput
   * @returns The updated brand.
   * @throws NotFoundException if the brand is not found.
   */
  async updateBrand(id: string, updateBrandInput: UpdateBrandInput): Promise<Brand> {
    await this.ensureBrandExists(id);
    return this.prisma.brand.update({
      where: { id },
      data: updateBrandInput,
    });
  }

  /**
   * Retrieves a brand by its ID.
   * @param id - The ID of the brand.
   * @returns The brand if found.
   * @throws NotFoundException if the brand is not found.
   */
  async getBrandById(id: string): Promise<Brand> {
    return this.prisma.brand.findUnique({
      where: { id },
    });
  }

  /**
   * Retrieves all brands with optional pagination.
   * @returns A list of brands.
   * @param requestedField
   */
  async getAllBrands(requestedField: Prisma.BrandSelect = {}): Promise<Brand[]> {
    const queryOptions: Prisma.BrandFindManyArgs = {
      orderBy: { createdAt: 'desc' },
    };
    if (Object.keys(requestedField).length) queryOptions.select = { ...requestedField, id: true };
    return this.prisma.brand.findMany(queryOptions);
  }

  /**
   * Deletes a brand by its ID.
   * @param id - The ID of the brand to delete.
   * @returns The deleted brand.
   * @throws NotFoundException if the brand is not found.
   */
  async deleteBrand(id: string): Promise<Brand> {
    await this.ensureBrandExists(id);
    return this.prisma.brand.delete({ where: { id } });
  }

  /**
   * Checks if a brand exists by ID.
   * @param id - The ID of the brand.
   * @throws NotFoundException if the brand is not found.
   */
  private async ensureBrandExists(id: string): Promise<void> {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
    });

    if (!brand) throw new NotFoundException(`Brand with ID ${id} not found`);
  }
}
