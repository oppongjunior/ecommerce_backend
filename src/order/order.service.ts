import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { Cart, CartItem, Order, OrderItem, OrderStatus, Prisma, Product } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cartService: CartService,
  ) {}

  // Public API Methods (Order Lifecycle)

  /**
   * Creates an order from the user's cart using the specified shipping address.
   * @param userId - The ID of the user placing the order.
   * @param shippingAddressId - The ID of the shipping address.
   * @returns The created order with its items.
   */
  async createOrderFromCart(userId: string, shippingAddressId: string): Promise<Order & { items: OrderItem[] }> {
    const cart = await this.ensureValidCart(userId);
    await this.ensureValidShippingAddress(userId, shippingAddressId);
    await this.ensureUserCanOrder(userId, cart);
    const orderDetails = await this.buildOrderDetails(cart.items);
    return this.saveOrderAndUpdateInventory(userId, shippingAddressId, orderDetails, cart.id);
  }

  /**
   * Retrieves a specific order by ID for the user.
   * @param userId - The ID of the user.
   * @param orderId - The ID of the order.
   * @returns The order with its items.
   */
  async getOrder(userId: string, orderId: string): Promise<Order & { items: OrderItem[] }> {
    return this.retrieveUserOrder(userId, orderId);
  }

  /**
   * Retrieves all orders for the user.
   * @param userId - The ID of the user.
   * @returns List of orders with their items.
   */
  async getUserOrders(userId: string): Promise<(Order & { items: OrderItem[] })[]> {
    return this.fetchUserOrders(userId);
  }

  /**
   * Retrieves all orders from the database (e.g., for admin use).
   * @returns List of all orders.
   */
  async getOrders(): Promise<Order[]> {
    return this.fetchAllOrders();
  }

  /**
   * Updates the status of an order.
   * @param userId - The ID of the user.
   * @param orderId - The ID of the order.
   * @param status - The new status.
   * @returns The updated order with its items.
   */
  async updateOrderStatus(
    userId: string,
    orderId: string,
    status: OrderStatus,
  ): Promise<Order & { items: OrderItem[] }> {
    await this.retrieveUserOrder(userId, orderId);
    return this.applyOrderStatus(orderId, status);
  }

  /**
   * Cancels an order and restores product stock.
   * @param userId - The ID of the user.
   * @param orderId - The ID of the order.
   * @returns The cancelled order with its items.
   */
  async cancelOrder(userId: string, orderId: string): Promise<Order & { items: OrderItem[] }> {
    const order = await this.retrieveUserOrder(userId, orderId);
    this.ensureOrderCanBeCancelled(order);
    return this.cancelOrderAndRestoreStock(order);
  }

  /**
   * Marks an order as paid, transitioning to PROCESSING status.
   * @param userId - The ID of the user.
   * @param orderId - The ID of the order.
   * @returns The updated order with its items.
   */
  async markOrderAsPaid(userId: string, orderId: string): Promise<Order & { items: OrderItem[] }> {
    const order = await this.retrieveUserOrder(userId, orderId);
    this.ensureOrderCanBePaid(order);
    return this.applyOrderStatus(orderId, 'PROCESSING');
  }

  /**
   * Deletes an order and restores stock (admin only).
   * @param orderId - The ID of the order.
   * @returns The deleted order with its items.
   */
  async deleteOrder(orderId: string): Promise<Order & { items: OrderItem[] }> {
    const order = await this.retrieveOrder(orderId);
    return this.removeOrderAndRestoreStock(order);
  }

  // Private Helper Methods (Implementation Details)

  private async ensureValidCart(userId: string): Promise<Cart & { items: CartItem[] }> {
    const cart = await this.cartService.getCartOrThrow(userId);
    if (cart.items.length === 0) throw new NotFoundException(`Cart for user "${userId}" is empty`);
    return cart;
  }

  private async ensureValidShippingAddress(userId: string, shippingAddressId: string): Promise<void> {
    const address = await this.prismaService.address.findFirst({
      where: { id: shippingAddressId, userId },
    });
    if (!address) {
      throw new NotFoundException(`Shipping address "${shippingAddressId}" not found for user "${userId}"`);
    }
  }

  private async ensureUserCanOrder(userId: string, cart: Cart & { items: CartItem[] }): Promise<void> {
    const user = await this.prismaService.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) throw new BadRequestException(`User "${userId}" is not eligible to place an order`);
    if (cart.items.length > 50) throw new BadRequestException('Order exceeds maximum item limit of 50');
  }

  private async buildOrderDetails(cartItems: CartItem[]): Promise<{ orderItems: OrderItem[]; totalAmount: number }> {
    const orderItems = await this.createOrderItems(cartItems);
    const totalAmount = this.computeTotalAmount(orderItems);
    return { orderItems, totalAmount };
  }

  private async createOrderItems(cartItems: CartItem[]): Promise<OrderItem[]> {
    const orderItems: OrderItem[] = [];
    for (const item of cartItems) {
      const product = await this.checkProductAvailability(item);
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtOrder: product.price as unknown as number,
      } as OrderItem);
    }
    return orderItems;
  }

  private async checkProductAvailability(item: CartItem): Promise<Product> {
    const product = await this.prismaService.product.findUnique({
      where: { id: item.productId },
    });
    if (!product) throw new NotFoundException(`Product "${item.productId}" not found`);

    if (product.quantity < item.quantity) {
      throw new BadRequestException(
        `Insufficient stock for "${product.name}": ${product.quantity} available, ${item.quantity} requested`,
      );
    }
    return product;
  }

  private computeTotalAmount(orderItems: OrderItem[]): number {
    const subtotal = orderItems.reduce((sum, item) => sum + item.priceAtOrder * item.quantity, 0);
    const tax = subtotal * 0.1; // 10% tax, configurable later
    const shippingFee = 5.0; // Flat fee, configurable later
    return subtotal + tax + shippingFee;
  }

  private async saveOrderAndUpdateInventory(
    userId: string,
    shippingAddressId: string,
    orderDetails: { orderItems: OrderItem[]; totalAmount: number },
    cartId: string,
  ): Promise<Order & { items: OrderItem[] }> {
    return this.prismaService.$transaction(async (prisma) => {
      const newOrder = await this.createOrderInDb(prisma, userId, shippingAddressId, orderDetails);
      await this.reduceProductStock(prisma, orderDetails.orderItems);
      await this.emptyCart(prisma, cartId);
      return newOrder;
    });
  }

  private async createOrderInDb(
    prisma: Prisma.TransactionClient,
    userId: string,
    shippingAddressId: string,
    orderDetails: { orderItems: OrderItem[]; totalAmount: number },
  ): Promise<Order & { items: OrderItem[] }> {
    return prisma.order.create({
      data: {
        userId,
        shippingAddressId,
        totalAmount: orderDetails.totalAmount,
        items: { create: orderDetails.orderItems },
      },
      include: { items: { include: { product: true } } },
    });
  }

  private async reduceProductStock(prisma: Prisma.TransactionClient, orderItems: OrderItem[]): Promise<void> {
    for (const item of orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } },
      });
    }
  }

  private async emptyCart(prisma: Prisma.TransactionClient, cartId: string): Promise<void> {
    await prisma.cartItem.deleteMany({ where: { cartId } });
  }

  private async retrieveUserOrder(userId: string, orderId: string): Promise<Order & { items: OrderItem[] }> {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });
    if (!order || order.userId !== userId) {
      throw new NotFoundException(`Order "${orderId}" not found`);
    }
    return order;
  }

  private async fetchUserOrders(userId: string): Promise<(Order & { items: OrderItem[] })[]> {
    return this.prismaService.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async fetchAllOrders(): Promise<Order[]> {
    return this.prismaService.order.findMany();
  }

  private async applyOrderStatus(orderId: string, status: OrderStatus): Promise<Order & { items: OrderItem[] }> {
    return this.prismaService.order.update({
      where: { id: orderId },
      data: { status },
      include: { items: { include: { product: true } } },
    });
  }

  private ensureOrderCanBeCancelled(order: Order & { items: OrderItem[] }): void {
    if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
      throw new BadRequestException(`Order "${order.id}" cannot be cancelled; current status: ${order.status}`);
    }
  }

  private async cancelOrderAndRestoreStock(order: Order & { items: OrderItem[] }): Promise<
    Order & {
      items: OrderItem[];
    }
  > {
    return this.prismaService.$transaction(async (prisma) => {
      await this.restoreProductStock(prisma, order.items);
      return this.applyOrderStatus(order.id, 'CANCELLED');
    });
  }

  private ensureOrderCanBePaid(order: Order & { items: OrderItem[] }): void {
    if (order.status !== 'PENDING') {
      throw new BadRequestException(`Order "${order.id}" cannot be paid; current status: ${order.status}`);
    }
  }

  private async retrieveOrder(orderId: string): Promise<Order & { items: OrderItem[] }> {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException(`Order "${orderId}" not found`);
    return order;
  }

  private async removeOrderAndRestoreStock(
    order: Order & { items: OrderItem[] },
  ): Promise<Order & { items: OrderItem[] }> {
    return this.prismaService.$transaction(async (prisma) => {
      await this.restoreProductStock(prisma, order.items);
      return prisma.order.delete({
        where: { id: order.id },
        include: { items: { include: { product: true } } },
      });
    });
  }

  private async restoreProductStock(prisma: Prisma.TransactionClient, orderItems: OrderItem[]): Promise<void> {
    for (const item of orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { quantity: { increment: item.quantity } },
      });
    }
  }
}
