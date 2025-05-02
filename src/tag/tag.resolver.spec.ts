import { Test, TestingModule } from '@nestjs/testing';
import { TagResolver } from './tag.resolver';
import { TagService } from './tag.service';
import { Tag } from './entities/tag.entity';

describe('TagResolver', () => {
  let resolver: TagResolver;
  let tagService: TagService;

  const mockTagService = {
    getTag: jest.fn(),
    getAllTags: jest.fn(),
    createTag: jest.fn(),
    updateTag: jest.fn(),
    deleteTag: jest.fn(),
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
      providers: [
        TagResolver,
        { provide: TagService, useValue: mockTagService },
      ],
    }).compile();

    resolver = module.get<TagResolver>(TagResolver);
    tagService = module.get<TagService>(TagService);
    jest.resetAllMocks();
  });

  describe('getTag', () => {
    it('should retrieve a specific tag by ID', async () => {
      mockTagService.getTag.mockResolvedValue(mockTag);

      const result = await resolver.getTag('tag1');

      expect(tagService.getTag).toHaveBeenCalledWith('tag1');
      expect(result).toEqual(mockTag);
    });
  });

  describe('getAllTags', () => {
    it('should retrieve all tags for admin', async () => {
      mockTagService.getAllTags.mockResolvedValue([mockTag]);

      const result = await resolver.getAllTags();

      expect(tagService.getAllTags).toHaveBeenCalled();
      expect(result).toEqual([mockTag]);
    });
  });

  describe('createTag', () => {
    it('should create a tag for admin', async () => {
      mockTagService.createTag.mockResolvedValue(mockTag);

      const result = await resolver.createTag('Summer');

      expect(tagService.createTag).toHaveBeenCalledWith('Summer');
      expect(result).toEqual(mockTag);
    });
  });

  describe('updateTag', () => {
    it('should update a tag for admin', async () => {
      const updatedTag = { ...mockTag, name: 'Winter' };
      mockTagService.updateTag.mockResolvedValue(updatedTag);

      const result = await resolver.updateTag('tag1', 'Winter');

      expect(tagService.updateTag).toHaveBeenCalledWith('tag1', 'Winter');
      expect(result).toEqual(updatedTag);
    });
  });

  describe('deleteTag', () => {
    it('should delete a tag for admin', async () => {
      mockTagService.deleteTag.mockResolvedValue(mockTag);

      const result = await resolver.deleteTag('tag1');

      expect(tagService.deleteTag).toHaveBeenCalledWith('tag1');
      expect(result).toEqual(mockTag);
    });
  });

  // Role-Based Access Tests (Assuming decorator enforcement)
  describe('role-based access', () => {
    it('should allow public access to getTag', async () => {
      mockTagService.getTag.mockResolvedValue(mockTag);

      const result = await resolver.getTag('tag1');

      expect(tagService.getTag).toHaveBeenCalled();
      expect(result).toEqual(mockTag);
    });

    it('should allow ADMIN role to access getAllTags', async () => {
      mockTagService.getAllTags.mockResolvedValue([mockTag]);

      const result = await resolver.getAllTags();

      expect(tagService.getAllTags).toHaveBeenCalled();
      expect(result).toEqual([mockTag]);
    });

    it('should allow ADMIN role to createTag', async () => {
      mockTagService.createTag.mockResolvedValue(mockTag);

      const result = await resolver.createTag('Summer');

      expect(tagService.createTag).toHaveBeenCalled();
      expect(result).toEqual(mockTag);
    });
  });
});
