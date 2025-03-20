import { Module } from '@nestjs/common';
import { AddressesResolver } from './addresses.resolver';
import { AddressesService } from './addresses.service';

@Module({
  providers: [AddressesResolver, AddressesService],
})
export class AddressesModule {}
