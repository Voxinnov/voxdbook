import request from 'supertest';
import app from '../index';
import { prisma } from '../config/database';

let adminToken: string;
let freelancerToken: string;
// let developerToken: string;
let founderId: number;
let freelancerId: number;
let developerId: number;
let sampleProjectId: number;
let sampleModuleId: number;
let sampleTaskId: number;

beforeAll(async () => {
  // Login as admin
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'admin@example.com',
      password: 'Admin@123',
    });
  adminToken = adminLogin.body.accessToken;
  founderId = adminLogin.body.user.id;

  // Login as freelancer
  const freelancerLogin = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'freelancer@example.com',
      password: 'Freelancer@123',
    });
  freelancerToken = freelancerLogin.body.accessToken;
  freelancerId = freelancerLogin.body.user.id;

  // Create a developer user for testing
  const developer = await prisma.user.create({
    data: {
      name: 'Test Developer',
      email: 'developer@example.com',
      passwordHash: '$2b$10$example.hash.for.developer',
      roleId: 4, // Developer role
      isFreelancer: false,
    },
  });
  developerId = developer.id;

  // Login as developer
  // const developerLogin = await request(app)
  //   .post('/api/auth/login')
  //   .send({
  //     email: 'developer@example.com',
  //     password: 'Developer@123',
  //   });
  // developerToken = developerLogin.body.accessToken;

  // Create a sample project
  const project = await prisma.project.create({
    data: {
      name: 'Test Project for Time Tracking',
      description: 'Description for time tracking testing',
      createdById: founderId,
      status: 'active',
    },
  });
  sampleProjectId = project.id;

  // Create a sample module
  const module = await prisma.module.create({
    data: {
      name: 'Test Module for Time Tracking',
      projectId: sampleProjectId,
    },
  });
  sampleModuleId = module.id;

  // Create a sample task
  const task = await prisma.task.create({
    data: {
      title: 'Test Task for Time Tracking',
      description: 'Task for time tracking testing',
      moduleId: sampleModuleId,
      estimateHours: 8,
      priority: 'high',
      status: 'todo',
      createdById: founderId,
    },
  });
  sampleTaskId = task.id;

  // Assign freelancer to the task
  await prisma.taskAssignment.create({
    data: {
      taskId: sampleTaskId,
      userId: freelancerId,
    },
  });

  // Assign developer to the task
  await prisma.taskAssignment.create({
    data: {
      taskId: sampleTaskId,
      userId: developerId,
    },
  });
});

afterAll(async () => {
  // Clean up test data
  await prisma.timeEntry.deleteMany({
    where: {
      task: {
        module: {
          projectId: sampleProjectId,
        },
      },
    },
  });

  await prisma.taskAssignment.deleteMany({
    where: {
      taskId: sampleTaskId,
    },
  });

  await prisma.task.deleteMany({
    where: {
      moduleId: sampleModuleId,
    },
  });

  await prisma.module.deleteMany({
    where: {
      projectId: sampleProjectId,
    },
  });

  await prisma.project.deleteMany({
    where: {
      id: sampleProjectId,
    },
  });

  await prisma.user.deleteMany({
    where: {
      email: 'developer@example.com',
    },
  });
});

describe('Time Entry Endpoints', () => {
  describe('POST /api/time-entries/start', () => {
    it('should start time tracking for assigned user', async () => {
      const res = await request(app)
        .post('/api/time-entries/start')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          taskId: sampleTaskId,
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.taskId).toEqual(sampleTaskId);
      expect(res.body.data.userId).toEqual(freelancerId);
      expect(res.body.data.endTime).toBeNull();
    });

    it('should prevent starting multiple time entries', async () => {
      const res = await request(app)
        .post('/api/time-entries/start')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          taskId: sampleTaskId,
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already have a running time entry');
    });

    it('should reject unauthorized users', async () => {
      // Create a user not assigned to the task
      const unauthorizedUser = await prisma.user.create({
        data: {
          name: 'Unauthorized User',
          email: 'unauthorized@example.com',
          passwordHash: '$2b$10$example.hash.for.unauthorized',
          roleId: 4, // Developer role
          isFreelancer: false,
        },
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unauthorized@example.com',
          password: 'Unauthorized@123',
        });

      const res = await request(app)
        .post('/api/time-entries/start')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .send({
          taskId: sampleTaskId,
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('not authorized to track time');

      // Clean up
      await prisma.user.delete({
        where: { id: unauthorizedUser.id },
      });
    });
  });

  describe('POST /api/time-entries/stop', () => {
    it('should stop time tracking and calculate duration', async () => {
      // First, get the running time entry
      const runningEntry = await prisma.timeEntry.findFirst({
        where: {
          userId: freelancerId,
          endTime: null,
        },
      });

      expect(runningEntry).toBeTruthy();

      const res = await request(app)
        .post('/api/time-entries/stop')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          entryId: runningEntry!.id,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('endTime');
      expect(res.body.data).toHaveProperty('durationMins');
      expect(res.body.data.durationMins).toBeGreaterThan(0);
    });

    it('should calculate billing amount for freelancers', async () => {
      // Start a new time entry
      await request(app)
        .post('/api/time-entries/start')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          taskId: sampleTaskId,
        });

      // Wait a moment to ensure duration > 0
      await new Promise(resolve => setTimeout(resolve, 1000));

      const runningEntry = await prisma.timeEntry.findFirst({
        where: {
          userId: freelancerId,
          endTime: null,
        },
      });

      const res = await request(app)
        .post('/api/time-entries/stop')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          entryId: runningEntry!.id,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveProperty('billingAmount');
      expect(res.body.data.billingAmount).toBeGreaterThan(0);
    });
  });

  describe('POST /api/time-entries', () => {
    it('should create manual time entry', async () => {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

      const res = await request(app)
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          taskId: sampleTaskId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          notes: 'Manual time entry for testing',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('durationMins');
      expect(res.body.data.durationMins).toEqual(120); // 2 hours = 120 minutes
      expect(res.body.data.notes).toEqual('Manual time entry for testing');
    });

    it('should warn about overlapping entries', async () => {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 1 * 60 * 60 * 1000); // 1 hour later

      const res = await request(app)
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          taskId: sampleTaskId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          notes: 'Overlapping time entry',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.warning).toBeDefined();
      expect(res.body.warning.message).toContain('Overlapping time entries detected');
    });
  });

  describe('GET /api/time-entries/users/:id/time-entries', () => {
    it('should get user time entries', async () => {
      const res = await request(app)
        .get(`/api/time-entries/users/${freelancerId}/time-entries`)
        .set('Authorization', `Bearer ${freelancerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter by project', async () => {
      const res = await request(app)
        .get(`/api/time-entries/users/${freelancerId}/time-entries?projectId=${sampleProjectId}`)
        .set('Authorization', `Bearer ${freelancerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
    });

    it('should filter by date range', async () => {
      const from = new Date();
      from.setDate(from.getDate() - 7);
      const to = new Date();

      const res = await request(app)
        .get(`/api/time-entries/users/${freelancerId}/time-entries?from=${from.toISOString()}&to=${to.toISOString()}`)
        .set('Authorization', `Bearer ${freelancerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/time-entries/projects/:id/timesheet', () => {
    it('should get project timesheet for admin', async () => {
      const res = await request(app)
        .get(`/api/time-entries/projects/${sampleProjectId}/timesheet`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('project');
      expect(res.body.data).toHaveProperty('timesheet');
      expect(res.body.data).toHaveProperty('summary');
      expect(Array.isArray(res.body.data.timesheet)).toBe(true);
    });

    it('should reject non-admin users', async () => {
      const res = await request(app)
        .get(`/api/time-entries/projects/${sampleProjectId}/timesheet`)
        .set('Authorization', `Bearer ${freelancerToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('not authorized to view project timesheets');
    });

    it('should aggregate time by user', async () => {
      const res = await request(app)
        .get(`/api/time-entries/projects/${sampleProjectId}/timesheet`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.timesheet).toBeDefined();
      
      if (res.body.data.timesheet.length > 0) {
        const userData = res.body.data.timesheet[0];
        expect(userData).toHaveProperty('user');
        expect(userData).toHaveProperty('totalMinutes');
        expect(userData).toHaveProperty('totalHours');
        expect(userData).toHaveProperty('totalAmount');
        expect(userData).toHaveProperty('entryCount');
        expect(userData).toHaveProperty('entries');
      }
    });
  });

  describe('Time Entry Validation', () => {
    it('should validate start time format', async () => {
      const response = await request(app)
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          taskId: sampleTaskId,
          startTime: 'invalid-date',
          endTime: new Date().toISOString(),
          notes: 'Test entry'
        });

      expect(response.status).toBe(400);
    });

    it('should validate end time is after start time', async () => {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() - 3600000); // 1 hour before start

      const response = await request(app)
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          taskId: sampleTaskId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          notes: 'Test entry'
        });

      expect(response.status).toBe(400);
    });

    it('should prevent overlapping time entries', async () => {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 3600000); // 1 hour later

      // Create first entry
      await request(app)
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          taskId: sampleTaskId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          notes: 'First entry'
        });

      // Try to create overlapping entry
      const overlappingStart = new Date(startTime.getTime() + 1800000); // 30 minutes after first start
      const overlappingEnd = new Date(overlappingStart.getTime() + 3600000);

      const response = await request(app)
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          taskId: sampleTaskId,
          startTime: overlappingStart.toISOString(),
          endTime: overlappingEnd.toISOString(),
          notes: 'Overlapping entry'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Time Entry Permissions', () => {
    it('should allow assigned users to create time entries', async () => {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 3600000);

      const response = await request(app)
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          taskId: sampleTaskId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          notes: 'Authorized entry'
        });

      expect(response.status).toBe(201);
    });

    it('should deny unassigned users from creating time entries', async () => {
      // Create a new user not assigned to the task
      const unassignedUser = await prisma.user.create({
        data: {
          name: 'Unassigned User',
          email: 'unassigned@example.com',
          passwordHash: '$2b$10$example.hash.for.unassigned',
          roleId: 4, // Developer role
          isFreelancer: false,
        },
      });

      // Login as unassigned user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unassigned@example.com',
          password: 'password123',
        });

      const unassignedToken = loginResponse.body.accessToken;

      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 3600000);

      const response = await request(app)
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${unassignedToken}`)
        .send({
          taskId: sampleTaskId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          notes: 'Unauthorized entry'
        });

      expect(response.status).toBe(403);

      // Clean up
      await prisma.user.delete({ where: { id: unassignedUser.id } });
    });
  });

  describe('Time Entry Calculations', () => {
    it('should calculate duration correctly', async () => {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 7200000); // 2 hours

      const response = await request(app)
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          taskId: sampleTaskId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          notes: '2 hour entry'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.durationMins).toBe(120); // 2 hours = 120 minutes
    });

    it('should handle fractional hours correctly', async () => {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 5400000); // 1.5 hours

      const response = await request(app)
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          taskId: sampleTaskId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          notes: '1.5 hour entry'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.durationMins).toBe(90); // 1.5 hours = 90 minutes
    });
  });
});
