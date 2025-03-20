import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Address } from '@prisma/client';

@Injectable()
export class AddressesService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Creates a new address for the user.
   * @param userId - The ID of the user.
   * @param data - The address data to create.
   * @returns The created address.
   */
  async createAddress(
    userId: string,
    data: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  ): Promise<Address> {
    return this.saveAddress({ ...data, userId });
  }

  /**
   * Retrieves a specific address by ID for the user.
   * @param userId - The ID of the user.
   * @param addressId - The ID of the address.
   * @returns The address.
   */
  async getAddress(userId: string, addressId: string): Promise<Address> {
    return this.retrieveUserAddress(userId, addressId);
  }

  /**
   * Retrieves all addresses for the user.
   * @param userId - The ID of the user.
   * @returns List of addresses.
   */
  async getUserAddresses(userId: string): Promise<Address[]> {
    return this.fetchUserAddresses(userId);
  }

  /**
   * Retrieves all addresses (admin only).
   * @returns List of all addresses.
   */
  async getAllAddresses(): Promise<Address[]> {
    return this.fetchAllAddresses();
  }

  /**
   * Updates an existing address for the user.
   * @param userId - The ID of the user.
   * @param addressId - The ID of the address.
   * @param data - The address data to update.
   * @returns The updated address.
   */
  async updateAddress(
    userId: string,
    addressId: string,
    data: Partial<Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Address> {
    await this.retrieveUserAddress(userId, addressId);
    return this.modifyAddress(addressId, data);
  }

  /**
   * Deletes an address for the user.
   * @param userId - The ID of the user.
   * @param addressId - The ID of the address.
   * @returns The deleted address.
   */
  async deleteAddress(userId: string, addressId: string): Promise<Address> {
    await this.retrieveUserAddress(userId, addressId);
    return this.removeAddress(addressId);
  }

  private async saveAddress(data: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>): Promise<Address> {
    return this.prismaService.address.create({ data });
  }

  private async retrieveUserAddress(userId: string, addressId: string): Promise<Address> {
    const address = await this.prismaService.address.findUnique({
      where: { id: addressId },
    });
    if (!address || address.userId !== userId) {
      throw new NotFoundException(`Address "${addressId}" not found for user "${userId}"`);
    }
    return address;
  }

  private async fetchUserAddresses(userId: string): Promise<Address[]> {
    return this.prismaService.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async fetchAllAddresses(): Promise<Address[]> {
    return this.prismaService.address.findMany({ orderBy: { createdAt: 'desc' } });
  }

  private async modifyAddress(
    addressId: string,
    data: Partial<Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Address> {
    return this.prismaService.address.update({ where: { id: addressId }, data });
  }

  private async removeAddress(addressId: string): Promise<Address> {
    return this.prismaService.address.delete({ where: { id: addressId } });
  }
}
