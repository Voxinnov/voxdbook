import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create roles
  const founderRole = await prisma.role.upsert({
    where: { name: 'Founder' },
    update: {},
    create: {
      name: 'Founder',
      desc: 'Company founder with full system access',
    },
  });

  await prisma.role.upsert({
    where: { name: 'ProjectManager' },
    update: {},
    create: {
      name: 'ProjectManager',
      desc: 'Project manager with project management access',
    },
  });

  await prisma.role.upsert({
    where: { name: 'TechLead' },
    update: {},
    create: {
      name: 'TechLead',
      desc: 'Technical lead with development oversight',
    },
  });

  await prisma.role.upsert({
    where: { name: 'Developer' },
    update: {},
    create: {
      name: 'Developer',
      desc: 'Developer with task assignment access',
    },
  });

  await prisma.role.upsert({
    where: { name: 'QA' },
    update: {},
    create: {
      name: 'QA',
      desc: 'Quality assurance with testing responsibilities',
    },
  });

  const freelancerRole = await prisma.role.upsert({
    where: { name: 'Freelancer' },
    update: {},
    create: {
      name: 'Freelancer',
      desc: 'Freelancer with limited project access',
    },
  });

  console.log('✅ Roles created');

  // Create admin user (admin@example.com, password: Admin@123)
  const adminPasswordHash = await bcrypt.hash('Admin@123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'System Administrator',
      email: 'admin@example.com',
      passwordHash: adminPasswordHash,
      roleId: founderRole.id,
      isFreelancer: false,
    },
  });

  // Create sample freelancer user with hourly rate 1200
  const freelancerPasswordHash = await bcrypt.hash('Freelancer@123', 12);
  const freelancerUser = await prisma.user.upsert({
    where: { email: 'freelancer@example.com' },
    update: {},
    create: {
      name: 'Jane Freelancer',
      email: 'freelancer@example.com',
      passwordHash: freelancerPasswordHash,
      roleId: freelancerRole.id,
      isFreelancer: true,
      hourlyRate: 1200.0,
    },
  });

  console.log('✅ Users created');

  // Create sample project
  const project = await prisma.project.create({
    data: {
      name: 'VOXTREE Development',
      clientName: 'VOXINNOV PVT LTD',
      description: 'Development of the VOXTREE project management system',
      budget: 50000.0,
      status: 'active',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      createdById: adminUser.id,
    },
  });

  console.log('✅ Sample project created');

  // Create sample module
  const module = await prisma.module.create({
    data: {
      projectId: project.id,
      name: 'Backend API',
      description: 'REST API development with Express and Prisma',
      status: 'active',
    },
  });

  console.log('✅ Sample module created');

  // Create sample task
  const task = await prisma.task.create({
    data: {
      title: 'Set up Express server',
      description: 'Create basic Express server with middleware and routing',
      moduleId: module.id,
      status: 'todo',
      priority: 'high',
      estimateHours: 4.0,
      dueDate: new Date('2024-02-15'),
      createdById: adminUser.id,
    },
  });

  console.log('✅ Sample task created');

  // Assign task to freelancer
  await prisma.taskAssignment.create({
    data: {
      taskId: task.id,
      userId: freelancerUser.id,
    },
  });

  console.log('✅ Task assignment created');

  // Create sample time entry
  await prisma.timeEntry.create({
    data: {
      taskId: task.id,
      userId: freelancerUser.id,
      startTime: new Date('2024-01-15T09:00:00Z'),
      endTime: new Date('2024-01-15T13:00:00Z'),
      durationMins: 240, // 4 hours
      notes: 'Initial server setup and configuration',
      billed: false,
    },
  });

  console.log('✅ Sample time entry created');

  // Create sample comment
  await prisma.comment.create({
    data: {
      taskId: task.id,
      userId: freelancerUser.id,
      content: 'Started working on the Express server setup. Will complete by tomorrow.',
    },
  });

  console.log('✅ Sample comment created');

  // Create sample invoice
  const invoice = await prisma.invoice.create({
    data: {
      projectId: project.id,
      clientJson: JSON.stringify({
        name: 'VOXINNOV PVT LTD',
        email: 'contact@voxinnov.com',
        address: '123 Business Street, City, Country',
      }),
      amount: 25000.0,
      currency: 'INR',
      dueDate: new Date('2024-06-30'),
      status: 'draft',
      createdById: adminUser.id,
    },
  });

  console.log('✅ Sample invoice created');

  // Create sample payment
  await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      amount: 12500.0,
      method: 'Bank Transfer',
      recordedById: adminUser.id,
    },
  });

  console.log('✅ Sample payment created');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Sample accounts created:');
  console.log('Admin: admin@example.com / Admin@123');
  console.log('Freelancer: freelancer@example.com / Freelancer@123');
  console.log('\n📊 Sample data created:');
  console.log('- 1 Project with 1 Module and 1 Task');
  console.log('- 1 Task Assignment');
  console.log('- 1 Time Entry');
  console.log('- 1 Comment');
  console.log('- 1 Invoice with 1 Payment');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
