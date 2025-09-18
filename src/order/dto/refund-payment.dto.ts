import { IsInt, IsOptional } from 'class-validator';

export class RefundPaymentDto {
  @IsOptional()
  @IsInt()
  amount?: number; // paise - if omitted full refund attempted
  @IsOptional()
  reason?: string;
}
