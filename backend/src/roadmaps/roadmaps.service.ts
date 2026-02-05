import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Roadmap, Prisma } from '@prisma/client';

@Injectable()
export class RoadmapsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: Prisma.RoadmapCreateInput): Promise<Roadmap> {
    return this.prisma.roadmap.create({
      data: {
        ...data,
        user: { connect: { id: userId } },
      },
      include: { steps: true },
    });
  }

  async findAll(userId: string): Promise<Roadmap[]> {
    return this.prisma.roadmap.findMany({
      where: { userId },
      include: { steps: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string): Promise<Roadmap | null> {
    return this.prisma.roadmap.findFirst({
      where: { id, userId },
      include: { steps: { orderBy: { order: 'asc' } } },
    });
  }

  async update(id: string, userId: string, data: Prisma.RoadmapUpdateInput): Promise<Roadmap> {
    return this.prisma.roadmap.update({
      where: { id },
      data,
      include: { steps: true },
    });
  }

  async remove(id: string, userId: string): Promise<Roadmap> {
    return this.prisma.roadmap.delete({
      where: { id },
    });
  }

  async addStep(roadmapId: string, userId: string, stepData: Prisma.StepCreateInput) {
    const roadmap = await this.findOne(roadmapId, userId);
    if (!roadmap) throw new Error('Roadmap not found');

    return this.prisma.step.create({
      data: {
        ...stepData,
        roadmap: { connect: { id: roadmapId } },
      },
    });
  }

  async updateStep(stepId: string, data: Prisma.StepUpdateInput) {
    return this.prisma.step.update({
      where: { id: stepId },
      data,
    });
  }

  async removeStep(stepId: string) {
    return this.prisma.step.delete({
      where: { id: stepId },
    });
  }
}
