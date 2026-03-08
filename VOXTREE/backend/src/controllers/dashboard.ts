import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        error: 'Unauthorized' 
      });
    }

    // Get all statistics in parallel
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      openTasks,
      completedTasks,
      totalTimeEntries,
      totalInvoices,
      pendingInvoices,
      paidInvoices,
      overdueInvoices
    ] = await Promise.all([
      // Project counts
      prisma.project.count(),
      prisma.project.count({ where: { status: 'active' } }),
      prisma.project.count({ where: { status: 'completed' } }),
      
      // Task counts
      prisma.task.count(),
      prisma.task.count({ where: { status: { in: ['pending', 'in_progress'] } } }),
      prisma.task.count({ where: { status: 'completed' } }),
      
      // Time entry counts
      prisma.timeEntry.count(),
      
      // Invoice counts
      prisma.invoice.count(),
      prisma.invoice.count({ where: { status: { in: ['draft', 'sent'] } } }),
      prisma.invoice.count({ where: { status: 'paid' } }),
      prisma.invoice.count({ 
        where: { 
          status: { in: ['sent', 'overdue'] },
          dueDate: { lt: new Date() }
        } 
      })
    ]);

    const summary = {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      openTasks,
      completedTasks,
      totalTimeEntries,
      totalInvoices,
      pendingInvoices,
      paidInvoices,
      overdueInvoices
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard summary'
    });
  }
};
