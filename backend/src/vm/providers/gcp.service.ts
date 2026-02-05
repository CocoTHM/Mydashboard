import { Injectable, Logger } from '@nestjs/common';
import { VM, VMStatus } from '@prisma/client';
import { IVMProvider } from './vm-provider.interface';
import { VMMetrics } from '../dto/vm.dto';
import Compute from '@google-cloud/compute';

@Injectable()
export class GcpService implements IVMProvider {
  private readonly logger = new Logger(GcpService.name);

  private getClient(credentials?: any): any {
    const config: any = {};

    if (credentials?.projectId) {
      config.projectId = credentials.projectId;
    }

    if (credentials?.keyFile) {
      config.keyFilename = credentials.keyFile;
    } else if (credentials?.credentials) {
      config.credentials = JSON.parse(credentials.credentials);
    }

    return new Compute(config);
  }

  async start(vm: VM, credentials: any): Promise<void> {
    this.logger.log(`Starting GCP VM: ${vm.name}`);
    
    const compute = this.getClient(credentials);
    const { zone, instanceName } = this.parseInstanceId(vm.instanceId);
    
    const instance = compute.zone(zone).vm(instanceName);
    await instance.start();
    
    this.logger.log(`GCP VM ${instanceName} start command sent`);
  }

  async stop(vm: VM, credentials: any): Promise<void> {
    this.logger.log(`Stopping GCP VM: ${vm.name}`);
    
    const compute = this.getClient(credentials);
    const { zone, instanceName } = this.parseInstanceId(vm.instanceId);
    
    const instance = compute.zone(zone).vm(instanceName);
    await instance.stop();
    
    this.logger.log(`GCP VM ${instanceName} stop command sent`);
  }

  async restart(vm: VM, credentials: any): Promise<void> {
    this.logger.log(`Restarting GCP VM: ${vm.name}`);
    
    const compute = this.getClient(credentials);
    const { zone, instanceName } = this.parseInstanceId(vm.instanceId);
    
    const instance = compute.zone(zone).vm(instanceName);
    await instance.reset();
    
    this.logger.log(`GCP VM ${instanceName} reset command sent`);
  }

  async getStatus(vm: VM, credentials: any): Promise<VMStatus> {
    const compute = this.getClient(credentials);
    const { zone, instanceName } = this.parseInstanceId(vm.instanceId);
    
    const instance = compute.zone(zone).vm(instanceName);
    const [metadata] = await instance.getMetadata();

    return this.mapGCPStateToVMStatus(metadata.status);
  }

  async getMetrics(vm: VM, credentials: any): Promise<VMMetrics> {
    // Mock metrics - en production, utiliser Cloud Monitoring API
    this.logger.log(`Fetching metrics for GCP VM: ${vm.name}`);

    return {
      cpuUsage: Math.random() * 100,
      ramUsage: vm.ramMb ? vm.ramMb * (0.3 + Math.random() * 0.5) : 0,
      ramTotal: vm.ramMb || 0,
      diskUsage: vm.diskGb ? vm.diskGb * (0.4 + Math.random() * 0.4) : 0,
      diskTotal: vm.diskGb || 0,
      networkIn: Math.random() * 10,
      networkOut: Math.random() * 10,
      timestamp: new Date(),
    };
  }

  async testConnection(credentials: any): Promise<boolean> {
    try {
      const compute = this.getClient(credentials);
      await compute.getVMs({ maxResults: 1 });
      return true;
    } catch (error) {
      this.logger.error(`GCP connection test failed: ${error.message}`);
      return false;
    }
  }

  private parseInstanceId(instanceId: string): { zone: string; instanceName: string } {
    // Format attendu: "zone/instanceName"
    const [zone, instanceName] = instanceId?.split('/') || ['', ''];
    return { zone, instanceName };
  }

  private mapGCPStateToVMStatus(state: string | undefined): VMStatus {
    switch (state) {
      case 'RUNNING':
        return VMStatus.RUNNING;
      case 'TERMINATED':
      case 'STOPPED':
        return VMStatus.STOPPED;
      case 'PROVISIONING':
      case 'STAGING':
        return VMStatus.STARTING;
      case 'STOPPING':
        return VMStatus.STOPPING;
      default:
        return VMStatus.UNKNOWN;
    }
  }
}
