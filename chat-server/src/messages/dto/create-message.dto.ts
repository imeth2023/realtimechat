import { Message } from '../entities/message.entity';

// Create a class called CreateMessageDto that extends the Message class
export class CreateMessageDto extends Message {
  // Optional property to store the recipient's ID
  recipientId?: string;

  // Optional property to store the recipient's name
  recipientName?: string;

  // Required property to store the sender's ID
  senderId: string;
}
