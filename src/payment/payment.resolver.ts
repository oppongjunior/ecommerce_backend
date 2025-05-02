import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PaymentService } from './payment.service';
import { Payment } from './entities/payment.entity';
import { Roles } from '../iam/authentication/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { VerifyPaymentInput } from './dto/verify-payment.input';
import { ActiveUser } from '../iam/authentication/decorators/active-user.decorator';

@Resolver(() => Payment)
export class PaymentResolver {
  constructor(private readonly paymentService: PaymentService) {}

  @Mutation(() => Payment)
  verifyPayment(
    @Args('verifyPaymentInput') verifyPaymentInput: VerifyPaymentInput,
  ) {
    return this.paymentService.verifyPayment(verifyPaymentInput.reference);
  }

  @Roles(Role.USER)
  @Query(() => [Payment], { name: 'getMyPayments' })
  getMyPayments(@ActiveUser('id') userId: string) {
    return this.paymentService.getUserPayments(userId);
  }

  @Roles(Role.ADMIN)
  @Query(() => [Payment], { name: 'getUserPayment' })
  getUserPayments(@Args('userId', { type: () => String }) userId: string) {
    return this.paymentService.getUserPayments(userId);
  }

  @Query(() => Payment, { name: 'payment' })
  getPayment(@Args('id', { type: () => String }) id: string) {
    return this.paymentService.getPayment(id);
  }

  @Roles(Role.ADMIN)
  @Mutation(() => Payment)
  softDeletePayment(@Args('id', { type: () => String }) id: string) {
    return this.paymentService.softDelete(id);
  }

  @Roles(Role.ADMIN)
  @Mutation(() => Payment)
  restorePayment(@Args('id', { type: () => String }) id: string) {
    return this.paymentService.restore(id);
  }

  @Roles(Role.ADMIN)
  @Mutation(() => Payment)
  removePayment(@Args('id', { type: () => String }) id: string) {
    return this.paymentService.remove(id);
  }
}
