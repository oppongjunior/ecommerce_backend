import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { HashingService } from '../iam/hashing/hashing.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserInput } from './dto/create-user.input';
import { UserPaginateArgs } from './dto/user-paginate.args';
import { User } from '@prisma/client';
import { Role } from './enums/role.enum';
import { UpdateUserInput } from './dto/update-user.input';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ChangeUserPasswordInput } from './dto/change-user-password.input';

const mockPrismaService = {
  user: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  authProvider: {
    findMany: jest.fn(),
  },
};

const mockHashingService = {
  hash: jest.fn(),
  compare: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;
  let hashingService: HashingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: HashingService, useValue: mockHashingService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
    hashingService = module.get<HashingService>(HashingService);

    jest.clearAllMocks();
  });

  describe('createUserByCredentials', () => {
    it('should create a user with hashed password', async () => {
      const input: CreateUserInput = {
        email: 'test@example.com',
        password: 'password123',
        role: Role.USER,
        isActive: true,
        name: 'sean paul',
      };
      const hashedPassword = 'hashedPassword123';
      const createdUser = { id: '1', email: input.email, password: hashedPassword };

      mockHashingService.hash.mockResolvedValue(hashedPassword);
      mockPrismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.createUserByCredentials(input);

      expect(hashingService.hash).toHaveBeenCalledWith('password123');
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: { ...input, password: hashedPassword },
      });
      expect(result).toEqual(createdUser);
    });
  });

  describe('createUserByAuthProvider', () => {
    it('should create a user with an auth provider', async () => {
      const provider = 'google';
      const providerId = 'google123';
      const email = 'test@example.com';
      const createdUser = { id: '1', email, authProvider: [{ provider, providerId }] };

      mockPrismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.createUserByAuthProvider(providerId, provider, email);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email,
          authProvider: { create: { providerId, provider } },
        },
      });
      expect(result).toEqual(createdUser);
    });
  });

  describe('findAll', () => {
    it('should return paginated users with filters', async () => {
      const filter: UserPaginateArgs = { first: 2, name: 'John', isActive: true };
      const users: User[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          isActive: true,
          role: 'USER',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: null,
          profilePicture: null,
          phoneNumber: null,
          password: null,
        },
        {
          id: '2',
          name: 'John Smith',
          email: 'john.smith@example.com',
          isActive: true,
          role: 'USER',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: null,
          profilePicture: null,
          phoneNumber: null,
          password: null,
        },
      ];
      const totalCount = 5;

      mockPrismaService.user.findMany.mockResolvedValue(users);
      mockPrismaService.user.count.mockResolvedValue(totalCount);

      const result = await service.findAll(filter);

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        take: 2,
        skip: 0,
        cursor: undefined,
        where: { name: { contains: 'John', mode: 'insensitive' }, isActive: true },
        orderBy: { name: 'asc' },
      });
      expect(prismaService.user.count).toHaveBeenCalledWith({
        where: { name: { contains: 'John', mode: 'insensitive' }, isActive: true },
      });
      expect(result).toEqual({
        edges: [
          { cursor: '1', node: users[0] },
          { cursor: '2', node: users[1] },
        ],
        pageInfo: { pageSize: 2, hasPreviousPage: false, hasNextPage: true },
      });
    });

    it('should handle pagination with cursor', async () => {
      const filter: UserPaginateArgs = { first: 1, after: '1' };
      const users: User[] = [
        {
          id: '2',
          name: 'Jane',
          email: 'jane@example.com',
          isActive: true,
          role: 'USER',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: null,
          profilePicture: null,
          phoneNumber: null,
          password: null,
        },
      ];
      const totalCount = 3;

      mockPrismaService.user.findMany.mockResolvedValue(users);
      mockPrismaService.user.count.mockResolvedValue(totalCount);

      const result = await service.findAll(filter);

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        take: 1,
        skip: 1,
        cursor: { id: '1' },
        where: {},
        orderBy: { name: 'asc' },
      });
      expect(result.pageInfo.hasNextPage).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      const user = { id: '1', email: 'test@example.com', name: 'Test' };
      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.findOne('1');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual(user);
    });
  });

  describe('findUserByEmail', () => {
    it('should return a user by email', async () => {
      const email = 'test@example.com';
      const user = {
        id: '1',
        email,
        name: 'Test',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.findUserByEmail(email);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { email } });
      expect(result).toEqual(user);
    });

    it('should return null if no user is found', async () => {
      const email = 'nonexistent@example.com';

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findUserByEmail(email);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { email } });
      expect(result).toBeNull();
    });
  });

  describe('findUserByProviderId', () => {
    it('should return the first user matching the provider ID', async () => {
      const providerId = 'google123';
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const users = [user];

      mockPrismaService.user.findMany.mockResolvedValue(users);

      const result = await service.findUserByProviderId(providerId);

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: { authProvider: { every: { providerId } } },
      });
      expect(result).toEqual(user);
    });

    it('should return undefined if no users match the provider ID', async () => {
      const providerId = 'nonexistent123';

      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.findUserByProviderId(providerId);

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: { authProvider: { every: { providerId } } },
      });
      expect(result).toBeUndefined();
    });

    it('should return the first user if multiple users match (edge case)', async () => {
      const providerId = 'shared123';
      const users = [
        {
          id: '1',
          email: 'test1@example.com',
          name: 'Test1',
          role: 'USER',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          email: 'test2@example.com',
          name: 'Test2',
          role: 'USER',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(users);

      const result = await service.findUserByProviderId(providerId);

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: { authProvider: { every: { providerId } } },
      });
      expect(result).toEqual(users[0]);
    });
  });

  describe('update', () => {
    it('should update a user with new password', async () => {
      const id = '1';
      const existingUser = { id, email: 'test@example.com', password: 'oldHash' };
      const input = { password: 'newPassword' } as UpdateUserInput;
      const updatedUser = { ...existingUser, password: 'newHash' };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockHashingService.compare.mockResolvedValue(false);
      mockHashingService.hash.mockResolvedValue('newHash');
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(id, input);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { id } });
      expect(hashingService.compare).toHaveBeenCalledWith('newPassword', 'oldHash');
      expect(hashingService.hash).toHaveBeenCalledWith('newPassword');
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id },
        data: { password: 'newHash' },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw if new password matches old', async () => {
      const id = '1';
      const existingUser = { id, email: 'test@example.com', password: 'oldHash' };
      const input: UpdateUserInput = { id: '1', password: 'samePassword' };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockHashingService.compare.mockResolvedValue(true);

      await expect(service.update(id, input)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('changePassword', () => {
    it('should change the user’s password', async () => {
      const input: ChangeUserPasswordInput = {
        oldPassword: 'oldPass123',
        newPassword: 'NewPass123',
      };
      const existingUser = { id: '1', email: 'test@example.com', password: 'hashedOldPass' };
      const updatedUser = { ...existingUser, password: 'hashedNewPass' };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockHashingService.compare.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
      mockHashingService.hash.mockResolvedValue('hashedNewPass');
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.changePassword('1', input);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(hashingService.compare).toHaveBeenCalledWith('oldPass123', 'hashedOldPass');
      expect(hashingService.compare).toHaveBeenCalledWith('NewPass123', 'hashedOldPass');
      expect(hashingService.hash).toHaveBeenCalledWith('NewPass123');
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { password: 'hashedNewPass' },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw if old password is incorrect', async () => {
      const input: ChangeUserPasswordInput = {
        oldPassword: 'wrongPass',
        newPassword: 'NewPass123',
      };
      const existingUser = { id: '1', email: 'test@example.com', password: 'hashedOldPass' };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockHashingService.compare.mockResolvedValue(false);

      await expect(service.changePassword('1', input)).rejects.toThrow('Old password is incorrect');
    });

    it('should throw if new password matches old', async () => {
      const input: ChangeUserPasswordInput = {
        oldPassword: 'oldPass123',
        newPassword: 'oldPass123',
      };
      const existingUser = { id: '1', email: 'test@example.com', password: 'hashedOldPass' };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockHashingService.compare.mockResolvedValue(true);

      await expect(service.changePassword('1', input)).rejects.toThrow(
        'New password must be different from old password',
      );
    });
  });
  describe('remove', () => {
    it('should delete a user', async () => {
      const id = '1';
      const user = { id, email: 'test@example.com' };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.user.delete.mockResolvedValue(user);

      const result = await service.remove(id);

      expect(prismaService.user.delete).toHaveBeenCalledWith({ where: { id } });
      expect(result).toEqual(user);
    });

    it('should throw if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('archiveUser', () => {
    it('should archive a user', async () => {
      const id = '1';
      const user = { id, email: 'test@example.com', isActive: true };
      const archivedUser = { ...user, isActive: false };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.user.update.mockResolvedValue(archivedUser);

      const result = await service.archiveUser(id);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id },
        data: { isActive: false },
      });
      expect(result).toEqual(archivedUser);
    });
  });
  describe('deArchiveUser', () => {
    it('should de archive  a user', async () => {
      const id = '1';
      const user = { id, email: 'test@example.com', isActive: false };
      const deArchivedUser = { ...user, isActive: true };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.user.update.mockResolvedValue(deArchivedUser);

      const result = await service.deArchiveUser(id);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id },
        data: { isActive: true },
      });
      expect(result).toEqual(deArchivedUser);
    });
  });
});
