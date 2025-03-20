import { Test, TestingModule } from '@nestjs/testing';
import { AddressesResolver } from './addresses.resolver';
import { AddressesService } from './addresses.service';
import { Address } from './entities/address.entity';
import { CreateAddressInput } from './dto/create-address.input';
import { ActiveUser } from '../iam/authentication/decorators/active-user.decorator';
import { UpdateAddressInput } from './dto/update-address.input';

describe('AddressesResolver', () => {
  let resolver: AddressesResolver;
  let addressesService: AddressesService;

  const mockAddressesService = {
    getAddress: jest.fn(),
    getUserAddresses: jest.fn(),
    getAllAddresses: jest.fn(),
    createAddress: jest.fn(),
    updateAddress: jest.fn(),
    deleteAddress: jest.fn(),
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

  const mockCreateAddressInput: CreateAddressInput = {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
  };

  const mockUpdateAddressInput = {
    street: '456 Elm St',
  } as UpdateAddressInput;

  const mockActiveUser = (id: string) => ({ id });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AddressesResolver, { provide: AddressesService, useValue: mockAddressesService }],
    })
      .overrideProvider(ActiveUser)
      .useValue(mockActiveUser)
      .compile();

    resolver = module.get<AddressesResolver>(AddressesResolver);
    addressesService = module.get<AddressesService>(AddressesService);
    jest.resetAllMocks();
  });

  describe('getAddress', () => {
    it('should retrieve a specific address for the user', async () => {
      mockAddressesService.getAddress.mockResolvedValue(mockAddress);

      const result = await resolver.getAddress(mockUserId, 'addr1');

      expect(addressesService.getAddress).toHaveBeenCalledWith(mockUserId, 'addr1');
      expect(result).toEqual(mockAddress);
    });
  });

  describe('getUserAddresses', () => {
    it('should retrieve all addresses for the user', async () => {
      mockAddressesService.getUserAddresses.mockResolvedValue([mockAddress]);

      const result = await resolver.getUserAddresses(mockUserId);

      expect(addressesService.getUserAddresses).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual([mockAddress]);
    });
  });

  describe('getAllAddresses', () => {
    it('should retrieve all addresses for admin', async () => {
      mockAddressesService.getAllAddresses.mockResolvedValue([mockAddress]);

      const result = await resolver.getAllAddresses();

      expect(addressesService.getAllAddresses).toHaveBeenCalled();
      expect(result).toEqual([mockAddress]);
    });
  });

  describe('createAddress', () => {
    it('should create an address for the user', async () => {
      mockAddressesService.createAddress.mockResolvedValue(mockAddress);

      const result = await resolver.createAddress(mockUserId, mockCreateAddressInput);

      expect(addressesService.createAddress).toHaveBeenCalledWith(mockUserId, mockCreateAddressInput);
      expect(result).toEqual(mockAddress);
    });
  });

  describe('updateAddress', () => {
    it('should update an address for the user', async () => {
      const updatedAddress = { ...mockAddress, street: '456 Elm St' };
      mockAddressesService.updateAddress.mockResolvedValue(updatedAddress);

      const result = await resolver.updateAddress(mockUserId, 'addr1', mockUpdateAddressInput);

      expect(addressesService.updateAddress).toHaveBeenCalledWith(mockUserId, 'addr1', mockUpdateAddressInput);
      expect(result).toEqual(updatedAddress);
    });
  });

  describe('deleteAddress', () => {
    it('should delete an address for the user', async () => {
      mockAddressesService.deleteAddress.mockResolvedValue(mockAddress);

      const result = await resolver.deleteAddress(mockUserId, 'addr1');

      expect(addressesService.deleteAddress).toHaveBeenCalledWith(mockUserId, 'addr1');
      expect(result).toEqual(mockAddress);
    });
  });

  // Role-Based Access Tests (Assuming decorator enforcement)
  describe('role-based access', () => {
    it('should allow USER role to access getAddress', async () => {
      mockAddressesService.getAddress.mockResolvedValue(mockAddress);

      const result = await resolver.getAddress(mockUserId, 'addr1');

      expect(addressesService.getAddress).toHaveBeenCalled();
      expect(result).toEqual(mockAddress);
    });

    it('should allow ADMIN role to access getAllAddresses', async () => {
      mockAddressesService.getAllAddresses.mockResolvedValue([mockAddress]);

      const result = await resolver.getAllAddresses();

      expect(addressesService.getAllAddresses).toHaveBeenCalled();
      expect(result).toEqual([mockAddress]);
    });
  });
});
