import { Controller, Post, Body } from '@nestjs/common';
import { TransactionService } from './transaction.service';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('save')
  async saveFromFrontend(@Body() body: { paymentId: string; orderId: string; amount: number; userId: string }) {
    const { paymentId, orderId, amount, userId } = body;
    const transaction = await this.transactionService.saveTransaction({
      paymentId,
      orderId,
      amount,
      userId,
      date: new Date(),
      status: 'success', // Validate with Razorpay API if needed
    });
    return { message: 'Transaction saved successfully', transaction };
  }
}