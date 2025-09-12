import { IsMongoId, IsString } from 'class-validator';
export class ConfirmPaymentDto {
  @IsMongoId() bookingId: string;
  @IsString() paymentRef: string;   // gateway order/txn id
  @IsString() status: 'success'|'failed';
}
