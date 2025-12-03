import { Test, TestingModule } from '@nestjs/testing';
import { PremiumPlanController } from './premium-plan.controller';
import { PremiumPlanService } from './premium-plan.service';

describe('PremiumPlanController', () => {
  let controller: PremiumPlanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PremiumPlanController],
      providers: [PremiumPlanService],
    }).compile();

    controller = module.get<PremiumPlanController>(PremiumPlanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
