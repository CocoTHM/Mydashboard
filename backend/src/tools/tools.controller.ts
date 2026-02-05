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
import { ToolsService } from './tools.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateToolDto, UpdateToolDto } from './dto/tool.dto';

@ApiTags('tools')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() createToolDto: CreateToolDto) {
    return this.toolsService.create(userId, createToolDto as any);
  }

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('isFavorite') isFavorite?: string,
  ) {
    const filters: any = {};
    if (type) filters.type = type;
    if (category) filters.category = category;
    if (isFavorite) filters.isFavorite = isFavorite === 'true';

    return this.toolsService.findAll(userId, filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.toolsService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateToolDto: UpdateToolDto,
  ) {
    return this.toolsService.update(id, userId, updateToolDto as any);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.toolsService.remove(id, userId);
  }
}
