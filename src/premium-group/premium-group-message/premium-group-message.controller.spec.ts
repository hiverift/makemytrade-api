import { Test, TestingModule } from '@nestjs/testing';
import { PremiumGroupMessageController } from './premium-group-message.controller';

describe('PremiumGroupMessageController', () => {
  let controller: PremiumGroupMessageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PremiumGroupMessageController],
    }).compile();

    controller = module.get<PremiumGroupMessageController>(PremiumGroupMessageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
