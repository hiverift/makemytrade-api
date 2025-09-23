// src/payment/webhook-verifier.ts (or put in OrdersService)
import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebhookVerifier {
  constructor(private readonly configService: ConfigService) {}

  verify(raw: Buffer | string, signatureHeader: string | undefined): boolean {
    const secret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET') || '';
    if (!secret || !signatureHeader) return false;

    // raw may be a Buffer (preferred) or a string (if you constructed it)
    const rawBuf = Buffer.isBuffer(raw) ? raw : Buffer.from(String(raw), 'utf8');

    const expected = crypto.createHmac('sha256', secret).update(rawBuf).digest('hex');
    return expected === signatureHeader;
  }
}
