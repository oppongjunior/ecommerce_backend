import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DiscountService } from './discount.service';
import { Discount } from './entities/discount.entity';
import { CreateDiscountInput } from './dto/create-discount.input';
import { UpdateDiscountInput } from './dto/update-discount.input';

@Resolver(() => Discount)
export class DiscountResolver {
  constructor(private readonly discountService: DiscountService) {}

  @Mutation(() => Discount)
  createDiscount(@Args('createDiscountInput') createDiscountInput: CreateDiscountInput) {
    return this.discountService.createDiscount(createDiscountInput);
  }

  @Query(() => [Discount], { name: 'discount' })
  findAll() {
    return this.discountService.findAllDiscounts();
  }

  @Query(() => Discount, { name: 'discount' })
  findOne(@Args('id', { type: () => Int }) id: string) {
    return this.discountService.findOneDiscount(id);
  }

  @Mutation(() => Discount)
  updateDiscount(@Args('updateDiscountInput') updateDiscountInput: UpdateDiscountInput) {
    return this.discountService.updateDiscount(updateDiscountInput.id, updateDiscountInput);
  }

  @Mutation(() => Discount)
  removeDiscount(@Args('id', { type: () => Int }) id: string) {
    return this.discountService.deleteDiscount(id);
  }
}
