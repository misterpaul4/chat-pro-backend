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
import { TypingDto } from './dto/user-operations.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Thread } from '../thread/entities/thread.entity';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';

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

  constructor(
    private readonly authService: AuthService,
    private readonly userSerive: UsersService,
  ) {}

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
      connectedIds: this.connectedIds,
    });
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    // remove from connected users
    this.removeUser(client.id);
    this.logger.log(`Client Disconnected`, {
      connectedUsers: this.connectedUsers,
    });
  }

  @SubscribeMessage(SocketEvents.TYPING)
  async typing(
    @MessageBody() body: TypingDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { isTyping, threadId } = body;
    // get thread users
    const receivers = await this.userSerive.getThreadUsers(threadId);

    const clientEmail = this.connectedIds[client.id];

    // only emails not belonging to current user
    const receiversEmail = receivers
      .filter((user) => user.email !== clientEmail)
      .map((user) => user.email);

    this.send(receiversEmail, SocketEvents.TYPING, {
      isTyping,
      threadId,
      clientEmail,
    });
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
    const clients = [];
    recipientEmails.forEach((email) => {
      const socketIds = this.connectedUsers[email];
      if (socketIds) {
        socketIds.forEach((clientId) =>
          this.server.to(clientId).emit(event, payload),
        );
        clients.push(email);
      }
    });

    if (clients.length) {
      this.logger.log({
        message: 'Sent message to multiple users',
        clients,
        event,
        payload,
      });
    }
  }

  sendToUser(email: string, event: `${SocketEvents}`, payload: any) {
    const socketIds = this.connectedUsers[email] || [];
    socketIds.forEach((clientId) =>
      this.server.to(clientId).emit(event, payload),
    );
    if (socketIds.length) {
      this.logger.log({
        message: 'Sent message to logged in user',
        event,
        payload,
        email,
      });
    }
  }
}
