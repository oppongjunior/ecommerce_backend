import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from './review.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Review } from '@prisma/client';
import { CreateReviewInput } from './dto/create-review.input';
import { UpdateReviewInput } from './dto/update-review.input';

describe('ReviewService', () => {
  let service: ReviewService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    review: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
  };

  const mockUserId = 'user1';
  const mockProductId = 'prod1';
  const mockReviewId = 'rev1';
  const mockReview: Review & { user: { id: string; email: string }; product: { id: string; name: string } } = {
    id: mockReviewId,
    userId: mockUserId,
    productId: mockProductId,
    score: 5,
    comment: 'Great product!',
    user: { id: mockUserId, email: 'user1@example.com' },
    product: { id: mockProductId, name: 'T-Shirt' },
  };
  const mockProduct = { id: mockProductId, name: 'T-Shirt' };
  const createReviewInput: CreateReviewInput = {
    productId: mockProductId,
    score: 5,
    comment: 'Great product!',
  };
  const updateReviewInput: UpdateReviewInput = {
    id: mockReviewId,
    score: 4,
    comment: 'Updated review',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReviewService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
    prismaService = module.get<PrismaService>(PrismaService);
    jest.resetAllMocks();
  });

  describe('createReview', () => {
    it('should create a review successfully', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.review.findFirst.mockResolvedValue(null);
      mockPrismaService.review.create.mockResolvedValue(mockReview);

      const result = await service.createReview(mockUserId, createReviewInput);

      expect(prismaService.product.findUnique).toHaveBeenCalledWith({ where: { id: mockProductId } });
      expect(prismaService.review.findFirst).toHaveBeenCalledWith({
        where: { userId: mockUserId, productId: mockProductId },
      });
      expect(prismaService.review.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          productId: mockProductId,
          score: createReviewInput.score,
          comment: createReviewInput.comment,
        },
        include: {
          user: { select: { id: true, email: true } },
          product: { select: { id: true, name: true } },
        },
      });
      expect(result).toEqual(mockReview);
    });

    it('should throw NotFoundException if product doesn’t exist', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.createReview(mockUserId, createReviewInput)).rejects.toThrow(
        new NotFoundException(`Product "${mockProductId}" not found`),
      );
      expect(prismaService.review.findFirst).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if user already reviewed product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.review.findFirst.mockResolvedValue(mockReview);

      await expect(service.createReview(mockUserId, createReviewInput)).rejects.toThrow(
        new BadRequestException(`You have already reviewed product "${mockProductId}"`),
      );
      expect(prismaService.review.create).not.toHaveBeenCalled();
    });
  });

  describe('getReview', () => {
    it('should retrieve a review by ID', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(mockReview);

      const result = await service.getReview(mockReviewId);

      expect(prismaService.review.findUnique).toHaveBeenCalledWith({
        where: { id: mockReviewId },
        include: {
          user: { select: { id: true, email: true } },
          product: { select: { id: true, name: true } },
        },
      });
      expect(result).toEqual(mockReview);
    });

    it('should throw NotFoundException if review doesn’t exist', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(null);

      await expect(service.getReview(mockReviewId)).rejects.toThrow(
        new NotFoundException(`Review "${mockReviewId}" not found`),
      );
    });
  });

  describe('getProductReviews', () => {
    it('should retrieve all reviews for a product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.review.findMany.mockResolvedValue([mockReview]);

      const result = await service.getProductReviews(mockProductId);

      expect(prismaService.product.findUnique).toHaveBeenCalledWith({ where: { id: mockProductId } });
      expect(prismaService.review.findMany).toHaveBeenCalledWith({
        where: { productId: mockProductId },
        include: { user: { select: { id: true, email: true } } },
        orderBy: { id: 'asc' },
      });
      expect(result).toEqual([mockReview]);
    });

    it('should throw NotFoundException if product doesn’t exist', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.getProductReviews(mockProductId)).rejects.toThrow(
        new NotFoundException(`Product "${mockProductId}" not found`),
      );
      expect(prismaService.review.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getUserReviews', () => {
    it('should retrieve all reviews by a user', async () => {
      mockPrismaService.review.findMany.mockResolvedValue([mockReview]);

      const result = await service.getUserReviews(mockUserId);

      expect(prismaService.review.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        include: { product: { select: { id: true, name: true } } },
        orderBy: { id: 'asc' },
      });
      expect(result).toEqual([mockReview]);
    });

    it('should return empty array if no reviews exist', async () => {
      mockPrismaService.review.findMany.mockResolvedValue([]);

      const result = await service.getUserReviews(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('updateReview', () => {
    it('should update a review successfully', async () => {
      const updatedReview = { ...mockReview, score: 4, comment: 'Updated review' };
      mockPrismaService.review.findUnique.mockResolvedValue(mockReview);
      mockPrismaService.review.update.mockResolvedValue(updatedReview);

      const result = await service.updateReview(mockUserId, updateReviewInput);

      expect(prismaService.review.findUnique).toHaveBeenCalledWith({
        where: { id: mockReviewId },
        include: { user: { select: { id: true, email: true } }, product: { select: { id: true, name: true } } },
      });
      expect(prismaService.review.update).toHaveBeenCalledWith({
        where: { id: mockReviewId },
        data: { score: updateReviewInput.score, comment: updateReviewInput.comment },
        include: { user: { select: { id: true, email: true } }, product: { select: { id: true, name: true } } },
      });
      expect(result).toEqual(updatedReview);
    });

    it('should throw NotFoundException if review doesn’t exist', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(null);

      await expect(service.updateReview(mockUserId, updateReviewInput)).rejects.toThrow(
        new NotFoundException(`Review "${mockReviewId}" not found`),
      );
      expect(prismaService.review.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if user doesn’t own review', async () => {
      const reviewByOtherUser = { ...mockReview, userId: 'user2' };
      mockPrismaService.review.findUnique.mockResolvedValue(reviewByOtherUser);

      await expect(service.updateReview(mockUserId, updateReviewInput)).rejects.toThrow(
        new BadRequestException(`You can only modify your own reviews`),
      );
      expect(prismaService.review.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteReview', () => {
    it('should delete a review successfully', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(mockReview);
      mockPrismaService.review.delete.mockResolvedValue(mockReview);

      const result = await service.deleteReview(mockUserId, mockReviewId);

      expect(prismaService.review.findUnique).toHaveBeenCalledWith({
        where: { id: mockReviewId },
        include: { user: { select: { id: true, email: true } }, product: { select: { id: true, name: true } } },
      });
      expect(prismaService.review.delete).toHaveBeenCalledWith({ where: { id: mockReviewId } });
      expect(result).toEqual(mockReview);
    });

    it('should throw NotFoundException if review doesn’t exist', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(null);

      await expect(service.deleteReview(mockUserId, mockReviewId)).rejects.toThrow(
        new NotFoundException(`Review "${mockReviewId}" not found`),
      );
      expect(prismaService.review.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if user doesn’t own review', async () => {
      const reviewByOtherUser = { ...mockReview, userId: 'user2' };
      mockPrismaService.review.findUnique.mockResolvedValue(reviewByOtherUser);

      await expect(service.deleteReview(mockUserId, mockReviewId)).rejects.toThrow(
        new BadRequestException(`You can only modify your own reviews`),
      );
      expect(prismaService.review.delete).not.toHaveBeenCalled();
    });
  });
});
