import request from 'supertest';
import app from '../index';
import { prisma } from '../config/database';

let adminToken: string;
let freelancerToken: string;
let founderId: number;
let freelancerId: number;
let sampleProjectId: number;
let sampleModuleId: number;
let sampleTaskId: number;
let sampleTimeEntryId: number;

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

  // Create a sample project
  const project = await prisma.project.create({
    data: {
      name: 'Test Project for Invoicing',
      description: 'Description for invoice testing',
      createdById: founderId,
      status: 'active',
      clientJson: JSON.stringify({
        name: 'Test Client',
        email: 'client@example.com',
        address: '123 Client Street, City, Country',
        phone: '+1234567890',
      }),
    },
  });
  sampleProjectId = project.id;

  // Create a sample module
  const module = await prisma.module.create({
    data: {
      name: 'Test Module for Invoicing',
      projectId: sampleProjectId,
    },
  });
  sampleModuleId = module.id;

  // Create a sample task
  const task = await prisma.task.create({
    data: {
      title: 'Test Task for Invoicing',
      description: 'Task for invoice testing',
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

  // Create time entries for invoice generation
  const timeEntry = await prisma.timeEntry.create({
    data: {
      taskId: sampleTaskId,
      userId: freelancerId,
      startTime: new Date('2025-10-01T09:00:00.000Z'),
      endTime: new Date('2025-10-01T17:00:00.000Z'),
      durationMins: 480, // 8 hours
      notes: 'Full day of development work',
    },
  });
  sampleTimeEntryId = timeEntry.id;
});

afterAll(async () => {
  // Clean up test data
  await prisma.payment.deleteMany({
    where: {
      invoice: {
        projectId: sampleProjectId,
      },
    },
  });

  await prisma.invoice.deleteMany({
    where: {
      projectId: sampleProjectId,
    },
  });

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
});

describe('Invoice Endpoints', () => {
  describe('POST /api/invoices', () => {
    it('should create invoice from timesheet data', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectId: sampleProjectId,
          from: '2025-10-01T00:00:00.000Z',
          to: '2025-10-01T23:59:59.000Z',
          clientInfo: {
            name: 'Custom Client',
            email: 'custom@example.com',
            address: '456 Custom Street, City, Country',
            phone: '+9876543210',
          },
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('lineItems');
      expect(res.body.data).toHaveProperty('subtotal');
      expect(res.body.data).toHaveProperty('taxAmount');
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data.lineItems).toHaveLength(1);
      expect(res.body.data.lineItems[0].userName).toBe('Jane Freelancer');
      expect(res.body.data.lineItems[0].hours).toBe(8);
      expect(res.body.data.lineItems[0].amount).toBe(9600); // 8 hours * 1200 rate
    });

    it('should reject unauthorized users', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          projectId: sampleProjectId,
          from: '2025-10-01T00:00:00.000Z',
          to: '2025-10-01T23:59:59.000Z',
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('not authorized to create invoices');
    });

    it('should handle no time entries found', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectId: sampleProjectId,
          from: '2025-11-01T00:00:00.000Z',
          to: '2025-11-01T23:59:59.000Z',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('No time entries found');
    });
  });

  describe('GET /api/invoices/:id', () => {
    let invoiceId: number;

    beforeAll(async () => {
      // Create an invoice for testing
      const invoice = await prisma.invoice.create({
        data: {
          projectId: sampleProjectId,
          clientJson: JSON.stringify({
            name: 'Test Client',
            email: 'client@example.com',
          }),
          amount: 11328, // 9600 + 18% tax
          currency: 'INR',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'draft',
          lineItems: JSON.stringify([{
            userId: freelancerId,
            userName: 'Jane Freelancer',
            userEmail: 'freelancer@example.com',
            hours: 8,
            rate: 1200,
            amount: 9600,
            isFreelancer: true,
            entryCount: 1,
          }]),
          fromDate: new Date('2025-10-01T00:00:00.000Z'),
          toDate: new Date('2025-10-01T23:59:59.000Z'),
          createdById: founderId,
        },
      });
      invoiceId = invoice.id;
    });

    it('should get invoice by ID', async () => {
      const res = await request(app)
        .get(`/api/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', invoiceId);
      expect(res.body.data).toHaveProperty('lineItems');
      expect(res.body.data).toHaveProperty('totalPaid');
      expect(res.body.data).toHaveProperty('balance');
      expect(res.body.data).toHaveProperty('clientInfo');
    });

    it('should reject unauthorized users', async () => {
      const res = await request(app)
        .get(`/api/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${freelancerToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('not authorized to view this invoice');
    });
  });

  describe('POST /api/invoices/:id/send', () => {
    let invoiceId: number;

    beforeAll(async () => {
      // Create an invoice for testing
      const invoice = await prisma.invoice.create({
        data: {
          projectId: sampleProjectId,
          clientJson: JSON.stringify({
            name: 'Test Client',
            email: 'client@example.com',
          }),
          amount: 11328,
          currency: 'INR',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'draft',
          lineItems: JSON.stringify([{
            userId: freelancerId,
            userName: 'Jane Freelancer',
            userEmail: 'freelancer@example.com',
            hours: 8,
            rate: 1200,
            amount: 9600,
            isFreelancer: true,
            entryCount: 1,
          }]),
          fromDate: new Date('2025-10-01T00:00:00.000Z'),
          toDate: new Date('2025-10-01T23:59:59.000Z'),
          createdById: founderId,
        },
      });
      invoiceId = invoice.id;
    });

    it('should send invoice via email', async () => {
      const res = await request(app)
        .post(`/api/invoices/${invoiceId}/send`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'client@example.com',
          message: 'Please find attached invoice for your review.',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('emailContent');
      expect(res.body.data.emailContent).toHaveProperty('to', 'client@example.com');
      expect(res.body.data.emailContent).toHaveProperty('subject');
      expect(res.body.data.emailContent).toHaveProperty('html');
    });

    it('should update invoice status to sent', async () => {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

      expect(invoice?.status).toBe('sent');
    });
  });

  describe('POST /api/invoices/:id/pay', () => {
    let invoiceId: number;

    beforeAll(async () => {
      // Create an invoice for testing
      const invoice = await prisma.invoice.create({
        data: {
          projectId: sampleProjectId,
          clientJson: JSON.stringify({
            name: 'Test Client',
            email: 'client@example.com',
          }),
          amount: 11328,
          currency: 'INR',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'draft',
          lineItems: JSON.stringify([{
            userId: freelancerId,
            userName: 'Jane Freelancer',
            userEmail: 'freelancer@example.com',
            hours: 8,
            rate: 1200,
            amount: 9600,
            isFreelancer: true,
            entryCount: 1,
          }]),
          fromDate: new Date('2025-10-01T00:00:00.000Z'),
          toDate: new Date('2025-10-01T23:59:59.000Z'),
          createdById: founderId,
        },
      });
      invoiceId = invoice.id;
    });

    it('should record partial payment', async () => {
      const res = await request(app)
        .post(`/api/invoices/${invoiceId}/pay`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 5000,
          method: 'Bank Transfer',
          notes: 'Partial payment received',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.payment).toHaveProperty('id');
      expect(res.body.data.payment.amount).toBe(5000);
      expect(res.body.data.payment.method).toBe('Bank Transfer');
      expect(res.body.data.invoice.status).toBe('partial');
      expect(res.body.data.invoice.totalPaid).toBe(5000);
    });

    it('should record full payment and update status to paid', async () => {
      const res = await request(app)
        .post(`/api/invoices/${invoiceId}/pay`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 6328, // Remaining balance
          method: 'Bank Transfer',
          notes: 'Final payment received',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.invoice.status).toBe('paid');
      expect(res.body.data.invoice.totalPaid).toBe(11328);
      expect(res.body.data.invoice.balance).toBe(0);
    });

    it('should reject payment exceeding balance', async () => {
      const res = await request(app)
        .post(`/api/invoices/${invoiceId}/pay`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 1000,
          method: 'Bank Transfer',
          notes: 'Excess payment attempt',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Payment amount cannot exceed remaining balance');
    });
  });

  describe('GET /api/invoices/:id/pdf', () => {
    let invoiceId: number;

    beforeAll(async () => {
      // Create an invoice for testing
      const invoice = await prisma.invoice.create({
        data: {
          projectId: sampleProjectId,
          clientJson: JSON.stringify({
            name: 'Test Client',
            email: 'client@example.com',
            address: '123 Client Street, City, Country',
            phone: '+1234567890',
          }),
          amount: 11328,
          currency: 'INR',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'draft',
          lineItems: JSON.stringify([{
            userId: freelancerId,
            userName: 'Jane Freelancer',
            userEmail: 'freelancer@example.com',
            hours: 8,
            rate: 1200,
            amount: 9600,
            isFreelancer: true,
            entryCount: 1,
          }]),
          fromDate: new Date('2025-10-01T00:00:00.000Z'),
          toDate: new Date('2025-10-01T23:59:59.000Z'),
          createdById: founderId,
        },
      });
      invoiceId = invoice.id;
    });

    it('should generate HTML invoice template', async () => {
      const res = await request(app)
        .get(`/api/invoices/${invoiceId}/pdf`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('Invoice #' + invoiceId);
      expect(res.text).toContain('Test Client');
      expect(res.text).toContain('Jane Freelancer');
      expect(res.text).toContain('INR 9600.00');
      expect(res.text).toContain('TODO: Implement PDF generation');
    });
  });
});
