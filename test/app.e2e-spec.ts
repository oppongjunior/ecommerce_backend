import { INestApplication } from '@nestjs/common';
import { clearDatabase, createTestApp, graphqlRequest } from './e2e.utils';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  beforeEach(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await clearDatabase(prisma);
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
  });

  describe('User', () => {
    it('should sign up user', async () => {
      const mutation = `
      mutation SignUp($input: SignUpInput!) {
          signUp(input: $input) {
            accessToken
            refreshToken
          }
      }
      `;
      const variables = {
        input: {
          email: 'test2@gmail.com',
          name: 'test user 2',
          password: '12345678',
        },
      };

      const response = await graphqlRequest(app, mutation, variables).expect(
        200,
      );
      expect(response.body.data.signUp).toBeDefined();
      expect(response.body.data.signUp.accessToken).toBeDefined();
      expect(response.body.data.signUp.refreshToken).toBeDefined();
    });
  });
});
