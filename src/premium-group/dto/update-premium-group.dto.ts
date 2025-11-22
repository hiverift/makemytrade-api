import { PartialType } from '@nestjs/mapped-types';
import { CreatePremiumGroupDto } from './create-premium-group.dto';

export class UpdatePremiumGroupDto extends PartialType(CreatePremiumGroupDto) {}
