import { IsString, IsEnum, IsOptional, IsNumber, IsArray, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VMProvider, VMStatus } from '@prisma/client';

export class CreateVmDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: VMProvider })
  @IsEnum(VMProvider)
  provider: VMProvider;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dnsName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  os?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  osVersion?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  vcpus?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  ramMb?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  diskGb?: number;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  instanceId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  zone?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  credentials?: {
    username?: string;
    password?: string;
    privateKey?: string;
    port?: number;
    [key: string]: any;
  };
}

export class UpdateVmDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dnsName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  os?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  osVersion?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  vcpus?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  ramMb?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  diskGb?: number;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsEnum(VMStatus)
  @IsOptional()
  status?: VMStatus;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  credentials?: {
    username?: string;
    password?: string;
    privateKey?: string;
    port?: number;
    [key: string]: any;
  };
}

export interface VMMetrics {
  cpuUsage: number;      // Pourcentage
  ramUsage: number;      // MB
  ramTotal: number;      // MB
  diskUsage: number;     // GB
  diskTotal: number;     // GB
  networkIn?: number;    // MB/s
  networkOut?: number;   // MB/s
  timestamp: Date;
}
