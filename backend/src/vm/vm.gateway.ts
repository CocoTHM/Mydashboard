import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { VmService } from './vm.service';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'vm',
})
export class VmGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, { userId: string; socket: Socket }> = new Map();

  constructor(
    private vmService: VmService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Extraire le token depuis les headers ou query
      const token = client.handshake.auth.token || client.handshake.query.token;
      
      if (!token) {
        client.disconnect();
        return;
      }

      // Vérifier le token
      const payload = this.jwtService.verify(token as string);
      const userId = payload.sub;

      this.connectedClients.set(client.id, { userId, socket: client });
      
      console.log(`Client connected: ${client.id} (user: ${userId})`);
      
      // Joindre la room de l'utilisateur
      client.join(`user:${userId}`);
    } catch (error) {
      console.error('WebSocket auth error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe-vm')
  async handleSubscribeVM(client: Socket, vmId: string) {
    const clientInfo = this.connectedClients.get(client.id);
    if (!clientInfo) return;

    try {
      // Vérifier que l'utilisateur a accès à cette VM
      await this.vmService.findOne(vmId, clientInfo.userId);
      
      // Joindre la room de la VM
      client.join(`vm:${vmId}`);
      
      console.log(`Client ${client.id} subscribed to VM ${vmId}`);
    } catch (error) {
      client.emit('error', { message: 'Unauthorized or VM not found' });
    }
  }

  @SubscribeMessage('unsubscribe-vm')
  handleUnsubscribeVM(client: Socket, vmId: string) {
    client.leave(`vm:${vmId}`);
    console.log(`Client ${client.id} unsubscribed from VM ${vmId}`);
  }

  /**
   * Émettre une mise à jour de statut VM
   */
  emitVMStatusUpdate(vmId: string, status: any) {
    this.server.to(`vm:${vmId}`).emit('vm-status-update', { vmId, status });
  }

  /**
   * Émettre des métriques VM
   */
  emitVMMetrics(vmId: string, metrics: any) {
    this.server.to(`vm:${vmId}`).emit('vm-metrics-update', { vmId, metrics });
  }

  /**
   * Émettre un log d'action VM
   */
  emitVMLog(vmId: string, log: any) {
    this.server.to(`vm:${vmId}`).emit('vm-log', { vmId, log });
  }

  /**
   * Notifier tous les clients d'un utilisateur
   */
  notifyUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
