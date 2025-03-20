import { Test, TestingModule } from '@nestjs/testing';
import { AddressesService } from './addresses.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Address } from '@prisma/client';

describe('AddressesService', () => {
  let service: AddressesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    address: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockUserId = 'user1';
  const fixedDate = new Date('2025-03-18T00:00:00.000Z');
  const mockAddress: Address = {
    id: 'addr1',
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
    userId: mockUserId,
    createdAt: fixedDate,
    updatedAt: fixedDate,
  };
  const mockAddressInput = {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AddressesService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<AddressesService>(AddressesService);
    prismaService = module.get<PrismaService>(PrismaService);
    jest.resetAllMocks();
  });

  describe('createAddress', () => {
    it('should create an address successfully', async () => {
      mockPrismaService.address.create.mockResolvedValue(mockAddress);

      const result = await service.createAddress(mockUserId, mockAddressInput);

      expect(prismaService.address.create).toHaveBeenCalledWith({
        data: { ...mockAddressInput, userId: mockUserId },
      });
      expect(result).toEqual(mockAddress);
    });
  });

  describe('getAddress', () => {
    it('should retrieve a user’s address', async () => {
      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);

      const result = await service.getAddress(mockUserId, 'addr1');

      expect(prismaService.address.findUnique).toHaveBeenCalledWith({
        where: { id: 'addr1' },
      });
      expect(result).toEqual(mockAddress);
    });

    it('should throw NotFoundException if address doesn’t exist', async () => {
      mockPrismaService.address.findUnique.mockResolvedValue(null);

      await expect(service.getAddress(mockUserId, 'addr1')).rejects.toThrow(
        new NotFoundException(`Address "addr1" not found for user "${mockUserId}"`),
      );
    });

    it('should throw NotFoundException if address belongs to another user', async () => {
      mockPrismaService.address.findUnique.mockResolvedValue({ ...mockAddress, userId: 'user2' });

      await expect(service.getAddress(mockUserId, 'addr1')).rejects.toThrow(
        new NotFoundException(`Address "addr1" not found for user "${mockUserId}"`),
      );
    });
  });

  describe('getUserAddresses', () => {
    it('should retrieve all addresses for the user', async () => {
      mockPrismaService.address.findMany.mockResolvedValue([mockAddress]);

      const result = await service.getUserAddresses(mockUserId);

      expect(prismaService.address.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockAddress]);
    });

    it('should return an empty array if no addresses exist', async () => {
      mockPrismaService.address.findMany.mockResolvedValue([]);

      const result = await service.getUserAddresses(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('getAllAddresses', () => {
    it('should retrieve all addresses', async () => {
      mockPrismaService.address.findMany.mockResolvedValue([mockAddress]);

      const result = await service.getAllAddresses();

      expect(prismaService.address.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockAddress]);
    });
  });

  describe('updateAddress', () => {
    it('should update an address successfully', async () => {
      const updatedAddress = { ...mockAddress, street: '456 Elm St' };
      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);
      mockPrismaService.address.update.mockResolvedValue(updatedAddress);

      const result = await service.updateAddress(mockUserId, 'addr1', { street: '456 Elm St' });

      expect(prismaService.address.findUnique).toHaveBeenCalledWith({
        where: { id: 'addr1' },
      });
      expect(prismaService.address.update).toHaveBeenCalledWith({
        where: { id: 'addr1' },
        data: { street: '456 Elm St' },
      });
      expect(result).toEqual(updatedAddress);
    });

    it('should throw NotFoundException if address doesn’t exist', async () => {
      mockPrismaService.address.findUnique.mockResolvedValue(null);

      await expect(service.updateAddress(mockUserId, 'addr1', { street: '456 Elm St' })).rejects.toThrow(
        new NotFoundException(`Address "addr1" not found for user "${mockUserId}"`),
      );
    });
  });

  describe('deleteAddress', () => {
    it('should delete an address successfully', async () => {
      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);
      mockPrismaService.address.delete.mockResolvedValue(mockAddress);

      const result = await service.deleteAddress(mockUserId, 'addr1');

      expect(prismaService.address.findUnique).toHaveBeenCalledWith({
        where: { id: 'addr1' },
      });
      expect(prismaService.address.delete).toHaveBeenCalledWith({
        where: { id: 'addr1' },
      });
      expect(result).toEqual(mockAddress);
    });

    it('should throw NotFoundException if address doesn’t exist', async () => {
      mockPrismaService.address.findUnique.mockResolvedValue(null);

      await expect(service.deleteAddress(mockUserId, 'addr1')).rejects.toThrow(
        new NotFoundException(`Address "addr1" not found for user "${mockUserId}"`),
      );
    });
  });
});
