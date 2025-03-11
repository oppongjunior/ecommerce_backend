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
   * @param signUpDto - The data transfer object containing the user's sign-up information.
   * @throws ConflictException - If a user with the provided email already exists.
   * @returns A promise that resolves to an object containing access and refresh tokens for the newly created user.
   */
  async signUp(signUpDto: SignUpInput) {
    const findUser = await this.userService.findUserByEmail(signUpDto.email);
    if (findUser) throw new ConflictException('User already exist!');
    const hashedPassword = await this.passwordService.hash(signUpDto.password);
    const user = await this.prisma.user.create({
      data: { email: signUpDto.email, password: hashedPassword, role: Role.USER },
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
    if (!user) throw new UnauthorizedException('Bad Credentials');
    const isPasswordEqual = await this.passwordService.compare(signInDto.password, user.password);
    if (!isPasswordEqual) throw new UnauthorizedException('Bad Credentials');
    return this.generateTokens(user);
  }

  async generateTokens(user: User) {
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken(user.id, this.jwtConfiguration.accessTokenTtl),
      this.signToken(user.id, this.jwtConfiguration.refreshTokenTtl),
    ]);
    return {
      accessToken,
      refreshToken,
    };
  }

  private async signToken<T>(userId: string, expiresIn: number, payload?: T) {
    return await this.jwtServices.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
        expiresIn: expiresIn,
      },
    );
  }
}
