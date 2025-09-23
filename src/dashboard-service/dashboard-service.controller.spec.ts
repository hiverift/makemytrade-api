import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard-service.controller';
import { DashboardService} from './dashboard-service.service';

describe('DashboardServiceController', () => {
  let controller: DashboardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [DashboardService],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
