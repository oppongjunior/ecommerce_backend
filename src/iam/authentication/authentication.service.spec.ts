import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationService } from './authentication.service';
import { UsersService } from '../../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { HashingService } from '../hashing/hashing.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import jwtConfig from '../config/jwt.config';
import { Role } from '../../users/enums/role.enum';
import { SignUpInput } from './dto/sign-up.input';
import { SignInInput } from './dto/sign-in.input';
import { User } from '@prisma/client';

const mockUsersService = {
  findUserByEmail: jest.fn(),
  createUserByCredentials: jest.fn(),
  updateLastLogin: jest.fn(),
};

const mockPrismaService = {
  user: {
    create: jest.fn(),
  },
};

const mockHashingService = {
  hash: jest.fn(),
  compare: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn(),
};

const mockJwtConfig = {
  secret: 'test-secret',
  audience: 'test-audience',
  issuer: 'test-issuer',
  accessTokenTtl: 3600,
  refreshTokenTtl: 86400,
};

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let usersService: UsersService;
  let hashingService: HashingService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forFeature(jwtConfig)],
      providers: [
        AuthenticationService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: HashingService, useValue: mockHashingService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: jwtConfig.KEY, useValue: mockJwtConfig },
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
    usersService = module.get<UsersService>(UsersService);
    hashingService = module.get<HashingService>(HashingService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should sign up a new user and return tokens', async () => {
      const input: SignUpInput = { email: 'test@example.com', password: 'password123', name: 'Test' };
      const hashedPassword = 'hashedPass';
      const user = { id: '1', email: input.email, role: Role.USER, isActive: true, password: hashedPassword };
      const tokens = { accessToken: 'access', refreshToken: 'refresh' };

      mockUsersService.findUserByEmail.mockResolvedValue(null);
      mockHashingService.hash.mockResolvedValue(hashedPassword);
      mockUsersService.createUserByCredentials.mockResolvedValue(user);
      mockJwtService.signAsync.mockResolvedValueOnce('access').mockResolvedValueOnce('refresh');
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);

      const result = await service.signUp(input);

      expect(usersService.findUserByEmail).toHaveBeenCalledWith(input.email);
      expect(usersService.createUserByCredentials).toHaveBeenCalledWith({
        email: input.email,
        password: input.password,
        name: input.name,
        isActive: true,
        role: Role.USER,
      });
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(usersService.updateLastLogin).toHaveBeenCalledWith(user.id);
      expect(result).toEqual(tokens);
    });

    it('should throw if user already exists', async () => {
      const input: SignUpInput = { email: 'test@example.com', password: 'password123', name: 'Test' };
      mockUsersService.findUserByEmail.mockResolvedValue({ id: '1' });

      await expect(service.signUp(input)).rejects.toThrow('User already exist!');
    });
  });

  describe('signIn', () => {
    it('should sign in a user and return tokens', async () => {
      const input: SignInInput = { email: 'test@example.com', password: 'password123' };
      const user = { id: '1', email: input.email, role: Role.USER, password: 'hashedPass' };
      const tokens = { accessToken: 'access', refreshToken: 'refresh' };

      mockUsersService.findUserByEmail.mockResolvedValue(user);
      mockHashingService.compare.mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValueOnce('access').mockResolvedValueOnce('refresh');
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);

      const result = await service.signIn(input);

      expect(usersService.findUserByEmail).toHaveBeenCalledWith(input.email);
      expect(hashingService.compare).toHaveBeenCalledWith(input.password, user.password);
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(usersService.updateLastLogin).toHaveBeenCalledWith(user.id);
      expect(result).toEqual(tokens);
    });

    it('should throw if user not found', async () => {
      const input: SignInInput = { email: 'test@example.com', password: 'password123' };
      mockUsersService.findUserByEmail.mockResolvedValue(null);

      await expect(service.signIn(input)).rejects.toThrow('Invalid email or password');
    });

    it('should throw if password is incorrect', async () => {
      const input: SignInInput = { email: 'test@example.com', password: 'wrongPass' };
      const user = { id: '1', email: input.email, password: 'hashedPass' };

      mockUsersService.findUserByEmail.mockResolvedValue(user);
      mockHashingService.compare.mockResolvedValue(false);

      await expect(service.signIn(input)).rejects.toThrow('Invalid email or password');
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens without role', async () => {
      const user = { id: '1', email: 'test@example.com', role: Role.USER };
      mockJwtService.signAsync.mockResolvedValueOnce('access').mockResolvedValueOnce('refresh');
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);

      const result = await service.generateTokens(user as User);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: user.id },
        expect.objectContaining({ expiresIn: mockJwtConfig.accessTokenTtl }),
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: user.id },
        expect.objectContaining({ expiresIn: mockJwtConfig.refreshTokenTtl }),
      );
      expect(usersService.updateLastLogin).toHaveBeenCalledWith(user.id);
      expect(result).toEqual({ accessToken: 'access', refreshToken: 'refresh' });
    });
  });
});
