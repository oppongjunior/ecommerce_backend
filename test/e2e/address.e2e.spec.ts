import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  clearDatabase,
  createAdmin,
  createSuperAdmin,
  createTestApp,
  createUser,
  getAdminToken,
  getSuperAdminToken,
  getUserToken,
  graphqlRequest,
} from '../e2e.utils';

// GraphQL queries and mutations
const GET_ADDRESS = `
  query GetAddress($addressId: String!) {
    address(addressId: $addressId) {
      id
      street
      city
      state
      zipCode
      country
      userId
      createdAt
      updatedAt
    }
  }
`;

const GET_USER_ADDRESSES = `
  query GetUserAddresses {
    userAddresses {
      id
      street
      city
      state
      zipCode
      country
      userId
      createdAt
      updatedAt
    }
  }
`;

const GET_ALL_ADDRESSES = `
  query GetAllAddresses {
    addresses {
      id
      street
      city
      state
      zipCode
      country
      userId
      createdAt
      updatedAt
    }
  }
`;

const CREATE_ADDRESS = `
  mutation CreateAddress($input: CreateAddressInput!) {
    createAddress(input: $input) {
      id
      street
      city
      state
      zipCode
      country
      userId
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_ADDRESS = `
  mutation UpdateAddress($addressId: String!, $input: UpdateAddressInput!) {
    updateAddress(addressId: $addressId, input: $input) {
      id
      street
      city
      state
      zipCode
      country
      userId
      createdAt
      updatedAt
    }
  }
`;

const DELETE_ADDRESS = `
  mutation DeleteAddress($addressId: String!) {
    deleteAddress(addressId: $addressId) {
      id
      street
      city
      state
      zipCode
      country
      userId
    }
  }
`;

describe('Address E2E Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;

    await app.init();
    await clearDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Super Admin Address Actions', () => {
    let superAdminToken: string;

    beforeAll(async () => {
      await createSuperAdmin(prisma);
      superAdminToken = await getSuperAdminToken(app);
    });

    it('should retrieve all addresses', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'user1@example.com',
          password: 'hashedpassword',
          role: 'USER',
        },
      });

      await prisma.address.create({
        data: {
          street: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
          country: 'USA',
          userId: user.id,
        },
      });

      const response = await graphqlRequest(app, GET_ALL_ADDRESSES)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.addresses).toBeInstanceOf(Array);
      expect(response.body.data.addresses.length).toBeGreaterThan(0);
      expect(response.body.data.addresses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            street: '123 Main St',
            city: 'Springfield',
            state: 'IL',
            zipCode: '62701',
            country: 'USA',
            userId: user.id,
          }),
        ]),
      );
    });

    it('should not allow creating an address', async () => {
      const addressInput = {
        street: '456 Oak St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62702',
        country: 'USA',
      };

      const response = await graphqlRequest(app, CREATE_ADDRESS, { input: addressInput })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');

      // Verify in database
      const addressInDb = await prisma.address.findFirst({
        where: { street: addressInput.street },
      });
      expect(addressInDb).toBeNull();
    });

    it('should not allow updating an address', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'user2@example.com',
          password: 'hashedpassword',
          role: 'USER',
        },
      });

      const address = await prisma.address.create({
        data: {
          street: '789 Pine St',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62703',
          country: 'USA',
          userId: user.id,
        },
      });

      const updateInput = {
        street: 'Updated Pine St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62704',
        country: 'USA',
      };

      const response = await graphqlRequest(app, UPDATE_ADDRESS, { addressId: address.id, input: updateInput })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');

      // Verify in database
      const addressInDb = await prisma.address.findUnique({
        where: { id: address.id },
      });
      expect(addressInDb.street).toBe('789 Pine St');
    });

    it('should not allow deleting an address', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'user3@example.com',
          password: 'hashedpassword',
          role: 'USER',
        },
      });

      const address = await prisma.address.create({
        data: {
          street: '101 Elm St',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62705',
          country: 'USA',
          userId: user.id,
        },
      });

      const response = await graphqlRequest(app, DELETE_ADDRESS, { addressId: address.id })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');

      // Verify in database
      const addressInDb = await prisma.address.findUnique({
        where: { id: address.id },
      });
      expect(addressInDb).not.toBeNull();
    });
  });

  describe('Admin Address Actions', () => {
    let adminToken: string;

    beforeAll(async () => {
      await createAdmin(prisma);
      adminToken = await getAdminToken(app);
    });

    it('should retrieve all addresses', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'user4@example.com',
          password: 'hashedpassword',
          role: 'USER',
        },
      });

      await prisma.address.create({
        data: {
          street: '202 Maple St',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62706',
          country: 'USA',
          userId: user.id,
        },
      });

      const response = await graphqlRequest(app, GET_ALL_ADDRESSES)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.addresses).toBeInstanceOf(Array);
      expect(response.body.data.addresses.length).toBeGreaterThan(0);
      expect(response.body.data.addresses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            street: '202 Maple St',
            city: 'Springfield',
            state: 'IL',
            zipCode: '62706',
            country: 'USA',
            userId: user.id,
          }),
        ]),
      );
    });

    it('should not allow creating an address', async () => {
      const addressInput = {
        street: '303 Cedar St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62707',
        country: 'USA',
      };

      const response = await graphqlRequest(app, CREATE_ADDRESS, { input: addressInput })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');

      // Verify in database
      const addressInDb = await prisma.address.findFirst({
        where: { street: addressInput.street },
      });
      expect(addressInDb).toBeNull();
    });

    it('should not allow updating an address', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'user5@example.com',
          password: 'hashedpassword',
          role: 'USER',
        },
      });

      const address = await prisma.address.create({
        data: {
          street: '404 Birch St',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62708',
          country: 'USA',
          userId: user.id,
        },
      });

      const updateInput = {
        street: 'Updated Birch St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62709',
        country: 'USA',
      };

      const response = await graphqlRequest(app, UPDATE_ADDRESS, { addressId: address.id, input: updateInput })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');

      // Verify in database
      const addressInDb = await prisma.address.findUnique({
        where: { id: address.id },
      });
      expect(addressInDb.street).toBe('404 Birch St');
    });

    it('should not allow deleting an address', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'user6@example.com',
          password: 'hashedpassword',
          role: 'USER',
        },
      });

      const address = await prisma.address.create({
        data: {
          street: '505 Walnut St',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62710',
          country: 'USA',
          userId: user.id,
        },
      });

      const response = await graphqlRequest(app, DELETE_ADDRESS, { addressId: address.id })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');

      // Verify in database
      const addressInDb = await prisma.address.findUnique({
        where: { id: address.id },
      });
      expect(addressInDb).not.toBeNull();
    });
  });

  describe('User Address Actions', () => {
    let userToken: string;
    let userId: string;

    beforeAll(async () => {
      const user = await createUser(prisma);
      userId = user.id;
      userToken = await getUserToken(app);
    });

    it('should create a new address', async () => {
      const addressInput = {
        street: '606 Spruce St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62711',
        country: 'USA',
      };

      const response = await graphqlRequest(app, CREATE_ADDRESS, { input: addressInput })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.createAddress).toBeDefined();
      expect(response.body.data.createAddress).toMatchObject({
        street: addressInput.street,
        city: addressInput.city,
        state: addressInput.state,
        zipCode: addressInput.zipCode,
        country: addressInput.country,
        userId,
      });
      expect(response.body.data.createAddress.id).toBeDefined();
      expect(response.body.data.createAddress.createdAt).toBeDefined();
      expect(response.body.data.createAddress.updatedAt).toBeDefined();

      // Verify in database
      const addressInDb = await prisma.address.findUnique({
        where: { id: response.body.data.createAddress.id },
      });
      expect(addressInDb).toMatchObject({ ...addressInput, userId });
    });

    it('should retrieve all user addresses', async () => {
      await prisma.address.create({
        data: {
          street: '707 Oak St',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62712',
          country: 'USA',
          userId,
        },
      });

      const response = await graphqlRequest(app, GET_USER_ADDRESSES)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.userAddresses).toBeInstanceOf(Array);
      expect(response.body.data.userAddresses.length).toBeGreaterThan(0);
      expect(response.body.data.userAddresses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            street: '707 Oak St',
            city: 'Springfield',
            state: 'IL',
            zipCode: '62712',
            country: 'USA',
            userId,
          }),
        ]),
      );
    });

    it('should retrieve an address by ID', async () => {
      const address = await prisma.address.create({
        data: {
          street: '808 Pine St',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62713',
          country: 'USA',
          userId,
        },
      });

      const response = await graphqlRequest(app, GET_ADDRESS, { addressId: address.id })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.address).toMatchObject({
        id: address.id,
        street: '808 Pine St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62713',
        country: 'USA',
        userId,
      });
    });

    it('should update an existing address', async () => {
      const address = await prisma.address.create({
        data: {
          street: '909 Elm St',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62714',
          country: 'USA',
          userId,
        },
      });

      const updateInput = {
        street: 'Updated Elm St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62715',
        country: 'USA',
      };

      const response = await graphqlRequest(app, UPDATE_ADDRESS, { addressId: address.id, input: updateInput })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.updateAddress).toMatchObject({
        id: address.id,
        street: updateInput.street,
        city: updateInput.city,
        state: updateInput.state,
        zipCode: updateInput.zipCode,
        country: updateInput.country,
        userId,
      });

      // Verify in database
      const updatedAddress = await prisma.address.findUnique({
        where: { id: address.id },
      });
      expect(updatedAddress).toMatchObject({ ...updateInput, userId });
    });

    it('should delete an address', async () => {
      const address = await prisma.address.create({
        data: {
          street: '1010 Maple St',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62716',
          country: 'USA',
          userId,
        },
      });

      const response = await graphqlRequest(app, DELETE_ADDRESS, { addressId: address.id })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.deleteAddress).toMatchObject({
        id: address.id,
        street: '1010 Maple St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62716',
        country: 'USA',
        userId,
      });

      // Verify in database
      const deletedAddress = await prisma.address.findUnique({
        where: { id: address.id },
      });
      expect(deletedAddress).toBeNull();
    });

    it('should not allow retrieving all addresses', async () => {
      const response = await graphqlRequest(app, GET_ALL_ADDRESSES)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');
    });

    it('should not allow retrieving another user’s address', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'otheruser@example.com',
          password: 'hashedpassword',
          role: 'USER',
        },
      });

      const address = await prisma.address.create({
        data: {
          street: '1111 Cedar St',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62717',
          country: 'USA',
          userId: otherUser.id,
        },
      });

      const response = await graphqlRequest(app, GET_ADDRESS, { addressId: address.id })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
    });
  });
});
