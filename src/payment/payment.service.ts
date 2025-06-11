import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaystackWebhookDto } from './dto/paystack.dto';
import { Payment, PaymentStatus } from '@prisma/client';
import * as Paystack from 'paystack-api';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { PaystackEvent } from './enums/paystack-event.enum';

@Injectable()
export class PaymentService {
  private readonly paystack: Paystack.Client;
  private readonly PAYSTACK_EVENTS = {
    CHARGE_SUCCESS: PaystackEvent.CHARGE_SUCCESS,
    CHARGE_FAILED: PaystackEvent.CHARGE_FAILED,
  } as const;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.paystack = Paystack(this.configService.get('PAYSTACK_SECRET_KEY'));
  }

  /**
   * Initiates a payment for an order using Paystack.
   * @param userId - The ID of the user.
   * @param createPaymentDto - Payment input data.
   * @returns Payment record with Paystack authorization URL.
   */
  async initiatePayment(
    userId: string,
    createPaymentDto: CreatePaymentDto,
  ): Promise<Payment & { authorizationUrl?: string }> {
    const { orderId } = createPaymentDto;
    const {
      totalAmount,
      user: { email },
    } = await this.validateOrderOwnership(userId, orderId);
    await this.ensurePaymentNotInitiated(orderId);
    const transaction = await this.initializePaystackTransaction({
      email: email,
      amount: totalAmount,
      input: createPaymentDto,
    });
    return this.createPaymentRecord(totalAmount, createPaymentDto, transaction);
  }

  /**
   * Verifies a payment status using Paystack reference.
   * @param reference - Paystack transaction reference.
   * @returns Updated payment record.
   */
  async verifyPayment(reference: string): Promise<Payment> {
    const payment = await this.fetchPaymentByReference(reference);
    const verification = await this.verifyPaystackTransaction(reference);
    return this.updatePaymentStatus(payment.id, verification);
  }

  /**
   * Retrieves a payment by ID.
   * @param paymentId - The ID of the payment.
   * @returns Payment record.
   */
  async getPayment(paymentId: string): Promise<Payment> {
    return this.fetchPayment(paymentId);
  }

  /**
   * Retrieves all payments for a user.
   * @param userId - The ID of the user.
   * @returns List of payments.
   */
  async getUserPayments(userId: string): Promise<Payment[]> {
    return this.fetchUserPayments(userId);
  }

  /**
   * Processes a Paystack webhook event.
   * @param dto - Webhook payload.
   * @param signature - Paystack signature header.
   * @returns True if processed successfully, false otherwise.
   */
  async handlePaystackWebhook(dto: PaystackWebhookDto, signature: string): Promise<boolean> {
    if (!this.canProcessWebhook(dto, signature)) {
      return false;
    }
    return this.processWebhookPayment(dto.data.reference);
  }

  /**
   * Soft deletes a payment record by marking it as deleted and setting the deletion timestamp.
   * @param id - The ID of the payment to be softly deleted.
   * @returns The updated payment record with deletion status.
   * @throws NotFoundException if the payment is not found.
   */
  async softDelete(id: string) {
    await this.findPaymentOrThrow(id);
    return this.prismaService.payment.update({
      where: { id },
      data: { deleted: true, deletedAt: new Date() },
    });
  }

  /**
   * Restores a soft-deleted payment record by setting its deleted status to false
   * and clearing the deletion timestamp.
   * @param id - The ID of the payment to be restored.
   * @returns The updated payment record.
   * @throws NotFoundException if the payment is not found.
   */
  async restore(id: string) {
    await this.findPaymentOrThrow(id);
    return this.prismaService.payment.update({
      where: { id },
      data: { deleted: false, deletedAt: null },
    });
  }

  /**
   * Permanently removes a payment record from the database.
   * @param id - The ID of the payment to be removed.
   * @returns The deleted payment record.
   * @throws NotFoundException if the payment is not found.
   */
  async remove(id: string) {
    await this.findPaymentOrThrow(id);
    return this.prismaService.payment.delete({ where: { id } });
  }

  private async findPaymentOrThrow(id: string) {
    const payment = await this.prismaService.payment.findUnique({
      where: { id },
    });
    if (!payment) throw new NotFoundException('Payment Not found');
  }

  private async validateOrderOwnership(userId: string, orderId: string) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });
    if (!order) throw new NotFoundException(`Order "${orderId}" not found`);
    if (order.userId !== userId) throw new ForbiddenException('Order does not belong to you');
    return order;
  }

  private async ensurePaymentNotInitiated(orderId: string): Promise<void> {
    const existingPayment = await this.prismaService.payment.findUnique({
      where: { orderId },
    });
    if (existingPayment) throw new BadRequestException('Payment already initiated for this order');
  }

  private async initializePaystackTransaction({
    email,
    amount,
    input,
  }): Promise<Paystack.Response<Paystack.Transaction.InitializeResponse>> {
    const { currency, orderId } = input;
    const amountInSubunit = this.convertToSubunit(amount);
    return this.paystack.transaction.initialize({
      email,
      amount: amountInSubunit,
      currency,
      reference: this.generateReference(orderId),
      callback_url: this.configService.get('PAYSTACK_CALLBACK_URL'),
    });
  }

  private convertToSubunit(amount: number): number {
    return Math.round(amount * 100);
  }

  private generateReference(orderId: string): string {
    return `${orderId}-${Date.now()}`;
  }

  private async createPaymentRecord(
    amount: number,
    input: CreatePaymentDto,
    transaction: Paystack.Response<Paystack.Transaction.InitializeResponse>,
  ): Promise<Payment & { authorizationUrl?: string }> {
    const { orderId, currency, paymentMethod } = input;
    const payment = await this.prismaService.payment.create({
      data: {
        orderId,
        amount,
        currency,
        paymentMethod,
        status: PaymentStatus.PENDING,
        transactionId: transaction.data.reference,
        paymentDetails: transaction.data,
      },
    });
    return { ...payment, authorizationUrl: transaction.data.authorization_url };
  }

  private async fetchPaymentByReference(reference: string): Promise<Payment> {
    const payment = await this.prismaService.payment.findFirst({
      where: { transactionId: reference },
    });
    if (!payment) throw new NotFoundException(`Payment with reference "${reference}" not found`);
    return payment;
  }

  private async verifyPaystackTransaction(
    reference: string,
  ): Promise<Paystack.Response<Paystack.Transaction.VerifyResponse>> {
    return this.paystack.transaction.verify({ reference });
  }

  private async updatePaymentStatus(
    paymentId: string,
    verification: Paystack.Response<Paystack.Transaction.VerifyResponse>,
  ): Promise<Payment> {
    const status = verification.data.status === 'success' ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;
    return this.prismaService.payment.update({
      where: { id: paymentId },
      data: {
        status,
        paymentDetails: verification.data,
      },
    });
  }

  private async fetchPayment(paymentId: string): Promise<Payment> {
    return this.prismaService.payment.findUnique({
      where: { id: paymentId, deleted: false },
      include: { order: true },
    });
  }

  private async fetchUserPayments(userId: string): Promise<Payment[]> {
    return this.prismaService.payment.findMany({
      where: { order: { userId }, deleted: false },
      include: { order: true },
    });
  }

  private canProcessWebhook(dto: PaystackWebhookDto, signature: string): boolean {
    return this.isValidWebhookSignature(dto, signature) && this.isRelevantEvent(dto.event);
  }

  private async processWebhookPayment(reference: string): Promise<boolean> {
    try {
      await this.verifyPayment(reference);
      return true;
    } catch (error) {
      console.error('Webhook processing failed', {
        reference,
        error: error.message,
        stack: error.stack,
      });
      return false;
    }
  }

  private isValidWebhookSignature(dto: PaystackWebhookDto, signature: string): boolean {
    try {
      const hash = this.computeWebhookSignature(dto);
      return hash === signature;
    } catch (error) {
      console.error('Signature validation error', {
        error: error.message,
        stack: error.stack,
      });
      return false;
    }
  }

  private computeWebhookSignature(dto: PaystackWebhookDto): string {
    const secret = this.configService.get('PAYSTACK_SECRET_KEY');
    return createHmac('sha512', secret).update(JSON.stringify(dto)).digest('hex');
  }

  private isRelevantEvent(event: PaystackEvent): boolean {
    return [this.PAYSTACK_EVENTS.CHARGE_SUCCESS, this.PAYSTACK_EVENTS.CHARGE_FAILED].includes(event);
  }
}
