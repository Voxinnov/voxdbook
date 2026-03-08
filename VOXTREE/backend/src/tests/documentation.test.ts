import request from 'supertest';
import { app } from '../index';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Documentation API', () => {
  let authToken: string;
  let projectId: number;
  let userId: number;

  beforeAll(async () => {
    // Create a test user
    const hashedPassword = await bcrypt.hash('testpassword', 12);
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: hashedPassword,
        roleId: 1, // Assuming role with id 1 exists
        isFreelancer: false,
      },
    });
    userId = user.id;

    // Create a test project
    const project = await prisma.project.create({
      data: {
        name: 'Test Project',
        description: 'Test project for documentation',
        createdById: userId,
      },
    });
    projectId = project.id;

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword',
      });

    authToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.documentation.deleteMany({
      where: { projectId },
    });
    await prisma.project.delete({
      where: { id: projectId },
    });
    await prisma.user.delete({
      where: { id: userId },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/documentation', () => {
    it('should create a new document', async () => {
      const documentData = {
        title: 'Test Document',
        type: 'general',
        body: 'This is a test document',
        visibility: 'public',
        projectId,
      };

      const response = await request(app)
        .post('/api/documentation')
        .set('Authorization', `Bearer ${authToken}`)
        .send(documentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(documentData.title);
      expect(response.body.data.type).toBe(documentData.type);
      expect(response.body.data.visibility).toBe(documentData.visibility);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/documentation')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });

    it('should validate document type', async () => {
      const response = await request(app)
        .post('/api/documentation')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Document',
          type: 'invalid_type',
          projectId,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/documentation', () => {
    it('should get documents for a project', async () => {
      const response = await request(app)
        .get(`/api/documentation?projectId=${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should require projectId parameter', async () => {
      const response = await request(app)
        .get('/api/documentation')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Project ID is required');
    });
  });

  describe('POST /api/documentation/:id/comments', () => {
    let documentId: number;

    beforeAll(async () => {
      // Create a test document
      const document = await prisma.documentation.create({
        data: {
          title: 'Test Document for Comments',
          type: 'general',
          body: 'Test document body',
          visibility: 'public',
          projectId,
          createdBy: userId,
        },
      });
      documentId = document.id;
    });

    it('should add a comment to a document', async () => {
      const commentData = {
        body: 'This is a test comment',
      };

      const response = await request(app)
        .post(`/api/documentation/${documentId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.body).toBe(commentData.body);
      expect(response.body.data.userId).toBe(userId);
    });

    it('should validate comment body', async () => {
      const response = await request(app)
        .post(`/api/documentation/${documentId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing body
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Authentication', () => {
    it('should require authentication for all endpoints', async () => {
      const response = await request(app)
        .get('/api/documentation?projectId=1')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });
});






