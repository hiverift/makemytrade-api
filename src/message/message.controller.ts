import { Controller, Post, Body, UseInterceptors, UploadedFile,UploadedFiles, Get, Param, Patch } from '@nestjs/common';
import { FileInterceptor,FilesInterceptor } from '@nestjs/platform-express';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/message.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { BadRequestException } from '@nestjs/common';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post('sendMessage')
  async sendMessage(@Body() messageDto: CreateMessageDto) {
    return this.messageService.createMessage(messageDto);
  }

  @Get('getMessage/:userId/:receiverId')
  async getMessages(@Param('userId') userId: string, @Param('receiverId') receiverId: string) {
    return this.messageService.getChatHistory(userId, receiverId);
  }

  @Get('getMessageByMessageId/:messageId')
  async getMessageById(@Param('messageId') messageId: string) {
    return this.messageService.getMessageById(messageId);
  }

  // Existing upload endpoint (unchanged)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @UploadedFile() file: Express.Multer.File,
    @Body('senderId') senderId: string,
    @Body('receiverId') receiverId: string,
    @Body('mediaType') mediaType: string,
    @Body('caption') caption: string,
  ) {
    return this.messageService.uploadMedia(file, senderId, receiverId, mediaType, caption);
  }

  // New upload endpoint for media
   @Post('upload-multiple-media')
  @UseInterceptors(FilesInterceptor('files', 10, { limits: { fileSize: 100 * 1024 * 1024 } })) // 100MB limit
  async uploadMultipleMedia(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('senderId') senderId: string,
    @Body('receiverId') receiverId: string,
  ) {
    return this.messageService.uploadMultipleMedia(files, senderId, receiverId);
  }


  @Patch('status')
  async updateStatus(@Body() { messageId, status }) {
    return this.messageService.updateStatus(messageId, status);
  }

  // @Get('sidebar-chats/:userId')
  // async getSidebarChats(@Param('userId') userId: string) {
  //   return this.messageService.getSidebarChats(userId);
  
  // }
}