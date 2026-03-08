import { Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/database';
import { socketService } from '../services/socketService';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Validation schemas
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  moduleId: z.number().int().positive('Module ID is required'),
  estimateHours: z.number().positive().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.string().datetime().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled']).default('todo'),
});

const updateTaskSchema = createTaskSchema.partial();

const assignTaskSchema = z.object({
  userIds: z.array(z.number().int().positive()).min(1, 'At least one user ID is required'),
});

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
});

// Get all tasks
export const getTasks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { status, priority, projectId, moduleId } = req.query;

    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (priority) {
      where.priority = priority;
    }
    
    if (projectId) {
      where.module = {
        projectId: parseInt(projectId as string)
      };
    }
    
    if (moduleId) {
      where.moduleId = parseInt(moduleId as string);
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        module: {
          include: {
            project: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        files: true,
        _count: {
          select: {
            assignments: true,
            comments: true,
            files: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks'
    });
  }
};

// Create task
export const createTask = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validatedData = createTaskSchema.parse(req.body);

    // Check if module exists
    const module = await prisma.module.findUnique({
      where: { id: validatedData.moduleId },
      include: { project: true }
    });

    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Module not found'
      });
    }

    const task = await prisma.task.create({
      data: {
        ...validatedData,
        createdById: userId,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        module: {
          select: { id: true, name: true, project: { select: { id: true, name: true } } }
        },
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        _count: {
          select: {
            comments: true,
            files: true,
            timeEntries: true
          }
        }
      }
    });

    // Log activity
    await prisma.comment.create({
      data: {
        content: `Task "${task.title}" was created`,
        taskId: task.id,
        userId: userId,
        isSystem: true
      }
    });

    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create task'
    });
  }
};

// Get task by ID
export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const taskId = parseInt(id);

    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task ID'
      });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        module: {
          select: { id: true, name: true, project: { select: { id: true, name: true } } }
        },
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        files: {
          orderBy: { createdAt: 'desc' }
        },
        timeEntries: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            comments: true,
            files: true,
            timeEntries: true
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task'
    });
  }
};

// Update task
export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const taskId = parseInt(id);
    const userId = req.user?.id;

    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task ID'
      });
    }

    const validatedData = updateTaskSchema.parse(req.body);

    const oldTask = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!oldTask) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...validatedData,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        module: {
          select: { id: true, name: true, project: { select: { id: true, name: true } } }
        },
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        _count: {
          select: {
            comments: true,
            files: true,
            timeEntries: true
          }
        }
      }
    });

    // Log activity for significant changes
    const changes = [];
    if (validatedData.status && validatedData.status !== oldTask.status) {
      changes.push(`status changed from ${oldTask.status} to ${validatedData.status}`);
    }
    if (validatedData.priority && validatedData.priority !== oldTask.priority) {
      changes.push(`priority changed from ${oldTask.priority} to ${validatedData.priority}`);
    }
    if (validatedData.title && validatedData.title !== oldTask.title) {
      changes.push(`title changed to "${validatedData.title}"`);
    }

    if (changes.length > 0 && userId) {
      await prisma.comment.create({
        data: {
          content: `Task updated: ${changes.join(', ')}`,
          taskId: task.id,
          userId: userId,
          isSystem: true
        }
      });
    }

    res.json({
      success: true,
      data: task,
      message: 'Task updated successfully'
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
        error: 'Task not found'
      });
    }
    
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update task'
    });
  }
};

// Delete task
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const taskId = parseInt(id);

    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task ID'
      });
    }

    await prisma.task.delete({
      where: { id: taskId }
    });

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete task'
    });
  }
};

// Assign task to users
export const assignTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const taskId = parseInt(id);
    const userId = req.user?.id;

    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task ID'
      });
    }

    const validatedData = assignTaskSchema.parse(req.body);

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Check if all users exist
    const users = await prisma.user.findMany({
      where: { id: { in: validatedData.userIds } },
      select: { id: true, name: true, email: true }
    });

    if (users.length !== validatedData.userIds.length) {
      return res.status(400).json({
        success: false,
        error: 'One or more users not found'
      });
    }

    // Remove existing assignments
    await prisma.taskAssignment.deleteMany({
      where: { taskId }
    });

    // Create new assignments
    const assignments = await prisma.taskAssignment.createMany({
      data: validatedData.userIds.map(userId => ({
        taskId,
        userId
      }))
    });

    // Get updated task with assignments
    const updatedTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Log activity
    if (userId) {
      const userNames = users.map(u => u.name).join(', ');
      await prisma.comment.create({
        data: {
          content: `Task assigned to: ${userNames}`,
          taskId: taskId,
          userId: userId,
          isSystem: true
        }
      });
    }

    // Send notifications to assigned users
    const taskWithProject = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        module: {
          include: {
            project: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (taskWithProject) {
      const assignedBy = await prisma.user.findUnique({
        where: { id: userId! },
        select: { name: true, email: true }
      });

      if (assignedBy) {
        // Send notifications to each assigned user
        for (const user of users) {
          await socketService.notifyTaskAssignment(
            user.id,
            taskWithProject.title,
            taskWithProject.module.project.name,
            assignedBy.name,
            assignedBy.email
          );
        }
      }
    }

    res.json({
      success: true,
      data: updatedTask,
      message: 'Task assigned successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    
    console.error('Assign task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign task'
    });
  }
};

// Add comment to task
export const addComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const taskId = parseInt(id);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task ID'
      });
    }

    const validatedData = createCommentSchema.parse(req.body);

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    const comment = await prisma.comment.create({
      data: {
        content: validatedData.content,
        taskId,
        userId,
        isSystem: false
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Send notifications to task assignees
    const taskWithAssignees = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        module: {
          include: {
            project: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (taskWithAssignees && taskWithAssignees.assignedTo.length > 0) {
      const commenter = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true }
      });

      if (commenter) {
        // Send notifications to each assigned user (excluding the commenter)
        for (const assignee of taskWithAssignees.assignedTo) {
          if (assignee.id !== userId) {
            await socketService.notifyNewComment(
              assignee.id,
              commenter.name,
              commenter.email,
              taskWithAssignees.title,
              taskWithAssignees.module.project.name,
              validatedData.content
            );
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      data: comment,
      message: 'Comment added successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment'
    });
  }
};

// Upload file to task
export const uploadFile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const taskId = parseInt(id);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task ID'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    const file = await prisma.file.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        taskId,
        uploadedById: userId
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Log activity
    await prisma.comment.create({
      data: {
        content: `File "${req.file.originalname}" was uploaded`,
        taskId: taskId,
        userId: userId,
        isSystem: true
      }
    });

    // TODO: Emit socket notification for real-time updates
    // socket.emit('fileUploaded', { taskId, file });

    res.status(201).json({
      success: true,
      data: file,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file'
    });
  }
};
