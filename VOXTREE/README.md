# VOXTREE - Project Management System

A full-stack project management system built with modern technologies.

## 🏗️ Architecture

This is a **monorepo** containing:

- **`/backend`** - Node.js + TypeScript + Express + Prisma + MySQL
- **`/frontend`** - React + TypeScript + Vite + Tailwind CSS
- **`/infra`** - Docker Compose setup for development

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Make (optional, for convenience commands)

### 1. Start Development Environment

```bash
# Using Make (recommended)
make dev

# Or using Docker Compose directly
cd infra && docker-compose up -d
```

### 2. Setup Database

```bash
# Run database migrations
make db-migrate

# Seed with sample data
make db-seed
```

### 3. Documentation Feature Migration

The Documentation feature has been added with new database models. If you're upgrading from a previous version:

```bash
# Apply the new documentation models to your database
cd backend && npx prisma db push

# Or if you prefer migrations
cd backend && npx prisma migrate dev --name add-documentation-models
```

**New Models Added:**
- `Documentation` - Main document entity
- `DocumentFile` - File attachments for documents  
- `DocumentComment` - Comments on documents

**Features:**
- Document types: `initial_discussion`, `minutes_of_meeting`, `general`
- Visibility levels: `public`, `internal`, `private`
- File uploads with type validation
- Real-time notifications for comments and file uploads
- Role-based access control

### 4. Access Applications

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health**: http://localhost:3001/health

## 📁 Project Structure

```
VOXTREE/
├── backend/              # Express API server
│   ├── src/              # Source code
│   ├── prisma/           # Database schema
│   ├── Dockerfile        # Backend container
│   └── README.md         # Backend documentation
├── frontend/             # React application
│   ├── src/              # Source code
│   ├── Dockerfile        # Frontend container
│   └── README.md         # Frontend documentation
├── infra/                # Infrastructure
│   ├── docker-compose.yml # Development setup
│   └── mysql/            # Database initialization
├── Makefile              # Development commands
└── README.md             # This file
```

## 🛠️ Development Commands

### Using Make (Recommended)

```bash
make dev          # Start all services
make install      # Install dependencies
make backend      # Start backend only
make frontend     # Start frontend only
make clean         # Clean everything
make stop         # Stop all services
make logs         # View service logs
```

### Manual Commands

```bash
# Backend
cd backend
npm install
npm run dev
npm run migrate
npm run seed

# Frontend
cd frontend
npm install
npm run dev

# Infrastructure
cd infra
docker-compose up -d
docker-compose down
```

## 🔧 Backend API

- **Framework**: Express.js with TypeScript
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT tokens
- **Security**: Rate limiting, CORS, Helmet
- **Development**: ts-node-dev for hot reload

### Backend Commands

```bash
cd backend
npm install       # Install dependencies
npm run dev       # Start development server
npm run migrate   # Run database migrations
npm run seed      # Seed database with sample data
npm test          # Run tests
npm run lint      # Run ESLint
```

## 🎨 Frontend App

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: React Query for API state

### Frontend Commands

```bash
cd frontend
npm install       # Install dependencies
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## 🐳 Docker Development

The project includes a complete Docker setup for development:

- **MySQL 8.0** - Database server
- **Backend** - Express API with hot reload
- **Frontend** - React app with Vite dev server

### Docker Commands

```bash
# Start all services
cd infra && docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Clean volumes
docker-compose down -v
```

## 📊 Database Schema

The system includes a comprehensive schema with:

- **Users** - System users with roles
- **Projects** - Main project containers
- **Tasks** - Individual work items
- **Time Entries** - Time tracking records
- **Invoices** - Billing management
- **Comments** - Task collaboration
- **Files** - File attachments

## 🔐 Authentication

The system uses JWT-based authentication with:

- Access tokens (short-lived)
- Refresh tokens (long-lived)
- Role-based authorization
- Password hashing with bcrypt

## 🧪 Testing

Both backend and frontend include testing setups:

- **Backend**: Jest with Supertest for API testing
- **Frontend**: Vitest with React Testing Library
- **Coverage**: Comprehensive test coverage

## 📋 Next Steps Checklist

To implement the full system, complete these tasks:

### Authentication & Authorization
- [ ] Implement JWT authentication endpoints
- [ ] Add refresh token rotation
- [ ] Create role-based middleware
- [ ] Add password reset functionality
- [ ] Implement session management

### Database Models & API
- [ ] Create user management endpoints
- [ ] Implement project CRUD operations
- [ ] Add task management APIs
- [ ] Build time tracking endpoints
- [ ] Create invoicing system APIs
- [ ] Add file upload functionality

### Frontend Features
- [ ] Implement login/logout flow
- [ ] Add protected route middleware
- [ ] Create user dashboard
- [ ] Build project management interface
- [ ] Add task assignment features
- [ ] Implement time tracking UI
- [ ] Create invoice management

### Advanced Features
- [x] Real-time notifications (Socket.IO)
- [x] File upload and management
- [x] Email notifications (Mailtrap integration)
- [ ] Advanced reporting
- [ ] Mobile responsiveness
- [ ] Performance optimization

## 📧 Email & Notifications

### Real-time Notifications

The system includes real-time notifications via Socket.IO:

- **Task Assignments**: Users get notified when assigned to tasks
- **Comments**: Team members get notified of new comments  
- **Invoice Updates**: Clients get notified of invoice status changes
- **Payment Confirmations**: Payment receipts are sent automatically

### Email Setup

For development, we recommend using **Mailtrap** for email testing:

1. **Setup Mailtrap** (see `/infra/mailtrap/README.md`)
2. **Configure environment variables**:
   ```env
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=your_mailtrap_username
   SMTP_PASS=your_mailtrap_password
   SMTP_FROM=noreply@voxtree.com
   ```

3. **Test email functionality**:
   - Assign tasks to users
   - Add comments to tasks
   - Send invoices
   - Record payments

All emails will be captured in your Mailtrap inbox for testing.

### Socket.IO Integration

The backend includes Socket.IO for real-time features:

- **Authentication**: Clients authenticate with JWT tokens
- **Project Rooms**: Users can join project-specific channels
- **Real-time Updates**: Instant notifications for task updates, comments, etc.

Frontend integration example:
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-jwt-token'
  }
});

socket.on('notification', (data) => {
  console.log('New notification:', data);
});
```

## 🚀 Production Deployment

For production deployment:

1. Set up production environment variables
2. Configure database connection
3. Set up SSL certificates
4. Configure reverse proxy (Nginx)
5. Set up monitoring and logging
6. Deploy with Docker or cloud services

## 📄 License

MIT License - VOXINNOV PVT LTD

## 🆘 Support

For questions and support:

- Check individual README files in `/backend` and `/frontend`
- Review the database schema in `/backend/prisma/schema.prisma`
- Check Docker logs with `make logs`
- Ensure all services are running with `docker-compose ps`