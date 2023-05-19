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
import { Logger } from '@nestjs/common';
import { SocketEvents } from './enums';
import { AuthService } from '../auth/auth.service';

@WebSocketGateway({
  transports: ['websocket'],
  path: '/ws',
})
export class UsersGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(UsersGateway.name);

  // TODO: use redis
  private connectedUsers: {
    [key in string]: string[];
  } = {};

  private connectedIds: {
    [key in string]: string;
  } = {};

  constructor(private readonly authService: AuthService) {}

  afterInit(server: Server) {
    this.logger.log('Initialized websocket connection');
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    const token = client.handshake.auth?.token;
    const connectionId = client.id;

    if (!token) {
      this.logger.warn('Client has no token');

      // REJECT CONNECTION
      client.disconnect();
      return;
    }

    let email: string;

    try {
      email = this.authService.verify(token).email;
    } catch (error) {
      this.logger.warn('Client has invalid token');
      // REJECT CONNECTION
      client.disconnect();
      return;
    }

    // add to connectedusers
    this.addUser(email, connectionId);
    this.logger.log(`Client Connected`, {
      connectedUsers: this.connectedUsers,
    });
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    // remove from connected users
    this.removeUser(client.id);
    this.logger.log(`Client Disconnected`, {
      connectedUsers: this.connectedUsers,
    });
  }

  @SubscribeMessage('typing')
  async typing(
    @MessageBody('isTyping') isTyping: boolean,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log('typing event triggered', { isTyping });
    // client.broadcast.emit('typing', { isTyping });
  }

  private addUser(email: string, id: string) {
    if (this.connectedUsers[email]) {
      this.connectedUsers[email].push(id);
    } else {
      this.connectedUsers[email] = [id];
    }

    this.connectedIds[id] = email;
  }

  private removeUser(id: string) {
    const email = this.connectedIds[id];
    this.connectedUsers[email] = this.connectedUsers[email].filter(
      (c) => c !== id,
    );

    if (!this.connectedUsers[email].length) {
      delete this.connectedUsers[email];
    }

    delete this.connectedIds[id];
  }

  async totalConnections(): Promise<number> {
    const sockets = await this.server.fetchSockets();
    return sockets.length;
  }

  send(recipientEmails: string[], event: `${SocketEvents}`, payload: any) {
    recipientEmails.forEach((email) => {
      const socketIds = this.connectedUsers[email];
      if (socketIds) {
        socketIds.forEach((clientId) =>
          this.server.to(clientId).emit(event, payload),
        );
      }
    });
  }
}
