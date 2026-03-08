# Backend API

Node.js + TypeScript + Express backend with Prisma ORM for MySQL.

## Commands

### Install Dependencies
```bash
npm install
```

### Database Setup
```bash
# Run database migrations
npx prisma migrate dev --name init

# Seed database with sample data
npm run prisma:seed
```

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Run Tests
```bash
npm test
npm run test:watch
```

### Linting & Formatting
```bash
npm run lint
npm run lint:fix
npm run format
```

## Environment Setup

1. Copy `env.example` to `.env`
2. Update `DATABASE_URL` with your MySQL connection string
3. Set secure `JWT_SECRET` and `JWT_REFRESH_SECRET` values

## Database Schema

The backend uses Prisma ORM with MySQL. The schema includes:

- **Users** - System users with roles
- **Roles** - User roles (Founder, ProjectManager, TechLead, Developer, QA, Freelancer)
- **Projects** - Main project containers
- **Modules** - Project subdivisions
- **Tasks** - Individual work items
- **Task Assignments** - User-task relationships
- **Time Entries** - Time tracking records
- **Invoices** - Billing management
- **Payments** - Invoice payments
- **Comments** - Task collaboration
- **Files** - File attachments

## Sample Data

The seed script creates:

- **6 Roles**: Founder, ProjectManager, TechLead, Developer, QA, Freelancer
- **2 Users**: 
  - Admin: `admin@example.com` / `Admin@123` (Founder role)
  - Freelancer: `freelancer@example.com` / `Freelancer@123` (Freelancer role, hourly rate: ₹1200)
- **1 Project**: VOXTREE Development with 1 module and 1 task
- **1 Task Assignment**: Freelancer assigned to the task
- **1 Time Entry**: 4-hour logged time
- **1 Comment**: Task discussion
- **1 Invoice**: With 1 payment record

## API Endpoints

- `GET /health` - Health check
- `GET /api` - API status

## Development

The server runs on port 3001 by default with hot reload using `ts-node-dev`.
