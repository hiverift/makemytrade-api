import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { CreateContactDto } from './dto/create-contact-dto';
import { Enquiry,EnquirySchema } from './entities/rrp.schema';
import CustomResponse from 'src/providers/custom-response.service';
import CustomError from 'src/providers/customer-error.service';
import nodemailer from 'nodemailer';
import { Contact } from './entities/contact.schema';
const RPP_REALTOR_FALLBACK = 'realtoredmontonab@gmail.com';
@Injectable()
export class ContactService {
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    @InjectModel(Contact.name) private contactModel: Model<Contact>,
    @InjectModel(Enquiry.name) private enquiryModel: Model<Enquiry>,
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
              <a href="tel:${phone.replace(/[^\d+]/g, '')}" style="display:inline-block;margin-left:10px;padding:10px 14px;border-radius:6px;text-decoration:none;font-weight:600;background:#0b2340;color:#fff;">Call: ${phone}</a>
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
  private buildClientAckEmailHiverift(dto: CreateContactDto) {
    const { fullName, subject, message } = dto;

    // Environment / config-based values (change these in your env or config service)
    const companyName = this.configService.get<string>('HIVERIFT_NAME') || 'Hiverift';
    const companyTagline = this.configService.get<string>('HIVERIFT_TAGLINE') || 'Product & Growth Studio';
    const companyWebsite = this.configService.get<string>('HIVERIFT_WEBSITE') || 'https://hiverift.com/';
    const phone = this.configService.get<string>('HIVERIFT_PHONE') || '+91-88-1493-0229';
    const address = this.configService.get<string>('HIVERIFT_ADDRESS') || 'New Delhi, New Rohtak Rd, Ratan Nagar, Karol Bagh, Delhi, 110005';
    const logoUrl = this.configService.get<string>('HIVERIFT_LOGO_URL') || 'https://via.placeholder.com/140x40?text=Hiverift';
    const supportEmail = this.configService.get<string>('HIVERIFT_SUPPORT_EMAIL') || 'support@hiverift.com';

    // Plain-text fallback
    const text = `Dear ${fullName || 'Client'},

Thank you for contacting ${companyName}.

Subject: ${subject || '—'}
Message:
${message || '—'}

Our team at ${companyName} will review your query and get back to you shortly. For urgent matters, call: ${phone} or email: ${supportEmail}

Regards,
${companyName}
${companyWebsite}
${address}
`;

    // HTML acknowledgement (uses escapeHtml for user-provided fields)
    const html = `
  <!doctype html>
  <html lang="en">
  <head><meta charset="utf-8"></head>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:Helvetica,Arial,sans-serif;color:#1b1f23;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px;">
      <tr><td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e6e9ec;">
          <tr><td style="padding:18px 22px;background:#0b2340;color:#fff;">
            <table width="100%"><tr>
              <td><img src="${logoUrl}" alt="${companyName}" width="140" style="display:block;border:0;"></td>
              <td style="text-align:right;">
                <div style="font-size:14px;font-weight:700;color:#f6e8c3;">${companyName}</div>
                <div style="font-size:11px;opacity:0.9;margin-top:2px;">${companyTagline}</div>
              </td>
            </tr></table>
          </td></tr>

          <tr><td style="padding:22px 26px 12px 26px;">
            <h2 style="margin:0 0 8px 0;font-size:18px;color:#0b2340;font-weight:700;">Thanks — we received your message</h2>
            <p style="margin:0 0 14px 0;font-size:14px;color:#444;line-height:1.5;">
              Dear <strong>${this.escapeHtml(fullName) || 'Client'}</strong>,<br/>
              Thanks for reaching out to ${companyName}. Our team has received your enquiry and will reply within 1 business day.
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
            <a href="${companyWebsite}" style="display:inline-block;padding:10px 14px;border-radius:6px;text-decoration:none;font-weight:600;border:1px solid #c6a15a;color:#0b2340;background:#fff;">Visit Hiverift</a>
            <a href="tel:${phone.replace(/[^\d+]/g, '')}" style="display:inline-block;margin-left:10px;padding:10px 14px;border-radius:6px;text-decoration:none;font-weight:600;background:#0b2340;color:#fff;">Call: ${phone}</a>
            <a href="mailto:${supportEmail}" style="display:inline-block;margin-left:10px;padding:10px 14px;border-radius:6px;text-decoration:none;font-weight:600;border:1px solid #e1e5ea;color:#0b2340;background:#fff;">Email Support</a>
          </td></tr>

          <tr><td style="padding:16px 26px 22px 26px;background:#fbfbfd;border-top:1px solid #eef1f6;color:#5b6168;font-size:13px;">
            <table width="100%"><tr>
              <td style="vertical-align:top;padding-right:12px;">
                <strong style="color:#0b2340;">${companyName}</strong><br/>${this.escapeHtml(address)}<br/>
              </td>
              <td style="vertical-align:top;text-align:right;">
                <div style="font-size:13px;"><strong>Phone:</strong> ${phone}</div>
                <div style="margin-top:6px;"><a href="${companyWebsite}" style="color:#0b2340;text-decoration:none;font-weight:600;">Request a Demo</a></div>
              </td>
            </tr></table>
          </td></tr>

        </table>

        <div style="font-size:11px;color:#9aa0a6;margin-top:12px;max-width:620px;text-align:center;">
          This is an automated acknowledgement from ${companyName}. If you did not contact us, please ignore this email or write to ${supportEmail}.
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
  private buildFirmNotificationEmailHiveRift(dto: CreateContactDto) {
    const { fullName, emailAddress, subject, message } = dto;

    const firmName = ' Hiverift Product Solutions';
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

  async createContactTohiverift(dto: CreateContactDto) {
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
        const { text: firmText, html: firmHtml } = this.buildFirmNotificationEmailHiveRift(dto);

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
        const { text: clientText, html: clientHtml } = this.buildClientAckEmailHiverift(dto);
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
// .env me yeh keys rakho (niche list di hai)


private buildRppFirmNotificationEmail(enquiryModel: any) {
  const {
    firstName,
    lastName,
    email,
    phone,
    goal,
    firstHouse,
    budget,
    timeline,
    location,
    propertyType,
    additionalInfo,
  } = enquiryModel;

  const subject = `RightPricePumps enquiry from ${firstName || ''} ${lastName || ''}`;

  const html = `
    <!doctype html><html><head><meta charset="utf-8"></head>
    <body style="font-family:Helvetica,Arial,sans-serif;color:#111;">
      <div style="max-width:700px;padding:18px;border:1px solid #e6e9ec;border-radius:6px;">
        <h2 style="margin:0 0 8px 0;color:#0b2340;">RightPricePumps — New enquiry</h2>
        <p>You have a new RightPricePumps enquiry submitted via the website.</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px;border-top:1px solid #f0f0f0;"><strong>First name</strong></td><td style="padding:8px;border-top:1px solid #f0f0f0;">${this.escapeHtml(firstName) || '—'}</td></tr>
          <tr><td style="padding:8px;"><strong>Last name</strong></td><td style="padding:8px;">${this.escapeHtml(lastName) || '—'}</td></tr>
          <tr><td style="padding:8px;"><strong>Email</strong></td><td style="padding:8px;">${this.escapeHtml(email) || '—'}</td></tr>
          <tr><td style="padding:8px;"><strong>Phone</strong></td><td style="padding:8px;">${this.escapeHtml(phone) || '—'}</td></tr>
          <tr><td style="padding:8px;"><strong>Goal</strong></td><td style="padding:8px;">${this.escapeHtml(goal) || '—'}</td></tr>
          <tr><td style="padding:8px;"><strong>First house?</strong></td><td style="padding:8px;">${this.escapeHtml(firstHouse) || '—'}</td></tr>
          <tr><td style="padding:8px;"><strong>Budget</strong></td><td style="padding:8px;">${this.escapeHtml(budget) || '—'}</td></tr>
          <tr><td style="padding:8px;"><strong>Timeline</strong></td><td style="padding:8px;">${this.escapeHtml(timeline) || '—'}</td></tr>
          <tr><td style="padding:8px;"><strong>Location</strong></td><td style="padding:8px;">${this.escapeHtml(location) || '—'}</td></tr>
          <tr><td style="padding:8px;"><strong>Property type</strong></td><td style="padding:8px;">${this.escapeHtml(propertyType) || '—'}</td></tr>
          <tr><td style="padding:8px;vertical-align:top;"><strong>Additional info</strong></td><td style="padding:8px;white-space:pre-wrap;">${this.escapeHtml(additionalInfo) || '—'}</td></tr>
        </table>
      </div>
    </body></html>
  `;

  const text = `
RightPricePumps enquiry from ${firstName || ''} ${lastName || ''} (${email || '—'})

Phone: ${phone || '—'}
Goal: ${goal || '—'}
First house: ${firstHouse || '—'}
Budget: ${budget || '—'}
Timeline: ${timeline || '—'}
Location: ${location || '—'}
Property type: ${propertyType || '—'}

Additional info:
${additionalInfo || '—'}
  `.trim();

  return { subject, text, html };
}

private buildRppClientAckEmail(enquiryModel: any) {
  const { firstName } = enquiryModel;
  const company = this.configService.get<string>('RPP_COMPANY_NAME') || 'RightPricePumps';
  const support = this.configService.get<string>('RPP_SUPPORT_EMAIL') || 'support@rightpricepumps.example';

  const text = `Dear ${firstName || 'Client'},

Thanks for contacting ${company}. We have received your enquiry and will get back to you shortly.

If urgent, contact: ${support}

Regards,
${company}
`;

  const html = `
  <!doctype html><html><head><meta charset="utf-8"></head>
  <body style="font-family: Helvetica, Arial, sans-serif;">
    <div style="max-width:600px;padding:18px;border:1px solid #e6e9ec;border-radius:6px;">
      <h3>Thanks — we received your enquiry</h3>
      <p>Dear ${this.escapeHtml(firstName) || 'Client'},</p>
      <p>Thanks for contacting ${company}. Our team will review your request and reply shortly.</p>
      <p>If you need immediate help, email <a href="mailto:${support}">${support}</a>.</p>
    </div>
  </body></html>
  `;

  return { text, html };
}

async createRightPricePumpsContact(enquiryModel: any) {
  try {
    // 1) Save with tag
    const payload = { ...enquiryModel, formType: 'rightpricepumps', createdAt: new Date() };
    const contact = new this.enquiryModel(payload);
    await contact.save();

    // 2) Build mail content once
    const { subject, text: rppText, html: rppHtml } = this.buildRppFirmNotificationEmail(enquiryModel);

    // 3) Resolve recipients from ENV
    const gmailUser = this.configService.get<string>('GMAIL_USER'); // sender
    const firmReceiver = this.configService.get<string>('CONTACT_RECEIVER_EMAIL'); // optional
    const clientReceiver = this.configService.get<string>('RPP_CLIENT_EMAIL');     // your client fixed email
    const realtorReceiver =
      this.configService.get<string>('RPP_REALTOR_EMAIL') || RPP_REALTOR_FALLBACK; // defaults to realtoredmontonab@gmail.com

    // 4) Make a unique recipient list
    const recipientsSet = new Set<string>();
    if (firmReceiver) recipientsSet.add(firmReceiver);
    if (clientReceiver) recipientsSet.add(clientReceiver);
    if (realtorReceiver) recipientsSet.add(realtorReceiver);
    const recipients: string[] = Array.from(recipientsSet);

    // 5) Send notification to firm + client + realtor
    await this.transporter.sendMail({
      from: `"${this.configService.get<string>('FIRM_NAME') || 'RightPricePumps'}" <${gmailUser}>`,
      to: recipients.join(','),
      subject,
      text: rppText,
      html: rppHtml,
      replyTo: enquiryModel.email || undefined, // so they can reply to the lead directly
    });
    console.log('RPP notification email sent to:', recipients);

    // 6) Acknowledgement to user (if user provided email)
    if (enquiryModel.email) {
      const { text: clientText, html: clientHtml } = this.buildRppClientAckEmail(enquiryModel);
      await this.transporter.sendMail({
        from: `"${this.configService.get<string>('FIRM_NAME') || 'RightPricePumps'}" <${gmailUser}>`,
        to: enquiryModel.email,
        subject: `${this.configService.get<string>('FIRM_NAME') || 'RightPricePumps'} — We received your enquiry`,
        text: clientText,
        html: clientHtml,
      });
      console.log('RPP acknowledgement emailed to user:', enquiryModel.email);
    }

    return new CustomResponse(201, 'RightPricePumps enquiry submitted successfully', contact);
  } catch (e) {
    console.error('Error submitting RightPricePumps enquiry:', e);
    return new CustomError(500, 'Failed to submit RightPricePumps enquiry');
  }
}



}
