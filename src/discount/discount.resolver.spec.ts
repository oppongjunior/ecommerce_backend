import { Test, TestingModule } from '@nestjs/testing';
import { DiscountResolver } from './discount.resolver';
import { DiscountService } from './discount.service';

describe('DiscountResolver', () => {
  let resolver: DiscountResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiscountResolver, DiscountService],
    }).compile();

    resolver = module.get<DiscountResolver>(DiscountResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
