import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UserConnection } from './entities/user-connection.entity';
import { UserPaginateArgs } from './dto/user-paginate.args';
import { Auth } from '../iam/authentication/decorators/auth.decorator';
import { AuthType } from '../iam/authentication/enums/auth-type.enum';
import { Roles } from '../iam/authentication/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ActiveUser } from '../iam/authentication/decorators/active-user.decorator';
import { ChangeUserPasswordInput } from './dto/change-user-password.input';

@Auth(AuthType.Bearer)
@Roles(Role.SUPER_ADMIN)
@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => User, {
    description: 'Create a new user with email and password',
  })
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.usersService.createUserByCredentials(createUserInput);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Query(() => UserConnection, {
    name: 'users',
    description: 'Fetch a paginated list of users',
  })
  async usersConnection(
    @Args('filter', { type: () => UserPaginateArgs }) filter: UserPaginateArgs,
  ) {
    return this.usersService.findAll(filter);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Query(() => User, { name: 'userById', description: 'Fetch a user by ID' })
  findUserById(@Args('id', { type: () => String }) id: string) {
    return this.usersService.findOne(id);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Query(() => User, {
    name: 'userByEmail',
    description: 'Fetch a user by email',
  })
  findUserByEmail(@Args('email', { type: () => String }) email: string) {
    return this.usersService.findUserByEmail(email);
  }
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Query(() => User, {
    name: 'userByProviderId',
    description: 'Fetch a user by OAuth provider ID',
  })
  findUserByProviderId(
    @Args('providerId', { type: () => String }) providerId: string,
  ) {
    return this.usersService.findUserByProviderId(providerId);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Mutation(() => User, { description: 'Update an existing user' })
  updateUser(
    @Args('id', { type: () => String }) id: string,
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
  ) {
    return this.usersService.update(id, updateUserInput);
  }

  @Roles(Role.USER)
  @Mutation(() => User, { description: 'Update user profile' })
  updateMyProfile(
    @ActiveUser('id') id: string,
    @Args('updateMyProfileInput') updateMyProfileInput: UpdateUserInput,
  ) {
    return this.usersService.update(id, updateMyProfileInput);
  }

  @Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN)
  @Mutation(() => User, {
    description: 'Change the password of the active user',
  })
  async changeUserPassword(
    @ActiveUser('id') id: string,
    @Args('input', { type: () => ChangeUserPasswordInput })
    input: ChangeUserPasswordInput,
  ) {
    return this.usersService.changePassword(id, input);
  }

  @Mutation(() => User, { description: 'Delete a user permanently' })
  removeUser(@Args('id', { type: () => String }) id: string) {
    return this.usersService.remove(id);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Mutation(() => User, { description: 'Archive (soft delete) a user' })
  archiveUser(@Args('id', { type: () => String }) id: string) {
    return this.usersService.archiveUser(id);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Mutation(() => User, { description: 'Restore an archived user' })
  deArchiveUser(@Args('id', { type: () => String }) id: string) {
    return this.usersService.deArchiveUser(id);
  }

  @Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN)
  @Query(() => User, {
    name: 'userProfile',
    description: 'Fetch a user’s profile with related data',
  })
  userProfile(@ActiveUser('id') id: string) {
    return this.usersService.getUserProfile(id);
  }
}
