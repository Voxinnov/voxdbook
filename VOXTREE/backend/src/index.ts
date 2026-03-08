import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { prisma } from './config/database';
import { socketService } from './services/socketService';
import { setupSwagger } from './config/swagger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env['FRONTEND_URL'] || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // limit each IP to 10000 requests per windowMs (increased for development)
  message: 'Too many requests from this IP, please try again later.',
});

// Apply rate limiting to all API routes except time-entries/running
app.use('/api/', (req, res, next) => {
  if (req.path === '/time-entries/running') {
    // Skip rate limiting for running time entry endpoint
    return next();
  }
  return limiter(req, res, next);
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      version: process.env['npm_package_version'] || '1.0.0',
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'disconnected',
      error: 'Database connection failed',
    });
  }
});

// API documentation redirect
app.get('/docs', (_req, res) => {
  res.redirect('/docs/');
});

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import projectRoutes from './routes/projects';
import moduleRoutes from './routes/modules';
import taskRoutes from './routes/tasks';
import timeEntryRoutes from './routes/timeEntries';
import invoiceRoutes from './routes/invoices';
import notificationRoutes from './routes/notifications';
import dashboardRoutes from './routes/dashboard';
import employeeRoutes from './routes/employees';
import milestoneRoutes from './routes/milestones';
import roleRoutes from './routes/roles';
import userRoleRoutes from './routes/userRoles';
import documentationRoutes from './routes/documentation';
import quotationRoutes from './routes/quotations';

// API routes
app.get('/api', (_req, res) => {
  res.json({
    message: 'Backend API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// User routes
app.use('/api/users', userRoutes);

// Project routes
app.use('/api/projects', projectRoutes);

// Module routes
app.use('/api/modules', moduleRoutes);

// Task routes
app.use('/api/tasks', taskRoutes);

// Employee routes
app.use('/api/employees', employeeRoutes);

// Milestone routes
app.use('/api/milestones', milestoneRoutes);

// Time entry routes
app.use('/api/time-entries', timeEntryRoutes);

// Invoice routes
app.use('/api/invoices', invoiceRoutes);

// Notification routes
app.use('/api/notifications', notificationRoutes);

// Dashboard routes
app.use('/api/dashboard', dashboardRoutes);

// Role routes
app.use('/api/roles', roleRoutes);

// User role assignment routes
app.use('/api/user-roles', userRoleRoutes);

// Documentation routes
app.use('/api/documentation', documentationRoutes);

// Quotation routes
app.use('/api/quotations', quotationRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    ...(process.env['NODE_ENV'] === 'development' && { stack: err.stack }),
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
socketService.initialize(server);

// Setup Swagger documentation
setupSwagger(app);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🔌 Socket.IO enabled for real-time notifications`);
});

export default app;
