import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  ) {}

  async saveTransaction(dto: CreateTransactionDto) {
    const session = await this.transactionModel.db.startSession();
    session.startTransaction();

    try {
      const transaction = new this.transactionModel({
        paymentId: dto.paymentId,
        orderId: dto.orderId,
        amount: dto.amount,
        userId: dto.userId,
        date: dto.date,
        status: dto.status,
      });

      await transaction.save({ session });

      await session.commitTransaction();
      session.endSession();

      return transaction;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw new Error('Transaction failed');
    }
  }
}