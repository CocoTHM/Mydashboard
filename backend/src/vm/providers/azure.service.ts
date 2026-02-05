import { Injectable, Logger } from '@nestjs/common';
import { VM, VMStatus } from '@prisma/client';
import { IVMProvider } from './vm-provider.interface';
import { VMMetrics } from '../dto/vm.dto';
import { ComputeManagementClient } from '@azure/arm-compute';
import { DefaultAzureCredential, ClientSecretCredential } from '@azure/identity';

@Injectable()
export class AzureService implements IVMProvider {
  private readonly logger = new Logger(AzureService.name);

  private getClient(credentials?: any): ComputeManagementClient {
    const subscriptionId = credentials?.subscriptionId || process.env.AZURE_SUBSCRIPTION_ID;

    let credential;
    if (credentials?.clientId && credentials?.clientSecret && credentials?.tenantId) {
      credential = new ClientSecretCredential(
        credentials.tenantId,
        credentials.clientId,
        credentials.clientSecret,
      );
    } else {
      credential = new DefaultAzureCredential();
    }

    return new ComputeManagementClient(credential, subscriptionId);
  }

  async start(vm: VM, credentials: any): Promise<void> {
    this.logger.log(`Starting Azure VM: ${vm.name}`);
    
    const client = this.getClient(credentials);
    const { resourceGroup, vmName } = this.parseInstanceId(vm.instanceId);

    await client.virtualMachines.beginStartAndWait(resourceGroup, vmName);
    this.logger.log(`Azure VM ${vmName} started`);
  }

  async stop(vm: VM, credentials: any): Promise<void> {
    this.logger.log(`Stopping Azure VM: ${vm.name}`);
    
    const client = this.getClient(credentials);
    const { resourceGroup, vmName } = this.parseInstanceId(vm.instanceId);

    await client.virtualMachines.beginPowerOffAndWait(resourceGroup, vmName);
    this.logger.log(`Azure VM ${vmName} stopped`);
  }

  async restart(vm: VM, credentials: any): Promise<void> {
    this.logger.log(`Restarting Azure VM: ${vm.name}`);
    
    const client = this.getClient(credentials);
    const { resourceGroup, vmName } = this.parseInstanceId(vm.instanceId);

    await client.virtualMachines.beginRestartAndWait(resourceGroup, vmName);
    this.logger.log(`Azure VM ${vmName} restarted`);
  }

  async getStatus(vm: VM, credentials: any): Promise<VMStatus> {
    const client = this.getClient(credentials);
    const { resourceGroup, vmName } = this.parseInstanceId(vm.instanceId);

    const instanceView = await client.virtualMachines.instanceView(resourceGroup, vmName);
    const powerState = instanceView.statuses?.find(s => s.code?.startsWith('PowerState/'));

    return this.mapAzureStateToVMStatus(powerState?.code);
  }

  async getMetrics(vm: VM, credentials: any): Promise<VMMetrics> {
    // Mock metrics - en production, utiliser Azure Monitor API
    this.logger.log(`Fetching metrics for Azure VM: ${vm.name}`);

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
      const client = this.getClient(credentials);
      await client.virtualMachines.listAll();
      return true;
    } catch (error) {
      this.logger.error(`Azure connection test failed: ${error.message}`);
      return false;
    }
  }

  private parseInstanceId(instanceId: string): { resourceGroup: string; vmName: string } {
    // Format attendu: "resourceGroup/vmName"
    const [resourceGroup, vmName] = instanceId?.split('/') || ['', ''];
    return { resourceGroup, vmName };
  }

  private mapAzureStateToVMStatus(powerState: string | undefined): VMStatus {
    if (!powerState) return VMStatus.UNKNOWN;

    if (powerState.includes('running')) return VMStatus.RUNNING;
    if (powerState.includes('stopped') || powerState.includes('deallocated')) return VMStatus.STOPPED;
    if (powerState.includes('starting')) return VMStatus.STARTING;
    if (powerState.includes('stopping')) return VMStatus.STOPPING;

    return VMStatus.UNKNOWN;
  }
}
