export class CreateTransactionDto {
  paymentId: string;
  orderId: string;
  amount: number;
  userId: string;
  date: Date;
  status: string;
}