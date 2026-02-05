import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Task, Prisma, TaskStatus, TaskPriority } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: Prisma.TaskCreateInput): Promise<Task> {
    return this.prisma.task.create({
      data: {
        ...data,
        user: { connect: { id: userId } },
      },
    });
  }

  async findAll(userId: string, filters?: {
    status?: TaskStatus;
    priority?: TaskPriority;
  }): Promise<Task[]> {
    const where: any = { userId };
    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;

    return this.prisma.task.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { deadline: 'asc' },
      ],
    });
  }

  async findOne(id: string, userId: string): Promise<Task | null> {
    return this.prisma.task.findFirst({
      where: { id, userId },
    });
  }

  async update(id: string, userId: string, data: Prisma.TaskUpdateInput): Promise<Task> {
    const updateData = { ...data };
    if (data.status === TaskStatus.DONE) {
      updateData.completedAt = new Date();
    }

    return this.prisma.task.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, userId: string): Promise<Task> {
    return this.prisma.task.delete({
      where: { id },
    });
  }
}
