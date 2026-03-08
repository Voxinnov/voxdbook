import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const router = Router();
const prisma = new PrismaClient();

// Validation schema for user creation
const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  roleId: z.union([z.string(), z.number()]).transform((val) => parseInt(val.toString())).pipe(z.number().int().positive('Role ID must be a positive integer')),
  isFreelancer: z.boolean().default(false),
  hourlyRate: z.union([z.string(), z.number()]).transform((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    return parseFloat(val.toString());
  }).pipe(z.number().min(0).optional()).optional(),
});

// GET /users/me - Get current user profile
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    // User is already attached to req.user by authenticate middleware
    res.json({
      user: req.user
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      error: 'Failed to get user profile',
      code: 'PROFILE_ERROR'
    });
  }
});

// GET /users - Get all users (Admin only)
router.get('/', authenticate, authorize(['Founder', 'ProjectManager']), async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isFreelancer: true,
        hourlyRate: true,
        createdAt: true,
        role: {
          select: {
            name: true,
            desc: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to get users',
      code: 'USERS_ERROR'
    });
  }
});

// POST /users - Create new user (Admin only)
router.post('/', authenticate, authorize(['Founder', 'ProjectManager']), async (req: Request, res: Response) => {
  try {
    console.log('User creation request body:', req.body);
    const validatedData = createUserSchema.parse(req.body);
    console.log('Validated data:', validatedData);

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

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: validatedData.roleId },
    });

    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'Role not found',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash,
        roleId: validatedData.roleId,
        isFreelancer: validatedData.isFreelancer,
        hourlyRate: validatedData.hourlyRate,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            desc: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors);
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create user',
    });
  }
});

// GET /users/:id - Get user by ID (Admin or self)
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const currentUserId = req.user!.id;
    const currentUserRole = req.user!.role;

    // Users can only view their own profile unless they're admin
    if (userId !== currentUserId && !['Founder', 'ProjectManager'].includes(currentUserRole)) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        isFreelancer: true,
        hourlyRate: true,
        createdAt: true,
        role: {
          select: {
            name: true,
            desc: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to get user',
      code: 'USER_ERROR'
    });
  }
});

// PUT /users/:id - Update user (Admin only)
router.put('/:id', authenticate, authorize(['Founder', 'ProjectManager']), async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const updateData = createUserSchema.partial().parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if email already exists (if email is being updated)
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: updateData.email },
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: 'User with this email already exists',
        });
      }
    }

    // Check if role exists (if role is being updated)
    if (updateData.roleId) {
      const role = await prisma.role.findUnique({
        where: { id: updateData.roleId },
      });

      if (!role) {
        return res.status(400).json({
          success: false,
          error: 'Role not found',
        });
      }
    }

    // Hash password if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        passwordHash: updateData.password || undefined,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            desc: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
    });
  }
});

// DELETE /users/:id - Delete user (Admin only)
router.delete('/:id', authenticate, authorize(['Founder', 'ProjectManager']), async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
    });
  }
});

export default router;

