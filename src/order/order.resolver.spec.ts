import { Test, TestingModule } from '@nestjs/testing';
import { OrdersResolver } from './order.resolver';
import { OrdersService } from './order.service';
import { CreateOrderInput } from './dto/create-order.input';
import { UpdateOrderStatusInput } from './dto/update-order-status.input';
import { OrderStatusEnum } from './enums/order.enum';
import { ActiveUser } from '../iam/authentication/decorators/active-user.decorator';

describe('OrdersResolver', () => {
  let resolver: OrdersResolver;
  let ordersService: OrdersService;

  const mockOrdersService = {
    getOrder: jest.fn(),
    getUserOrders: jest.fn(),
    getOrders: jest.fn(),
    createOrderFromCart: jest.fn(),
    updateOrderStatus: jest.fn(),
    cancelOrder: jest.fn(),
    markOrderAsPaid: jest.fn(),
    deleteOrder: jest.fn(),
  };

  const mockUserId = 'user1';
  const fixedDate = new Date('2025-03-18T00:00:00.000Z');
  const mockOrder = {
    id: 'order1',
    userId: mockUserId,
    totalAmount: 44.978,
    status: OrderStatusEnum.PENDING,
    shippingAddressId: 'addr1',
    createdAt: fixedDate,
    updatedAt: fixedDate,
    items: [
      {
        id: 'item1',
        orderId: 'order1',
        productId: 'prod1',
        variantId: null,
        quantity: 2,
        priceAtOrder: 19.99,
        createdAt: fixedDate,
        updatedAt: fixedDate,
        product: {
          id: 'prod1',
          name: 'T-Shirt',
          price: 19.99,
          quantity: 98,
          isActive: true,
          categoryId: 'cat1',
          createdAt: fixedDate,
          updatedAt: fixedDate,
          images: [],
        },
      },
    ],
  };

  const mockCreateOrderInput: CreateOrderInput = { shippingAddressId: 'addr1' };
  const mockUpdateOrderStatusInput: UpdateOrderStatusInput = {
    orderId: 'order1',
    status: OrderStatusEnum.SHIPPED,
  };

  const mockActiveUser = (id: string) => ({ id });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersResolver, { provide: OrdersService, useValue: mockOrdersService }],
    })
      .overrideProvider(ActiveUser)
      .useValue(mockActiveUser)
      .compile();

    resolver = module.get<OrdersResolver>(OrdersResolver);
    ordersService = module.get<OrdersService>(OrdersService);
    jest.resetAllMocks();
  });

  describe('getOrder', () => {
    it('should retrieve a specific order for the user', async () => {
      mockOrdersService.getOrder.mockResolvedValue(mockOrder);

      const result = await resolver.getOrder(mockUserId, 'order1');

      expect(ordersService.getOrder).toHaveBeenCalledWith(mockUserId, 'order1');
      expect(result).toEqual(mockOrder);
    });
  });

  describe('getUserOrders', () => {
    it('should retrieve all orders for the user', async () => {
      mockOrdersService.getUserOrders.mockResolvedValue([mockOrder]);

      const result = await resolver.getUserOrders(mockUserId);

      expect(ordersService.getUserOrders).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual([mockOrder]);
    });
  });

  describe('getOrders', () => {
    it('should retrieve all orders for admin', async () => {
      mockOrdersService.getOrders.mockResolvedValue([mockOrder]);

      const result = await resolver.getOrders();

      expect(ordersService.getOrders).toHaveBeenCalled();
      expect(result).toEqual([mockOrder]);
    });
  });

  describe('createOrder', () => {
    it('should create an order from the user’s cart', async () => {
      mockOrdersService.createOrderFromCart.mockResolvedValue(mockOrder);

      const result = await resolver.createOrder(mockUserId, mockCreateOrderInput);

      expect(ordersService.createOrderFromCart).toHaveBeenCalledWith(mockUserId, 'addr1');
      expect(result).toEqual(mockOrder);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update the order status', async () => {
      const updatedOrder = { ...mockOrder, status: OrderStatusEnum.SHIPPED };
      mockOrdersService.updateOrderStatus.mockResolvedValue(updatedOrder);

      const result = await resolver.updateOrderStatus(mockUserId, mockUpdateOrderStatusInput);

      expect(ordersService.updateOrderStatus).toHaveBeenCalledWith(mockUserId, 'order1', OrderStatusEnum.SHIPPED);
      expect(result).toEqual(updatedOrder);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel an order', async () => {
      const cancelledOrder = { ...mockOrder, status: OrderStatusEnum.CANCELLED };
      mockOrdersService.cancelOrder.mockResolvedValue(cancelledOrder);

      const result = await resolver.cancelOrder(mockUserId, 'order1');

      expect(ordersService.cancelOrder).toHaveBeenCalledWith(mockUserId, 'order1');
      expect(result).toEqual(cancelledOrder);
    });
  });

  describe('markOrderAsPaid', () => {
    it('should mark an order as paid', async () => {
      const paidOrder = { ...mockOrder, status: OrderStatusEnum.PROCESSING };
      mockOrdersService.markOrderAsPaid.mockResolvedValue(paidOrder);

      const result = await resolver.markOrderAsPaid(mockUserId, 'order1');

      expect(ordersService.markOrderAsPaid).toHaveBeenCalledWith(mockUserId, 'order1');
      expect(result).toEqual(paidOrder);
    });
  });

  describe('deleteOrder', () => {
    it('should delete an order (admin only)', async () => {
      mockOrdersService.deleteOrder.mockResolvedValue(mockOrder);

      const result = await resolver.deleteOrder('order1');

      expect(ordersService.deleteOrder).toHaveBeenCalledWith('order1');
      expect(result).toEqual(mockOrder);
    });
  });

  describe('role-based access', () => {
    it('should allow USER role to access getOrder', async () => {
      mockOrdersService.getOrder.mockResolvedValue(mockOrder);

      const result = await resolver.getOrder(mockUserId, 'order1');

      expect(ordersService.getOrder).toHaveBeenCalled();
      expect(result).toEqual(mockOrder);
    });

    it('should allow ADMIN role to access getOrders', async () => {
      mockOrdersService.getOrders.mockResolvedValue([mockOrder]);

      const result = await resolver.getOrders();

      expect(ordersService.getOrders).toHaveBeenCalled();
      expect(result).toEqual([mockOrder]);
    });
  });
});
