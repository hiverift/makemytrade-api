import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateBookingDto {
  @IsMongoId() serviceId: string;
  @IsMongoId() slotId: string;
  @IsOptional() @IsString() userId?: string; // if logged-in attach
  @IsOptional() @IsString() paymentMethod?: string; // "card"/"upi"
}
