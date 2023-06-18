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

    let userId: string;

    try {
      userId = this.authService.verify(token).id;
    } catch (error) {
      this.logger.warn('Client has invalid token');
      // REJECT CONNECTION
      client.disconnect();
      return;
    }

    // add to connectedusers
    this.addUser(userId, connectionId);
    this.logger.log(`Client Connected`, {
      connectedUsers: this.connectedUsers,
      connectedIds: this.connectedIds,
    });

    // send online status
    this.sendOnlineStatus(userId, true);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    // send online status
    this.sendOnlineStatus(this.connectedIds[client.id], false);

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

    const clientId = this.connectedIds[client.id];

    // only id not belonging to current user
    const receiverAppId = receivers
      .filter((th) => th.userId !== clientId)
      .map((th) => th.userId);

    this.send(receiverAppId, SocketEvents.TYPING, {
      isTyping,
      threadId,
      clientId,
    });
  }

  private addUser(clientAppId: string, id: string) {
    if (this.connectedUsers[clientAppId]) {
      this.connectedUsers[clientAppId].push(id);
    } else {
      this.connectedUsers[clientAppId] = [id];
    }

    this.connectedIds[id] = clientAppId;
  }

  private removeUser(id: string) {
    const clientAppId = this.connectedIds[id];
    this.connectedUsers[clientAppId] = this.connectedUsers[clientAppId].filter(
      (c) => c !== id,
    );

    if (!this.connectedUsers[clientAppId].length) {
      delete this.connectedUsers[clientAppId];
    }

    delete this.connectedIds[id];
  }

  async totalConnections(): Promise<number> {
    const sockets = await this.server.fetchSockets();
    return sockets.length;
  }

  send(recipientAppIds: string[], event: `${SocketEvents}`, payload: any) {
    const clients = [];
    recipientAppIds.forEach((id) => {
      const socketIds = this.connectedUsers[id];
      if (socketIds) {
        socketIds.forEach((clientId) =>
          this.server.to(clientId).emit(event, payload),
        );
        clients.push(id);
      }
    });
  }

  sendToUser(id: string, event: `${SocketEvents}`, payload: any) {
    const socketIds = this.connectedUsers[id] || [];
    socketIds.forEach((clientId) =>
      this.server.to(clientId).emit(event, payload),
    );
  }

  getOnlineContacts(contactList: string[]): string[] {
    return contactList.filter((contact) => this.connectedUsers[contact]);
  }

  async sendOnlineStatus(clientAppId: string, isOnline: boolean) {
    // get thread users
    const userContacts = await this.userSerive.getContacts(clientAppId);
    userContacts.forEach((user) => {
      const contactSocketIds = this.connectedUsers[user.contactId] || [];
      contactSocketIds.forEach((ctSocket) =>
        this.server
          .to(ctSocket)
          .emit(SocketEvents.ONLINE_STATUS, { user: clientAppId, isOnline }),
      );
    });
  }
}
