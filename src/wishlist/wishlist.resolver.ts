import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { WishlistService } from './wishlist.service';
import { Wishlist } from './entities/wishlist.entity';
import { ActiveUser } from '../iam/authentication/decorators/active-user.decorator';
import { Roles } from '../iam/authentication/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';

@Roles(Role.USER)
@Resolver(() => Wishlist)
export class WishlistResolver {
  constructor(private readonly wishlistService: WishlistService) {}

  @Query(() => Wishlist, {
    name: 'wishlist',
    description: 'Retrieves the user’s wishlist',
  })
  async getWishlist(@ActiveUser('id') userId: string) {
    return this.wishlistService.getOrCreateWishlist(userId);
  }

  @Mutation(() => Wishlist, {
    name: 'addToWishlist',
    description: 'Adds a product to the user’s wishlist',
  })
  async addToWishlist(
    @ActiveUser('id') userId: string,
    @Args('productId', { type: () => String }) productId: string,
  ) {
    return this.wishlistService.addToWishlist(userId, productId);
  }

  @Mutation(() => Wishlist, {
    name: 'removeFromWishlist',
    description: 'Removes a product from the user’s wishlist',
  })
  async removeFromWishlist(
    @ActiveUser('id') userId: string,
    @Args('productId', { type: () => String }) productId: string,
  ) {
    return this.wishlistService.removeFromWishlist(userId, productId);
  }

  @Mutation(() => Wishlist, {
    name: 'clearWishlist',
    description: 'Clears the user’s wishlist',
  })
  async clearWishlist(@ActiveUser('id') userId: string) {
    return this.wishlistService.clearWishlist(userId);
  }
}
