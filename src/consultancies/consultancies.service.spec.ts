import { Test, TestingModule } from '@nestjs/testing';
import { ConsultanciesService } from './consultancies.service';

describe('ConsultanciesService', () => {
  let service: ConsultanciesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsultanciesService],
    }).compile();

    service = module.get<ConsultanciesService>(ConsultanciesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
