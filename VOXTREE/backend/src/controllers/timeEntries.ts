import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';

// Validation schemas
const startTimeEntrySchema = z.object({
  taskId: z.number().int().positive('Task ID is required'),
});

const stopTimeEntrySchema = z.object({
  entryId: z.number().int().positive('Entry ID is required'),
});

const createTimeEntrySchema = z.object({
  taskId: z.number().int().positive('Task ID is required'),
  startTime: z.string().datetime('Start time must be a valid datetime'),
  endTime: z.string().datetime('End time must be a valid datetime'),
  notes: z.string().optional(),
});

const getTimeEntriesSchema = z.object({
  projectId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  from: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  to: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
});

const getTimesheetSchema = z.object({
  from: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  to: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
});

// Helper function to check if user can track time for a task
const canUserTrackTime = async (userId: number, taskId: number): Promise<boolean> => {
  // Check if user is assigned to the task
  const taskAssignment = await prisma.taskAssignment.findFirst({
    where: {
      taskId,
      userId,
    },
  });

  if (taskAssignment) return true;

  // Check if user is assigned to the project (through modules)
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      module: {
        include: {
          project: true,
        },
      },
    },
  });

  if (!task) return false;

  // Check if user has any role that allows time tracking on the project
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!user) return false;

  // Allow time tracking for all roles (this can be customized based on business rules)
  return true;
};

// Start time tracking
export const startTimeEntry = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { taskId } = startTimeEntrySchema.parse(req.body);

    // Check if user can track time for this task
    const canTrack = await canUserTrackTime(userId, taskId);
    if (!canTrack) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to track time for this task',
      });
    }

    // Check if user already has a running time entry
    const existingRunningEntry = await prisma.timeEntry.findFirst({
      where: {
        userId,
        endTime: null,
      },
    });

    if (existingRunningEntry) {
      return res.status(400).json({
        success: false,
        error: 'You already have a running time entry. Please stop it first.',
        data: {
          runningEntry: {
            id: existingRunningEntry.id,
            taskId: existingRunningEntry.taskId,
            startTime: existingRunningEntry.startTime,
          },
        },
      });
    }

    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        module: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        taskId,
        userId,
        startTime: new Date(),
        notes: 'Started time tracking',
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                id: true,
                name: true,
                project: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        user: {
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
      data: timeEntry,
      message: 'Time tracking started successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Start time entry error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start time tracking',
    });
  }
};

// Stop time tracking
export const stopTimeEntry = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { entryId } = stopTimeEntrySchema.parse(req.body);

    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        id: entryId,
        userId,
        endTime: null,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        error: 'Running time entry not found or already stopped',
      });
    }

    const endTime = new Date();
    const durationMins = Math.round((endTime.getTime() - timeEntry.startTime.getTime()) / (1000 * 60));

    const updatedEntry = await prisma.timeEntry.update({
      where: { id: entryId },
      data: {
        endTime,
        durationMins,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                id: true,
                name: true,
                project: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            hourlyRate: true,
            isFreelancer: true,
          },
        },
      },
    });

    // Calculate billing amount for freelancers
    let billingAmount = null;
    if (updatedEntry.user.isFreelancer && updatedEntry.user.hourlyRate) {
      billingAmount = (durationMins / 60) * updatedEntry.user.hourlyRate;
    }

    res.status(200).json({
      success: true,
      data: {
        ...updatedEntry,
        billingAmount,
      },
      message: 'Time tracking stopped successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Stop time entry error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop time tracking',
    });
  }
};

// Create manual time entry
export const createTimeEntry = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validatedData = createTimeEntrySchema.parse(req.body);

    // Check if user can track time for this task
    const canTrack = await canUserTrackTime(userId, validatedData.taskId);
    if (!canTrack) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to track time for this task',
      });
    }

    const startTime = new Date(validatedData.startTime);
    const endTime = new Date(validatedData.endTime);

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        error: 'Start time must be before end time',
      });
    }

    const durationMins = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    // Check for overlapping entries
    const overlappingEntries = await prisma.timeEntry.findMany({
      where: {
        userId,
        OR: [
          {
            startTime: {
              lte: endTime,
            },
            endTime: {
              gte: startTime,
            },
          },
          {
            startTime: {
              lte: endTime,
            },
            endTime: null,
          },
        ],
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    const timeEntry = await prisma.timeEntry.create({
      data: {
        taskId: validatedData.taskId,
        userId,
        startTime,
        endTime,
        durationMins,
        notes: validatedData.notes,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                id: true,
                name: true,
                project: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            hourlyRate: true,
            isFreelancer: true,
          },
        },
      },
    });

    // Calculate billing amount for freelancers
    let billingAmount = null;
    if (timeEntry.user.isFreelancer && timeEntry.user.hourlyRate) {
      billingAmount = (durationMins / 60) * timeEntry.user.hourlyRate;
    }

    const response: any = {
      success: true,
      data: {
        ...timeEntry,
        billingAmount,
      },
      message: 'Time entry created successfully',
    };

    // Add warning if overlapping entries found
    if (overlappingEntries.length > 0) {
      response.warning = {
        message: 'Overlapping time entries detected',
        overlappingEntries: overlappingEntries.map(entry => ({
          id: entry.id,
          taskTitle: entry.task.title,
          startTime: entry.startTime,
          endTime: entry.endTime,
        })),
      };
    }

    res.status(201).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Create time entry error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create time entry',
    });
  }
};

// Get user's time entries
export const getUserTimeEntries = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const targetUserId = parseInt(req.params.id);
    const queryParams = getTimeEntriesSchema.parse(req.query);

    // Check if user can view these time entries (own entries or admin)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const isAdmin = ['Founder', 'ProjectManager'].includes(user.role.name);
    const isOwnEntries = userId === targetUserId;

    if (!isAdmin && !isOwnEntries) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to view these time entries',
      });
    }

    const whereClause: any = {
      userId: targetUserId,
    };

    if (queryParams.projectId) {
      whereClause.task = {
        module: {
          projectId: queryParams.projectId,
        },
      };
    }

    if (queryParams.from || queryParams.to) {
      whereClause.startTime = {};
      if (queryParams.from) {
        whereClause.startTime.gte = queryParams.from;
      }
      if (queryParams.to) {
        whereClause.startTime.lte = queryParams.to;
      }
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: whereClause,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                id: true,
                name: true,
                project: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            hourlyRate: true,
            isFreelancer: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    // Calculate billing amounts for freelancers
    const entriesWithBilling = timeEntries.map(entry => {
      let billingAmount = null;
      if (entry.user.isFreelancer && entry.user.hourlyRate && entry.durationMins) {
        billingAmount = (entry.durationMins / 60) * entry.user.hourlyRate;
      }
      return {
        ...entry,
        billingAmount,
      };
    });

    res.status(200).json({
      success: true,
      data: entriesWithBilling,
      message: 'Time entries retrieved successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Get user time entries error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve time entries',
    });
  }
};

// Get project timesheet
export const getProjectTimesheet = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const projectId = parseInt(req.params.id);
    const queryParams = getTimesheetSchema.parse(req.query);

    // Check if user can view this project's timesheet
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const isAdmin = ['Founder', 'ProjectManager'].includes(user.role.name);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to view project timesheets',
      });
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    const whereClause: any = {
      task: {
        module: {
          projectId,
        },
      },
    };

    if (queryParams.from || queryParams.to) {
      whereClause.startTime = {};
      if (queryParams.from) {
        whereClause.startTime.gte = queryParams.from;
      }
      if (queryParams.to) {
        whereClause.startTime.lte = queryParams.to;
      }
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            hourlyRate: true,
            isFreelancer: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Aggregate by user
    const userAggregates = new Map();

    timeEntries.forEach(entry => {
      const userId = entry.user.id;
      if (!userAggregates.has(userId)) {
        userAggregates.set(userId, {
          user: entry.user,
          totalMinutes: 0,
          totalAmount: 0,
          entries: [],
        });
      }

      const aggregate = userAggregates.get(userId);
      aggregate.totalMinutes += entry.durationMins || 0;
      aggregate.entries.push({
        id: entry.id,
        taskTitle: entry.task.title,
        moduleName: entry.task.module.name,
        startTime: entry.startTime,
        endTime: entry.endTime,
        durationMins: entry.durationMins,
        notes: entry.notes,
      });

      // Calculate billing amount for freelancers
      if (entry.user.isFreelancer && entry.user.hourlyRate && entry.durationMins) {
        const amount = (entry.durationMins / 60) * entry.user.hourlyRate;
        aggregate.totalAmount += amount;
      }
    });

    const timesheetData = Array.from(userAggregates.values()).map(aggregate => ({
      user: aggregate.user,
      totalMinutes: aggregate.totalMinutes,
      totalHours: Math.round((aggregate.totalMinutes / 60) * 100) / 100,
      totalAmount: Math.round(aggregate.totalAmount * 100) / 100,
      entryCount: aggregate.entries.length,
      entries: aggregate.entries,
    }));

    res.status(200).json({
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
        },
        timesheet: timesheetData,
        summary: {
          totalUsers: timesheetData.length,
          totalMinutes: timesheetData.reduce((sum, user) => sum + user.totalMinutes, 0),
          totalAmount: timesheetData.reduce((sum, user) => sum + user.totalAmount, 0),
        },
      },
      message: 'Project timesheet retrieved successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Get project timesheet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve project timesheet',
    });
  }
};

// Get running time entry for current user
export const getRunningTimeEntry = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const runningEntry = await prisma.timeEntry.findFirst({
      where: {
        userId,
        endTime: null, // Running entry has no end time
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                name: true,
                project: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    res.json({
      success: true,
      data: runningEntry,
    });
  } catch (error) {
    console.error('Get running time entry error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get running time entry',
    });
  }
};
