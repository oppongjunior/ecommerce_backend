import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Order } from './entities/order.entity';
import { Roles } from '../iam/authentication/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { ActiveUser } from '../iam/authentication/decorators/active-user.decorator';
import { CreateOrderInput } from './dto/create-order.input';
import { UpdateOrderStatusInput } from './dto/update-order-status.input';
import { OrdersService } from './order.service';

@Resolver(() => Order)
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

  @Roles(Role.USER)
  @Query(() => Order, { name: 'order', description: 'Retrieves a specific order by ID for the current user' })
  async getOrder(@ActiveUser('id') userId: string, @Args('orderId', { type: () => String }) orderId: string) {
    return this.ordersService.getOrder(userId, orderId);
  }

  @Roles(Role.USER)
  @Query(() => [Order], { name: 'userOrders', description: 'Retrieves all orders for the current user' })
  async getUserOrders(@ActiveUser('id') userId: string) {
    return this.ordersService.getUserOrders(userId);
  }

  @Roles(Role.ADMIN)
  @Query(() => [Order], { name: 'orders', description: 'Retrieves all orders (admin only)' })
  async getOrders() {
    return this.ordersService.getOrders();
  }

  @Roles(Role.USER)
  @Mutation(() => Order, { name: 'createOrder', description: 'Creates an order from the user’s cart' })
  async createOrder(@ActiveUser('id') userId: string, @Args('input') input: CreateOrderInput) {
    return this.ordersService.createOrderFromCart(userId, input.shippingAddressId);
  }

  @Roles(Role.USER)
  @Mutation(() => Order, { name: 'updateOrderStatus', description: 'Updates the status of an order' })
  async updateOrderStatus(@ActiveUser('id') userId: string, @Args('input') input: UpdateOrderStatusInput) {
    return this.ordersService.updateOrderStatus(userId, input.orderId, input.status);
  }

  @Roles(Role.USER)
  @Mutation(() => Order, { name: 'cancelOrder', description: 'Cancels an order and restores stock' })
  async cancelOrder(@ActiveUser('id') userId: string, @Args('orderId', { type: () => String }) orderId: string) {
    return this.ordersService.cancelOrder(userId, orderId);
  }

  @Roles(Role.USER)
  @Mutation(() => Order, { name: 'markOrderAsPaid', description: 'Marks an order as paid' })
  async markOrderAsPaid(@ActiveUser('id') userId: string, @Args('orderId', { type: () => String }) orderId: string) {
    return this.ordersService.markOrderAsPaid(userId, orderId);
  }

  @Roles(Role.ADMIN)
  @Mutation(() => Order, { name: 'deleteOrder', description: 'Deletes an order and restores stock (admin only)' })
  async deleteOrder(@Args('orderId', { type: () => String }) orderId: string) {
    return this.ordersService.deleteOrder(orderId);
  }
}
