import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { PrismaService } from '../prisma/prisma.service';
import { HashingService } from '../iam/hashing/hashing.service';
import { Prisma, User } from '@prisma/client';
import { UserPaginateArgs } from './dto/user-paginate.args';
import { ChangeUserPasswordInput } from './dto/change-user-password.input';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly passwordService: HashingService,
  ) {}

  async createUserByCredentials(createUserInput: CreateUserInput) {
    const { password } = createUserInput;
    createUserInput.password = await this.passwordService.hash(password);
    return this.prismaService.user.create({ data: createUserInput });
  }

  async changePassword(id: string, input: ChangeUserPasswordInput): Promise<User> {
    const { oldPassword, newPassword } = input;
    const user = await this.findUserByIdOrThrow(id);
    const isOldPasswordValid = await this.passwordService.compare(oldPassword, user.password);
    if (!isOldPasswordValid) throw new ForbiddenException('Old password is incorrect');
    await this.compareNewPasswordToOld(newPassword, user.password);
    const hashedNewPassword = await this.passwordService.hash(newPassword);
    return this.prismaService.user.update({ where: { id }, data: { password: hashedNewPassword } });
  }

  async createUserByAuthProvider(providerId: string, provider: string, email: string) {
    return this.prismaService.user.create({ data: { email, authProvider: { create: { providerId, provider } } } });
  }

  async findAll(filter: UserPaginateArgs) {
    const paginationOptions = this.buildPaginationOptions(filter);
    const whereClause = this.buildWhereClause(filter);

    const users = await this.fetchUsers(paginationOptions, whereClause);
    const totalCount = await this.countUsers(whereClause);
    return this.formatPaginatedResponse(users, totalCount, paginationOptions);
  }

  private buildPaginationOptions({ first, after }: UserPaginateArgs) {
    const pageSize = first;
    const hasCursor = !!after;
    return { take: pageSize, skip: hasCursor ? 1 : 0, cursor: hasCursor ? { id: after } : undefined };
  }

  private buildWhereClause(filter: UserPaginateArgs): Prisma.UserWhereInput {
    const { email, phoneNumber, role, isActive, name, createdAfter } = filter;
    return {
      ...(email && { email: { contains: email, mode: 'insensitive' as const } }),
      ...(phoneNumber && { phoneNumber }),
      ...(role && { role }),
      ...(isActive !== undefined && { isActive }),
      ...(name && { name: { contains: name, mode: 'insensitive' as const } }),
      ...(createdAfter && { createdAt: { gte: createdAfter } }),
    };
  }

  private async fetchUsers(
    { take, skip, cursor }: { take: number; skip: number; cursor?: { id: string } },
    where: Prisma.UserWhereInput,
  ) {
    return this.prismaService.user.findMany({ take, skip, cursor, where, orderBy: { name: 'asc' } });
  }

  private async countUsers(where: Prisma.UserWhereInput): Promise<number> {
    return this.prismaService.user.count({ where });
  }

  private formatPaginatedResponse(users: User[], totalCount: number, { skip, take }: { take: number; skip: number }) {
    const lastUser = users[users.length - 1];
    const itemsFetched = skip + users.length;
    return {
      edges: users.map((user) => ({
        cursor: user.id,
        node: user,
      })),
      pageInfo: {
        pageSize: take,
        hasPreviousPage: skip > 0,
        hasNextPage: !!lastUser && totalCount > itemsFetched,
      },
    };
  }

  findOne(id: string) {
    return this.prismaService.user.findUnique({ where: { id } });
  }

  findUserByEmail(email: string) {
    return this.prismaService.user.findUnique({ where: { email } });
  }

  async findUserByProviderId(providerId: string) {
    const users = await this.prismaService.user.findMany({ where: { authProvider: { every: { providerId } } } });
    return users[0];
  }

  async update(id: string, updateUserInput: UpdateUserInput) {
    return this.prismaService.user.update({ where: { id }, data: updateUserInput });
  }

  private async compareNewPasswordToOld(newPassword: string, oldEncryptedPassword: string) {
    const result = await this.passwordService.compare(newPassword, oldEncryptedPassword);
    if (result) {
      throw new ForbiddenException('New password must be different from old password');
    }
  }

  async remove(id: string) {
    await this.findUserByIdOrThrow(id);
    return this.prismaService.user.delete({ where: { id } });
  }

  async archiveUser(id: string) {
    await this.findUserByIdOrThrow(id);
    return this.prismaService.user.update({ where: { id }, data: { isActive: false } });
  }

  async deArchiveUser(id: string) {
    await this.findUserByIdOrThrow(id);
    return this.prismaService.user.update({ where: { id }, data: { isActive: true } });
  }

  async getUserProfile(id: string) {
    return this.prismaService.user.findUnique({
      where: { id },
      include: { addresses: true, cart: true, wishlist: true, order: true },
    });
  }

  async updateLastLogin(id: string) {
    return this.prismaService.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
  }

  private async findUserByIdOrThrow(id: string) {
    const user = await this.prismaService.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
