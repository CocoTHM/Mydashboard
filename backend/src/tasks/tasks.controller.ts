import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(userId, createTaskDto as any);
  }

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;

    return this.tasksService.findAll(userId, filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.tasksService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, userId, updateTaskDto as any);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.tasksService.remove(id, userId);
  }
}
