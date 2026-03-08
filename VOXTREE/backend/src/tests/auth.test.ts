import request from 'supertest';
import app from '../index';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Authentication Routes', () => {
  let testUser: any;
  let testRole: any;

  beforeAll(async () => {
    // Create test role
    testRole = await prisma.role.create({
      data: {
        name: 'TestRole',
        desc: 'Test role for authentication tests'
      }
    });

    // Create test user
    const passwordHash = await bcrypt.hash('testpassword123', 12);
    testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        roleId: testRole.id,
        isFreelancer: false
      },
      include: { role: true }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.refreshToken.deleteMany({
      where: { userId: testUser.id }
    });
    await prisma.passwordReset.deleteMany({
      where: { userId: testUser.id }
    });
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    await prisma.role.delete({
      where: { id: testRole.id }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.name).toBe('Test User');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Create a valid refresh token
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword123'
        });

      refreshToken = response.body.refreshToken;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid or expired refresh token');
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Login to get access token
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword123'
        });

      accessToken = response.body.accessToken;
    });

    it('should logout with valid access token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out successfully');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('POST /api/auth/request-reset', () => {
    it('should request password reset for existing user', async () => {
      const response = await request(app)
        .post('/api/auth/request-reset')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('If the email exists, a reset link has been sent');
    });

    it('should return success for non-existent user (security)', async () => {
      const response = await request(app)
        .post('/api/auth/request-reset')
        .send({
          email: 'nonexistent@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('If the email exists, a reset link has been sent');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/request-reset')
        .send({
          email: 'invalid-email'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Protected Routes', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Login to get access token
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword123'
        });

      accessToken = response.body.accessToken;
    });

    describe('GET /api/users/me', () => {
      it('should return current user with valid token', async () => {
        const response = await request(app)
          .get('/api/users/me')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body.user).toHaveProperty('id');
        expect(response.body.user).toHaveProperty('email');
        expect(response.body.user).toHaveProperty('name');
        expect(response.body.user.email).toBe('test@example.com');
      });

      it('should reject request without token', async () => {
        const response = await request(app)
          .get('/api/users/me');

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Access token required');
      });

      it('should reject request with invalid token', async () => {
        const response = await request(app)
          .get('/api/users/me')
          .set('Authorization', 'Bearer invalid-token');

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Invalid or expired token');
      });
    });

    describe('GET /api/users', () => {
      it('should return users list for admin role', async () => {
        // Update user role to Founder for admin access
        await prisma.user.update({
          where: { id: testUser.id },
          data: { roleId: testRole.id }
        });

        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('users');
        expect(Array.isArray(response.body.users)).toBe(true);
      });
    });
  });

  describe('Token Validation', () => {
    it('should validate access token correctly', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword123'
        });

      const { accessToken } = loginResponse.body.data;

      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should reject invalid access token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('should reject expired access token', async () => {
      const expiredToken = jwt.sign(
        { userId: testUser.id, email: testUser.email, role: testUser.role.name },
        process.env.JWT_SECRET!,
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Password Reset Flow', () => {
    it('should request password reset successfully', async () => {
      const response = await request(app)
        .post('/api/auth/request-reset')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject password reset for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/request-reset')
        .send({
          email: 'nonexistent@example.com'
        });

      expect(response.status).toBe(404);
    });

    it('should reset password with valid token', async () => {
      // First request a reset
      await request(app)
        .post('/api/auth/request-reset')
        .send({
          email: 'test@example.com'
        });

      // Get the reset token from database
      const resetRecord = await prisma.passwordReset.findFirst({
        where: { userId: testUser.id }
      });

      const response = await request(app)
        .post('/api/auth/reset')
        .send({
          token: resetRecord?.token,
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify new password works
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'newpassword123'
        });

      expect(loginResponse.status).toBe(200);
    });

    it('should reject password reset with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset')
        .send({
          token: 'invalid-token',
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Role-Based Access Control', () => {
    let adminRole: any;
    let adminUser: any;

    beforeAll(async () => {
      // Create admin role
      adminRole = await prisma.role.create({
        data: {
          name: 'Admin',
          desc: 'Administrator role'
        }
      });

      // Create admin user
      const passwordHash = await bcrypt.hash('adminpassword123', 12);
      adminUser = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@example.com',
          passwordHash,
          roleId: adminRole.id,
          isFreelancer: false
        },
        include: { role: true }
      });
    });

    afterAll(async () => {
      await prisma.user.delete({ where: { id: adminUser.id } });
      await prisma.role.delete({ where: { id: adminRole.id } });
    });

    it('should allow admin to access admin routes', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'adminpassword123'
        });

      const { accessToken } = loginResponse.body.data;

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
    });

    it('should deny regular user access to admin routes', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword123'
        });

      const { accessToken } = loginResponse.body.data;

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(403);
    });
  });
});

