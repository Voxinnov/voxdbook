import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';

// Validation schemas
const markReadSchema = z.object({
  notificationIds: z.array(z.number().int().positive()).min(1, 'At least one notification ID is required'),
});

// Get user notifications
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = { userId };
    if (unreadOnly === 'true') {
      whereClause.read = false;
    }

    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.notification.count({ where: whereClause }),
    ]);

    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });

    res.status(200).json({
      success: true,
      data: {
        notifications: notifications.map(notification => ({
          ...notification,
          data: notification.data ? JSON.parse(notification.data) : null,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum),
        },
        unreadCount,
      },
      message: 'Notifications retrieved successfully',
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve notifications',
    });
  }
};

// Mark notifications as read
export const markNotificationsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { notificationIds } = markReadSchema.parse(req.body);

    // Verify all notifications belong to the user
    const notifications = await prisma.notification.findMany({
      where: {
        id: { in: notificationIds },
        userId,
      },
    });

    if (notifications.length !== notificationIds.length) {
      return res.status(400).json({
        success: false,
        error: 'Some notifications not found or do not belong to user',
      });
    }

    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
      },
      data: { read: true },
    });

    res.status(200).json({
      success: true,
      data: { updatedCount: notificationIds.length },
      message: 'Notifications marked as read',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Mark notifications read error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to mark notifications as read',
    });
  }
};

// Mark all notifications as read
export const markAllNotificationsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    res.status(200).json({
      success: true,
      data: { updatedCount: result.count },
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read',
    });
  }
};

// Create notification (internal function)
export const createNotification = async (
  userId: number,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  data?: any
) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        data: data ? JSON.stringify(data) : null,
      },
    });

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

// Get notification statistics
export const getNotificationStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [totalCount, unreadCount, typeStats] = await Promise.all([
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, read: false } }),
      prisma.notification.groupBy({
        by: ['type'],
        where: { userId },
        _count: { type: true },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCount,
        unreadCount,
        readCount: totalCount - unreadCount,
        typeStats: typeStats.reduce((acc, stat) => {
          acc[stat.type] = stat._count.type;
          return acc;
        }, {} as Record<string, number>),
      },
      message: 'Notification statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve notification statistics',
    });
  }
};
