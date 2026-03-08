import request from 'supertest';
import app from '../index';
import { prisma } from '../config/database';

let adminToken: string;
let adminId: number;

beforeAll(async () => {
  // Clear database
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  // Create roles
  await prisma.role.createMany({
    data: [
      { name: 'Founder', desc: 'System Founder' },
      { name: 'ProjectManager', desc: 'Manages projects' },
      { name: 'Developer', desc: 'Software Developer' },
    ],
  });

  const founderRole = await prisma.role.findUnique({ where: { name: 'Founder' } });

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      name: 'Test Admin',
      email: 'admin@test.com',
      passwordHash: '$2b$10$test.hash',
      roleId: founderRole!.id,
    },
  });

  adminId = adminUser.id;

  // Login to get token
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'admin@test.com',
      password: 'Admin@123',
    });

  adminToken = loginResponse.body.data.accessToken;
});

afterAll(async () => {
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.$disconnect();
});

describe('Notification API', () => {
  describe('GET /api/notifications', () => {
    it('should get user notifications', async () => {
      // Create a test notification
      await prisma.notification.create({
        data: {
          userId: adminId,
          title: 'Test Notification',
          message: 'This is a test notification',
          type: 'info',
        },
      });

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toHaveLength(1);
      expect(response.body.data.notifications[0].title).toBe('Test Notification');
    });

    it('should get unread notifications only', async () => {
      // Create read and unread notifications
      await prisma.notification.createMany({
        data: [
          {
            userId: adminId,
            title: 'Read Notification',
            message: 'This is read',
            type: 'info',
            read: true,
          },
          {
            userId: adminId,
            title: 'Unread Notification',
            message: 'This is unread',
            type: 'info',
            read: false,
          },
        ],
      });

      const response = await request(app)
        .get('/api/notifications?unreadOnly=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      const unreadNotifications = response.body.data.notifications.filter(
        (n: any) => !n.read
      );
      expect(unreadNotifications.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/notifications/mark-read', () => {
    it('should mark notifications as read', async () => {
      // Create test notifications
      await prisma.notification.createMany({
        data: [
          {
            userId: adminId,
            title: 'Notification 1',
            message: 'Test message 1',
            type: 'info',
          },
          {
            userId: adminId,
            title: 'Notification 2',
            message: 'Test message 2',
            type: 'info',
          },
        ],
      });

      const notificationIds = await prisma.notification.findMany({
        where: { userId: adminId },
        select: { id: true },
      });

      const response = await request(app)
        .post('/api/notifications/mark-read')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notificationIds: notificationIds.map(n => n.id),
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.updatedCount).toBe(2);
    });
  });

  describe('POST /api/notifications/mark-all-read', () => {
    it('should mark all notifications as read', async () => {
      // Create unread notifications
      await prisma.notification.createMany({
        data: [
          {
            userId: adminId,
            title: 'Unread 1',
            message: 'Unread message 1',
            type: 'info',
            read: false,
          },
          {
            userId: adminId,
            title: 'Unread 2',
            message: 'Unread message 2',
            type: 'info',
            read: false,
          },
        ],
      });

      const response = await request(app)
        .post('/api/notifications/mark-all-read')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.updatedCount).toBeGreaterThan(0);
    });
  });

  describe('GET /api/notifications/stats', () => {
    it('should get notification statistics', async () => {
      const response = await request(app)
        .get('/api/notifications/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalCount');
      expect(response.body.data).toHaveProperty('unreadCount');
      expect(response.body.data).toHaveProperty('readCount');
      expect(response.body.data).toHaveProperty('typeStats');
    });
  });
});
