import { PartialType } from '@nestjs/mapped-types';
import { CreateWebinarDto } from './create-webinar.dto';

export class UpdateWebinarDto extends PartialType(CreateWebinarDto) {}
