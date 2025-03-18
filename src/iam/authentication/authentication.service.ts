import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../../users/enums/role.enum';
import { HashingService } from '../hashing/hashing.service';
import { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from '../config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { SignUpInput } from './dto/sign-up.input';
import { SignInInput } from './dto/sign-in.input';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly userService: UsersService,
    private readonly passwordService: HashingService,
    private readonly prisma: PrismaService,
    private readonly jwtServices: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  /**
   * Registers a new user by creating an account with the provided sign-up details.
   *
   * @throws ConflictException - If a user with the provided email already exists.
   * @returns A promise that resolves to an object containing access and refresh tokens for the newly created user.
   * @param signUpInput
   */
  async signUp(signUpInput: SignUpInput) {
    const { email, password, name } = signUpInput;
    const findUser = await this.userService.findUserByEmail(email);
    if (findUser) throw new ConflictException('User already exist!');
    const user = await this.userService.createUserByCredentials({
      email,
      password,
      name,
      role: Role.USER,
      isActive: true,
    });
    return this.generateTokens(user);
  }

  /**
   * Authenticates a user using the provided sign-in details.
   *
   * @param signInDto - The data transfer object containing the user's sign-in information.
   * @throws UnauthorizedException - If the user does not exist or the password is incorrect.
   * @returns A promise that resolves to an object containing access and refresh tokens for the authenticated user.
   */
  async signIn(signInDto: SignInInput) {
    const user = await this.userService.findUserByEmail(signInDto.email);
    if (!user) throw new UnauthorizedException('Invalid email or password');
    const isPasswordEqual = await this.passwordService.compare(signInDto.password, user.password);
    if (!isPasswordEqual) throw new UnauthorizedException('Invalid email or password');
    return await this.generateTokens(user);
  }

  async generateTokens(user: User) {
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken(user.id, this.jwtConfiguration.accessTokenTtl),
      this.signToken(user.id, this.jwtConfiguration.refreshTokenTtl),
    ]);
    await this.userService.updateLastLogin(user.id);
    return {
      accessToken,
      refreshToken,
    };
  }

  private async signToken<T>(userId: string, expiresIn: number, payload?: T) {
    return await this.jwtServices.signAsync(
      { sub: userId, ...payload },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
        expiresIn: expiresIn,
      },
    );
  }
}
