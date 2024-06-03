import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Server, Socket } from 'socket.io';

// WebSocket gateway for handling real-time communication
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server; // Server instance for broadcasting messages
  private onlineUsers = new Map<string, string>(); // Map to store online users with their socket IDs

  constructor(private readonly messagesService: MessagesService) {}

  // Handle incoming message creation
  @SubscribeMessage('createMessage')
  async create(
    @MessageBody() createMessageDto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const senderName = this.messagesService.getClientName(client.id);
    const message = await this.messagesService.create(
      createMessageDto,
      senderName,
      createMessageDto.room,
    );
    // Handle private messages
    if (createMessageDto.recipientName) {
      // Send private message
      const recipientSocketId = this.getSocketIdByName(
        createMessageDto.recipientName,
      );
      if (recipientSocketId) {
        // Send private message to recipient and sender
        this.server.to(recipientSocketId).emit('privateMessage', message);
        this.server.to(client.id).emit('privateMessage', message);
        if (!client.rooms.has(recipientSocketId)) {
          this.server
            .to(recipientSocketId)
            .emit('newDirectMessageNotification', {
              message: message.text,
              from: senderName,
            });
        }
      }
    } else if (createMessageDto.room) {
      // Broadcast to everyone in the room
      this.server.to(createMessageDto.room).emit('message', message);
    }

    return message;
  }
  // Retrieve all messages for a given room
  @SubscribeMessage('findAllMessages')
  findAll(@MessageBody('room') room: string) {
    return this.messagesService.findAll(room);
  }

  @SubscribeMessage('join')
  joinRoom(
    @MessageBody('name') name: string,
    @MessageBody('room') room: string,
    @ConnectedSocket() client: Socket,
  ) {
    this.messagesService.identify(name, client.id); // Identify the user
    client.join(room); // Join the room
    this.onlineUsers.set(client.id, name); // Add user to online users map
    this.server.emit(
      'onlineUsers',
      Array.from(this.onlineUsers.entries()).map(([id, name]) => ({
        id,
        name,
      })),
    );
    console.log(`User ${name} joined room ${room} with socket ID ${client.id}`);
    return this.messagesService.findAll(room);
  }
  // Handle user leaving a room
  @SubscribeMessage('leaveRoom')
  leaveRoom(
    @MessageBody('room') room: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(room); // Leave the room
    this.onlineUsers.delete(client.id); // Remove user from online users map

    this.server.emit(
      'onlineUsers',
      Array.from(this.onlineUsers.entries()).map(([id, name]) => ({
        id,
        name,
      })),
    );
  }
  // Handle user typing notification
  @SubscribeMessage('typing')
  async typing(
    @MessageBody('isTyping') isTyping: boolean,
    @MessageBody('room') room: string,
    @ConnectedSocket() client: Socket,
  ) {
    const name = this.messagesService.getClientName(client.id); // Get user name
    client.to(room).emit('typing', { name, isTyping }); // Notify others in the room
  }
  // Retrieve all messages between two users
  @SubscribeMessage('findMessagesBetweenUsers')
  findMessagesBetweenUsers(
    @MessageBody('senderName') senderName: string,
    @MessageBody('recipientName') recipientName: string,
  ) {
    return this.messagesService.findMessagesBetweenUsers(
      senderName,
      recipientName,
    );
  }
  // Handle client connection
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }
  // Handle client disconnection
  handleDisconnect(client: Socket) {
    this.onlineUsers.delete(client.id); // Remove user from online users map
    this.server.emit(
      'onlineUsers',
      Array.from(this.onlineUsers.entries()).map(([id, name]) => ({
        id,
        name,
      })),
    );
    console.log(`Client disconnected: ${client.id}`);
  }
  // Helper method to get socket ID by user name
  private getSocketIdByName(name: string): string | undefined {
    for (const [id, userName] of this.onlineUsers.entries()) {
      if (userName === name) {
        return id;
      }
    }
    return undefined;
  }
}
