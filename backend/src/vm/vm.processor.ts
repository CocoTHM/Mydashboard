import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { VmService } from './vm.service';
import { VmGateway } from './vm.gateway';

@Processor('vm-operations')
export class VmProcessor {
  constructor(
    private vmService: VmService,
    private vmGateway: VmGateway,
  ) {}

  @Process('start-vm')
  async handleStartVM(job: Job) {
    const { vmId, userId } = job.data;
    
    console.log(`Processing start VM: ${vmId}`);
    
    try {
      await this.vmService.executeAction(vmId, 'start');
      
      // Notifier via WebSocket
      this.vmGateway.emitVMStatusUpdate(vmId, 'RUNNING');
      this.vmGateway.notifyUser(userId, 'vm-action-complete', {
        vmId,
        action: 'start',
        success: true,
      });
    } catch (error) {
      console.error(`Failed to start VM ${vmId}:`, error);
      
      this.vmGateway.emitVMStatusUpdate(vmId, 'ERROR');
      this.vmGateway.notifyUser(userId, 'vm-action-error', {
        vmId,
        action: 'start',
        error: error.message,
      });
    }
  }

  @Process('stop-vm')
  async handleStopVM(job: Job) {
    const { vmId, userId } = job.data;
    
    console.log(`Processing stop VM: ${vmId}`);
    
    try {
      await this.vmService.executeAction(vmId, 'stop');
      
      this.vmGateway.emitVMStatusUpdate(vmId, 'STOPPED');
      this.vmGateway.notifyUser(userId, 'vm-action-complete', {
        vmId,
        action: 'stop',
        success: true,
      });
    } catch (error) {
      console.error(`Failed to stop VM ${vmId}:`, error);
      
      this.vmGateway.emitVMStatusUpdate(vmId, 'ERROR');
      this.vmGateway.notifyUser(userId, 'vm-action-error', {
        vmId,
        action: 'stop',
        error: error.message,
      });
    }
  }

  @Process('restart-vm')
  async handleRestartVM(job: Job) {
    const { vmId, userId } = job.data;
    
    console.log(`Processing restart VM: ${vmId}`);
    
    try {
      await this.vmService.executeAction(vmId, 'restart');
      
      this.vmGateway.emitVMStatusUpdate(vmId, 'RUNNING');
      this.vmGateway.notifyUser(userId, 'vm-action-complete', {
        vmId,
        action: 'restart',
        success: true,
      });
    } catch (error) {
      console.error(`Failed to restart VM ${vmId}:`, error);
      
      this.vmGateway.emitVMStatusUpdate(vmId, 'ERROR');
      this.vmGateway.notifyUser(userId, 'vm-action-error', {
        vmId,
        action: 'restart',
        error: error.message,
      });
    }
  }
}
