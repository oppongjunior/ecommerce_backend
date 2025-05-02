import { INestApplication } from '@nestjs/common';
import {
  clearDatabase,
  createAdmin,
  createSuperAdmin,
  createTestApp,
  createUser,
  graphqlRequest,
} from '../e2e.utils';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('User Management', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Super Admin', () => {
    let superAdminToken: string;

    beforeEach(async () => {
      await clearDatabase(prisma);
      await createSuperAdmin(prisma);
      await prisma.user.createMany({
        data: [
          {
            id: 'user2',
            email: 'user2@example.com',
            name: 'User 2',
            role: 'USER',
          },
          {
            id: 'user3',
            email: 'user3@example.com',
            name: 'User 3',
            role: 'USER',
          },
          {
            id: 'user5',
            email: 'user5@example.com',
            name: 'User 5',
            role: 'USER',
          },
        ],
      });

      const signInMutation = `
        mutation {
          signIn(input: { email: "super_admin@example.com", password: "SuperAdmin@123" }) {
            accessToken
          }
        }
      `;
      const response = await graphqlRequest(app, signInMutation).expect(200);
      superAdminToken = response.body.data.signIn.accessToken;
    });

    it('should create a user with credentials (super admin only)', async () => {
      const mutation = `
        mutation {
          createUser(createUserInput: {
            email: "newuser@example.com"
            password: "password123"
            name: "New User"
            phoneNumber: "1234567890"
          }) {
            id
            email
            name
            phoneNumber
            role
            isActive
          }
        }
      `;

      const response = await graphqlRequest(app, mutation)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.createUser).toMatchObject({
        email: 'newuser@example.com',
        name: 'New User',
        phoneNumber: '1234567890',
        role: 'USER',
        isActive: true,
      });
    });

    it('should fetch paginated users', async () => {
      const query = `
        query {
          users(filter: { first: 4, orderBy: "createdAt", orderInAsc: true }) {
            edges {
              node {
                email
              }
            }
            pageInfo {
              hasNextPage
              pageSize
            }
          }
        }
      `;

      const response = await graphqlRequest(app, query)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.users.edges.length).toBeGreaterThanOrEqual(3);
    });

    it('should fetch user by ID', async () => {
      const query = `
        query {
          userById(id: "user2") {
            id
            email
            name
            role
          }
        }
      `;

      const response = await graphqlRequest(app, query)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.userById).toMatchObject({
        id: 'user2',
        email: 'user2@example.com',
        name: 'User 2',
        role: 'USER',
      });
    });

    it('should change user password and allow login with new password', async () => {
      const changePasswordMutation = `
        mutation {
          changeUserPassword(input: {
            oldPassword: "SuperAdmin@123"
            newPassword: "newpassword123"
          }) {
            id
            email
          }
        }
      `;

      await graphqlRequest(app, changePasswordMutation)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      // Attempt login with new password
      const signInMutation = `
        mutation {
          signIn(input: { email: "super_admin@example.com", password: "newpassword123" }) {
            accessToken
          }
        }
      `;
      const loginResponse = await graphqlRequest(app, signInMutation).expect(
        200,
      );
      expect(loginResponse.body.data.signIn.accessToken).toBeDefined();
    });

    it('should archive and restore user', async () => {
      const archiveMutation = `
        mutation {
          archiveUser(id: "user2") {
            id
            isActive
          }
        }
      `;

      const archiveResponse = await graphqlRequest(app, archiveMutation)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(archiveResponse.body.data.archiveUser.isActive).toBe(false);

      const restoreMutation = `
        mutation {
          deArchiveUser(id: "user2") {
            id
            isActive
          }
        }
      `;

      const restoreResponse = await graphqlRequest(app, restoreMutation)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(restoreResponse.body.data.deArchiveUser.isActive).toBe(true);
    });

    it('should delete user', async () => {
      const mutation = `
        mutation {
          removeUser(id: "user2") {
            id
            email
          }
        }
      `;

      const response = await graphqlRequest(app, mutation)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.removeUser).toMatchObject({
        id: 'user2',
        email: 'user2@example.com',
      });

      const user = await prisma.user.findUnique({ where: { id: 'user2' } });
      expect(user).toBeNull();
    });

    it('should update user', async () => {
      const mutation = `
        mutation {
          updateUser(
            id: "user3",
            updateUserInput: {
              email: "user3updated@example.com"
              name: "new username"
              phoneNumber: "00000000"
            }
          ) {
            id
            email
            name
            phoneNumber
            role
            isActive
          }
        }
      `;

      const response = await graphqlRequest(app, mutation)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.updateUser).toMatchObject({
        email: 'user3updated@example.com',
        name: 'new username',
        phoneNumber: '00000000',
        role: 'USER',
        isActive: true,
      });
    });
  });
  describe('Admin', () => {
    let adminToken: string;

    beforeEach(async () => {
      await clearDatabase(prisma);
      await createAdmin(prisma);
      await createSuperAdmin(prisma);

      await prisma.user.createMany({
        data: [
          {
            id: 'user1',
            email: 'user1@example.com',
            name: 'Regular User',
            role: 'USER',
          },
        ],
      });

      const signInMutation = `
      mutation {
        signIn(input: { email: "admin@example.com", password: "Admin@123" }) {
          accessToken
        }
      }
    `;
      const response = await graphqlRequest(app, signInMutation).expect(200);
      adminToken = response.body.data.signIn.accessToken;
    });

    it('should fetch paginated users', async () => {
      const query = `
      query {
        users(filter: { first: 10 }) {
          edges {
            node {
              email
              role
            }
          }
        }
      }
    `;

      const response = await graphqlRequest(app, query)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.users.edges.length).toBeGreaterThanOrEqual(1);
    });

    it('should fetch user by ID', async () => {
      const query = `
      query {
        userById(id: "user1") {
          id
          email
          name
        }
      }
    `;

      const response = await graphqlRequest(app, query)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.userById).toMatchObject({
        id: 'user1',
        email: 'user1@example.com',
        name: 'Regular User',
      });
    });

    it('should archive and restore user', async () => {
      const archiveMutation = `
      mutation {
        archiveUser(id: "user1") {
          id
          isActive
        }
      }
    `;

      const archiveResponse = await graphqlRequest(app, archiveMutation)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(archiveResponse.body.data.archiveUser.isActive).toBe(false);

      const restoreMutation = `
      mutation {
        deArchiveUser(id: "user1") {
          id
          isActive
        }
      }
    `;

      const restoreResponse = await graphqlRequest(app, restoreMutation)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(restoreResponse.body.data.deArchiveUser.isActive).toBe(true);
    });

    it('should update user details', async () => {
      const mutation = `
      mutation {
        updateUser(
          id: "user1",
          updateUserInput: {
            name: "Updated User"
            phoneNumber: "9876543210"
          }
        ) {
          id
          name
          phoneNumber
        }
      }
    `;

      const response = await graphqlRequest(app, mutation)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.updateUser).toMatchObject({
        name: 'Updated User',
        phoneNumber: '9876543210',
      });
    });

    it('should change password', async () => {
      const mutation = `
      mutation {
        changeUserPassword(input: {
          oldPassword: "Admin@123"
          newPassword: "AdminNew123"
        }) {
          id
          email
        }
      }
    `;

      const response = await graphqlRequest(app, mutation)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.changeUserPassword.email).toBe(
        'admin@example.com',
      );

      // Try signing in with new password
      const signInMutation = `
      mutation {
        signIn(input: { email: "admin@example.com", password: "AdminNew123" }) {
          accessToken
        }
      }
    `;
      const loginResponse = await graphqlRequest(app, signInMutation).expect(
        200,
      );
      expect(loginResponse.body.data.signIn.accessToken).toBeDefined();
    });

    it('should NOT create a user (forbidden)', async () => {
      const mutation = `
      mutation {
        createUser(createUserInput: {
          email: "unauthorized@example.com"
          password: "pass123"
          name: "Not Allowed"
          phoneNumber: "000"
        }) {
          id
        }
      }
    `;

      const response = await graphqlRequest(app, mutation)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');
    });

    it('should NOT delete a user (forbidden)', async () => {
      const mutation = `
      mutation {
        removeUser(id: "user1") {
          id
        }
      }
    `;

      const response = await graphqlRequest(app, mutation)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');
    });
  });

  describe('User', () => {
    let userToken: string;

    beforeEach(async () => {
      await clearDatabase(prisma);
      await createUser(prisma);

      const signInMutation = `
      mutation {
        signIn(input: { email: "user@example.com", password: "User@123" }) {
          accessToken
        }
      }
    `;
      const response = await graphqlRequest(app, signInMutation).expect(200);
      userToken = response.body.data.signIn.accessToken;
    });

    it('should fetch their own profile', async () => {
      const query = `
      query {
        userProfile {
          id
          email
          name
          role
        }
      }
    `;

      const response = await graphqlRequest(app, query)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.userProfile).toMatchObject({
        email: 'user@example.com',
        name: 'Regular User',
        role: 'USER',
      });
    });

    it('should update their own profile', async () => {
      const mutation = `
      mutation {
        updateMyProfile(updateMyProfileInput: {
          name: "Updated User"
          phoneNumber: "0551234567"
        }) {
          id
          name
          phoneNumber
        }
      }
    `;

      const response = await graphqlRequest(app, mutation)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.updateMyProfile).toMatchObject({
        name: 'Updated User',
        phoneNumber: '0551234567',
      });
    });

    it('should change their password', async () => {
      const mutation = `
      mutation {
        changeUserPassword(input: {
          oldPassword: "User@123"
          newPassword: "UserNew123"
        }) {
          id
          email
        }
      }
    `;

      const response = await graphqlRequest(app, mutation)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.changeUserPassword.email).toBe(
        'user@example.com',
      );

      // Confirm new password works
      const loginTest = `
      mutation {
        signIn(input: { email: "user@example.com", password: "UserNew123" }) {
          accessToken
        }
      }
    `;

      const loginResponse = await graphqlRequest(app, loginTest).expect(200);
      expect(loginResponse.body.data.signIn.accessToken).toBeDefined();
    });

    it('should NOT fetch all users', async () => {
      const query = `
      query {
        users(filter: { first: 10 }) {
          edges {
            node {
              id
              email
            }
          }
        }
      }
    `;

      const response = await graphqlRequest(app, query)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');
    });

    it('should NOT archive another user', async () => {
      const mutation = `
      mutation {
        archiveUser(id: "some-id") {
          id
          isActive
        }
      }
    `;

      const response = await graphqlRequest(app, mutation)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');
    });

    it('should NOT update other users', async () => {
      const mutation = `
      mutation {
        updateUser(id: "some-id", updateUserInput: { name: "Hacker" }) {
          id
        }
      }
    `;

      const response = await graphqlRequest(app, mutation)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');
    });

    it('should NOT remove any user', async () => {
      const mutation = `
      mutation {
        removeUser(id: "some-id") {
          id
        }
      }
    `;

      const response = await graphqlRequest(app, mutation)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');
    });

    it('should NOT create a user', async () => {
      const mutation = `
      mutation {
        createUser(createUserInput: {
          email: "badguy@example.com"
          password: "password123"
          name: "Unauthorized"
        }) {
          id
        }
      }
    `;

      const response = await graphqlRequest(app, mutation)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');
    });
  });
});
