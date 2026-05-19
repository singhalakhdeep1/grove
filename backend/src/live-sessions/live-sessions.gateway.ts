import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/live-sessions', cors: true })
export class LiveSessionsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('join-room')
    handleJoinRoom(client: Socket, payload: { roomId: string; userId: string }) {
        client.join(payload.roomId);
        this.server.to(payload.roomId).emit('user-joined', payload.userId);
    }

    @SubscribeMessage('leave-room')
    handleLeaveRoom(client: Socket, payload: { roomId: string; userId: string }) {
        client.leave(payload.roomId);
        this.server.to(payload.roomId).emit('user-left', payload.userId);
    }

    @SubscribeMessage('webrtc-offer')
    handleWebRTCOffer(client: Socket, payload: any) {
        client.to(payload.roomId).emit('webrtc-offer', payload);
    }

    @SubscribeMessage('webrtc-answer')
    handleWebRTCAnswer(client: Socket, payload: any) {
        client.to(payload.roomId).emit('webrtc-answer', payload);
    }

    @SubscribeMessage('webrtc-ice-candidate')
    handleICECandidate(client: Socket, payload: any) {
        client.to(payload.roomId).emit('webrtc-ice-candidate', payload);
    }

    @SubscribeMessage('chat-message')
    handleChatMessage(client: Socket, payload: any) {
        this.server.to(payload.roomId).emit('chat-message', payload);
    }

    @SubscribeMessage('screen-share-start')
    handleScreenShareStart(client: Socket, payload: any) {
        this.server.to(payload.roomId).emit('screen-share-started', payload.userId);
    }

    @SubscribeMessage('screen-share-stop')
    handleScreenShareStop(client: Socket, payload: any) {
        this.server.to(payload.roomId).emit('screen-share-stopped', payload.userId);
    }

    @SubscribeMessage('raise-hand')
    handleRaiseHand(client: Socket, payload: any) {
        this.server.to(payload.roomId).emit('hand-raised', payload);
    }
}
