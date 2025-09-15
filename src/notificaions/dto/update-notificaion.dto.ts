import { PartialType } from '@nestjs/mapped-types';
import { CreateNotificaionDto } from './create-notificaion.dto';

export class UpdateNotificaionDto extends PartialType(CreateNotificaionDto) {}
