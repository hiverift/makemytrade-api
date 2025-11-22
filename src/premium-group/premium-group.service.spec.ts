import { Test, TestingModule } from '@nestjs/testing';
import { PremiumGroupsService } from './premium-group.service';

describe('PremiumGroupService', () => {
  let service: PremiumGroupsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PremiumGroupsService],
    }).compile();

    service = module.get<PremiumGroupsService>(PremiumGroupsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
