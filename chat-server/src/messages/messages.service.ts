import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './entities/message.entity';

@Injectable()
export class MessagesService {
  messages: { [room: string]: Message[] } = {}; // Stores messages by room
  directMessages: { [key: string]: Message[] } = {}; // Stores direct messages between users
  clientToUser = {}; // Maps client IDs to user names

  create(createMessageDto: CreateMessageDto, senderName: string, room: string) {
    const message: Message = {
      name: senderName,
      text: createMessageDto.text,
      recipientName: createMessageDto.recipientName,
      senderName: senderName,
      room: room,
      senderId: createMessageDto.senderId,
    };

    if (createMessageDto.recipientName) {
      // Save direct message
      const key = [senderName, createMessageDto.recipientName].sort().join('-');
      if (!this.directMessages[key]) {
        this.directMessages[key] = [];
      }
      this.directMessages[key].push(message);
    } else {
      // Save room message
      if (!this.messages[room]) {
        this.messages[room] = [];
      }
      this.messages[room].push(message);
    }

    return message;
  }

  identify(name: string, id: string) {
    this.clientToUser[id] = name; // Map client ID to user name
    return Object.values(this.clientToUser);
  }

  getClientName(clientId: string) {
    return this.clientToUser[clientId]; // Get user name for a given client ID
  }

  findAll(room: string) {
    return this.messages[room] || []; // Get all messages for a given room
  }

  findMessagesBetweenUsers(senderName: string, recipientName: string) {
    const key = [senderName, recipientName].sort().join('-');
    return this.directMessages[key] || []; // Get all direct messages between two users
  }
}
