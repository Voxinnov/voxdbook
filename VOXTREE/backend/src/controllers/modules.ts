import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';

// Validation schemas
const createModuleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).default('planning'),
});

const updateModuleSchema = createModuleSchema.partial();

// Create module for a project
export const createModule = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const projectIdNum = parseInt(projectId);

    if (isNaN(projectIdNum)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID'
      });
    }

    const validatedData = createModuleSchema.parse(req.body);

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectIdNum }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const module = await prisma.module.create({
      data: {
        ...validatedData,
        projectId: projectIdNum,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
      },
      include: {
        project: {
          select: { id: true, name: true }
        },
        _count: {
          select: { tasks: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: module,
      message: 'Module created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    
    console.error('Create module error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create module'
    });
  }
};

// Get modules for a project
export const getProjectModules = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const projectIdNum = parseInt(projectId);

    if (isNaN(projectIdNum)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID'
      });
    }

    const modules = await prisma.module.findMany({
      where: { projectId: projectIdNum },
      include: {
        _count: {
          select: { tasks: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: modules
    });
  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch modules'
    });
  }
};

// Update module
export const updateModule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const moduleId = parseInt(id);

    if (isNaN(moduleId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid module ID'
      });
    }

    const validatedData = updateModuleSchema.parse(req.body);

    const module = await prisma.module.update({
      where: { id: moduleId },
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
      },
      include: {
        project: {
          select: { id: true, name: true }
        },
        _count: {
          select: { tasks: true }
        }
      }
    });

    res.json({
      success: true,
      data: module,
      message: 'Module updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Module not found'
      });
    }
    
    console.error('Update module error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update module'
    });
  }
};

// Delete module
export const deleteModule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const moduleId = parseInt(id);

    if (isNaN(moduleId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid module ID'
      });
    }

    await prisma.module.delete({
      where: { id: moduleId }
    });

    res.json({
      success: true,
      message: 'Module deleted successfully'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Module not found'
      });
    }
    
    console.error('Delete module error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete module'
    });
  }
};
