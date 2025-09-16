import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Kyc, KycDocument } from './entities/kyc.entity';
import { CreateKycDto } from './dto/create-kyc.dto';
import CustomResponse from 'src/providers/custom-response.service';
import CustomError from 'src/providers/customer-error.service';
import { fileUpload } from 'src/util/fileupload';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class KycService {
  constructor(@InjectModel(Kyc.name) private kycModel: Model<KycDocument>) {}

  async submitKyc(dto: CreateKycDto, files: {
    aadhaarFront?: Express.Multer.File[],
    aadhaarBack?: Express.Multer.File[],
    panFront?: Express.Multer.File[],
    panBack?: Express.Multer.File[],
  }): Promise<CustomResponse> {
    try {
      // Expect exactly one file per field
      if (
        !files ||
        !files.aadhaarFront?.[0] ||
        !files.aadhaarBack?.[0] ||
        !files.panFront?.[0] ||
        !files.panBack?.[0]
      ) {
        throw new CustomError(
          400,
          'Please upload aadhaarFront, aadhaarBack, panFront and panBack files'
        );
      }

      // Use the shared fileUpload util to store files under 'kyc' folder
      const aadhaarFrontFile = files.aadhaarFront[0];
      const aadhaarBackFile = files.aadhaarBack[0];
      const panFrontFile = files.panFront[0];
      const panBackFile = files.panBack[0];

      const aadhaarFrontName = fileUpload('kyc', aadhaarFrontFile);
      const aadhaarBackName = fileUpload('kyc', aadhaarBackFile);
      const panFrontName = fileUpload('kyc', panFrontFile);
      const panBackName = fileUpload('kyc', panBackFile);

      const baseUrl = process.env.SERVER_BASE_URL?.replace(/\/$/, '') || '';
      console.log(dto.userId)
      const kyc = new this.kycModel({
        userId: dto.userId,
        aadhaarFrontDoc: `${baseUrl}/uploads/kyc/${aadhaarFrontName}`,
        aadhaarBackDoc: `${baseUrl}/uploads/kyc/${aadhaarBackName}`,
        panFrontDoc: `${baseUrl}/uploads/kyc/${panFrontName}`,
        panBackDoc: `${baseUrl}/uploads/kyc/${panBackName}`,
        status: 'pending',
        remark: dto.remark || 'Documents under review by our team',
      });

      await kyc.save();

      return new CustomResponse(200, 'KYC submitted successfully', kyc);
    } catch (e) {
      // surface CustomError directly, map other errors to 500 with message
      if (e instanceof CustomError) {
        throw e;
      }
      // if it's a BadRequestException from fileUpload util or others, convert
      const message = e?.message || 'Failed to submit KYC';
      throw new CustomError(500, message);
    }
  }

  async getKycStatus(userId: string): Promise<CustomResponse> {
    try {
      const kyc = await this.kycModel.findOne({ userId });
      if (!kyc) {
        throw new CustomError(404, 'KYC record not found');
      }
      return new CustomResponse(200, 'KYC status fetched successfully', kyc);
    } catch (e) {
      if (e instanceof CustomError) {
        throw e;
      }
      throw new CustomError(500, 'Failed to fetch KYC status');
    }
  }
async updateKycStatus(
    userId: string,
    status?: string,
    remark?: string,
    files?: {
      aadhaarFront?: Express.Multer.File[],
      aadhaarBack?: Express.Multer.File[],
      panFront?: Express.Multer.File[],
      panBack?: Express.Multer.File[],
    }
  ): Promise<CustomResponse> {
    try {
      const kyc = await this.kycModel.findOne({ userId });
      if (!kyc) {
        throw new CustomError(404, 'KYC record not found');
      }

      const updates: Partial<Kyc> = {};

      // update status/remark if provided
      if (typeof status === 'string' && status.trim() !== '') {
        updates.status = status;
      }
      if (typeof remark === 'string') {
        updates.remark = remark;
      }

      // helper to delete old file given stored url
      const deleteOldFile = (fileUrl?: string) => {
        if (!fileUrl) return;
        try {
          const fileName = path.basename(fileUrl);
          const filePath = path.join(__dirname, '..', '..', 'public', 'uploads', 'kyc', fileName);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          // non-fatal: log and continue
          console.warn('Failed to delete old file:', err?.message || err);
        }
      };

      const baseUrl = process.env.SERVER_BASE_URL?.replace(/\/$/, '') || '';

      // If new files provided, upload and replace fields (and remove old files)
      if (files) {
        if (files.aadhaarFront?.[0]) {
          const newName = fileUpload('kyc', files.aadhaarFront[0]);
          deleteOldFile(kyc.aadhaarFrontDoc);
          updates.aadhaarFrontDoc = `${baseUrl}/uploads/kyc/${newName}`;
        }
        if (files.aadhaarBack?.[0]) {
          const newName = fileUpload('kyc', files.aadhaarBack[0]);
          deleteOldFile(kyc.aadhaarBackDoc);
          updates.aadhaarBackDoc = `${baseUrl}/uploads/kyc/${newName}`;
        }
        if (files.panFront?.[0]) {
          const newName = fileUpload('kyc', files.panFront[0]);
          deleteOldFile(kyc.panFrontDoc);
          updates.panFrontDoc = `${baseUrl}/uploads/kyc/${newName}`;
        }
        if (files.panBack?.[0]) {
          const newName = fileUpload('kyc', files.panBack[0]);
          deleteOldFile(kyc.panBackDoc);
          updates.panBackDoc = `${baseUrl}/uploads/kyc/${newName}`;
        }
      }

      // If nothing to update:
      if (Object.keys(updates).length === 0) {
        return new CustomResponse(200, 'No changes provided', kyc);
      }

      const updated = await this.kycModel.findOneAndUpdate(
        { userId },
        { $set: updates },
        { new: true, runValidators: true },
      );

      return new CustomResponse(200, 'KYC updated successfully', updated);
    } catch (e) {
      if (e instanceof CustomError) throw e;
      throw new CustomError(500, e?.message || 'Failed to update KYC status');
    }
  }
}
