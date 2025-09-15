import { Test, TestingModule } from '@nestjs/testing';
import { DashboardServiceController } from './dashboard-service.controller';
import { DashboardServiceService } from './dashboard-service.service';

describe('DashboardServiceController', () => {
  let controller: DashboardServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardServiceController],
      providers: [DashboardServiceService],
    }).compile();

    controller = module.get<DashboardServiceController>(DashboardServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
