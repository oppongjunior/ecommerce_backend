import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AddressesService } from './addresses.service';
import { Address } from './entities/address.entity';
import { Roles } from '../iam/authentication/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { ActiveUser } from '../iam/authentication/decorators/active-user.decorator';
import { CreateAddressInput } from './dto/create-address.input';
import { UpdateAddressInput } from './dto/update-address.input';

@Resolver(() => Address)
export class AddressesResolver {
  constructor(private readonly addressService: AddressesService) {}

  @Roles(Role.USER)
  @Query(() => Address, { name: 'address', description: 'Retrieves a specific address by ID for the current user' })
  async getAddress(@ActiveUser('id') userId: string, @Args('addressId', { type: () => String }) addressId: string) {
    return this.addressService.getAddress(userId, addressId);
  }

  @Roles(Role.USER)
  @Query(() => [Address], { name: 'userAddresses', description: 'Retrieves all addresses for the current user' })
  async getUserAddresses(@ActiveUser('id') userId: string) {
    return this.addressService.getUserAddresses(userId);
  }

  @Roles(Role.ADMIN)
  @Query(() => [Address], { name: 'addresses', description: 'Retrieves all addresses (admin only)' })
  async getAllAddresses() {
    return this.addressService.getAllAddresses();
  }

  @Roles(Role.USER)
  @Mutation(() => Address, { name: 'createAddress', description: 'Creates a new address for the user' })
  async createAddress(@ActiveUser('id') userId: string, @Args('input') input: CreateAddressInput) {
    return this.addressService.createAddress(userId, input);
  }

  @Roles(Role.USER)
  @Mutation(() => Address, { name: 'updateAddress', description: 'Updates an existing address for the user' })
  async updateAddress(
    @ActiveUser('id') userId: string,
    @Args('addressId', { type: () => String }) addressId: string,
    @Args('input') input: UpdateAddressInput,
  ) {
    return this.addressService.updateAddress(userId, addressId, input);
  }

  @Roles(Role.USER)
  @Mutation(() => Address, { name: 'deleteAddress', description: 'Deletes an address for the user' })
  async deleteAddress(@ActiveUser('id') userId: string, @Args('addressId', { type: () => String }) addressId: string) {
    return this.addressService.deleteAddress(userId, addressId);
  }
}
