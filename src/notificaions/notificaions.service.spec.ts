import { Test, TestingModule } from '@nestjs/testing';
import { NotificaionsService } from './notificaions.service';

describe('NotificaionsService', () => {
  let service: NotificaionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificaionsService],
    }).compile();

    service = module.get<NotificaionsService>(NotificaionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
