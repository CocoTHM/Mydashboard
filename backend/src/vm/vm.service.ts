import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { VM, VMProvider, VMStatus, VMAction, Prisma } from '@prisma/client';
import { VmProviderFactory } from './providers/vm-provider.factory';
import { CreateVmDto, UpdateVmDto, VMMetrics } from './dto/vm.dto';

@Injectable()
export class VmService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
    private providerFactory: VmProviderFactory,
    @InjectQueue('vm-operations') private vmQueue: Queue,
  ) {}

  async create(userId: string, createVmDto: CreateVmDto): Promise<VM> {
    const { credentials, ...vmData } = createVmDto;

    // Chiffrer les credentials
    const encryptedCredentials = credentials 
      ? this.encryption.encryptObject(credentials)
      : null;

    const vm = await this.prisma.vM.create({
      data: {
        ...vmData,
        userId,
        credentials: encryptedCredentials,
      },
    });

    // Log de création
    await this.logAction(vm.id, VMAction.CREATE, 'success', 'VM created');

    return this.sanitizeVM(vm);
  }

  async findAll(userId: string): Promise<VM[]> {
    const vms = await this.prisma.vM.findMany({
      where: { userId },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    return vms.map(vm => this.sanitizeVM(vm));
  }

  async findOne(id: string, userId: string): Promise<VM> {
    const vm = await this.prisma.vM.findFirst({
      where: { id, userId },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!vm) {
      throw new NotFoundException(`VM #${id} not found`);
    }

    return this.sanitizeVM(vm);
  }

  async update(id: string, userId: string, updateVmDto: UpdateVmDto): Promise<VM> {
    await this.checkOwnership(id, userId);

    const { credentials, ...vmData } = updateVmDto;

    const updateData: any = { ...vmData };

    if (credentials) {
      updateData.credentials = this.encryption.encryptObject(credentials);
    }

    const vm = await this.prisma.vM.update({
      where: { id },
      data: updateData,
    });

    await this.logAction(id, VMAction.UPDATE, 'success', 'VM updated');

    return this.sanitizeVM(vm);
  }

  async remove(id: string, userId: string): Promise<VM> {
    await this.checkOwnership(id, userId);

    const vm = await this.prisma.vM.delete({ where: { id } });
    await this.logAction(id, VMAction.DELETE, 'success', 'VM deleted');

    return this.sanitizeVM(vm);
  }

  /**
   * Démarrer une VM
   */
  async start(id: string, userId: string): Promise<void> {
    const vm = await this.findOne(id, userId);

    // Ajouter à la queue pour traitement asynchrone
    await this.vmQueue.add('start-vm', { vmId: id, userId });

    await this.prisma.vM.update({
      where: { id },
      data: { status: VMStatus.STARTING },
    });

    await this.logAction(id, VMAction.START, 'pending', 'Start command sent');
  }

  /**
   * Arrêter une VM
   */
  async stop(id: string, userId: string): Promise<void> {
    const vm = await this.findOne(id, userId);

    await this.vmQueue.add('stop-vm', { vmId: id, userId });

    await this.prisma.vM.update({
      where: { id },
      data: { status: VMStatus.STOPPING },
    });

    await this.logAction(id, VMAction.STOP, 'pending', 'Stop command sent');
  }

  /**
   * Redémarrer une VM
   */
  async restart(id: string, userId: string): Promise<void> {
    const vm = await this.findOne(id, userId);

    await this.vmQueue.add('restart-vm', { vmId: id, userId });

    await this.prisma.vM.update({
      where: { id },
      data: { status: VMStatus.RESTARTING },
    });

    await this.logAction(id, VMAction.RESTART, 'pending', 'Restart command sent');
  }

  /**
   * Obtenir les métriques d'une VM
   */
  async getMetrics(id: string, userId: string): Promise<VMMetrics> {
    const vm = await this.findOne(id, userId);
    
    if (vm.lastMetrics) {
      return vm.lastMetrics as any;
    }

    // Récupérer les métriques en temps réel
    return await this.refreshMetrics(id, userId);
  }

  /**
   * Rafraîchir les métriques d'une VM
   */
  async refreshMetrics(id: string, userId: string): Promise<VMMetrics> {
    const vm = await this.findOne(id, userId);
    const provider = this.providerFactory.getProvider(vm.provider);

    const credentials = vm.credentials 
      ? this.encryption.decryptObject(vm.credentials as any)
      : null;

    const metrics = await provider.getMetrics(vm, credentials);

    await this.prisma.vM.update({
      where: { id },
      data: {
        lastMetrics: metrics as any,
        lastCheckedAt: new Date(),
      },
    });

    await this.logAction(id, VMAction.METRICS_UPDATE, 'success', 'Metrics updated');

    return metrics;
  }

  /**
   * Obtenir le statut en temps réel d'une VM
   */
  async getStatus(id: string, userId: string): Promise<VMStatus> {
    const vm = await this.findOne(id, userId);
    const provider = this.providerFactory.getProvider(vm.provider);

    const credentials = vm.credentials 
      ? this.encryption.decryptObject(vm.credentials as any)
      : null;

    const status = await provider.getStatus(vm, credentials);

    if (status !== vm.status) {
      await this.prisma.vM.update({
        where: { id },
        data: { status },
      });
    }

    return status;
  }

  /**
   * Exécuter une action sur une VM via le provider
   */
  async executeAction(
    vmId: string,
    action: 'start' | 'stop' | 'restart',
  ): Promise<void> {
    const vm = await this.prisma.vM.findUnique({ where: { id: vmId } });
    
    if (!vm) {
      throw new NotFoundException(`VM #${vmId} not found`);
    }

    const provider = this.providerFactory.getProvider(vm.provider);
    const credentials = vm.credentials 
      ? this.encryption.decryptObject(vm.credentials as any)
      : null;

    try {
      switch (action) {
        case 'start':
          await provider.start(vm, credentials);
          await this.prisma.vM.update({
            where: { id: vmId },
            data: { status: VMStatus.RUNNING },
          });
          await this.logAction(vmId, VMAction.START, 'success', 'VM started successfully');
          break;

        case 'stop':
          await provider.stop(vm, credentials);
          await this.prisma.vM.update({
            where: { id: vmId },
            data: { status: VMStatus.STOPPED },
          });
          await this.logAction(vmId, VMAction.STOP, 'success', 'VM stopped successfully');
          break;

        case 'restart':
          await provider.restart(vm, credentials);
          await this.prisma.vM.update({
            where: { id: vmId },
            data: { status: VMStatus.RUNNING },
          });
          await this.logAction(vmId, VMAction.RESTART, 'success', 'VM restarted successfully');
          break;
      }
    } catch (error) {
      await this.prisma.vM.update({
        where: { id: vmId },
        data: { status: VMStatus.ERROR },
      });
      await this.logAction(vmId, action.toUpperCase() as VMAction, 'error', error.message);
      throw error;
    }
  }

  /**
   * Logger une action
   */
  private async logAction(
    vmId: string,
    action: VMAction,
    status: string,
    message: string,
    metadata?: any,
  ): Promise<void> {
    await this.prisma.vMLog.create({
      data: {
        vmId,
        action,
        status,
        message,
        metadata,
      },
    });
  }

  /**
   * Vérifier la propriété d'une VM
   */
  private async checkOwnership(vmId: string, userId: string): Promise<void> {
    const vm = await this.prisma.vM.findFirst({
      where: { id: vmId, userId },
    });

    if (!vm) {
      throw new ForbiddenException('You do not have permission to access this VM');
    }
  }

  /**
   * Nettoyer les données sensibles avant de retourner au client
   */
  private sanitizeVM(vm: any): VM {
    const { credentials, ...sanitized } = vm;
    return sanitized as VM;
  }
}
