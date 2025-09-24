import { IsString, IsIn } from 'class-validator';

export class CreateYoutubeDto {
  @IsString()
  link: string;

  @IsString()
  @IsIn(['course', 'webinar'])
  category: string;

  @IsString()
  @IsIn(['live', 'offline'])
  type: string;
}
