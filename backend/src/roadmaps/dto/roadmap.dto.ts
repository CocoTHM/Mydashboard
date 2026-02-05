import { IsString, IsEnum, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StepStatus } from '@prisma/client';

export class CreateRoadmapDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  domain: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  color?: string;
}

export class UpdateRoadmapDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  domain?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  color?: string;
}

export class CreateStepDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsNumber()
  order: number;

  @ApiPropertyOptional({ enum: StepStatus })
  @IsEnum(StepStatus)
  @IsOptional()
  status?: StepStatus;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class UpdateStepDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ enum: StepStatus })
  @IsEnum(StepStatus)
  @IsOptional()
  status?: StepStatus;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
