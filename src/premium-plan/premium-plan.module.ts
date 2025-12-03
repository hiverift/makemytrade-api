import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PremiumPlan } from './entities/premium-plan.entity';
import { PremiumPlanService } from './premium-plan.service';
import { PremiumPlanController } from './premium-plan.controller';
import { PremiumPlanSchema } from './entities/premium-plan.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PremiumPlan.name, schema: PremiumPlanSchema },
    ]),
  ],
  controllers: [PremiumPlanController],
  providers: [PremiumPlanService],
  exports: [PremiumPlanService],
})
export class PremiumPlanModule {}
