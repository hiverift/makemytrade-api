import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Dashboard,DashboardDocument } from './entities/dashboard-service.entity';
import { UsersService } from '../users/users.service';
import { CoursesService } from 'src/courses/courses.service';
import CustomResponse from 'src/providers/custom-response.service';
import CustomError from 'src/providers/customer-error.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Dashboard.name) private dashboardModel: Model<DashboardDocument>,
    private usersService: UsersService,
    private couseservice : CoursesService
  ) {}

  async getDashboardData() {
    try {
      const totalUsers = await this.usersService.findAllUsers();
      //const activeCourses = await this.dashboardModel.countDocuments({ status: 'active' }).catch(() => 0); // Fallback
      const activeCourses = await this.couseservice.activCourses();
      const monthlyRevenue = await this.calculateMonthlyRevenue();
      const liveWebinars = 3; // Static for now, replace with actual logic
      // const pendingKYC = await this.usersService.findAll().then((res) =>
      //   res.data.filter((user) => !user.kycVerified).length,
      // ).catch(() => 0);
      const pendingKYC=0;
      const growthRate = 15.3; // Static for now, replace with actual calculation

      const dashboardData = new this.dashboardModel({
        totalUsers,
        activeCourses,
        monthlyRevenue,
        liveWebinars,
        pendingKYC,
        growthRate,
      });

      await dashboardData.save();

      return new CustomResponse(200, 'Dashboard data fetched and saved successfully', dashboardData);
    } catch (e) {
      throw new CustomError(500, 'Failed to fetch dashboard data');
    }
  }

  private async calculateMonthlyRevenue(): Promise<number> {
    // Simulate revenue calculation (replace with actual logic)
    return 254000; // Example value
  }
}