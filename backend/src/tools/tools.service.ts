import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Tool, Prisma, ToolType } from '@prisma/client';

@Injectable()
export class ToolsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: Prisma.ToolCreateInput): Promise<Tool> {
    return this.prisma.tool.create({
      data: {
        ...data,
        user: { connect: { id: userId } },
      },
    });
  }

  async findAll(userId: string, filters?: {
    type?: ToolType;
    category?: string;
    isFavorite?: boolean;
  }): Promise<Tool[]> {
    const where: any = { userId };
    if (filters?.type) where.type = filters.type;
    if (filters?.category) where.category = filters.category;
    if (filters?.isFavorite !== undefined) where.isFavorite = filters.isFavorite;

    return this.prisma.tool.findMany({
      where,
      orderBy: [
        { isFavorite: 'desc' },
        { name: 'asc' },
      ],
    });
  }

  async findOne(id: string, userId: string): Promise<Tool | null> {
    return this.prisma.tool.findFirst({
      where: { id, userId },
    });
  }

  async update(id: string, userId: string, data: Prisma.ToolUpdateInput): Promise<Tool> {
    return this.prisma.tool.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string): Promise<Tool> {
    return this.prisma.tool.delete({
      where: { id },
    });
  }
}
