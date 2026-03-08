import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { createNotification } from '../controllers/notifications';
import { emailService } from './emailService';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  userEmail?: string;
  userName?: string;
}

class SocketService {
  private io: SocketIOServer | null = null;
  private userSockets = new Map<number, string[]>(); // userId -> socketIds

  initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env['FRONTEND_URL'] || 'http://localhost:5174',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log('🔌 Socket connected:', socket.id);

      // Handle authentication
      socket.on('authenticate', (data: { token: string }) => {
        try {
          // In a real implementation, you would verify the JWT token here
          // For now, we'll use a simple approach
          const userId = parseInt(data.token); // This is a simplified approach
          if (userId) {
            socket.userId = userId;
            socket.userEmail = `user${userId}@example.com`;
            socket.userName = `User ${userId}`;

            // Track user socket
            if (!this.userSockets.has(userId)) {
              this.userSockets.set(userId, []);
            }
            this.userSockets.get(userId)!.push(socket.id);

            socket.emit('authenticated', { success: true });
            console.log(`🔌 User ${userId} authenticated on socket ${socket.id}`);
          }
        } catch (error) {
          console.error('Socket authentication error:', error);
          socket.emit('authentication_error', { message: 'Invalid token' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('🔌 Socket disconnected:', socket.id);
        if (socket.userId) {
          const userSockets = this.userSockets.get(socket.userId);
          if (userSockets) {
            const index = userSockets.indexOf(socket.id);
            if (index > -1) {
              userSockets.splice(index, 1);
            }
            if (userSockets.length === 0) {
              this.userSockets.delete(socket.userId);
            }
          }
        }
      });

      // Handle joining project rooms
      socket.on('join_project', (projectId: number) => {
        if (socket.userId) {
          socket.join(`project_${projectId}`);
          console.log(`🔌 User ${socket.userId} joined project ${projectId}`);
        }
      });

      // Handle leaving project rooms
      socket.on('leave_project', (projectId: number) => {
        socket.leave(`project_${projectId}`);
        console.log(`🔌 User left project ${projectId}`);
      });
    });

    console.log('🔌 Socket.IO service initialized');
  }

  // Emit notification to specific user
  async emitNotificationToUser(userId: number, notification: any) {
    if (!this.io) return;

    const userSockets = this.userSockets.get(userId);
    if (userSockets && userSockets.length > 0) {
      userSockets.forEach(socketId => {
        this.io!.to(socketId).emit('notification', notification);
      });
      console.log(`📢 Notification sent to user ${userId}`);
    }
  }

  // Emit notification to project room
  async emitNotificationToProject(projectId: number, notification: any) {
    if (!this.io) return;

    this.io.to(`project_${projectId}`).emit('project_notification', notification);
    console.log(`📢 Project notification sent to project ${projectId}`);
  }

  // Create and send notification for task assignment
  async notifyTaskAssignment(
    assignedUserId: number,
    taskTitle: string,
    projectName: string,
    assignedByName: string,
    assignedByEmail: string
  ) {
    try {
      // Create database notification
      const notification = await createNotification(
        assignedUserId,
        'New Task Assignment',
        `You have been assigned to task: ${taskTitle}`,
        'info',
        {
          type: 'task_assignment',
          taskTitle,
          projectName,
          assignedBy: assignedByName,
        }
      );

      if (notification) {
        // Emit real-time notification
        await this.emitNotificationToUser(assignedUserId, {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          createdAt: notification.createdAt,
        });

        // Send email notification
        await emailService.sendTaskAssignmentNotification(
          assignedByEmail, // This should be the assigned user's email
          assignedByName, // This should be the assigned user's name
          taskTitle,
          projectName,
          assignedByName
        );
      }
    } catch (error) {
      console.error('Task assignment notification error:', error);
    }
  }

  // Create and send notification for new comment
  async notifyNewComment(
    taskUserId: number,
    commenterName: string,
    commenterEmail: string,
    taskTitle: string,
    projectName: string,
    commentContent: string
  ) {
    try {
      // Create database notification
      const notification = await createNotification(
        taskUserId,
        'New Comment',
        `${commenterName} commented on task: ${taskTitle}`,
        'info',
        {
          type: 'new_comment',
          taskTitle,
          projectName,
          commenter: commenterName,
          commentContent,
        }
      );

      if (notification) {
        // Emit real-time notification
        await this.emitNotificationToUser(taskUserId, {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          createdAt: notification.createdAt,
        });

        // Send email notification
        await emailService.sendCommentNotification(
          commenterEmail, // This should be the task user's email
          commenterName, // This should be the task user's name
          taskTitle,
          commenterName,
          commentContent,
          projectName
        );
      }
    } catch (error) {
      console.error('Comment notification error:', error);
    }
  }

  // Create and send notification for invoice sent
  async notifyInvoiceSent(
    clientEmail: string,
    clientName: string,
    invoiceNumber: string,
    amount: number,
    currency: string,
    dueDate: string
  ) {
    try {
      // Send email notification
      await emailService.sendInvoiceNotification(
        clientEmail,
        clientName,
        invoiceNumber,
        amount,
        currency,
        dueDate
      );
    } catch (error) {
      console.error('Invoice notification error:', error);
    }
  }

  // Create and send notification for payment received
  async notifyPaymentReceived(
    clientEmail: string,
    clientName: string,
    invoiceNumber: string,
    amount: number,
    currency: string,
    paymentMethod: string
  ) {
    try {
      // Send email notification
      await emailService.sendPaymentConfirmation(
        clientEmail,
        clientName,
        invoiceNumber,
        amount,
        currency,
        paymentMethod
      );
    } catch (error) {
      console.error('Payment notification error:', error);
    }
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  // Get user socket count
  getUserSocketCount(userId: number): number {
    const userSockets = this.userSockets.get(userId);
    return userSockets ? userSockets.length : 0;
  }
}

export const socketService = new SocketService();
export default socketService;
