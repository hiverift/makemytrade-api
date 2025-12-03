import { PartialType } from '@nestjs/mapped-types';
import { CreatePremiumPlanDto } from './create-premium-plan.dto';

export class UpdatePremiumPlanDto extends PartialType(CreatePremiumPlanDto) {}
