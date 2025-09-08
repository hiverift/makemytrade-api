import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { CreateContactDto } from './dto/create-contact-dto';
import CustomResponse from 'src/providers/custom-response.service';
import CustomError from 'src/providers/customer-error.service';
import nodemailer from 'nodemailer';
import { Contact } from './entities/contact.schema';

@Injectable()
export class ContactService {
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    @InjectModel(Contact.name) private contactModel: Model<Contact>,
  ) {
    // Initialize Nodemailer transporter for Gmail (use App Password if 2FA enabled)
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('GMAIL_USER'),
        pass: this.configService.get<string>('GMAIL_PASS'),
      },
    });
  }

  /**
   * Build CA-branded acknowledgement email for client (HTML + text)
   */
  private buildClientAckEmail(dto: CreateContactDto) {
    const { fullName, subject, message } = dto;

    const firmName = this.configService.get<string>('FIRM_NAME') || 'Apex Chartered Accountants';
    const firmWebsite = this.configService.get<string>('FIRM_WEBSITE') || 'https://your-ca-website.example';
    const phone = this.configService.get<string>('FIRM_PHONE') || '+91-99XXXXXXXX';
    const address = this.configService.get<string>('FIRM_ADDRESS') || 'Office: 12B, Finance Tower, MG Road, City';
    const registration = this.configService.get<string>('FIRM_REG') || 'Firm Reg. No: ICAI/123456';

    const text = `Dear ${fullName || 'Client'},

Thank you for contacting ${firmName}.

Subject: ${subject || '—'}
Message:
${message || '—'}

Our team will review your query and respond shortly. For urgent matters call: ${phone}

Regards,
${firmName}
${firmWebsite}
${address}
${registration}
`;

    const html = `
    <!doctype html>
    <html lang="en">
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#f3f5f7;font-family:Helvetica,Arial,sans-serif;color:#1b1f23;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px;">
        <tr><td align="center">
          <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e6e9ec;">
            <tr><td style="padding:18px 22px;background:#0b2340;color:#fff;">
              <table width="100%"><tr>
                <td><img src="${this.configService.get<string>('FIRM_LOGO_URL') || 'https://via.placeholder.com/140x40?text=Logo'}" alt="${firmName}" width="140" style="display:block;border:0;"></td>
                <td style="text-align:right;"><div style="font-size:14px;font-weight:600;color:#f6e8c3;">${firmName}</div>
                <div style="font-size:11px;opacity:0.9;margin-top:2px;">Chartered Accountants & Financial Advisors</div></td>
              </tr></table>
            </td></tr>

            <tr><td style="padding:22px 26px 12px 26px;">
              <h2 style="margin:0 0 8px 0;font-size:18px;color:#0b2340;font-weight:700;">Thank you — we received your enquiry</h2>
              <p style="margin:0 0 14px 0;font-size:14px;color:#444;line-height:1.5;">
                Dear <strong>${this.escapeHtml(fullName) || 'Client'}</strong>,<br>
                We appreciate you contacting ${firmName}. Our team will review your message and reply within 1 business day.
              </p>
            </td></tr>

            <tr><td style="padding:0 26px 18px 26px;">
              <table width="100%" style="border-radius:6px;background:#fbfbfd;border:1px solid #eef1f6;">
                <tr><td style="padding:14px 16px;">
                  <p style="margin:0 0 8px 0;font-size:13px;color:#222;"><strong>Subject:</strong> ${this.escapeHtml(subject) || '—'}</p>
                  <hr style="border:none;border-top:1px solid #eef1f6;margin:10px 0;">
                  <p style="margin:0;font-size:13px;color:#444;white-space:pre-wrap;">${this.escapeHtml(message) || '—'}</p>
                </td></tr>
              </table>
            </td></tr>

            <tr><td style="padding:6px 26px 18px 26px;">
              <a href="${firmWebsite}" style="display:inline-block;padding:10px 14px;border-radius:6px;text-decoration:none;font-weight:600;border:1px solid #c6a15a;color:#0b2340;background:#fff;">Visit Website</a>
              <a href="tel:${phone.replace(/[^\d+]/g,'')}" style="display:inline-block;margin-left:10px;padding:10px 14px;border-radius:6px;text-decoration:none;font-weight:600;background:#0b2340;color:#fff;">Call: ${phone}</a>
            </td></tr>

            <tr><td style="padding:16px 26px 22px 26px;background:#fbfbfd;border-top:1px solid #eef1f6;color:#5b6168;font-size:13px;">
              <table width="100%"><tr>
                <td style="vertical-align:top;padding-right:12px;">
                  <strong style="color:#0b2340;">${firmName}</strong><br/>${this.escapeHtml(address)}<br/>${this.escapeHtml(registration)}
                </td>
                <td style="vertical-align:top;text-align:right;">
                  <div style="font-size:13px;"><strong>Phone:</strong> ${phone}</div>
                  <div style="margin-top:6px;"><a href="${firmWebsite}" style="color:#0b2340;text-decoration:none;font-weight:600;">Book a Consultation</a></div>
                </td>
              </tr></table>
            </td></tr>

          </table>

          <div style="font-size:11px;color:#9aa0a6;margin-top:12px;max-width:620px;text-align:center;">
            This is an automated acknowledgement from ${firmName}. We treat client information confidentially.
          </div>

        </td></tr>
      </table>
    </body>
    </html>
    `;

    return { text, html };
  }

  /**
   * Build email that will be sent to the CA firm (detailed message from client)
   */
  private buildFirmNotificationEmail(dto: CreateContactDto) {
    const { fullName, emailAddress, subject, message } = dto;

    const firmName = this.configService.get<string>('FIRM_NAME') || 'Apex Chartered Accountants';
    const html = `
      <!doctype html><html><head><meta charset="utf-8"></head>
      <body style="font-family:Helvetica,Arial,sans-serif;color:#111;">
        <div style="max-width:700px;padding:18px;border:1px solid #e6e9ec;border-radius:6px;">
          <h2 style="margin:0 0 8px 0;color:#0b2340;">New contact form submission</h2>
          <p style="margin:0 0 10px 0;">You have received a new enquiry via the website contact form.</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px;border-top:1px solid #f0f0f0;"><strong>Client name</strong></td><td style="padding:8px;border-top:1px solid #f0f0f0;">${this.escapeHtml(fullName) || '—'}</td></tr>
            <tr><td style="padding:8px;border-top:1px solid #f0f0f0;"><strong>Client email</strong></td><td style="padding:8px;border-top:1px solid #f0f0f0;">${this.escapeHtml(emailAddress) || '—'}</td></tr>
            <tr><td style="padding:8px;border-top:1px solid #f0f0f0;"><strong>Subject</strong></td><td style="padding:8px;border-top:1px solid #f0f0f0;">${this.escapeHtml(subject) || '—'}</td></tr>
            <tr><td style="padding:8px;border-top:1px solid #f0f0f0;vertical-align:top;"><strong>Message</strong></td><td style="padding:8px;border-top:1px solid #f0f0f0;white-space:pre-wrap;">${this.escapeHtml(message) || '—'}</td></tr>
          </table>
          <p style="margin:12px 0 0 0;font-size:13px;color:#555;">Reply to client by clicking reply (reply-to is set to client's email).</p>
        </div>
      </body></html>
    `;
    const text = `New contact form submission from ${fullName || 'Client'} (${emailAddress || '—'})\nSubject: ${subject || '—'}\n\n${message || '—'}`;

    return { text, html };
  }

  /**
   * Simple HTML escape to avoid injection / broken markup in emails
   */
  private escapeHtml(unsafe?: string) {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Create contact: save to DB and send emails
   * - Primary: send notification to CA firm (CONTACT_RECEIVER_EMAIL)
   * - Optional: send acknowledgement to client (if client provided email)
   */
  async createContact(dto: CreateContactDto) {
    try {
      const { fullName, emailAddress, subject } = dto;

      // Save to MongoDB
      const contact = new this.contactModel(dto);
      await contact.save();

      // --- 1) Notify the firm (CA) ---
      const receiver = this.configService.get<string>('CONTACT_RECEIVER_EMAIL');
      if (!receiver) {
        console.warn('CONTACT_RECEIVER_EMAIL is not set in env/config. Firm will not receive notifications.');
      } else {
        const { text: firmText, html: firmHtml } = this.buildFirmNotificationEmail(dto);

        // send mail to firm; set replyTo so firm can reply to client directly
        await this.transporter.sendMail({
          from: `"${this.configService.get<string>('FIRM_NAME') || 'Apex CA'}" <${this.configService.get<string>('GMAIL_USER')}>`,
          to: receiver,
          subject: `New enquiry from ${fullName || 'Client'}${subject ? ' — ' + subject : ''}`,
          text: firmText,
          html: firmHtml,
          replyTo: emailAddress || undefined,
        });
        console.log('Notification email sent to firm:', receiver);
      }

      // --- 2) (Optional) Acknowledgement to client ---
      if (emailAddress) {
        const { text: clientText, html: clientHtml } = this.buildClientAckEmail(dto);
        await this.transporter.sendMail({
          from: `"${this.configService.get<string>('FIRM_NAME') || 'Apex CA'}" <${this.configService.get<string>('GMAIL_USER')}>`,
          to: emailAddress,
          subject: `${this.configService.get<string>('FIRM_NAME') || 'Apex CA'} — We received your enquiry${subject ? ': ' + subject : ''}`,
          text: clientText,
          html: clientHtml,
        });
        console.log('Acknowledgement email sent to client:', emailAddress);
      }

      return new CustomResponse(201, 'Contact form submitted successfully', contact);
    } catch (e) {
      console.error('Error submitting contact form:', e);
      return new CustomError(500, 'Failed to submit contact form');
    }
  }

  async getAllContacts() {
    try {
      const contacts = await this.contactModel.find().lean();
      return new CustomResponse(200, 'Contacts fetched successfully', contacts);
    } catch (e) {
      console.error('Error fetching contacts:', e);
      return new CustomError(500, 'Failed to fetch contacts');
    }
  }

  async getContactById(id: string) {
    try {
      const contact = await this.contactModel.findById(id).lean();
      if (!contact) {
        return new CustomError(404, 'Contact not found');
      }
      return new CustomResponse(200, 'Contact fetched successfully', contact);
    } catch (e) {
      console.error('Error fetching contact by id:', e);
      return new CustomError(500, 'Failed to fetch contact');
    }
  }
}
