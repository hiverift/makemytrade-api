import { Test, TestingModule } from '@nestjs/testing';
import { WebinarController } from './webinar.controller';
import { WebinarsService } from './webinar.service';

describe('WebinarController', () => {
  let controller: WebinarController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebinarController],
      providers: [WebinarsService],
    }).compile();

    controller = module.get<WebinarController>(WebinarController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
