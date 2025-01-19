import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../commons/password.service';
import { Args, Int, Query } from '@nestjs/graphql';
import { UserConnection } from './entities/user-connection.entity';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async createUserByCredentials(createUserInput: CreateUserInput) {
    const { password } = createUserInput;
    createUserInput.password = await this.passwordService.encryptPassword(password);
    return this.prismaService.user.create({ data: createUserInput });
  }

  @Query(() => UserConnection)
  async usersConnection(
    @Args('first', { type: () => Int, nullable: true }) first?: number,
    @Args('last', { type: () => Int, nullable: true }) last?: number,
    @Args('after', { type: () => Int, nullable: true }) after?: number,
  ) {}

  findAll() {
    return this.prismaService.user.findMany();
  }

  findOne(id: string) {
    return this.prismaService.user.findUnique({ where: { id } });
  }

  findUserByEmail(email: string) {
    return this.prismaService.user.findUnique({ where: { email } });
  }

  async update(id: string, updateUserInput: UpdateUserInput) {
    const existUserRecord = await this.findUserByIdOrThrow(id);
    const { password } = updateUserInput;
    if (updateUserInput) {
      await this.compareNewPasswordToOld(updateUserInput.password, existUserRecord.password);
      updateUserInput.password = await this.passwordService.encryptPassword(password);
    }
    return this.prismaService.user.update({ where: { id }, data: updateUserInput });
  }

  private async compareNewPasswordToOld(newPassword: string, oldEncryptedPassword: string) {
    const result = await this.passwordService.comparePassword(newPassword, oldEncryptedPassword);
    if (result) {
      throw new ForbiddenException('New password must be different from old password');
    }
  }

  async remove(id: string) {
    await this.findUserByIdOrThrow(id);
    return this.prismaService.user.delete({ where: { id } });
  }

  private async findUserByIdOrThrow(id: string) {
    const user = await this.prismaService.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
