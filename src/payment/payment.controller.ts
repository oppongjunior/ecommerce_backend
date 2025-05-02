import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { PaystackCallbackDto, PaystackWebhookDto } from './dto/paystack.dto';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ActiveUser } from '../iam/authentication/decorators/active-user.decorator';
import { Auth } from '../iam/authentication/decorators/auth.decorator';
import { AuthType } from '../iam/authentication/enums/auth-type.enum';
import { PAYSTACK_WEBHOOK_SIGNATURE_KEY } from './constant';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('/initialize')
  async initializeTransaction(
    @Body() createPaymentDto: CreatePaymentDto,
    @ActiveUser('id') userId: string,
  ) {
    return this.paymentService.initiatePayment(userId, createPaymentDto);
  }

  @Auth(AuthType.None)
  @Get('/callback')
  async verifyTransaction(@Query() query: PaystackCallbackDto) {
    return await this.paymentService.verifyPayment(query.reference);
  }

  @Auth(AuthType.None)
  @Post('/webhook')
  @HttpCode(HttpStatus.OK)
  async paymentWebhookHandler(
    @Body() dto: PaystackWebhookDto,
    @Headers() headers = {},
  ) {
    const result = await this.paymentService.handlePaystackWebhook(
      dto,
      `${headers[PAYSTACK_WEBHOOK_SIGNATURE_KEY]}`,
    );
    if (!result) throw new BadRequestException();
  }
}
