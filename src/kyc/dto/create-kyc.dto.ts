export class CreateKycDto {
  userId: string;
  aadhaarFrontDoc: Express.Multer.File; // Aadhaar front
  aadhaarBackDoc: Express.Multer.File;  // Aadhaar back
  panFrontDoc: Express.Multer.File;     // PAN front
  panBackDoc: Express.Multer.File;      // PAN back
  remark?: string;
}