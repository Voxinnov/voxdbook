import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';

// Validation schemas
const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  desc: z.string().optional(),
  permissions: z.array(z.string()).default([]),
});

const updateRoleSchema = createRoleSchema.partial();

// Get all roles
export const getRoles = async (req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch roles',
    });
  }
};

// Get role by ID
export const getRoleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const roleId = parseInt(id);

    if (isNaN(roleId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role ID',
      });
    }

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
      });
    }

    res.json({
      success: true,
      data: role,
    });
  } catch (error) {
    console.error('Get role by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch role',
    });
  }
};

// Create new role
export const createRole = async (req: Request, res: Response) => {
  try {
    const validatedData = createRoleSchema.parse(req.body);

    // Check if role name already exists
    const existingRole = await prisma.role.findUnique({
      where: { name: validatedData.name },
    });

    if (existingRole) {
      return res.status(400).json({
        success: false,
        error: 'Role with this name already exists',
      });
    }

    const role = await prisma.role.create({
      data: {
        name: validatedData.name,
        desc: validatedData.desc,
      },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: role,
      message: 'Role created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Create role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create role',
    });
  }
};

// Update role
export const updateRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const roleId = parseInt(id);

    if (isNaN(roleId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role ID',
      });
    }

    const validatedData = updateRoleSchema.parse(req.body);

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!existingRole) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
      });
    }

    // Check if new name conflicts with existing role
    if (validatedData.name && validatedData.name !== existingRole.name) {
      const nameConflict = await prisma.role.findUnique({
        where: { name: validatedData.name },
      });

      if (nameConflict) {
        return res.status(400).json({
          success: false,
          error: 'Role with this name already exists',
        });
      }
    }

    const role = await prisma.role.update({
      where: { id: roleId },
      data: validatedData,
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: role,
      message: 'Role updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update role',
    });
  }
};

// Delete role
export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const roleId = parseInt(id);

    if (isNaN(roleId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role ID',
      });
    }

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!existingRole) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
      });
    }

    // Check if role has users assigned
    if (existingRole._count.users > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete role with assigned users. Please reassign users first.',
      });
    }

    await prisma.role.delete({
      where: { id: roleId },
    });

    res.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete role',
    });
  }
};

// Get role statistics
export const getRoleStats = async (req: Request, res: Response) => {
  try {
    const [
      totalRoles,
      rolesWithUsers,
      totalUsers,
    ] = await Promise.all([
      prisma.role.count(),
      prisma.role.count({
        where: {
          users: {
            some: {},
          },
        },
      }),
      prisma.user.count(),
    ]);

    // Get user count per role
    const usersPerRole = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({
      success: true,
      data: {
        totalRoles,
        rolesWithUsers,
        totalUsers,
        usersPerRole,
      },
    });
  } catch (error) {
    console.error('Get role stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch role statistics',
    });
  }
};

