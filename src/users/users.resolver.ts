import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UserConnection } from './entities/user-connection.entity';
import { PaginateArgs } from '../commons/entities/paginate.args';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => User)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.usersService.createUserByCredentials(createUserInput);
  }

  @Query(() => UserConnection)
  async usersConnection(@Args('paginateFilter', { type: () => PaginateArgs, nullable: true }) filter: PaginateArgs) {
    return this.usersService.findAll(filter);
  }

  @Query(() => User, { name: 'user' })
  findOne(@Args('id', { type: () => String, nullable: false }) id: string) {
    return this.usersService.findOne(id);
  }

  @Mutation(() => User)
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return this.usersService.update(updateUserInput.id, updateUserInput);
  }

  @Mutation(() => User)
  removeUser(@Args('id', { type: () => String, nullable: false }) id: string) {
    return this.usersService.remove(id);
  }
}
