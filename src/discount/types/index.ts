import { Cart, CartItem, OrderItem, Product } from '@prisma/client';
import { CreateDiscountInput } from '../dto/create-discount.input';
import { UpdateDiscountInput } from '../dto/update-discount.input';

export interface DiscountConnectInput {
  products: { connect?: { id: string }[] };
  variants: { connect?: { id: string }[] };
  categories: { connect?: { id: string }[] };
}

export interface DiscountCalculation {
  discountedPrice: number;
  discountAmount: number;
  discountId?: string;
}

export interface DiscountSetInput {
  products: { set?: { id: string }[] };
  variants: { set?: { id: string }[] };
  categories: { set?: { id: string }[] };
}

export interface CartItemWithProduct extends CartItem {
  product: Product;
}

export interface CartWithDiscount extends Cart {
  items: CartItem[];
  total: number;
  discountTotal: number;
  finalTotal: number;
}

export interface OrderItemWithProduct extends OrderItem {
  product: Product;
}

export type CreateOrUpdateDiscountInput = CreateDiscountInput | UpdateDiscountInput;
export type DiscountConnectOrSetInput = DiscountConnectInput | DiscountSetInput;
export type DiscountConnectionOperation = 'connect' | 'set';
