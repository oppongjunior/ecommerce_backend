import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiscountInput } from './dto/create-discount.input';
import { UpdateDiscountInput } from './dto/update-discount.input';
import { Cart, CartItem, Discount, Order, OrderItem, Product, Variant } from '@prisma/client';

interface DiscountConnectInput {
  products: { connect?: { id: string }[] };
  variants: { connect?: { id: string }[] };
  categories: { connect?: { id: string }[] };
}

interface DiscountCalculation {
  discountedPrice: number;
  discountAmount: number;
  discountId?: string;
}

interface DiscountSetInput {
  products: { set?: { id: string }[] };
  variants: { set?: { id: string }[] };
  categories: { set?: { id: string }[] };
}

interface CartItemWithProduct extends CartItem {
  product: Product;
}

export interface CartWithDiscount extends Cart {
  items: CartItem[];
  total: number;
  discountTotal: number;
  finalTotal: number;
}

interface OrderItemWithProduct extends OrderItem {
  product: Product;
}

type CreateOrUpdateDiscountInput = CreateDiscountInput | UpdateDiscountInput;
type DiscountConnectOrSetInput = DiscountConnectInput | DiscountSetInput;
type DiscountConnectionOperation = 'connect' | 'set';

@Injectable()
export class DiscountService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new discount with the provided input.
   * Enforces business rules and establishes relationships with products, variants, or categories.
   * @param input - The input data for creating a discount.
   * @returns The created discount.
   * @throws BadRequestException if business rules are violated.
   */
  async createDiscount(input: CreateDiscountInput): Promise<Discount> {
    await this.validateDiscountInput(input);
    const connectData = this.prepareDiscountConnectionData(input, 'connect') as DiscountConnectInput;
    return this.prisma.discount.create({
      data: {
        name: input.name,
        description: input.description,
        type: input.type,
        value: input.value,
        startDate: input.startDate,
        endDate: input.endDate,
        isActive: input.isActive ?? false,
        minimumPurchase: input.minimumPurchase,
        products: connectData.products,
        variants: connectData.variants,
        categories: connectData.categories,
      },
    });
  }

  /**
   * Updates an existing discount with the provided input.
   * Supports partial updates and enforces business rules.
   * @param id
   * @param input - The input data for updating a discount, including the discount ID.
   * @returns The updated discount.
   * @throws NotFoundException if the discount is not found.
   * @throws BadRequestException if business rules are violated.
   */
  async updateDiscount(id: string, input: UpdateDiscountInput): Promise<Discount> {
    await this.findDiscountOrThrow(id);
    await this.validateDiscountInput(input, true);
    const connectData = this.prepareDiscountConnectionData(input, 'set') as DiscountSetInput;
    return this.prisma.discount.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        type: input.type,
        value: input.value,
        startDate: input.startDate,
        endDate: input.endDate,
        isActive: input.isActive,
        minimumPurchase: input.minimumPurchase,
        products: connectData.products,
        variants: connectData.variants,
        categories: connectData.categories,
      },
    });
  }

  /**
   * Retrieves all discounts.
   * @returns A list of all discounts.
   */
  async findAllDiscounts(): Promise<Discount[]> {
    return this.prisma.discount.findMany();
  }

  /**
   * Retrieves a single discount by ID.
   * @param id - The ID of the discount to retrieve.
   * @returns The discount with the specified ID.
   * @throws NotFoundException if the discount is not found.
   */
  async findOneDiscount(id: string): Promise<Discount> {
    return this.findDiscount(id);
  }

  /**
   * Deletes a discount by ID.
   * @param id - The ID of the discount to delete.
   * @returns The deleted discount.
   * @throws NotFoundException if the discount is not found.
   */
  async deleteDiscount(id: string): Promise<Discount> {
    await this.findDiscountOrThrow(id);
    return this.prisma.discount.delete({ where: { id } });
  }

  /**
   * Calculates the discounted price for a product or variant.
   * @param productId - The ID of the product.
   * @param variantId - The ID of the variant, if applicable.
   * @returns The discounted price, discount amount, and discount ID (if applicable).
   */
  async getDiscountedPriceForProduct(productId: string, variantId?: string): Promise<DiscountCalculation> {
    const product = await this.getProductOrThrow(productId);
    let price = Number(product.price);

    if (variantId) {
      const variant = await this.getVariantOrThrow(variantId);
      price = variant.price ? Number(variant.price) : price;
    }

    const discounts = await this.getApplicableDiscounts(productId, variantId);
    const bestDiscount = this.selectBestDiscount(discounts);
    return this.getBestDiscountDetails(price, bestDiscount);
  }

  /**
   * Applies discounts to cart items and computes totals.
   * @param cartId - The ID of the cart.
   * @returns The updated cart with applied discounts.
   * @throws NotFoundException if the cart is not found.
   * @throws BadRequestException if minimum purchase requirements are not met.
   */
  async applyDiscountsToCart(cartId: string): Promise<CartWithDiscount> {
    const cart = await this.findCartOrThrow(cartId);
    const { total, discountTotal, updatedItems } = await this.getCartItemCalculations(cart.items);
    const discounts = await this.getApplicableDiscountsForCart(cart.items);
    this.validateMinimumPurchaseRequirements(discounts, total);
    return { ...cart, items: updatedItems, total, discountTotal, finalTotal: total - discountTotal };
  }

  /**
   * Finalizes discounts for an order by persisting them in order items.
   * @param orderId - The ID of the order.
   * @returns The updated order with applied discounts.
   * @throws NotFoundException if the order is not found.
   */
  async finalizeDiscountsForOrder(orderId: string): Promise<Order & { items: OrderItem[] }> {
    const order = await this.findOrderOrThrow(orderId);
    const { total, discountTotal } = await this.getOrderItemsCalculation(order.items);
    return this.updateOrderWithDiscount(orderId, total, discountTotal);
  }

  private async validateDiscountInput(input: CreateOrUpdateDiscountInput, isUpdate = false): Promise<void> {
    this.ensureEndDateComeAfter(input);
    this.ensureDiscountInputIsValid(input);

    if (input.products.length) await this.ensureProductsExist(input);
    if (input.variants?.length) await this.ensureVariantsExist(input);
    if (input.categories?.length) await this.ensureCategoriesExist(input);

    // For updates, ensure at least one field is provided (besides id)
    if (isUpdate) this.ensureUpdateInputNotEmpty(input as UpdateDiscountInput);
  }

  private prepareDiscountConnectionData(
    input: CreateOrUpdateDiscountInput,
    operation: DiscountConnectionOperation,
  ): DiscountConnectOrSetInput {
    return {
      products: input.products?.length ? { [operation]: input.products.map((id) => ({ id })) } : undefined,
      variants: input.variants?.length ? { [operation]: input.variants.map((id) => ({ id })) } : undefined,
      categories: input.categories?.length ? { [operation]: input.categories.map((id) => ({ id })) } : undefined,
    };
  }

  private async findDiscountOrThrow(id: string): Promise<Discount> {
    const discount = await this.prisma.discount.findUnique({ where: { id } });
    if (!discount) throw new NotFoundException(`Discount with ID ${id} not found`);
    return discount;
  }

  private async findDiscount(id: string) {
    return this.prisma.discount.findUnique({ where: { id } });
  }

  private async getInvalidIds(ids: string[], model: 'product' | 'variant' | 'category'): Promise<string[]> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const count = await this.prisma[model].count({
      where: { id: { in: ids } },
    });
    if (count !== ids.length) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const existingIds = await this.prisma[model].findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });
      const existingIdSet = new Set(existingIds.map((item) => item.id));
      return ids.filter((id) => !existingIdSet.has(id));
    }
    return [];
  }

  private async getApplicableDiscounts(productId: string, variantId?: string): Promise<Discount[]> {
    const product = await this.getProductWithDiscounts(productId);
    const discounts: Discount[] = product ? product.discounts : [];

    const categoryDiscounts = await this.getCategoryDiscounts(product.categoryId);
    discounts.push(...categoryDiscounts);

    if (variantId) {
      const variantDiscounts = await this.getVariantDiscounts(variantId);
      discounts.push(...variantDiscounts);
    }

    return discounts;
  }

  private async getProductWithDiscounts(productId: string) {
    return this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        categoryId: true,
        discounts: { where: { isActive: true, startDate: { lte: new Date() }, endDate: { gte: new Date() } } },
      },
    });
  }

  private async getCategoryDiscounts(categoryId: string) {
    return this.prisma.discount.findMany({
      where: {
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
        categories: { some: { id: categoryId } },
      },
    });
  }

  private async getVariantDiscounts(variantId: string) {
    return this.prisma.discount.findMany({
      where: {
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
        variants: { some: { id: variantId } },
      },
    });
  }

  private selectBestDiscount(discounts: Discount[]): Discount | null {
    if (!discounts.length) return null;

    return discounts.reduce((best, current) => {
      const bestValue = Number(best.value);
      const currentValue = Number(current.value);
      if (currentValue > bestValue) return current;

      if (currentValue === bestValue && current.type === 'PERCENTAGE' && best.type === 'FLAT') {
        return current; // Prefer percentage if values are equal
      }
      return best;
    }, discounts[0]);
  }

  private calculateDiscountAmount(price: number, discount: Discount): number {
    if (discount.type === 'PERCENTAGE') return (price * Number(discount.value)) / 100;
    return Number(discount.value);
  }

  private async getProductOrThrow(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id }, select: { price: true } });
    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);
    return product;
  }

  private async getVariantOrThrow(id: string) {
    const variant = await this.prisma.variant.findUnique({ where: { id }, select: { price: true } });
    if (!variant) throw new NotFoundException(`Variant with ID ${id} not found`);
    return variant;
  }

  private getBestDiscountDetails(originalPrice: number, bestDiscount: Discount): DiscountCalculation {
    if (!bestDiscount) return { discountedPrice: originalPrice, discountAmount: 0 };
    const discountAmount = this.calculateDiscountAmount(originalPrice, bestDiscount);
    const discountedPrice = Math.max(0, originalPrice - discountAmount);
    return { discountedPrice, discountAmount, discountId: bestDiscount.id };
  }

  private async findCartOrThrow(cartId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: { include: { product: true, variant: true } } },
    });
    if (!cart) throw new NotFoundException(`Cart with ID ${cartId} not found`);
    return cart;
  }

  private async getCartItemCalculations(cartItems: CartItemWithProduct[]) {
    let total = 0;
    let discountTotal = 0;
    const updatedItems: CartItem[] = [];

    for (const cartItem of cartItems) {
      const { discountedPrice, discountAmount, discountId } = await this.getDiscountedPriceForProduct(
        cartItem.productId,
        cartItem.variantId,
      );
      total += Number(cartItem.product.price) * cartItem.quantity;
      discountTotal += discountAmount * cartItem.quantity;

      const updatedItem = await this.updateCartItemWithDiscountDetails(cartItem, {
        discountId,
        discountedPrice,
        discountAmount,
      });

      updatedItems.push(updatedItem);
    }
    return { total, discountTotal, updatedItems };
  }

  private async getApplicableDiscountsForCart(
    cartItem: (CartItem & {
      product: Product;
      variant?: Variant;
    })[],
  ): Promise<Discount[]> {
    const discountIds = new Set<string>();
    const discounts: Discount[] = [];

    for (const item of cartItem) {
      const itemDiscounts = await this.getApplicableDiscounts(item.productId, item.variantId);
      for (const discount of itemDiscounts) {
        if (!discountIds.has(discount.id)) {
          discountIds.add(discount.id);
          discounts.push(discount);
        }
      }
    }

    return discounts;
  }

  private validateMinimumPurchaseRequirements(discounts: Discount[], total: number) {
    for (const discount of discounts) {
      if (discount.minimumPurchase && total < Number(discount.minimumPurchase)) {
        throw new BadRequestException(
          `Cart total (${total}) does not meet minimum purchase requirement (${discount.minimumPurchase}) for discount ${discount.name}`,
        );
      }
    }
  }

  private async updateCartItemWithDiscountDetails(
    cartItem: CartItemWithProduct,
    discountDetails: DiscountCalculation,
    tx: PrismaService = this.prisma,
  ) {
    return tx.cartItem.update({
      where: { id: cartItem.id },
      data: {
        originalPrice: Number(cartItem.product.price),
        discountedPrice: discountDetails.discountedPrice,
        discountId: discountDetails.discountId,
      },
    });
  }

  private async findOrderOrThrow(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true, variant: true } } },
    });
    if (!order) throw new NotFoundException(`Order with ID ${orderId} not found`);
    return order;
  }

  private async getOrderItemsCalculation(orderItems: OrderItemWithProduct[]) {
    let total = 0;
    let discountTotal = 0;
    const updatedItems: OrderItem[] = [];

    for (const orderItem of orderItems) {
      const { discountAmount, discountId } = await this.getDiscountedPriceForProduct(
        orderItem.productId,
        orderItem.variantId,
      );
      total += Number(orderItem.product.price) * orderItem.quantity;
      discountTotal += discountAmount * orderItem.quantity;

      const updatedItem = await this.updateOrderItemWithDiscount(orderItem, {
        discountId,
        discountAmount,
      } as DiscountCalculation);
      updatedItems.push(updatedItem);
    }
    return {
      total,
      discountTotal,
      updatedItems,
    };
  }

  private async updateOrderItemWithDiscount(
    orderItem: OrderItemWithProduct,
    discount: DiscountCalculation,
    tx = this.prisma,
  ) {
    return tx.orderItem.update({
      where: { id: orderItem.id },
      data: {
        originalPrice: Number(orderItem.product.price),
        discountAmount: discount.discountAmount,
        discountId: discount.discountId,
      },
    });
  }

  private async updateOrderWithDiscount(orderId: string, total: number, discountTotal: number) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { totalAmount: total, discountTotal, totalWithOutDiscount: total - discountTotal },
      include: { items: true },
    });
  }

  private ensureEndDateComeAfter(input: CreateOrUpdateDiscountInput) {
    if (input.startDate && input.endDate && input.endDate <= input.startDate) {
      throw new BadRequestException('End date must be after start date');
    }
  }

  private ensureDiscountInputIsValid(input: CreateOrUpdateDiscountInput) {
    if (input.value !== undefined && input.type !== undefined) {
      if (input.type === 'PERCENTAGE' && input.value > 100) {
        throw new BadRequestException('Percentage discount value cannot exceed 100');
      }
      if (input.value < 0) {
        throw new BadRequestException('Discount value must be non-negative');
      }
    }
  }

  private async ensureProductsExist(input: CreateOrUpdateDiscountInput) {
    const invalidIds = await this.getInvalidIds(input.products, 'product');
    if (invalidIds.length) throw new BadRequestException(`Invalid product IDs: ${invalidIds.join(', ')}`);
  }

  private async ensureVariantsExist(input: CreateOrUpdateDiscountInput) {
    const invalidIds = await this.getInvalidIds(input.variants, 'variant');
    if (invalidIds.length) throw new BadRequestException(`Invalid variant IDs: ${invalidIds.join(', ')}`);
  }

  private async ensureCategoriesExist(input: CreateOrUpdateDiscountInput) {
    const invalidIds = await this.getInvalidIds(input.categories, 'category');
    if (invalidIds.length) throw new BadRequestException(`Invalid category IDs: ${invalidIds.join(', ')}`);
  }

  private ensureUpdateInputNotEmpty(input: UpdateDiscountInput) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...updateFields } = input;
    if (Object.keys(updateFields).every((key) => updateFields[key] === undefined)) {
      throw new BadRequestException('At least one field must be provided for update');
    }
  }
}
