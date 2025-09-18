import { IsOptional, IsIn, IsString, IsInt } from 'class-validator';

export class UpdateOrderDto {
  @IsOptional() @IsString() meta?: Record<string, any>;
  @IsOptional() @IsIn(['created','pending_payment','paid','failed','cancelled','refunded','delivered','shipped'])
  status?: string;
  @IsOptional() @IsInt()
  amount?: number; // paise - only update if you really trust caller (server-side usage only)
}
