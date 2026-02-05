import { Injectable, Logger } from '@nestjs/common';
import { VM, VMStatus } from '@prisma/client';
import { IVMProvider } from './vm-provider.interface';
import { VMMetrics } from '../dto/vm.dto';
import axios from 'axios';
import * as https from 'https';

@Injectable()
export class ProxmoxService implements IVMProvider {
  private readonly logger = new Logger(ProxmoxService.name);

  private getApiClient(credentials: any) {
    const baseURL = `https://${credentials.host}:${credentials.port || 8006}/api2/json`;
    
    return axios.create({
      baseURL,
      httpsAgent: new https.Agent({
        rejectUnauthorized: credentials.verifySsl !== false,
      }),
    });
  }

  private async getTicket(credentials: any): Promise<{ ticket: string; csrfToken: string }> {
    const client = this.getApiClient(credentials);
    
    const response = await client.post('/access/ticket', {
      username: credentials.username,
      password: credentials.password,
    });

    return {
      ticket: response.data.data.ticket,
      csrfToken: response.data.data.CSRFPreventionToken,
    };
  }

  async start(vm: VM, credentials: any): Promise<void> {
    this.logger.log(`Starting Proxmox VM: ${vm.name}`);
    
    const client = this.getApiClient(credentials);
    const { ticket, csrfToken } = await this.getTicket(credentials);
    
    const { node, vmid } = this.parseInstanceId(vm.instanceId);

    await client.post(`/nodes/${node}/qemu/${vmid}/status/start`, null, {
      headers: {
        'Cookie': `PVEAuthCookie=${ticket}`,
        'CSRFPreventionToken': csrfToken,
      },
    });

    this.logger.log(`Proxmox VM ${vmid} start command sent`);
  }

  async stop(vm: VM, credentials: any): Promise<void> {
    this.logger.log(`Stopping Proxmox VM: ${vm.name}`);
    
    const client = this.getApiClient(credentials);
    const { ticket, csrfToken } = await this.getTicket(credentials);
    
    const { node, vmid } = this.parseInstanceId(vm.instanceId);

    await client.post(`/nodes/${node}/qemu/${vmid}/status/stop`, null, {
      headers: {
        'Cookie': `PVEAuthCookie=${ticket}`,
        'CSRFPreventionToken': csrfToken,
      },
    });

    this.logger.log(`Proxmox VM ${vmid} stop command sent`);
  }

  async restart(vm: VM, credentials: any): Promise<void> {
    this.logger.log(`Restarting Proxmox VM: ${vm.name}`);
    
    const client = this.getApiClient(credentials);
    const { ticket, csrfToken } = await this.getTicket(credentials);
    
    const { node, vmid } = this.parseInstanceId(vm.instanceId);

    await client.post(`/nodes/${node}/qemu/${vmid}/status/reboot`, null, {
      headers: {
        'Cookie': `PVEAuthCookie=${ticket}`,
        'CSRFPreventionToken': csrfToken,
      },
    });

    this.logger.log(`Proxmox VM ${vmid} reboot command sent`);
  }

  async getStatus(vm: VM, credentials: any): Promise<VMStatus> {
    const client = this.getApiClient(credentials);
    const { ticket } = await this.getTicket(credentials);
    
    const { node, vmid } = this.parseInstanceId(vm.instanceId);

    const response = await client.get(`/nodes/${node}/qemu/${vmid}/status/current`, {
      headers: {
        'Cookie': `PVEAuthCookie=${ticket}`,
      },
    });

    return this.mapProxmoxStateToVMStatus(response.data.data.status);
  }

  async getMetrics(vm: VM, credentials: any): Promise<VMMetrics> {
    this.logger.log(`Fetching metrics for Proxmox VM: ${vm.name}`);
    
    const client = this.getApiClient(credentials);
    const { ticket } = await this.getTicket(credentials);
    
    const { node, vmid } = this.parseInstanceId(vm.instanceId);

    try {
      const response = await client.get(`/nodes/${node}/qemu/${vmid}/status/current`, {
        headers: {
          'Cookie': `PVEAuthCookie=${ticket}`,
        },
      });

      const data = response.data.data;

      return {
        cpuUsage: (data.cpu || 0) * 100,
        ramUsage: (data.mem || 0) / (1024 * 1024), // Convertir en MB
        ramTotal: (data.maxmem || 0) / (1024 * 1024),
        diskUsage: (data.disk || 0) / (1024 * 1024 * 1024), // Convertir en GB
        diskTotal: (data.maxdisk || 0) / (1024 * 1024 * 1024),
        networkIn: (data.netin || 0) / (1024 * 1024),
        networkOut: (data.netout || 0) / (1024 * 1024),
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch Proxmox metrics: ${error.message}`);
      throw error;
    }
  }

  async testConnection(credentials: any): Promise<boolean> {
    try {
      await this.getTicket(credentials);
      return true;
    } catch (error) {
      this.logger.error(`Proxmox connection test failed: ${error.message}`);
      return false;
    }
  }

  private parseInstanceId(instanceId: string): { node: string; vmid: string } {
    // Format attendu: "node/vmid" ex: "pve/100"
    const [node, vmid] = instanceId?.split('/') || ['', ''];
    return { node, vmid };
  }

  private mapProxmoxStateToVMStatus(state: string | undefined): VMStatus {
    switch (state) {
      case 'running':
        return VMStatus.RUNNING;
      case 'stopped':
        return VMStatus.STOPPED;
      case 'paused':
        return VMStatus.STOPPED;
      default:
        return VMStatus.UNKNOWN;
    }
  }
}
