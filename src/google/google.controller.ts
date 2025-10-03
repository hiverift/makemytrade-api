// src/google/google.controller.ts
import { Controller, Get, Query, Res, Logger } from '@nestjs/common';
import express from 'express';
import { GoogleService } from './google.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId, Types } from 'mongoose';
import { Admin } from '../users/entities/admin.entity';
import CustomResponse from 'src/providers/custom-response.service';
import CustomError from 'src/providers/customer-error.service';

@Controller('google')
export class GoogleController {
  private readonly logger = new Logger(GoogleController.name);
  constructor(
    private readonly googleService: GoogleService,
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
  ) {}

  // returns URL to open in browser (admin uses it)
  @Get('auth-url')
  authUrl() {
    try {
      const url = this.googleService.generateAuthUrl();
      return new CustomResponse(200, 'Auth url generated', { url });
    } catch (e:any) {
      this.logger.error(e);
      return new CustomError(500, e?.message || 'Failed to generate auth url');
    }
  }

  // Google will redirect here with ?code=...
  // Save tokens against admin (query must contain adminEmail to identify)
  @Get('oauth2callback')
  async oauthCallback(@Query('code') code: string, @Query('adminEmail') adminEmail: string, @Res() res: express.Response) {
    try {
      if (!code) {
        return res.status(400).send('Missing code');
      }
      if (!adminEmail) {
        return res.status(400).send('Missing adminEmail query param (where to save tokens)');
      }

      const tokens = await this.googleService.getTokenFromCode(code);
      // tokens includes refresh_token on first grant; access_token & expiry_date too

      // find admin by email and save tokens (upsert if desired)
      const admin = await this.adminModel.findOneAndUpdate(
        { email: adminEmail },
        { $set: { googleOauthTokens: tokens, name: adminEmail.split('@')[0] } },
        { upsert: true, new: true }
      );

      // Redirect to a success page in your admin UI or return JSON
      // For demo: show a small HTML page
      res.send(`
        <h3>Google OAuth success</h3>
        <p>Tokens saved for admin: ${admin.email}</p>
        <p>You can close this window.</p>
      `);
    } catch (e:any) {
      this.logger.error('oauthCallback error', e);
      res.status(500).send('OAuth callback error: ' + (e?.message || e));
    }
  }
}
