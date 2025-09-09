import { PartialType } from '@nestjs/mapped-types';
import { CreateConsultancyDto } from './create-consultancy.dto';

export class UpdateConsultancyDto extends PartialType(CreateConsultancyDto) {}
