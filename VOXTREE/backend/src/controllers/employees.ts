import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';

// Validation schemas
const createEmployeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  address: z.string().optional(),
  employeeType: z.enum(['permanent', 'freelance']),
  hourlyRate: z.number().min(0).optional(),
  salary: z.number().min(0).optional(),
  currency: z.enum(['INR', 'USD', 'GBP']).default('INR'),
  position: z.string().min(1, 'Position is required'),
  department: z.string().min(1, 'Department is required'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['active', 'inactive', 'terminated']).default('active'),
  skills: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

const updateEmployeeSchema = createEmployeeSchema.partial();

// Get all employees
export const getEmployees = async (req: Request, res: Response) => {
  try {
    const { type, status, search } = req.query;

    const where: any = {
      // Only get users who have employee information
      OR: [
        { employeeType: { not: null } },
        { position: { not: null } },
        { department: { not: null } },
      ],
    };

    if (type && type !== 'all') {
      where.employeeType = type;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { email: { contains: search as string, mode: 'insensitive' } },
            { position: { contains: search as string, mode: 'insensitive' } },
            { department: { contains: search as string, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const employees = await prisma.user.findMany({
      where,
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            TaskAssignment: true,
            TimeEntry: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch employees',
    });
  }
};

// Get employee by ID
export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const employeeId = parseInt(id);

    if (isNaN(employeeId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid employee ID',
      });
    }

    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        TaskAssignment: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
              },
            },
          },
        },
        TimeEntry: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            TaskAssignment: true,
            TimeEntry: true,
          },
        },
      },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }

    res.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error('Get employee by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch employee',
    });
  }
};

// Create new employee
export const createEmployee = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validatedData = createEmployeeSchema.parse(req.body);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists',
      });
    }

    // Validate compensation based on employee type
    if (validatedData.employeeType === 'freelance' && (!validatedData.hourlyRate || validatedData.hourlyRate <= 0)) {
      return res.status(400).json({
        success: false,
        error: 'Hourly rate is required for freelance employees',
      });
    }

    if (validatedData.employeeType === 'permanent' && (!validatedData.salary || validatedData.salary <= 0)) {
      return res.status(400).json({
        success: false,
        error: 'Salary is required for permanent employees',
      });
    }

    // Get a default role (Developer role)
    const defaultRole = await prisma.role.findFirst({
      where: { name: 'Developer' },
    });

    if (!defaultRole) {
      return res.status(500).json({
        success: false,
        error: 'Default role not found',
      });
    }

    // Create user with employee information
    const employee = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash: 'temp_password', // Will need to be set properly
        roleId: defaultRole.id,
        phone: validatedData.phone,
        address: validatedData.address,
        employeeType: validatedData.employeeType,
        hourlyRate: validatedData.hourlyRate,
        salary: validatedData.salary,
        currency: validatedData.currency,
        position: validatedData.position,
        department: validatedData.department,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        status: validatedData.status,
        skills: JSON.stringify(validatedData.skills),
        notes: validatedData.notes,
        isFreelancer: validatedData.employeeType === 'freelance',
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: employee,
      message: 'Employee created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create employee',
    });
  }
};

// Update employee
export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const employeeId = parseInt(id);

    if (isNaN(employeeId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid employee ID',
      });
    }

    const validatedData = updateEmployeeSchema.parse(req.body);

    // Check if employee exists
    const existingEmployee = await prisma.user.findUnique({
      where: { id: employeeId },
    });

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }

    // Check if email is being changed and if it already exists
    if (validatedData.email && validatedData.email !== existingEmployee.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: 'User with this email already exists',
        });
      }
    }

    // Validate compensation based on employee type
    const employeeType = validatedData.employeeType || existingEmployee.employeeType;
    
    if (employeeType === 'freelance' && validatedData.hourlyRate !== undefined && validatedData.hourlyRate <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Hourly rate must be greater than 0 for freelance employees',
      });
    }

    if (employeeType === 'permanent' && validatedData.salary !== undefined && validatedData.salary <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Salary must be greater than 0 for permanent employees',
      });
    }

    // Prepare update data
    const updateData: any = { ...validatedData };
    
    // Handle date fields
    if (validatedData.startDate) {
      updateData.startDate = new Date(validatedData.startDate);
    }
    if (validatedData.endDate) {
      updateData.endDate = new Date(validatedData.endDate);
    }
    
    // Handle skills array
    if (validatedData.skills) {
      updateData.skills = JSON.stringify(validatedData.skills);
    }
    
    // Handle employee type
    if (validatedData.employeeType) {
      updateData.isFreelancer = validatedData.employeeType === 'freelance';
    }

    const employee = await prisma.user.update({
      where: { id: employeeId },
      data: updateData,
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: employee,
      message: 'Employee updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update employee',
    });
  }
};

// Delete employee
export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const employeeId = parseInt(id);

    if (isNaN(employeeId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid employee ID',
      });
    }

    // Check if employee exists
    const existingEmployee = await prisma.user.findUnique({
      where: { id: employeeId },
    });

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }

    // Check if employee has active assignments or time entries
    const activeAssignments = await prisma.taskAssignment.count({
      where: {
        userId: employeeId,
        task: {
          status: {
            in: ['todo', 'in_progress'],
          },
        },
      },
    });

    if (activeAssignments > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete employee with active task assignments',
      });
    }

    await prisma.user.delete({
      where: { id: employeeId },
    });

    res.json({
      success: true,
      message: 'Employee deleted successfully',
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete employee',
    });
  }
};

// Get employee statistics
export const getEmployeeStats = async (req: Request, res: Response) => {
  try {
    const [
      totalEmployees,
      permanentEmployees,
      freelanceEmployees,
      activeEmployees,
      inactiveEmployees,
      terminatedEmployees,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          OR: [
            { employeeType: { not: null } },
            { position: { not: null } },
            { department: { not: null } },
          ],
        },
      }),
      prisma.user.count({ where: { employeeType: 'permanent' } }),
      prisma.user.count({ where: { employeeType: 'freelance' } }),
      prisma.user.count({ where: { status: 'active' } }),
      prisma.user.count({ where: { status: 'inactive' } }),
      prisma.user.count({ where: { status: 'terminated' } }),
    ]);

    res.json({
      success: true,
      data: {
        totalEmployees,
        permanentEmployees,
        freelanceEmployees,
        activeEmployees,
        inactiveEmployees,
        terminatedEmployees,
      },
    });
  } catch (error) {
    console.error('Get employee stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch employee statistics',
    });
  }
};
