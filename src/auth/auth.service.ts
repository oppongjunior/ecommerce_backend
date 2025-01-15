import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PasswordService } from '../commons/password.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findUserByEmail(email);
    if (user && (await this.passwordService.comparePassword(pass, user.password))) {
      return user;
    }
    return null;
  }
}
