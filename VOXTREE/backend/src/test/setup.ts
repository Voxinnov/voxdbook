import { PrismaClient } from '@prisma/client';

// Global test setup
beforeAll(async () => {
  // Setup test database connection
  process.env['DATABASE_URL'] = process.env['TEST_DATABASE_URL'] || 'file:./test.db';
});

afterAll(async () => {
  // Cleanup
  const prisma = new PrismaClient();
  await prisma.$disconnect();
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
