import request from 'supertest';
import app from '../index';
import { prisma } from '../config/database';

describe('Integration Tests', () => {
  let adminToken: string;
  let projectId: number;
  let moduleId: number;
  let taskId: number;

  beforeAll(async () => {
    // Login as admin
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin@123',
      });

    adminToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    if (taskId) {
      await prisma.task.delete({ where: { id: taskId } });
    }
    if (moduleId) {
      await prisma.module.delete({ where: { id: moduleId } });
    }
    if (projectId) {
      await prisma.project.delete({ where: { id: projectId } });
    }
  });

  describe('Complete Task Creation Flow', () => {
    it('should create a complete task with all related entities', async () => {
      // Step 1: Create a project
      const projectResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Integration Test Project',
          description: 'A project for integration testing',
          clientName: 'Test Client',
          budget: 10000,
          currency: 'USD',
          status: 'active',
          startDate: new Date().toISOString(),
        });

      expect(projectResponse.status).toBe(201);
      projectId = projectResponse.body.data.id;

      // Step 2: Create a module within the project
      const moduleResponse = await request(app)
        .post(`/api/projects/${projectId}/modules`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Integration Test Module',
          description: 'A module for integration testing',
        });

      expect(moduleResponse.status).toBe(201);
      moduleId = moduleResponse.body.data.id;

      // Step 3: Create a task within the module
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Integration Test Task',
          description: 'A task for integration testing',
          moduleId: moduleId,
          estimateHours: 8,
          priority: 'high',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          status: 'pending',
        });

      expect(taskResponse.status).toBe(201);
      taskId = taskResponse.body.data.id;

      // Step 4: Verify the task was created with correct relationships
      const getTaskResponse = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getTaskResponse.status).toBe(200);
      expect(getTaskResponse.body.data.title).toBe('Integration Test Task');
      expect(getTaskResponse.body.data.moduleId).toBe(moduleId);
      expect(getTaskResponse.body.data.priority).toBe('high');
    });

    it('should create time entries for the task', async () => {
      if (!taskId) {
        throw new Error('Task ID not available from previous test');
      }

      // Create a time entry for the task
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

      const timeEntryResponse = await request(app)
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          taskId: taskId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          notes: 'Integration test time entry',
        });

      expect(timeEntryResponse.status).toBe(201);
      expect(timeEntryResponse.body.data.durationMins).toBe(120); // 2 hours = 120 minutes
    });

    it('should add comments to the task', async () => {
      if (!taskId) {
        throw new Error('Task ID not available from previous test');
      }

      // Add a comment to the task
      const commentResponse = await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: 'This is an integration test comment',
        });

      expect(commentResponse.status).toBe(201);
      expect(commentResponse.body.data.content).toBe('This is an integration test comment');
    });

    it('should assign users to the task', async () => {
      if (!taskId) {
        throw new Error('Task ID not available from previous test');
      }

      // Get the current user ID
      const meResponse = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${adminToken}`);

      const currentUserId = meResponse.body.data.id;

      // Assign the current user to the task
      const assignResponse = await request(app)
        .post(`/api/tasks/${taskId}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userIds: [currentUserId],
        });

      expect(assignResponse.status).toBe(200);
      expect(assignResponse.body.data.assignedTo).toHaveLength(1);
    });

    it('should update task status', async () => {
      if (!taskId) {
        throw new Error('Task ID not available from previous test');
      }

      // Update task status to in_progress
      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'in_progress',
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.status).toBe('in_progress');
    });

    it('should complete the task', async () => {
      if (!taskId) {
        throw new Error('Task ID not available from previous test');
      }

      // Mark task as completed
      const completeResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'completed',
        });

      expect(completeResponse.status).toBe(200);
      expect(completeResponse.body.data.status).toBe('completed');
    });
  });

  describe('Project Statistics Integration', () => {
    it('should provide accurate project statistics', async () => {
      if (!projectId) {
        throw new Error('Project ID not available from previous test');
      }

      // Get project details
      const projectResponse = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(projectResponse.status).toBe(200);
      expect(projectResponse.body.data.name).toBe('Integration Test Project');

      // Verify the project has the module and task we created
      expect(projectResponse.body.data.modules).toHaveLength(1);
      expect(projectResponse.body.data.modules[0].tasks).toHaveLength(1);
      expect(projectResponse.body.data.modules[0].tasks[0].status).toBe('completed');
    });
  });

  describe('Data Consistency', () => {
    it('should maintain referential integrity', async () => {
      if (!projectId || !moduleId || !taskId) {
        throw new Error('Test data not available');
      }

      // Verify that deleting the project cascades properly
      const deleteProjectResponse = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteProjectResponse.status).toBe(200);

      // Verify that the module and task are also deleted
      const getModuleResponse = await request(app)
        .get(`/api/modules/${moduleId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getModuleResponse.status).toBe(404);

      const getTaskResponse = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getTaskResponse.status).toBe(404);

      // Reset for cleanup
      projectId = 0;
      moduleId = 0;
      taskId = 0;
    });
  });
});
