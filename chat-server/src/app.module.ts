import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [MessagesModule], // Import the MessagesModule to use its functionality
  controllers: [AppController], // Register the AppController to handle incoming requests
  providers: [AppService], // Register the AppService to provide business logic
})
export class AppModule {} // AppModule is responsible for configuring the application's modules
