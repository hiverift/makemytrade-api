import { Test, TestingModule } from '@nestjs/testing';
import { WebinarService } from './webinar.service';

describe('WebinarService', () => {
  let service: WebinarService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebinarService],
    }).compile();

    service = module.get<WebinarService>(WebinarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
