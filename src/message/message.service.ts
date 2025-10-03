import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel, } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Message, MessageDocument } from './modal/message.schema';
import { Express } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import CustomResponse from 'src/providers/custom-response.service';
import { throwException } from 'src/util/errorhandling';
import CustomError from 'src/providers/customer-error.service';
import { last } from 'rxjs';

@Injectable()
export class MessageService {
  private uploadPath = './uploads';

  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,


  ) { }

  async createMessage(data: any): Promise<Message> {
    try {
      console.log('createMessage', data);
      const message = await this.messageModel.create(data);
      return message;
    } catch (error) {
      throw new Error(error); //  Ensures function always returns or throws
    }
  }

  async getMessageById(messageId: string) {
    try {
      const message = await this.messageModel.findById(messageId).exec();
      if (!message) throw new CustomError(404, 'Message not found');
      return new CustomResponse(200, 'Message fetched successfully', message);
    } catch (error) {
      throwException(error);
    }
  }

  async updateStatus(messageId: string, status: string) {
    try {
      console.log('Updating message status for ID:', messageId);
      const updatedMessage = await this.messageModel.findByIdAndUpdate(
        messageId,
        { status },
        { new: true },
      );
      if (!updatedMessage) throw new CustomError(404, 'Message not found');
      return new CustomResponse(200, 'Status updated successfully', updatedMessage);
    } catch (error) {
      throwException(error);
    }
  }
  async getMessages(userId: string, receiverId: string, limit: any, skip: any) {
    return this.messageModel.aggregate([
      {
        $match: {
          $or: [
            { senderId: userId, receiverId: receiverId },
            { senderId: receiverId, receiverId: userId }
          ]
        }
      },
      { $sort: { createdAt: 1 } },
      { $skip: skip },
      { $limit: limit },

      // 🔹 Lookup sender details
      {
        $lookup: {
          from: 'users',
          let: { senderIdStr: '$senderId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', { $toObjectId: '$$senderIdStr' }] }
              }
            },
            {
              $project: {
                phoneNumber: 1,
                username: 1,
                profilePicture: 1
              }
            }
          ],
          as: 'senderDetails'
        }
      },
      { $unwind: { path: '$senderDetails', preserveNullAndEmptyArrays: true } },

      // 🔹 Lookup receiver details
      {
        $lookup: {
          from: 'users',
          let: { receiverIdStr: '$receiverId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', { $toObjectId: '$$receiverIdStr' }] }
              }
            },
            {
              $project: {
                phoneNumber: 1,
                username: 1,
                profilePicture: 1
              }
            }
          ],
          as: 'receiverDetails'
        }
      },
      { $unwind: { path: '$receiverDetails', preserveNullAndEmptyArrays: true } },

      // 🔹 Final projection
      {
        $project: {
          text: 1,
          mediaUrl: 1,
          mediaType: 1,
          caption: 1,
          messageType: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          senderId: 1,
          receiverId: 1,
          senderDetails: 1,
          receiverDetails: 1,
          document_title: 1,
          document_size: 1,
          document_page: 1

        }
      }
    ]);
  }
  async getChatHistory(userId: string, receiverId: string, limit = 20, skip = 0) {
    try {
      const chatHistory = await this.messageModel.aggregate([
        {
          $match: {
            $or: [
              { senderId: userId, receiverId: receiverId },
              { senderId: receiverId, receiverId: userId }
            ]
          }
        },
        { $sort: { createdAt: 1 } },
        { $skip: skip },
        { $limit: limit },

        // 🔹 Lookup sender details
        {
          $lookup: {
            from: 'users',
            let: { senderIdStr: '$senderId' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', { $toObjectId: '$$senderIdStr' }] }
                }
              },
              {
                $project: {
                  phoneNumber: 1,
                  username: 1,
                  profilePicture: 1
                }
              }
            ],
            as: 'senderDetails'
          }
        },
        { $unwind: { path: '$senderDetails', preserveNullAndEmptyArrays: true } },

        // 🔹 Lookup receiver details
        {
          $lookup: {
            from: 'users',
            let: { receiverIdStr: '$receiverId' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', { $toObjectId: '$$receiverIdStr' }] }
                }
              },
              {
                $project: {
                  phoneNumber: 1,
                  username: 1,
                  profilePicture: 1
                }
              }
            ],
            as: 'receiverDetails'
          }
        },
        { $unwind: { path: '$receiverDetails', preserveNullAndEmptyArrays: true } },

        // 🔹 Final projection
        {
          $project: {
            text: 1,
            mediaUrl: 1,
            mediaType: 1,
            caption: 1,
            messageType: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            senderId: 1,
            receiverId: 1,
            senderDetails: 1,
            receiverDetails: 1
          }
        }
      ]);

      return new CustomResponse(200, 'fetch Chat Sussceesfully ', chatHistory);
    } catch (error) {
      throwException(error);

    }
  }


  // async getChatHistory(userId: string, receiverId: string) {
  //   try {
  //     const messages = await this.messageModel
  //       .find({
  //         $or: [
  //           { senderId: userId, receiverId: receiverId },
  //           { senderId: receiverId, receiverId: userId },
  //         ],
  //       })
  //       .sort({ createdAt: 1 }) // Oldest to Newest
  //       .exec();
  //     return new CustomResponse(200, 'Chat history retrieved successfully', messages);
  //   } catch (error) {
  //     throwException(error);
  //   }
  // }
  async uploadMultipleMedia(files: Express.Multer.File[], senderId: string, receiverId: string): Promise<any> {
    try {
      if (!senderId || !receiverId) {
        throw new CustomError(404, 'senderId and receiverId are required');
      }
      if (!files || files.length === 0) {
        throw new CustomError(404, 'No files uploaded');
      }
      if (!process.env.SERVER_BASE_URL) {
        throw new CustomError(404, 'SERVER_BASE_URL is not defined in environment variables');
      }

      // try {
      //   if (!fs.existsSync(this.uploadPath)) {
      //     fs.mkdirSync(this.uploadPath, { recursive: true });
      //   }
      // } catch (error) {
      //   throw new CustomError(404, `Failed to create upload directory: ${error.message}`);
      // }

      const mediaFiles = files.map((file) => {
        const filename = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;

        try {
            const publicFolderPath = path.join(
              __dirname,
              '..',
              '..',
              'public',
              `uploads/messageMedia`,
            );
          //let publicFolderPath = path.join(__dirname, '..', '..', 'public', 'uploads', 'messageMedia');

          // Ensure the directory exists before writing the file
          if (!fs.existsSync(publicFolderPath)) {
            fs.mkdirSync(publicFolderPath, { recursive: true });
          }

          // Define file path
          const filePath = path.join(publicFolderPath, filename);

          // Save the file to the directory
          fs.writeFileSync(filePath, file.buffer);
        } catch (err) {
          throw new CustomError(404, `Failed to save file ${file.originalname}: ${err.message}`);
        }
        return {
          mediaUrl: `${process.env.SERVER_BASE_URL}/uploads/messageMedia/${filename}`,
          mediaType: file.mimetype,
          document_title: file.originalname,
          document_size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
          document_page: null,
          senderId,
          receiverId,
        };
      });

      return new CustomResponse(200, 'Files uploaded successfully', mediaFiles);
    } catch (error) {
      throwException(error);
    }
  }
  async uploadMedia(file: Express.Multer.File, senderId: string, receiverId: string, mediaType: string, caption: string) {
    try {
      if (!fs.existsSync(this.uploadPath)) fs.mkdirSync(this.uploadPath, { recursive: true });

      const filename = `${uuidv4()}-${file.originalname}`;
      const filePath = path.join(this.uploadPath, filename);
      fs.writeFileSync(filePath, file.buffer);

      const mediaMessage = await this.createMessage({
        senderId,
        receiverId,
        mediaUrl: `/uploads/${filename}`,
        mediaType,
        status: 'sent',
        caption,
      });

      return new CustomResponse(200, 'Media uploaded successfully', mediaMessage);
    } catch (error) {
      throwException(error);
    }
  }
  async uploadNewMedia(file: Express.Multer.File): Promise<any> {
    try {
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', // Images
        'video/mp4', 'video/mpeg', 'video/webm', // Videos
        'audio/mpeg', 'audio/wav', 'audio/ogg', // Audio
        'application/pdf', // PDFs
        'application/msword', 'application/document', // Documents
      ];
      if (!file || !allowedTypes.includes(file.mimetype)) {
        throw new CustomError(404, 'Invalid file or file type');
      }

      if (!fs.existsSync(this.uploadPath)) {
        fs.mkdirSync(this.uploadPath, { recursive: true });
      }

      const filename = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
      const filePath = path.join(this.uploadPath, filename);
      fs.writeFileSync(filePath, file.buffer);

      const mediaUrl = `${process.env.SERVER_BASE_URL}/Uploads/messageMedia/${filename}`;
      return new CustomResponse(200, 'File uploaded successfully', {
        mediaUrl,
        mediaType: file.mimetype,
      });
    } catch (error) {
      throwException(error);
    }
  }
  async getUserChats(userId: string) {

    const privateChats = await this.messageModel.aggregate([
      {
        $match: {
          $or: [
            { senderId: userId },
            { receiverId: userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', userId] },
              '$receiverId',
              '$senderId'
            ]
          },
          lastMessage: { $first: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        $project: {
          _id: 0,
          receiverId: '$_id',
          text: '$lastMessage.text',
          status: '$lastMessage.status',
          userDetails: {
            username: '$userDetails.username',
            phoneNumber: '$userDetails.phoneNumber'
          }
        }
      }
    ]);









    // const groupChats = await this.groupMessageModal.aggregate([
    //   {
    //     $match: { members: userId }
    //   },
    //   { $sort: { createdAt: -1 } },
    //   {
    //     $group: {
    //       _id: "$groupId",
    //       lastMessage: { $first: "$$ROOT" }
    //     }
    //   }
    // ]);

    const privateChatsArray = Array.isArray(privateChats) ? privateChats : [privateChats];
    // const groupChatsArray = Array.isArray(groupChats) ? groupChats : [groupChats];

    return [...privateChatsArray].sort(
      (a, b) => b.lastMessage.createdAt - a.lastMessage.createdAt
    );
  }
  async getSidebarChats(userId: string) {
    // 🔹 Private Chats Fetch
    const privateChats = await this.messageModel.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ["$senderId", userId] },
              then: "$receiverId",
              else: "$senderId"
            }
          },
          lastMessage: { $first: "$$ROOT" },
          unseenCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiverId", userId] },
                    { $ne: ["$status", "read"] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $addFields: {
          _id: {
            $convert: {
              input: "$_id",
              to: "objectId",
              onError: null
            }
          }
        }
      },
      { $match: { _id: { $ne: null } } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          lastMessage: 1,
          unseenCount: 1,
          "userDetails.mobile": 1,
          "userDetails.username": 1,
          "userDetails.profilePicture": 1
        }
      }
    ]);


    console.log("Private Chats:", privateChats);

    // // 🔹 Group Chats Fetch
    // const groupChats = await this.groupMessageModal.aggregate([
    //   {
    //     $match: { members: userId }
    //   },
    //   { $sort: { createdAt: -1 } },
    //   {
    //     $group: {
    //       _id: "$groupId",
    //       lastMessage: { $first: "$$ROOT" },
    //       unseenCount: {
    //         $sum: {
    //           $cond: [
    //             {
    //               $and: [
    //                 { $ne: ["$senderId", userId] },
    //                 { $ne: ["$status", "read"] }
    //               ]
    //             },
    //             1,
    //             0
    //           ]
    //         }
    //       }
    //     }
    //   },
    //   {
    //     $addFields: {
    //       _id: {
    //         $convert: {
    //           input: "$_id",
    //           to: "objectId",
    //           onError: null
    //         }
    //       }
    //     }
    //   },
    //   { $match: { _id: { $ne: null } } },
    //   {
    //     $lookup: {
    //       from: "groups",
    //       localField: "_id",
    //       foreignField: "_id",
    //       as: "groupDetails"
    //     }
    //   },
    //   { $unwind: { path: "$groupDetails", preserveNullAndEmptyArrays: true } },
    //   {
    //     $project: {
    //       _id: 1,
    //       lastMessage: 1,
    //       unseenCount: 1,
    //       "groupDetails.name": 1
    //     }
    //   }
    // ]);



    // console.log("Group Chats:", groupChats);

    // 🔹 Merge Private & Group Chats and Sort by Last Message Time
    return [...privateChats].sort((a, b) => b.lastMessage.createdAt - a.lastMessage.createdAt);
  }





  //   async getSidebarChats(userId: string) {
  //     const chats = await this.messageModel.aggregate([
  //         // Jo bhi messages tumne bheje ya tumhe mile hain, unko match karo
  //         {
  //             $match: {
  //                 $or: [
  //                     { senderId: userId },
  //                     { receiverId: userId }
  //                 ]
  //             }
  //         },
  //         {
  //             $sort: { createdAt: -1 } // Sabse latest messages pehle rakho
  //         },
  //         // Unique sender-receiver pair ke basis pe grouping
  //         {
  //             $group: {
  //                 _id: {
  //                     $setUnion: [["$senderId"], ["$receiverId"]] // Unique users ka pair banao
  //                 },
  //                 lastMessage: { $first: "$$ROOT" } // Sabse latest message select karo
  //             }
  //         },
  //         // Sender details fetch karo
  //         {
  //             $lookup: {
  //                 from: "users",
  //                 localField: "lastMessage.senderId",
  //                 foreignField: "_id",
  //                 as: "senderDetails"
  //             }
  //         },
  //         // Receiver details fetch karo
  //         {
  //             $lookup: {
  //                 from: "users",
  //                 localField: "lastMessage.receiverId",
  //                 foreignField: "_id",
  //                 as: "receiverDetails"
  //             }
  //         },
  //         // Required fields select karo
  //         {
  //             $project: {
  //                 _id: 0,
  //                 lastMessage: "$lastMessage.text",
  //                 createdAt: "$lastMessage.createdAt",
  //                 status: "$lastMessage.status",
  //                 sender: { $arrayElemAt: ["$senderDetails", 0] },
  //                 receiver: { $arrayElemAt: ["$receiverDetails", 0] }
  //             }
  //         },
  //         {
  //             $sort: { createdAt: -1 } // Sabse latest chats pehle dikhaye
  //         }
  //     ]);

  //     return chats.map((chat) => {
  //         const contact =
  //             chat.sender?._id.toString() === userId.toString()
  //                 ? chat.receiver
  //                 : chat.sender;

  //         return {
  //             userId: contact?._id.toString(),
  //             username: contact?.username || contact?.phoneNumber || "Unknown User",
  //             profilePicture: contact?.profilePicture || "default-avatar.png",
  //             lastMessage: chat.lastMessage,
  //             unread: chat.status === "delivered",
  //             createdAt: chat.createdAt
  //         };
  //     });
  // }






}
