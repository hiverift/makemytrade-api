import { PartialType } from '@nestjs/mapped-types';
import { CreateDashboardServiceDto } from './create-dashboard-service.dto';

export class UpdateDashboardServiceDto extends PartialType(CreateDashboardServiceDto) {}
