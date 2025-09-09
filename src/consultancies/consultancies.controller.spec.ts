import { Test, TestingModule } from '@nestjs/testing';
import { ConsultanciesController } from './consultancies.controller';
import { ConsultanciesService } from './consultancies.service';

describe('ConsultanciesController', () => {
  let controller: ConsultanciesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsultanciesController],
      providers: [ConsultanciesService],
    }).compile();

    controller = module.get<ConsultanciesController>(ConsultanciesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
