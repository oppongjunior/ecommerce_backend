import { Field, InputType } from '@nestjs/graphql';
import { Role } from '../enums/role.enum';
import { PaginateArgs } from '../../commons/entities/paginate.args';

@InputType()
export class UserPaginateArgs extends PaginateArgs {
  @Field(() => String, { nullable: true, description: 'Filter by email (partial match, case-insensitive)' })
  email?: string;

  @Field(() => String, { nullable: true, description: 'Filter by phone number (exact match)' })
  phoneNumber?: string;

  @Field(() => Role, { nullable: true, description: 'Filter by user role (USER or ADMIN)' })
  role?: Role;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Filter by active status (true for active, false for inactive)',
  })
  isActive?: boolean;

  @Field(() => String, { nullable: true, description: 'Filter by name (partial match, case-insensitive)' })
  name?: string;

  @Field(() => Date, { nullable: true, description: 'Filter by creation date (users created on or after this date)' })
  createdAfter?: Date;
}
