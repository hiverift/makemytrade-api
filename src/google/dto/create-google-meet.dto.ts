import { IsMongoId, IsString, IsOptional } from 'class-validator';

export class CreateMeetDto {
  @IsString()
  webinarId: string;        // your webinar id in DB

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  startDate?: string; // ISO string e.g. "2025-09-25T12:30:00Z"

  @IsOptional()
  endDate?: string;   // ISO string
}
