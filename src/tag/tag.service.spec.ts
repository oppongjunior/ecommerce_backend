import { Test, TestingModule } from '@nestjs/testing';
import { TagService } from './tag.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Tag } from '@prisma/client';

describe('TagService', () => {
  let service: TagService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    tag: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const fixedDate = new Date('2025-03-18T00:00:00.000Z');
  const mockTag: Tag = {
    id: 'tag1',
    name: 'Summer',
    createdAt: fixedDate,
    updatedAt: fixedDate,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TagService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<TagService>(TagService);
    prismaService = module.get<PrismaService>(PrismaService);
    jest.resetAllMocks();
  });

  describe('createTag', () => {
    it('should create a tag successfully', async () => {
      mockPrismaService.tag.findUnique.mockResolvedValue(null); // No existing tag
      mockPrismaService.tag.create.mockResolvedValue(mockTag);

      const result = await service.createTag('Summer');

      expect(prismaService.tag.findUnique).toHaveBeenCalledWith({
        where: { name: 'Summer' },
      });
      expect(prismaService.tag.create).toHaveBeenCalledWith({
        data: { name: 'Summer' },
      });
      expect(result).toEqual(mockTag);
    });

    it('should throw BadRequestException if tag name already exists', async () => {
      mockPrismaService.tag.findUnique.mockResolvedValue(mockTag);

      await expect(service.createTag('Summer')).rejects.toThrow(
        new BadRequestException(`Tag name "Summer" is already in use`),
      );
      expect(prismaService.tag.create).not.toHaveBeenCalled();
    });
  });

  describe('getTag', () => {
    it('should retrieve a tag by ID', async () => {
      mockPrismaService.tag.findUnique.mockResolvedValue(mockTag);

      const result = await service.getTag('tag1');

      expect(prismaService.tag.findUnique).toHaveBeenCalledWith({
        where: { id: 'tag1' },
      });
      expect(result).toEqual(mockTag);
    });

    it('should throw NotFoundException if tag doesn’t exist', async () => {
      mockPrismaService.tag.findUnique.mockResolvedValue(null);

      await expect(service.getTag('tag1')).rejects.toThrow(new NotFoundException(`Tag "tag1" not found`));
    });
  });

  describe('getAllTags', () => {
    it('should retrieve all tags', async () => {
      mockPrismaService.tag.findMany.mockResolvedValue([mockTag]);

      const result = await service.getAllTags();

      expect(prismaService.tag.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual([mockTag]);
    });

    it('should return an empty array if no tags exist', async () => {
      mockPrismaService.tag.findMany.mockResolvedValue([]);

      const result = await service.getAllTags();

      expect(result).toEqual([]);
    });
  });

  describe('updateTag', () => {
    it('should update a tag successfully', async () => {
      const updatedTag = { ...mockTag, name: 'Winter' };
      mockPrismaService.tag.findUnique
        .mockResolvedValueOnce(mockTag) // For retrieveTag
        .mockResolvedValueOnce(null); // For ensureTagNameUnique
      mockPrismaService.tag.update.mockResolvedValue(updatedTag);

      const result = await service.updateTag('tag1', 'Winter');

      expect(prismaService.tag.findUnique).toHaveBeenCalledWith({
        where: { id: 'tag1' },
      });
      expect(prismaService.tag.findUnique).toHaveBeenCalledWith({
        where: { name: 'Winter' },
      });
      expect(prismaService.tag.update).toHaveBeenCalledWith({
        where: { id: 'tag1' },
        data: { name: 'Winter' },
      });
      expect(result).toEqual(updatedTag);
    });

    it('should throw NotFoundException if tag doesn’t exist', async () => {
      mockPrismaService.tag.findUnique.mockResolvedValue(null);

      await expect(service.updateTag('tag1', 'Winter')).rejects.toThrow(new NotFoundException(`Tag "tag1" not found`));
      expect(prismaService.tag.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if new name is already in use', async () => {
      mockPrismaService.tag.findUnique
        .mockResolvedValueOnce(mockTag) // For retrieveTag
        .mockResolvedValueOnce({ id: 'tag2', name: 'Winter' }); // For ensureTagNameUnique

      await expect(service.updateTag('tag1', 'Winter')).rejects.toThrow(
        new BadRequestException(`Tag name "Winter" is already in use`),
      );
      expect(prismaService.tag.update).not.toHaveBeenCalled();
    });

    it('should allow updating to the same name', async () => {
      const updatedTag = { ...mockTag, name: 'Summer' };
      mockPrismaService.tag.findUnique
        .mockResolvedValueOnce(mockTag) // For retrieveTag
        .mockResolvedValueOnce(mockTag); // For ensureTagNameUnique (same tag)
      mockPrismaService.tag.update.mockResolvedValue(updatedTag);

      const result = await service.updateTag('tag1', 'Summer');

      expect(prismaService.tag.update).toHaveBeenCalledWith({
        where: { id: 'tag1' },
        data: { name: 'Summer' },
      });
      expect(result).toEqual(updatedTag);
    });
  });

  describe('deleteTag', () => {
    it('should delete a tag successfully', async () => {
      mockPrismaService.tag.findUnique.mockResolvedValue(mockTag);
      mockPrismaService.tag.delete.mockResolvedValue(mockTag);

      const result = await service.deleteTag('tag1');

      expect(prismaService.tag.findUnique).toHaveBeenCalledWith({
        where: { id: 'tag1' },
      });
      expect(prismaService.tag.delete).toHaveBeenCalledWith({
        where: { id: 'tag1' },
      });
      expect(result).toEqual(mockTag);
    });

    it('should throw NotFoundException if tag doesn’t exist', async () => {
      mockPrismaService.tag.findUnique.mockResolvedValue(null);

      await expect(service.deleteTag('tag1')).rejects.toThrow(new NotFoundException(`Tag "tag1" not found`));
      expect(prismaService.tag.delete).not.toHaveBeenCalled();
    });
  });
});
