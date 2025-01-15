import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { UsersModule } from '../users/users.module';
import { CommonsModule } from '../commons/commons.module';
import { LocalStrategy } from './local.strategy';

@Module({
  imports: [UsersModule, CommonsModule],
  providers: [AuthService, AuthResolver, LocalStrategy],
})
export class AuthModule {}
