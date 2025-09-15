import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard-service.service';


@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboardData() {
 
      const response = await this.dashboardService.getDashboardData();
      return response;
    
  }
}