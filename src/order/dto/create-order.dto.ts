import { IsOptional, IsIn, IsNotEmpty, IsString, IsInt } from 'class-validator';

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  webinarId?: string;

  @IsOptional()
  @IsString()
  userId?:string;

  @IsOptional()
  @IsString()
  PlanId?:string;

  @IsOptional()
  @IsString()
  appointmentId?: string;

  // optional helper but not required
  @IsOptional()
  @IsIn(['course', 'webinar', 'appointment'])
  itemType?: 'course' | 'webinar' | 'appointment' | 'Plan';

  // optional client-provided amount (we will validate server-side)
  @IsOptional()
  @IsInt()
  amount?: number; // paise

  @IsOptional()
  meta?: Record<string, any>;
}
