import {
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UsersService } from './users.service';
import { Logger } from '@nestjs/common';
import { SocketEvents } from './enums';

@WebSocketGateway({
  transports: ['websocket'],
  path: '/ws',
})
export class UsersGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(UsersGateway.name);

  constructor(private readonly service: UsersService) {}

  afterInit(server: Server) {
    this.logger.log('Initialized websocket connection');
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client Connected`, client.id);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client Disconnected`, client.id);
  }

  @SubscribeMessage(SocketEvents.SEND_MESSAGE)
  async create(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string,
  ) {
    this.logger.log('sendMessage event triggered', {
      payload,
      client: client.id,
    });
    // this.server.emit(SocketEvents.RECEIVE_MESSAGE, payload);
  }

  @SubscribeMessage('typing')
  async typing(
    @MessageBody('isTyping') isTyping: boolean,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log('typing event triggered', { isTyping });
    // client.broadcast.emit('typing', { isTyping });
  }
}
