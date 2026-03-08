import request from 'supertest';
import app from '../index';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

describe('Task API', () => {
  let authToken: string;
  let userId: number;
  let projectId: number;
  let moduleId: number;
  let taskId: number;

  beforeAll(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash('Test@123', 10);
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: hashedPassword,
        roleId: 1, // Assuming role 1 exists
      }
    });
    userId = user.id;

    // Create test project
    const project = await prisma.project.create({
      data: {
        name: 'Test Project',
        description: 'Test project description',
        createdById: userId,
        status: 'active'
      }
    });
    projectId = project.id;

    // Create test module
    const module = await prisma.module.create({
      data: {
        name: 'Test Module',
        description: 'Test module description',
        projectId: projectId,
        status: 'active'
      }
    });
    moduleId = module.id;

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test@123'
      });

    authToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.task.deleteMany({ where: { moduleId } });
    await prisma.module.deleteMany({ where: { projectId } });
    await prisma.project.deleteMany({ where: { id: projectId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test task description',
        moduleId: moduleId,
        estimateHours: 8,
        priority: 'high',
        status: 'todo'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(taskData.title);
      expect(response.body.data.moduleId).toBe(moduleId);
      expect(response.body.data.createdById).toBe(userId);

      taskId = response.body.data.id;
    });

    it('should fail with invalid module ID', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test task description',
        moduleId: 99999,
        estimateHours: 8,
        priority: 'high',
        status: 'todo'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Module not found');
    });

    it('should fail without authentication', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test task description',
        moduleId: moduleId,
        estimateHours: 8,
        priority: 'high',
        status: 'todo'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should get task by ID', async () => {
      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(taskId);
      expect(response.body.data.title).toBe('Test Task');
    });

    it('should fail with invalid task ID', async () => {
      const response = await request(app)
        .get('/api/tasks/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update task', async () => {
      const updateData = {
        title: 'Updated Task',
        status: 'in_progress',
        priority: 'urgent'
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.status).toBe(updateData.status);
      expect(response.body.data.priority).toBe(updateData.priority);
    });
  });

  describe('POST /api/tasks/:id/assign', () => {
    let assigneeId: number;

    beforeAll(async () => {
      // Create another user for assignment
      const hashedPassword = await bcrypt.hash('Assignee@123', 10);
      const assignee = await prisma.user.create({
        data: {
          name: 'Assignee User',
          email: 'assignee@example.com',
          passwordHash: hashedPassword,
          roleId: 1,
        }
      });
      assigneeId = assignee.id;
    });

    afterAll(async () => {
      await prisma.user.delete({ where: { id: assigneeId } });
    });

    it('should assign task to users', async () => {
      const assignmentData = {
        userIds: [assigneeId]
      };

      const response = await request(app)
        .post(`/api/tasks/${taskId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(assignmentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.assignedTo).toHaveLength(1);
      expect(response.body.data.assignedTo[0].id).toBe(assigneeId);
    });

    it('should fail with invalid user IDs', async () => {
      const assignmentData = {
        userIds: [99999]
      };

      const response = await request(app)
        .post(`/api/tasks/${taskId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(assignmentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('One or more users not found');
    });
  });

  describe('POST /api/tasks/:id/comments', () => {
    it('should add comment to task', async () => {
      const commentData = {
        content: 'This is a test comment'
      };

      const response = await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe(commentData.content);
      expect(response.body.data.userId).toBe(userId);
    });

    it('should fail with empty comment', async () => {
      const commentData = {
        content: ''
      };

      const response = await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete task', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task deleted successfully');
    });
  });
});
