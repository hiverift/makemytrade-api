import { Test, TestingModule } from '@nestjs/testing';
import { PremiumGroupMessagesService } from './premium-group-message.service';

describe('PremiumGroupMessageService', () => {
  let service: PremiumGroupMessagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PremiumGroupMessagesService],
    }).compile();

    service = module.get<PremiumGroupMessagesService>(PremiumGroupMessagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
