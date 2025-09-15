import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DashboardDocument = Dashboard & Document;

@Schema()
export class Dashboard {
  @Prop({ required: true })
  totalUsers: number;

  @Prop({ required: true })
  activeCourses: number;

  @Prop({ required: true })
  monthlyRevenue: number;

  @Prop({ required: true })
  liveWebinars: number;

  @Prop({ required: true })
  pendingKYC: number;

  @Prop({ required: true })
  growthRate: number;
}

export const DashboardSchema = SchemaFactory.createForClass(Dashboard);