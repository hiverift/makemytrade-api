import { Test, TestingModule } from '@nestjs/testing';
import { PremiumPlanService } from './premium-plan.service';

describe('PremiumPlanService', () => {
  let service: PremiumPlanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PremiumPlanService],
    }).compile();

    service = module.get<PremiumPlanService>(PremiumPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
