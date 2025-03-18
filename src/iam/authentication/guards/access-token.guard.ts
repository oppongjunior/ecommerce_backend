import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from '../../config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { Request } from 'express';
import { REQUEST_USER_KEY } from '../../iam.constants';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UsersService } from '../../../users/users.service';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly userService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    const token = this.extractTokenFromHeader(request);
    if (!token) throw new UnauthorizedException();
    try {
      const authenticatedUser = await this.jwtService.verifyAsync(token, this.jwtConfiguration);
      const id = authenticatedUser.sub;
      request[REQUEST_USER_KEY] = await this.userService.findOne(id);
    } catch (e) {
      console.log(e);
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request) {
    const [, token] = request.headers.authorization?.split(' ') ?? [];
    return token;
  }
}
