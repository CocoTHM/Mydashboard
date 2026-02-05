import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';
import { VmController } from './vm.controller';
import { VmService } from './vm.service';
import { VmGateway } from './vm.gateway';
import { VmProcessor } from './vm.processor';
import { AwsService } from './providers/aws.service';
import { AzureService } from './providers/azure.service';
import { GcpService } from './providers/gcp.service';
import { ProxmoxService } from './providers/proxmox.service';
import { VmwareService } from './providers/vmware.service';
import { VmProviderFactory } from './providers/vm-provider.factory';

@Module({
  imports: [
    JwtModule.register({}),
    BullModule.registerQueue({
      name: 'vm-operations',
    }),
  ],
  controllers: [VmController],
  providers: [
    VmService,
    VmGateway,
    VmProcessor,
    AwsService,
    AzureService,
    GcpService,
    ProxmoxService,
    VmwareService,
    VmProviderFactory,
  ],
  exports: [VmService],
})
export class VmModule {}
