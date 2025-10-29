import { Controller, Post, Req, Get, Put, Param, Body, UseInterceptors, UploadedFiles, Query } from '@nestjs/common';
import { KycService } from './kyc.service';
import { CreateKycDto } from './dto/create-kyc.dto';
import CustomResponse from 'src/providers/custom-response.service';
import CustomError from 'src/providers/customer-error.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  /**
   * Expects multipart/form-data with these fields:
   * - aadhaarFront (single file)
   * - aadhaarBack  (single file)
   * - panFront     (single file)
   * - panBack      (single file)
   */
  @Post('submit')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'aadhaarFront', maxCount: 1 },
      { name: 'aadhaarBack', maxCount: 1 },
      { name: 'panFront', maxCount: 1 },
      { name: 'panBack', maxCount: 1 },
    ]),
  )
  submitKyc(@Body() dto: any, @UploadedFiles() files: {
    aadhaarFront?: Express.Multer.File[],
    aadhaarBack?: Express.Multer.File[],
    panFront?: Express.Multer.File[],
    panBack?: Express.Multer.File[],
  }){
    console.log(dto)
    return this.kycService.submitKyc(dto, files);
  }

  @Get('status/:userId')
  getKycStatus(@Param('userId') userId: string) {
    return this.kycService.getKycStatus(userId);
  }

  @Put('status/:userId')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'aadhaarFront', maxCount: 1 },
      { name: 'aadhaarBack', maxCount: 1 },
      { name: 'panFront', maxCount: 1 },
      { name: 'panBack', maxCount: 1 },
    ]),
  )
  updateKycStatus(
    @Param('userId') userId: string,
    @Body() body: any, // keep any while debugging; later you can use DTO
    @UploadedFiles() files: {
      aadhaarFront?: Express.Multer.File[],
      aadhaarBack?: Express.Multer.File[],
      panFront?: Express.Multer.File[],
      panBack?: Express.Multer.File[],
    },
    @Req() req: any,
  ) {
    // debug logs (remove in production)
    console.log('content-type:', req.headers['content-type']);
    console.log('body:', body);
    console.log('files:', Object.keys(files || {}));
    // pass status/remark and files to service
    return this.kycService.updateKycStatus(userId, body?.status, body?.remark, files);
  }

  /**
   * GET /kyc/list
   * Optional query params:
   * - page (default 1)
   * - limit (default 20)
   * - status (optional) to filter by status
   */
  @Get('list')
  listAllKycs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const p = parseInt(page as any, 10) || 1;
    const l = parseInt(limit as any, 10) || 20;
    return this.kycService.listKycs({ page: p, limit: l, status });
  }

  /**
   * Approve a user's KYC
   * PUT /kyc/approve/:userId
   * body: { remark?: string, approvedBy?: string }
   */
  @Put('approve/:userId')
  approveKyc(
    @Param('userId') userId: string,
    @Body() body: any,
  ) {
    return this.kycService.approveKyc(userId, body?.remark, body?.approvedBy);
  }
}
