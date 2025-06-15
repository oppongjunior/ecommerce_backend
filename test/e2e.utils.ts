import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { genSalt, hash } from 'bcrypt';
import { Role, User } from '@prisma/client';

export async function createTestApp(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
}> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      AppModule,
      await ConfigModule.forRoot({
        envFilePath: '.env.test',
        isGlobal: true,
      }),
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  const prisma = moduleFixture.get<PrismaService>(PrismaService);

  await app.init();

  return { app, prisma };
}

export async function clearDatabase(prisma: PrismaService) {
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishList.deleteMany();
  await prisma.review.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.subCategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.address.deleteMany();
  await prisma.authProvider.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
}

export async function insertUserIntoDatabase(userData: User, prisma: PrismaService) {
  const salt = await genSalt();
  const hashPassword = await hash(userData.password, salt);
  return prisma.user.create({
    data: { ...userData, password: hashPassword },
  });
}

export function createSuperAdmin(prisma: PrismaService) {
  return insertUserIntoDatabase(
    {
      id: 'super_admin1',
      email: 'super_admin@example.com',
      password: 'SuperAdmin@123',
      name: 'Super Admin User',
      role: Role.SUPER_ADMIN,
    } as User,
    prisma,
  );
}

export function createAdmin(prisma: PrismaService) {
  return insertUserIntoDatabase(
    {
      id: 'admin1',
      email: 'admin@example.com',
      password: 'Admin@123',
      name: 'Admin User',
      role: Role.ADMIN,
    } as User,
    prisma,
  );
}

export function createUser(prisma: PrismaService) {
  return insertUserIntoDatabase(
    {
      id: 'user1',
      email: 'user@example.com',
      password: 'User@123',
      name: 'Regular User',
      role: Role.USER,
    } as User,
    prisma,
  );
}

export async function deleteUser(id: string, prisma: PrismaService) {
  await prisma.user.delete({ where: { id } });
}

export function graphqlRequest(app: INestApplication, query: string, variables?: any) {
  return request(app.getHttpServer()).post('/graphql').send({ query, variables }).set('Accept', 'application/json');
}

export async function getSuperAdminToken(app: INestApplication) {
  const signInMutation = `
        mutation {
          signIn(input: { email: "super_admin@example.com", password: "SuperAdmin@123" }) {
            accessToken
          }
        }
      `;
  const response = await graphqlRequest(app, signInMutation).expect(200);
  return response.body.data?.signIn?.accessToken;
}

export async function getAdminToken(app: INestApplication) {
  const signInMutation = `
        mutation {
          signIn(input: { email: "admin@example.com", password: "Admin@123" }) {
            accessToken
          }
        }
      `;
  const response = await graphqlRequest(app, signInMutation).expect(200);
  return response.body.data?.signIn?.accessToken;
}

export async function getUserToken(app: INestApplication) {
  const signInMutation = `
        mutation {
          signIn(input: { email: "user@example.com", password: "User@123" }) {
            accessToken
          }
        }
      `;
  const response = await graphqlRequest(app, signInMutation).expect(200);
  return response.body.data?.signIn?.accessToken;
}

export async function createCategory(prisma: PrismaService) {
  return prisma.category.create({
    data: {
      id: 'cat1',
      name: 'Electronics',
    },
  });
}

export async function createTag(prisma: PrismaService) {
  return prisma.tag.create({
    data: {
      id: 'tag1',
      name: 'Popular',
    },
  });
}

/**
 * Creates multiple product records in the database for the specified category.
 * the ids of the product created are prod1 and prod2
 * @param prisma - An instance of PrismaService used to interact with the database.
 * @param categoryId - The ID of the category to associate with the new products.
 * @returns A promise that resolves when the products have been created.
 */
export async function createProducts(prisma: PrismaService, categoryId: string) {
  await prisma.product.createMany({
    data: [
      {
        id: 'prod1',
        name: 'Laptop',
        price: 999.99,
        sku: 'LAP123',
        quantity: 50,
        images: ['laptop.jpg'],
        isActive: true,
        categoryId,
        createdAt: new Date('2025-01-01'),
      },
      {
        id: 'prod2',
        name: 'Phone',
        price: 499.99,
        sku: 'PHN123',
        quantity: 100,
        images: ['phone.jpg'],
        isActive: true,
        categoryId,
        createdAt: new Date('2025-01-02'),
      },
    ],
  });
}
