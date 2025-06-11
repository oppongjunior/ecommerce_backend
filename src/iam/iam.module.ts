import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication/authentication.service';
import { BcryptService } from './hashing/bcrypt.service';
import { HashingService } from './hashing/hashing.service';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from './config/jwt.config';
import { UsersModule } from '../users/users.module';
import { ConfigModule } from '@nestjs/config';
import { AuthenticationResolver } from './authentication/authentication.resolver';
import { GoogleAuthenticationService } from './authentication/social/google-authentication.service';
import { APP_GUARD } from '@nestjs/core';
import { AccessTokenGuard } from './authentication/guards/access-token.guard';
import { AuthenticationGuard } from './authentication/guards/authentication.guard';
import { RolesGuard } from './authentication/guards/roles.guard';

@Module({
  imports: [JwtModule.registerAsync(jwtConfig.asProvider()), UsersModule, ConfigModule.forFeature(jwtConfig)],
  providers: [
    AuthenticationService,
    { provide: HashingService, useClass: BcryptService },
    AuthenticationResolver,
    GoogleAuthenticationService,
    AccessTokenGuard,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  controllers: [],
})
export class IamModule {}
