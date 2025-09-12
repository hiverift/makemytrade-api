import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import CustomResponse from 'src/providers/custom-response.service';
import CustomError from 'src/providers/customer-error.service';
import { ServiceItem } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  private logger = new Logger(ServicesService.name);
  constructor(@InjectModel(ServiceItem.name) private model: Model<ServiceItem>) {}

  async create(dto: CreateServiceDto) {
    try {
      if (dto.order === undefined) {
        const last = await this.model.findOne().sort({order:-1}).lean();
        dto.order = last ? (last.order||0)+1 : 0;
      }
      const doc = new this.model(dto);
      await doc.save();
      return new CustomResponse(201,'Service created', doc.toObject());
    } catch(e:any){ this.logger.error(e); return new CustomError(500,e?.message||'Create failed');}
  }
  async list(activeOnly=false){
    try{
      const q = activeOnly ? {active:true} : {};
      const items = await this.model.find(q).sort({order:1,createdAt:-1}).lean();
      return new CustomResponse(200,'Services fetched', items);
    }catch(e:any){ return new CustomError(500,e?.message||'Fetch failed');}
  }
  async get(id:string){
    try{
      const item = await this.model.findById(id).lean();
      if(!item) return new CustomError(404,'Service not found');
      return new CustomResponse(200,'Service fetched', item);
    }catch(e:any){ return new CustomError(500,e?.message||'Fetch failed');}
  }
  async update(id:string,dto:UpdateServiceDto){
    try{
      const up = await this.model.findByIdAndUpdate(id,dto,{new:true}).lean();
      if(!up) return new CustomError(404,'Service not found');
      return new CustomResponse(200,'Service updated', up);
    }catch(e:any){ return new CustomError(500,e?.message||'Update failed');}
  }
  async remove(id:string){
    try{
      const del = await this.model.findByIdAndDelete(id).lean();
      if(!del) return new CustomError(404,'Service not found');
      return new CustomResponse(200,'Service deleted',{deleted:true});
    }catch(e:any){ return new CustomError(500,e?.message||'Delete failed');}
  }
}
