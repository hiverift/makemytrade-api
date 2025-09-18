import { Controller, Post, Req, Headers, HttpCode, BadRequestException } from '@nestjs/common';
import { OrdersService } from 'src/order/order.service';
import { Request } from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Req() req: Request & { rawBody?: Buffer }, @Headers('x-razorpay-signature') signature: string) {
    const raw = (req as any).rawBody || (req as any).raw;
    const bodyString = raw instanceof Buffer ? raw.toString() : JSON.stringify(req.body);

    if (!this.ordersService.verifyWebhookSignature(bodyString, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    await this.ordersService.handleWebhook(req.body);

    return { status: 'ok' };
  }
}
