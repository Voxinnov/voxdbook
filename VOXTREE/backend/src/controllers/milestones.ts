import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';

// Validation schemas
const createMilestoneSchema = z.object({
  name: z.string().min(1, 'Milestone name is required'),
  description: z.string().optional(),
  status: z.enum(['planning', 'in_progress', 'completed', 'cancelled']).default('planning'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  progress: z.number().min(0).max(100).default(0),
  projectId: z.number().int().positive('Project ID is required'),
});

const updateMilestoneSchema = createMilestoneSchema.partial();

// Get all milestones
export const getMilestones = async (req: Request, res: Response) => {
  try {
    const { projectId, status, priority } = req.query;

    const where: any = {};

    if (projectId) {
      where.projectId = parseInt(projectId as string);
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (priority && priority !== 'all') {
      where.priority = priority;
    }

    const milestones = await prisma.milestone.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: milestones,
    });
  } catch (error) {
    console.error('Get milestones error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch milestones',
    });
  }
};

// Get milestone by ID
export const getMilestoneById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const milestoneId = parseInt(id);

    if (isNaN(milestoneId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid milestone ID',
      });
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tasks: {
          include: {
            assignments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            _count: {
              select: {
                assignments: true,
                timeEntries: true,
                comments: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!milestone) {
      return res.status(404).json({
        success: false,
        error: 'Milestone not found',
      });
    }

    res.json({
      success: true,
      data: milestone,
    });
  } catch (error) {
    console.error('Get milestone by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch milestone',
    });
  }
};

// Create new milestone
export const createMilestone = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validatedData = createMilestoneSchema.parse(req.body);

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    const milestone = await prisma.milestone.create({
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        createdById: userId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: milestone,
      message: 'Milestone created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Create milestone error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create milestone',
    });
  }
};

// Update milestone
export const updateMilestone = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const milestoneId = parseInt(id);

    if (isNaN(milestoneId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid milestone ID',
      });
    }

    const validatedData = updateMilestoneSchema.parse(req.body);

    // Check if milestone exists
    const existingMilestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
    });

    if (!existingMilestone) {
      return res.status(404).json({
        success: false,
        error: 'Milestone not found',
      });
    }

    // If projectId is being changed, check if new project exists
    if (validatedData.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: validatedData.projectId },
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found',
        });
      }
    }

    // Prepare update data
    const updateData: any = { ...validatedData };
    
    // Handle date fields
    if (validatedData.startDate) {
      updateData.startDate = new Date(validatedData.startDate);
    }
    if (validatedData.endDate) {
      updateData.endDate = new Date(validatedData.endDate);
    }
    if (validatedData.dueDate) {
      updateData.dueDate = new Date(validatedData.dueDate);
    }

    const milestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: milestone,
      message: 'Milestone updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Update milestone error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update milestone',
    });
  }
};

// Delete milestone
export const deleteMilestone = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const milestoneId = parseInt(id);

    if (isNaN(milestoneId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid milestone ID',
      });
    }

    // Check if milestone exists
    const existingMilestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
    });

    if (!existingMilestone) {
      return res.status(404).json({
        success: false,
        error: 'Milestone not found',
      });
    }

    // Check if milestone has tasks
    const taskCount = await prisma.task.count({
      where: { milestoneId: milestoneId },
    });

    if (taskCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete milestone with associated tasks',
      });
    }

    await prisma.milestone.delete({
      where: { id: milestoneId },
    });

    res.json({
      success: true,
      message: 'Milestone deleted successfully',
    });
  } catch (error) {
    console.error('Delete milestone error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete milestone',
    });
  }
};

// Get milestones by project
export const getMilestonesByProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const projectIdNum = parseInt(projectId);

    if (isNaN(projectIdNum)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID',
      });
    }

    const milestones = await prisma.milestone.findMany({
      where: { projectId: projectIdNum },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: milestones,
    });
  } catch (error) {
    console.error('Get milestones by project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch milestones for project',
    });
  }
};

// Update milestone progress
export const updateMilestoneProgress = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;
    const milestoneId = parseInt(id);

    if (isNaN(milestoneId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid milestone ID',
      });
    }

    if (progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        error: 'Progress must be between 0 and 100',
      });
    }

    const milestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: { progress },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: milestone,
      message: 'Milestone progress updated successfully',
    });
  } catch (error) {
    console.error('Update milestone progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update milestone progress',
    });
  }
};
