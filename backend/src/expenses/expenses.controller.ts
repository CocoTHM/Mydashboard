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
import { ExpensesService } from './expenses.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/expense.dto';

@ApiTags('expenses')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() createExpenseDto: CreateExpenseDto) {
    return this.expensesService.create(userId, createExpenseDto as any);
  }

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};
    if (category) filters.category = category;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    return this.expensesService.findAll(userId, filters);
  }

  @Get('statistics')
  getStatistics(
    @CurrentUser('id') userId: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.expensesService.getStatistics(
      userId,
      year ? parseInt(year) : undefined,
      month ? parseInt(month) : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.expensesService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(id, userId, updateExpenseDto as any);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.expensesService.remove(id, userId);
  }
}
