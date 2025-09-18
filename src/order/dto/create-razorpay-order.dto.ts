// create-razorpay-order.dto.ts
import { IsInt, IsOptional, IsString, IsNotEmpty } from 'class-validator';
export class CreateRazorpayOrderDto {
  @IsInt()
  amount: number; // paise
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() receipt?: string;
  @IsOptional() notes?: Record<string, any>;
}


export class VerifyPaymentDto {
  @IsString() @IsNotEmpty() razorpay_order_id: string;
  @IsString() @IsNotEmpty() razorpay_payment_id: string;
  @IsString() @IsNotEmpty() razorpay_signature: string;
}
