import { Test, TestingModule } from '@nestjs/testing';
import { NotificaionsController } from './notificaions.controller';
import { NotificaionsService } from './notificaions.service';

describe('NotificaionsController', () => {
  let controller: NotificaionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificaionsController],
      providers: [NotificaionsService],
    }).compile();

    controller = module.get<NotificaionsController>(NotificaionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
