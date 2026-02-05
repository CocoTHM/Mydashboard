import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RoadmapsService } from './roadmaps.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateRoadmapDto, UpdateRoadmapDto, CreateStepDto, UpdateStepDto } from './dto/roadmap.dto';

@ApiTags('roadmaps')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('roadmaps')
export class RoadmapsController {
  constructor(private readonly roadmapsService: RoadmapsService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() createRoadmapDto: CreateRoadmapDto) {
    return this.roadmapsService.create(userId, createRoadmapDto as any);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.roadmapsService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.roadmapsService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateRoadmapDto: UpdateRoadmapDto,
  ) {
    return this.roadmapsService.update(id, userId, updateRoadmapDto as any);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.roadmapsService.remove(id, userId);
  }

  @Post(':id/steps')
  addStep(
    @Param('id') roadmapId: string,
    @CurrentUser('id') userId: string,
    @Body() createStepDto: CreateStepDto,
  ) {
    return this.roadmapsService.addStep(roadmapId, userId, createStepDto as any);
  }

  @Patch('steps/:stepId')
  updateStep(@Param('stepId') stepId: string, @Body() updateStepDto: UpdateStepDto) {
    return this.roadmapsService.updateStep(stepId, updateStepDto as any);
  }

  @Delete('steps/:stepId')
  removeStep(@Param('stepId') stepId: string) {
    return this.roadmapsService.removeStep(stepId);
  }
}
