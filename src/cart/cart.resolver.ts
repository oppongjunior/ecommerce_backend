import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CartService } from './cart.service';
import { AddToCartInput } from './dto/add-to-cart.input';
import { UpdateCartItemInput } from './dto/update-cart.input';
import { Auth } from '../iam/authentication/decorators/auth.decorator';
import { AuthType } from '../iam/authentication/enums/auth-type.enum';
import { Roles } from '../iam/authentication/decorators/roles.decorator';

import { ActiveUser } from '../iam/authentication/decorators/active-user.decorator';
import { Role } from '../users/enums/role.enum';
import { Cart } from './entities/cart.entity';

@Auth(AuthType.Bearer)
@Roles(Role.USER)
@Resolver('Cart')
export class CartResolver {
  constructor(private readonly cartService: CartService) {}

  @Query(() => Cart, { nullable: true, description: 'Retrieves the current user’s cart' })
  async cart(@ActiveUser('id') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Mutation(() => Cart, { description: 'Adds a product to the user’s cart' })
  async addToCart(@ActiveUser('id') userId: string, @Args('input') input: AddToCartInput) {
    return this.cartService.addToCart(userId, input);
  }

  @Mutation(() => Cart, { description: 'Updates the quantity of an item in the user’s cart' })
  async updateCartItem(@ActiveUser('id') userId: string, @Args('input') input: UpdateCartItemInput) {
    return this.cartService.updateCartItem(userId, input);
  }

  @Mutation(() => Cart, { description: 'Removes a specific item from the user’s cart' })
  async removeFromCart(@ActiveUser('id') userId: string, @Args('cartItemId') cartItemId: string) {
    return this.cartService.removeFromCart(userId, cartItemId);
  }

  @Mutation(() => Cart, { description: 'Clears all items from the user’s cart' })
  async clearCart(@ActiveUser('id') userId: string) {
    return this.cartService.clearCart(userId);
  }
}
