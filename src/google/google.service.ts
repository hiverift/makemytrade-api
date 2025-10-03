import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GoogleService {
  private readonly logger = new Logger(GoogleService.name);

  // Use env to decide path
  private getOAuth2ClientFromEnv() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirect = process.env.GOOGLE_REDIRECT_URI;
    if (!clientId || !clientSecret || !redirect) return null;
    return new google.auth.OAuth2(clientId, clientSecret, redirect);
  }

  // For Service Account:
  private getJwtClient(subject?: string) {
    const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
    if (!keyPath) return null;
    const keyJson = JSON.parse(readFileSync(keyPath, 'utf8'));
    const jwtClient = new google.auth.JWT({
      email: keyJson.client_email,
      key: keyJson.private_key,
      scopes: ['https://www.googleapis.com/auth/calendar.events'],
      subject: subject || process.env.GOOGLE_SERVICE_ACCOUNT_SUBJECT,
    });
    return jwtClient;
  }

  // create a calendar event with Meet link
  async createMeetEvent({
    calendarId = 'primary',
    title,
    description,
    start,
    end,
    oauthTokens, // optional: if provided, use OAuth2 tokens (access/refresh)
    subject,     // optional: service account impersonation user email
  }: {
    calendarId?: string;
    title: string;
    description?: string;
    start: string | Date;
    end: string | Date;
    oauthTokens?: { access_token: string; refresh_token?: string; expiry_date?: number };
    subject?: string;
  }) {
    try {
      let authClient: any = null;

      // prefer OAuth2 tokens if passed
      if (oauthTokens) {
        const o2 = this.getOAuth2ClientFromEnv();
        if (!o2) throw new Error('OAuth2 client not configured in env');
        o2.setCredentials(oauthTokens);
        authClient = o2;
      } else {
        // try service account
        const jwt = this.getJwtClient(subject);
        if (!jwt) throw new Error('No Google auth configured (provide oauth tokens or service account)');
        await jwt.authorize();
        authClient = jwt;
      }

      const calendar = google.calendar({ version: 'v3', auth: authClient });

      // unique requestId for conference creation
      const requestId = uuidv4();

      const event = {
        summary: title,
        description: description ?? '',
        start: { dateTime: new Date(start).toISOString() },
        end:   { dateTime: new Date(end).toISOString() },
        conferenceData: {
          createRequest: {
            requestId,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      };

      const res = await calendar.events.insert({
        calendarId,
        requestBody: event,
        conferenceDataVersion: 1,
      });

      // res.data contains event + conferenceData.entryPoints
      return res.data;
    } catch (e) {
      this.logger.error('createMeetEvent failed', e);
      throw e;
    }
  }

  // helper: generate OAuth2 consent URL (if you want to implement admin one-time auth)
  generateAuthUrl() {
    const o2 = this.getOAuth2ClientFromEnv();
    if (!o2) throw new Error('OAuth2 not configured');
    const url = o2.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.events'],
      prompt: 'consent',
    });
    return url;
  }

  // exchange code for token
  async getTokenFromCode(code: string) {
    const o2 = this.getOAuth2ClientFromEnv();
    if (!o2) throw new Error('OAuth2 not configured');
    const { tokens } = await o2.getToken(code);
    return tokens; // contains access_token, refresh_token etc
  }

   async createMeetEventUsingTokens(params: {
    oauthTokens: any,
    title: string,
    description?: string,
    start: string | Date,
    end: string | Date,
    calendarId?: string
  }) {
    try {
      const { oauthTokens, title, description, start, end, calendarId = 'primary' } = params;
      const o2 = this.getOAuth2Client();
      if (!o2) throw new Error('OAuth2 client not configured in env');
      o2.setCredentials(oauthTokens);
      const calendar = google.calendar({ version: 'v3', auth: o2 });

      const event = {
        summary: title,
        description: description || '',
        start: { dateTime: new Date(start).toISOString() },
        end: { dateTime: new Date(end).toISOString() },
        conferenceData: { createRequest: { requestId: `req-${Date.now()}`, conferenceSolutionKey: { type: 'hangoutsMeet' } } },
      };

      const res = await calendar.events.insert({
        calendarId,
        requestBody: event,
        conferenceDataVersion: 1,
      });

      return res.data;
    } catch (e) {
      this.logger.error('createMeetEventUsingTokens', e);
      throw e;
    }
  }
    getOAuth2Client() {
        return this.getOAuth2ClientFromEnv();
    }
}
