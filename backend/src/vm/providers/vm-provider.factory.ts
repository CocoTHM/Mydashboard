import { Injectable } from '@nestjs/common';
import { VMProvider } from '@prisma/client';
import { IVMProvider } from './vm-provider.interface';
import { AwsService } from './aws.service';
import { AzureService } from './azure.service';
import { GcpService } from './gcp.service';
import { ProxmoxService } from './proxmox.service';
import { VmwareService } from './vmware.service';

@Injectable()
export class VmProviderFactory {
  constructor(
    private awsService: AwsService,
    private azureService: AzureService,
    private gcpService: GcpService,
    private proxmoxService: ProxmoxService,
    private vmwareService: VmwareService,
  ) {}

  getProvider(provider: VMProvider): IVMProvider {
    switch (provider) {
      case VMProvider.AWS_EC2:
        return this.awsService;
      case VMProvider.AZURE_VM:
        return this.azureService;
      case VMProvider.GCP_COMPUTE:
        return this.gcpService;
      case VMProvider.PROXMOX:
        return this.proxmoxService;
      case VMProvider.VMWARE:
        return this.vmwareService;
      default:
        throw new Error(`Provider ${provider} not implemented`);
    }
  }
}
