import { Test, TestingModule } from '@nestjs/testing';
import { MessagesGateway } from './messages.gateway';
import { MessagesService } from './messages.service';

describe('MessagesGateway', () => {
  let gateway: MessagesGateway;

  beforeEach(async () => {
    // Create a testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessagesGateway, MessagesService], // Provide the MessagesGateway and MessagesService
    }).compile();

    // Get an instance of MessagesGateway from the testing module
    gateway = module.get<MessagesGateway>(MessagesGateway);
  });

  it('should be defined', () => {
    // Assert that the gateway is defined
    expect(gateway).toBeDefined();
  });
});
