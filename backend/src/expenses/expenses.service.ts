import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Expense, Prisma, ExpenseCategory } from '@prisma/client';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: Prisma.ExpenseCreateInput): Promise<Expense> {
    return this.prisma.expense.create({
      data: {
        ...data,
        user: { connect: { id: userId } },
      },
    });
  }

  async findAll(userId: string, filters?: {
    category?: ExpenseCategory;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Expense[]> {
    const where: any = { userId };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    return this.prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string, userId: string): Promise<Expense | null> {
    return this.prisma.expense.findFirst({
      where: { id, userId },
    });
  }

  async update(id: string, userId: string, data: Prisma.ExpenseUpdateInput): Promise<Expense> {
    return this.prisma.expense.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string): Promise<Expense> {
    return this.prisma.expense.delete({
      where: { id },
    });
  }

  async getStatistics(userId: string, year?: number, month?: number) {
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth() + 1;

    const expenses = await this.prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: new Date(currentYear, month ? currentMonth - 1 : 0, 1),
          lte: month 
            ? new Date(currentYear, currentMonth, 0)
            : new Date(currentYear, 11, 31),
        },
      },
    });

    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const byCategory = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAmount,
      count: expenses.length,
      byCategory,
      period: month ? `${currentYear}-${currentMonth}` : `${currentYear}`,
    };
  }
}
