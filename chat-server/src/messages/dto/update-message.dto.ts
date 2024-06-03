import { PartialType } from '@nestjs/mapped-types';
import { CreateMessageDto } from './create-message.dto';

// This class represents the data transfer object for updating a message.
export class UpdateMessageDto extends PartialType(CreateMessageDto) {
  // The ID of the message to be updated.
  id: number;
}
