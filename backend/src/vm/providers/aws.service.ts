import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VM, VMStatus } from '@prisma/client';
import { IVMProvider } from './vm-provider.interface';
import { VMMetrics } from '../dto/vm.dto';
import { 
  EC2Client, 
  StartInstancesCommand, 
  StopInstancesCommand,
  RebootInstancesCommand,
  DescribeInstancesCommand,
  DescribeInstanceStatusCommand,
} from '@aws-sdk/client-ec2';

@Injectable()
export class AwsService implements IVMProvider {
  private readonly logger = new Logger(AwsService.name);

  constructor(private configService: ConfigService) {}

  private getClient(credentials?: any): EC2Client {
    const config: any = {
      region: credentials?.region || this.configService.get('AWS_REGION') || 'us-east-1',
    };

    if (credentials?.accessKeyId && credentials?.secretAccessKey) {
      config.credentials = {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      };
    }

    return new EC2Client(config);
  }

  async start(vm: VM, credentials: any): Promise<void> {
    this.logger.log(`Starting AWS EC2 instance: ${vm.instanceId}`);
    
    const client = this.getClient(credentials);
    
    const command = new StartInstancesCommand({
      InstanceIds: [vm.instanceId],
    });

    await client.send(command);
    this.logger.log(`AWS EC2 instance ${vm.instanceId} start command sent`);
  }

  async stop(vm: VM, credentials: any): Promise<void> {
    this.logger.log(`Stopping AWS EC2 instance: ${vm.instanceId}`);
    
    const client = this.getClient(credentials);
    
    const command = new StopInstancesCommand({
      InstanceIds: [vm.instanceId],
    });

    await client.send(command);
    this.logger.log(`AWS EC2 instance ${vm.instanceId} stop command sent`);
  }

  async restart(vm: VM, credentials: any): Promise<void> {
    this.logger.log(`Restarting AWS EC2 instance: ${vm.instanceId}`);
    
    const client = this.getClient(credentials);
    
    const command = new RebootInstancesCommand({
      InstanceIds: [vm.instanceId],
    });

    await client.send(command);
    this.logger.log(`AWS EC2 instance ${vm.instanceId} reboot command sent`);
  }

  async getStatus(vm: VM, credentials: any): Promise<VMStatus> {
    const client = this.getClient(credentials);
    
    const command = new DescribeInstancesCommand({
      InstanceIds: [vm.instanceId],
    });

    const response = await client.send(command);
    const instance = response.Reservations?.[0]?.Instances?.[0];

    if (!instance) {
      return VMStatus.UNKNOWN;
    }

    return this.mapEC2StateToVMStatus(instance.State?.Name);
  }

  async getMetrics(vm: VM, credentials: any): Promise<VMMetrics> {
    // Note: Pour des métriques réelles, utiliser CloudWatch
    // Ici, on retourne des métriques mockées pour l'exemple
    
    this.logger.log(`Fetching metrics for AWS EC2 instance: ${vm.instanceId}`);

    // Mock metrics - en production, utiliser CloudWatch API
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
      const command = new DescribeInstancesCommand({ MaxResults: 1 });
      await client.send(command);
      return true;
    } catch (error) {
      this.logger.error(`AWS connection test failed: ${error.message}`);
      return false;
    }
  }

  private mapEC2StateToVMStatus(state: string | undefined): VMStatus {
    switch (state) {
      case 'running':
        return VMStatus.RUNNING;
      case 'stopped':
        return VMStatus.STOPPED;
      case 'pending':
        return VMStatus.STARTING;
      case 'stopping':
        return VMStatus.STOPPING;
      case 'shutting-down':
        return VMStatus.STOPPING;
      case 'terminated':
        return VMStatus.STOPPED;
      default:
        return VMStatus.UNKNOWN;
    }
  }
}
