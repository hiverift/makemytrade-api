import { Test, TestingModule } from '@nestjs/testing';
import { PremiumGroupController } from './premium-group.controller';
import { PremiumGroupService } from './premium-group.service';

describe('PremiumGroupController', () => {
  let controller: PremiumGroupController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PremiumGroupController],
      providers: [PremiumGroupService],
    }).compile();

    controller = module.get<PremiumGroupController>(PremiumGroupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
