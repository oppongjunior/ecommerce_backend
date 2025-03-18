import { Test, TestingModule } from '@nestjs/testing';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserConnection } from './entities/user-connection.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UserPaginateArgs } from './dto/user-paginate.args';
import { Role } from '@prisma/client';
import { Reflector } from '@nestjs/core';
import { ChangeUserPasswordInput } from './dto/change-user-password.input';

const mockUsersService = {
  createUserByCredentials: jest.fn(),
  createUserByAuthProvider: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findUserByEmail: jest.fn(),
  findUserByProviderId: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  archiveUser: jest.fn(),
  deArchiveUser: jest.fn(),
  getUserProfile: jest.fn(),
  changePassword: jest.fn(),
};

const mockReflector = {
  get: jest.fn(),
};

describe('UsersResolver', () => {
  let resolver: UsersResolver;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersResolver,
        { provide: UsersService, useValue: mockUsersService },
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    resolver = module.get<UsersResolver>(UsersResolver);
    usersService = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user with credentials', async () => {
      const input: CreateUserInput = { email: 'test@example.com', password: 'password123' } as CreateUserInput;
      const createdUser: User = { id: '1', email: input.email, role: Role.USER, isActive: true } as User;

      mockUsersService.createUserByCredentials.mockResolvedValue(createdUser);

      const result = await resolver.createUser(input);

      expect(usersService.createUserByCredentials).toHaveBeenCalledWith(input);
      expect(result).toEqual(createdUser);
    });
  });

  describe('createUserByOAuth', () => {
    it('should create a user via OAuth', async () => {
      const provider = 'google';
      const providerId = 'google123';
      const email = 'test@example.com';
      const createdUser: User = { id: '1', email, role: Role.USER, isActive: true } as User;

      mockUsersService.createUserByAuthProvider.mockResolvedValue(createdUser);

      const result = await resolver.createUserByOAuth(provider, providerId, email);

      expect(usersService.createUserByAuthProvider).toHaveBeenCalledWith(providerId, provider, email);
      expect(result).toEqual(createdUser);
    });
  });

  describe('usersConnection', () => {
    it('should return a paginated list of users', async () => {
      const filter: UserPaginateArgs = { first: 2, name: 'John' };
      const userConnection: UserConnection = {
        edges: [
          { cursor: '1', node: { id: '1', email: 'john@example.com', role: Role.USER, isActive: true } as User },
          { cursor: '2', node: { id: '2', email: 'john2@example.com', role: Role.USER, isActive: true } as User },
        ],
        pageInfo: { pageSize: 2, hasPreviousPage: false, hasNextPage: true },
      };

      mockUsersService.findAll.mockResolvedValue(userConnection);

      const result = await resolver.usersConnection(filter);

      expect(usersService.findAll).toHaveBeenCalledWith(filter);
      expect(result).toEqual(userConnection);
    });
  });

  describe('findUserById', () => {
    it('should return a user by ID', async () => {
      const id = '1';
      const user: User = { id, email: 'test@example.com', role: Role.USER, isActive: true } as User;

      mockUsersService.findOne.mockResolvedValue(user);

      const result = await resolver.findUserById(id);

      expect(usersService.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(user);
    });
  });

  describe('findUserByEmail', () => {
    it('should return a user by email', async () => {
      const email = 'test@example.com';
      const user: User = { id: '1', email, role: Role.USER, isActive: true } as User;

      mockUsersService.findUserByEmail.mockResolvedValue(user);

      const result = await resolver.findUserByEmail(email);

      expect(usersService.findUserByEmail).toHaveBeenCalledWith(email);
      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      const email = 'nonexistent@example.com';

      mockUsersService.findUserByEmail.mockResolvedValue(null);

      const result = await resolver.findUserByEmail(email);

      expect(usersService.findUserByEmail).toHaveBeenCalledWith(email);
      expect(result).toBeNull();
    });
  });

  describe('findUserByProviderId', () => {
    it('should return a user by provider ID', async () => {
      const providerId = 'google123';
      const user: User = { id: '1', email: 'test@example.com', role: Role.USER, isActive: true } as User;

      mockUsersService.findUserByProviderId.mockResolvedValue(user);

      const result = await resolver.findUserByProviderId(providerId);

      expect(usersService.findUserByProviderId).toHaveBeenCalledWith(providerId);
      expect(result).toEqual(user);
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      const id = '1';
      const input: UpdateUserInput = { id, email: 'new@example.com' };
      const updatedUser: User = { id, email: 'new@example.com', role: Role.USER, isActive: true } as User;

      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await resolver.updateUser(id, input);

      expect(usersService.update).toHaveBeenCalledWith(id, input);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('removeUser', () => {
    it('should remove a user', async () => {
      const id = '1';
      const removedUser: User = { id, email: 'test@example.com', role: Role.USER, isActive: true } as User;

      mockUsersService.remove.mockResolvedValue(removedUser);

      const result = await resolver.removeUser(id);

      expect(usersService.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(removedUser);
    });
  });

  describe('archiveUser', () => {
    it('should archive a user', async () => {
      const id = '1';
      const archivedUser: User = { id, email: 'test@example.com', role: Role.USER, isActive: false } as User;

      mockUsersService.archiveUser.mockResolvedValue(archivedUser);

      const result = await resolver.archiveUser(id);

      expect(usersService.archiveUser).toHaveBeenCalledWith(id);
      expect(result).toEqual(archivedUser);
    });
  });

  describe('deArchiveUser', () => {
    it('should restore an archived user', async () => {
      const id = '1';
      const restoredUser: User = { id, email: 'test@example.com', role: Role.USER, isActive: true } as User;

      mockUsersService.deArchiveUser.mockResolvedValue(restoredUser);

      const result = await resolver.deArchiveUser(id);

      expect(usersService.deArchiveUser).toHaveBeenCalledWith(id);
      expect(result).toEqual(restoredUser);
    });
  });

  describe('userProfile', () => {
    it('should return the active user’s profile using the injected ID', async () => {
      const userId = '1';
      const profile: User = {
        id: userId,
        email: 'test@example.com',
        role: Role.USER,
        isActive: true,
        name: 'test',
        // addresses: [],
        // wishlist: [],

        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.getUserProfile.mockResolvedValue(profile);

      const result = await resolver.userProfile(userId);

      expect(usersService.getUserProfile).toHaveBeenCalledWith(userId);
      expect(result).toEqual(profile);
    });
  });
  describe('changePassword', () => {
    it('should change the password for the active user', async () => {
      const userId = '1';
      const input: ChangeUserPasswordInput = {
        oldPassword: 'oldPass123',
        newPassword: 'NewPass123',
      };
      const updatedUser: User = {
        id: userId,
        email: 'test@example.com',
        role: Role.USER,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;

      mockUsersService.changePassword.mockResolvedValue(updatedUser);

      const result = await resolver.changeUserPassword(userId, input);

      expect(usersService.changePassword).toHaveBeenCalledWith('1', input);
      expect(result).toEqual(updatedUser);
    });
  });
});
