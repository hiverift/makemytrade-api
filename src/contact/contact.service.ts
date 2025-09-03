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
    // Initialize Nodemailer transporter for Gmail
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('GMAIL_USER'),
        pass: this.configService.get<string>('GMAIL_PASS'),
      },
    });
  }

  async createContact(dto: CreateContactDto) {
    try {
      const { fullName, emailAddress, subject, message } = dto;

      // Save to MongoDB
      const contact = new this.contactModel(dto);
      await contact.save();

      // Send Email via Gmail
      if (emailAddress) {
        await this.transporter.sendMail({
          from: this.configService.get<string>('GMAIL_USER'),
          to: emailAddress,
          subject: `Contact Us: ${subject}`,
          text: `Hello ${fullName},\n\nThank you for reaching out! Here are the details of your submission:\nSubject: ${subject}\nMessage: ${message}\n\nWe will get back to you soon.\nBest,\nYour Team`,
        });
        console.log('Email sent to:', emailAddress);
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