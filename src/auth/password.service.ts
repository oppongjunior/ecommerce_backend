import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  async encryptPassword(rawPassword: string) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(rawPassword, salt);
  }

  async comparePassword(rawPassword: string, encryptedPassword: string) {
    return bcrypt.compare(rawPassword, encryptedPassword);
  }
}
