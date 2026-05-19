import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/messaging', cors: true })
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private userSockets = new Map<string, string>();

    handleConnection(client: Socket) {
        console.log(`Messaging client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.userSockets.forEach((socketId, userId) => {
            if (socketId === client.id) {
                this.userSockets.delete(userId);
                this.server.emit('user-offline', userId);
            }
        });
    }

    @SubscribeMessage('user-online')
    handleUserOnline(client: Socket, userId: string) {
        this.userSockets.set(userId, client.id);
        this.server.emit('user-online', userId);
    }

    @SubscribeMessage('typing')
    handleTyping(client: Socket, payload: { conversationId: string; userId: string }) {
        client.to(payload.conversationId).emit('user-typing', payload.userId);
    }

    @SubscribeMessage('stop-typing')
    handleStopTyping(client: Socket, payload: { conversationId: string; userId: string }) {
        client.to(payload.conversationId).emit('user-stopped-typing', payload.userId);
    }

    @SubscribeMessage('join-conversation')
    handleJoinConversation(client: Socket, conversationId: string) {
        client.join(conversationId);
    }

    @SubscribeMessage('leave-conversation')
    handleLeaveConversation(client: Socket, conversationId: string) {
        client.leave(conversationId);
    }

    sendMessageToConversation(conversationId: string, message: any) {
        this.server.to(conversationId).emit('new-message', message);
    }
}
