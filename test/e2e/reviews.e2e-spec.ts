import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  clearDatabase,
  createAdmin,
  createCategory,
  createProducts,
  createSuperAdmin,
  createTestApp,
  createUser,
  getAdminToken,
  getSuperAdminToken,
  getUserToken,
  graphqlRequest,
} from '../e2e.utils';

// GraphQL queries and mutations
const GET_REVIEW = `
  query GetReview($reviewId: String!) {
    review(reviewId: $reviewId) {
      id
      score
      comment
      productId
      userId
    }
  }
`;

const GET_PRODUCT_REVIEWS = `
  query GetProductReviews($productId: String!) {
    productReviews(productId: $productId) {
      id
      score
      comment
      productId
      userId
    }
  }
`;

const GET_USER_REVIEWS = `
  query GetUserReviews {
    userReviews {
      id
      score
      comment
      productId
      userId
    }
  }
`;

const CREATE_REVIEW = `
  mutation CreateReview($input: CreateReviewInput!) {
    createReview(input: $input) {
      id
      score
      comment
      productId
      userId
    }
  }
`;

const UPDATE_REVIEW = `
  mutation UpdateReview($input: UpdateReviewInput!) {
    updateReview(input: $input) {
      id
      score
      comment
      productId
      userId
    }
  }
`;

const DELETE_REVIEW = `
  mutation DeleteReview($reviewId: String!) {
    deleteReview(reviewId: $reviewId) {
      id
      score
      comment
      productId
      userId
    }
  }
`;

describe('Review E2E Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userToken: string;
  let userId: string;
  let adminToken: string;
  let superAdminToken: string;
  let product1Id: string;
  let product2Id: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;

    await app.init();
    await clearDatabase(prisma);

    const user = await createUser(prisma);
    userId = user.id;
    userToken = await getUserToken(app);

    await createAdmin(prisma);
    adminToken = await getAdminToken(app);

    await createSuperAdmin(prisma);
    superAdminToken = await getSuperAdminToken(app);

    const category = await createCategory(prisma);
    await createProducts(prisma, category.id); // Assuming this creates products with IDs 'prod1' and 'prod2'
    const product1 = await prisma.product.findUnique({ where: { id: 'prod1' } });
    product1Id = product1.id;
    const product2 = await prisma.product.findUnique({ where: { id: 'prod2' } });
    product2Id = product2.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User Review Actions', () => {
    it('should retrieve an empty list of user reviews for a new user', async () => {
      const response = await graphqlRequest(app, GET_USER_REVIEWS)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.userReviews).toBeInstanceOf(Array);
      expect(response.body.data.userReviews).toHaveLength(0);

      // Verify in database
      const reviewsInDb = await prisma.review.findMany({
        where: { userId },
      });
      expect(reviewsInDb).toHaveLength(0);
    });

    it('should create a review for a product', async () => {
      const createReviewInput = {
        productId: product1Id,
        score: 4,
        comment: 'Great product!',
      };

      const response = await graphqlRequest(app, CREATE_REVIEW, { input: createReviewInput })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.createReview).toBeDefined();
      expect(response.body.data.createReview).toMatchObject({
        userId,
        productId: product1Id,
        score: 4,
        comment: 'Great product!',
      });
      expect(response.body.data.createReview.id).toBeDefined();

      // Verify in database
      const reviewInDb = await prisma.review.findUnique({
        where: { id: response.body.data.createReview.id },
      });
      expect(reviewInDb).toMatchObject({
        userId,
        productId: product1Id,
        score: 4,
        comment: 'Great product!',
      });
    });

    it('should retrieve all reviews for a product', async () => {
      await prisma.review.create({
        data: {
          userId,
          productId: product1Id,
          score: 5,
          comment: 'Excellent quality!',
        },
      });

      const response = await graphqlRequest(app, GET_PRODUCT_REVIEWS, { productId: product1Id })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.productReviews).toBeInstanceOf(Array);
      expect(response.body.data.productReviews.length).toBeGreaterThan(0);
      expect(response.body.data.productReviews).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            userId,
            productId: product1Id,
            score: 5,
            comment: 'Excellent quality!',
          }),
        ]),
      );
    });

    it('should retrieve a specific review by ID', async () => {
      const review = await prisma.review.create({
        data: {
          userId,
          productId: product1Id,
          score: 3,
          comment: 'Average product.',
        },
      });

      const response = await graphqlRequest(app, GET_REVIEW, { reviewId: review.id })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.review).toMatchObject({
        id: review.id,
        userId,
        productId: product1Id,
        score: 3,
        comment: 'Average product.',
      });
    });

    it('should update a user’s review', async () => {
      const review = await prisma.review.create({
        data: {
          userId,
          productId: product1Id,
          score: 2,
          comment: 'Not satisfied.',
        },
      });

      const updateReviewInput = {
        id: review.id,
        score: 3,
        comment: 'Better than expected after reconsideration.',
      };

      const response = await graphqlRequest(app, UPDATE_REVIEW, { input: updateReviewInput })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.updateReview).toMatchObject({
        id: review.id,
        userId,
        productId: product1Id,
        score: 3,
        comment: 'Better than expected after reconsideration.',
      });

      // Verify in database
      const reviewInDb = await prisma.review.findUnique({
        where: { id: review.id },
      });
      expect(reviewInDb).toMatchObject({
        score: 3,
        comment: 'Better than expected after reconsideration.',
      });
    });

    it('should delete a user’s review', async () => {
      const review = await prisma.review.create({
        data: {
          userId,
          productId: product1Id,
          score: 1,
          comment: 'Poor quality.',
        },
      });

      const response = await graphqlRequest(app, DELETE_REVIEW, { reviewId: review.id })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.deleteReview).toMatchObject({
        id: review.id,
        userId,
        productId: product1Id,
        score: 1,
        comment: 'Poor quality.',
      });

      // Verify in database
      const reviewInDb = await prisma.review.findUnique({
        where: { id: review.id },
      });
      expect(reviewInDb).toBeNull();
    });

    it('should not allow creating a review with an invalid product ID', async () => {
      const createReviewInput = {
        productId: 'invalid-product-id',
        score: 4,
        comment: 'Invalid product review.',
      };

      const response = await graphqlRequest(app, CREATE_REVIEW, { input: createReviewInput })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('not found');

      // Verify in database
      const reviewInDb = await prisma.review.findFirst({
        where: { productId: 'invalid-product-id' },
      });
      expect(reviewInDb).toBeNull();
    });

    it('should not allow updating another user’s review', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'otheruser@example.com',
          password: 'hashedpassword',
          role: 'USER',
        },
      });

      const review = await prisma.review.create({
        data: {
          userId: otherUser.id,
          productId: product1Id,
          score: 4,
          comment: 'Other user’s review.',
        },
      });

      const updateReviewInput = {
        id: review.id,
        score: 5,
        comment: 'Attempt to update.',
      };

      const response = await graphqlRequest(app, UPDATE_REVIEW, { input: updateReviewInput })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('You can only modify your own reviews');

      // Verify in database
      const reviewInDb = await prisma.review.findUnique({
        where: { id: review.id },
      });
      expect(reviewInDb.score).toBe(4);
      expect(reviewInDb.comment).toBe('Other user’s review.');
    });
  });

  describe('Admin Review Actions', () => {
    it('should retrieve a specific review by ID', async () => {
      const review = await prisma.review.create({
        data: {
          userId,
          productId: product2Id,
          score: 4,
          comment: 'Admin-accessed review.',
        },
      });

      const response = await graphqlRequest(app, GET_REVIEW, { reviewId: review.id })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.review).toMatchObject({
        id: review.id,
        userId,
        productId: product2Id,
        score: 4,
        comment: 'Admin-accessed review.',
      });
    });

    it('should retrieve all reviews for a product', async () => {
      await prisma.review.create({
        data: {
          userId,
          productId: product2Id,
          score: 5,
          comment: 'Another review for product 2.',
        },
      });

      const response = await graphqlRequest(app, GET_PRODUCT_REVIEWS, { productId: product2Id })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.productReviews).toBeInstanceOf(Array);
      expect(response.body.data.productReviews.length).toBeGreaterThan(0);
      expect(response.body.data.productReviews).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            userId,
            productId: product2Id,
            score: 5,
            comment: 'Another review for product 2.',
          }),
        ]),
      );
    });

    it('should not allow creating a review', async () => {
      const createReviewInput = {
        productId: product1Id,
        score: 4,
        comment: 'Admin review attempt.',
      };

      const response = await graphqlRequest(app, CREATE_REVIEW, { input: createReviewInput })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');

      // Verify in database
      const reviewInDb = await prisma.review.findFirst({
        where: { comment: 'Admin review attempt.' },
      });
      expect(reviewInDb).toBeNull();
    });

    it('should not allow updating a review', async () => {
      const review = await prisma.review.create({
        data: {
          userId,
          productId: product1Id,
          score: 2,
          comment: 'User review.',
        },
      });

      const updateReviewInput = {
        id: review.id,
        score: 3,
        comment: 'Admin update attempt.',
      };

      const response = await graphqlRequest(app, UPDATE_REVIEW, { input: updateReviewInput })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');

      // Verify in database
      const reviewInDb = await prisma.review.findUnique({
        where: { id: review.id },
      });
      expect(reviewInDb.score).toBe(2);
      expect(reviewInDb.comment).toBe('User review.');
    });

    it('should not allow deleting a review', async () => {
      const review = await prisma.review.create({
        data: {
          userId,
          productId: product1Id,
          score: 1,
          comment: 'User review for deletion.',
        },
      });

      const response = await graphqlRequest(app, DELETE_REVIEW, { reviewId: review.id })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.deleteReview).toBeDefined();

      // Verify in database
      const reviewInDb = await prisma.review.findUnique({
        where: { id: review.id },
      });
      expect(reviewInDb).toBeNull();
    });
  });

  describe('Super Admin Review Actions', () => {
    it('should retrieve a specific review by ID', async () => {
      const review = await prisma.review.create({
        data: {
          userId,
          productId: product2Id,
          score: 3,
          comment: 'Super admin-accessed review.',
        },
      });

      const response = await graphqlRequest(app, GET_REVIEW, { reviewId: review.id })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.review).toMatchObject({
        id: review.id,
        userId,
        productId: product2Id,
        score: 3,
        comment: 'Super admin-accessed review.',
      });
    });

    it('should retrieve all reviews for a product', async () => {
      await prisma.review.create({
        data: {
          userId,
          productId: product2Id,
          score: 4,
          comment: 'Another review for product 2 by super admin.',
        },
      });

      const response = await graphqlRequest(app, GET_PRODUCT_REVIEWS, { productId: product2Id })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.productReviews).toBeInstanceOf(Array);
      expect(response.body.data.productReviews.length).toBeGreaterThan(0);
      expect(response.body.data.productReviews).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            userId,
            productId: product2Id,
            score: 4,
            comment: 'Another review for product 2 by super admin.',
          }),
        ]),
      );
    });

    it('should not allow creating a review', async () => {
      const createReviewInput = {
        productId: product1Id,
        score: 4,
        comment: 'Super admin review attempt.',
      };

      const response = await graphqlRequest(app, CREATE_REVIEW, { input: createReviewInput })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');

      // Verify in database
      const reviewInDb = await prisma.review.findFirst({
        where: { comment: 'Super admin review attempt.' },
      });
      expect(reviewInDb).toBeNull();
    });

    it('should not allow updating a review', async () => {
      const review = await prisma.review.create({
        data: {
          userId,
          productId: product1Id,
          score: 2,
          comment: 'User review.',
        },
      });

      const updateReviewInput = {
        id: review.id,
        score: 3,
        comment: 'Super admin update attempt.',
      };

      const response = await graphqlRequest(app, UPDATE_REVIEW, { input: updateReviewInput })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');

      // Verify in database
      const reviewInDb = await prisma.review.findUnique({
        where: { id: review.id },
      });
      expect(reviewInDb.score).toBe(2);
      expect(reviewInDb.comment).toBe('User review.');
    });

    it('should not allow deleting a review', async () => {
      const review = await prisma.review.create({
        data: {
          userId,
          productId: product1Id,
          score: 1,
          comment: 'User review for super admin deletion.',
        },
      });

      const response = await graphqlRequest(app, DELETE_REVIEW, { reviewId: review.id })
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.deleteReview).toBeDefined();

      // Verify in database
      const reviewInDb = await prisma.review.findUnique({
        where: { id: review.id },
      });
      expect(reviewInDb).toBeNull();
    });
  });
});
