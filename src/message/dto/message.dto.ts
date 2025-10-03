import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  senderId: string;

  @IsString()
  receiverId: string;

  @IsString()
  @IsOptional()
  text?: string;

  @IsString()
  @IsOptional()
  fileData?: string; // Base64 string for media

  @IsString()
  @IsIn(['image/jpeg', 'image/png', 'video/mp4', 'audio/mpeg', 'application/pdf'])
  @IsOptional()
  mediaType?: string;

  @IsString()
  @IsOptional()
  caption?: string;

  @IsString()
  @IsOptional()
  document_title?: string;

  @IsString()
  @IsOptional()
  document_size?: string;

  @IsString()
  @IsOptional()
  document_page?: string;

}